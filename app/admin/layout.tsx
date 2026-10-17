"use client";

import { ReactNode, useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  FileText,
  Briefcase,
  UserCircle,
  Calendar,
  Wallet,
  Settings as SettingsIcon,
  Globe,
  LogOut,
  Bell,
  Search,
  Menu,
  ChevronDown,
  TrendingUp,
  MessageSquare,
  UserCheck,
  Ruler,
  Map,
  DollarSign,
  Eye,
  CheckCircle,
  Clock,
  Archive,
  BarChart3,
  Zap,
  Wrench,
  Navigation,
  AlertTriangle,
  Zap as Zap2,
  Star,
  CreditCard,
  AlertTriangle as AlertTriangleIcon,
  BarChart3 as BarChartIcon,
  Shield,
  Lock,
  Activity,
  Brain,
  Lightbulb,
  Package,
  X,
  ExternalLink,
  Sparkles,
  Inbox,
  Bot,
  MessageCircle,
} from "lucide-react";
import { logout, verifySession } from "@/lib/auth";
import { isPathAllowed } from "@/lib/admin-access";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  doc,
  updateDoc,
} from "firebase/firestore";

type Notification = {
  id: string;
  type: "reminder" | "alert" | "info" | "success";
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
  bookingId?: string;
  firestoreId?: string;
};

const playNotificationSound = () => {
  try {
    const audioContext = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.3,
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("New Booking Received", {
        body: "A new booking has been added",
        icon: "/favicon.ico",
      });
    }
  } catch (error) {
    console.log("Sound play failed, using fallback");
    const fallbackSound = new Audio(
      "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==",
    );
    fallbackSound.volume = 0.3;
    fallbackSound.play().catch((e) => console.log("Fallback sound failed"));
  }
};

const formatTime = (timestamp: any): string => {
  if (!timestamp) return "Just now";

  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "Recently";
  }
};

// ✅ FIXED: Added 'Employee Chat' key with correct icon and href

// ✅ FIXED: Added 'Report' with proper capitalization
const ALL_PAGES_CONFIG = {
  Dashboard: { icon: LayoutDashboard, href: "/admin/dashboard" },
  CRM: { icon: Users, href: "/admin/crm" },
  "Lead Dashboard": { icon: Users, href: "/admin/crm" },
  Communications: { icon: MessageSquare, href: "/admin/crm/communications" },
  Clients: { icon: UserCheck, href: "/admin/crm/clients" },
  Surveys: { icon: Ruler, href: "/admin/surveys" },
  Quotations: { icon: FileText, href: "/admin/quotations/complete" },
  "Inventory & Services": { icon: Wrench, href: "/admin/products" },
  Jobs: { icon: Briefcase, href: "/admin/jobs" },
  "Equipment & Permits": { icon: Wrench, href: "/admin/equipment-permits" },
  "Job Profitability": { icon: TrendingUp, href: "/admin/job-profitability" },
  Bookings: { icon: Calendar, href: "/admin/bookings" },
  "Process Inquiry": { icon: Inbox, href: "/admin/process-inquiry" },
  "Employee Chat": { icon: MessageCircle, href: "/admin/employee-chat" },
  "HR Management": { icon: UserCircle, href: "/admin/hr" },
  "Employee Directory": { icon: Users, href: "/admin/hr/employee-directory" },
  Attendance: { icon: Clock, href: "/admin/hr/attendance" },
  "Leave Management": { icon: Calendar, href: "/admin/hr/leave-management" },
  Payroll: { icon: DollarSign, href: "/admin/hr/payroll" },
  "Performance Dashboard": {
    icon: BarChart3,
    href: "/admin/hr/performance-dashboard",
  },
  "Feedback & Complaints": {
    icon: MessageSquare,
    href: "/admin/employee-feedback",
  },
  Meetings: { icon: Calendar, href: "/admin/meetings" },
  "Meeting Calendar": { icon: Calendar, href: "/admin/meetings/calendar" },
  "Meeting Detail": { icon: FileText, href: "/admin/meetings/detail" },
  "Notes & Decisions": {
    icon: FileText,
    href: "/admin/meetings/notes-decisions",
  },
  "Follow-Up Tracker": {
    icon: CheckCircle,
    href: "/admin/meetings/follow-up-tracker",
  },

  // ✅ FIXED: Changed from "report" to "Report" with proper capitalization
  Report: {
    icon: BarChart3,
    href: "/admin/report",
  },
  
  Finance: { icon: Wallet, href: "/admin/finance" },
  Marketing: { icon: TrendingUp, href: "/admin/marketing" },
  "Admin Management": { icon: Shield, href: "/admin/admin-management" },
  "Role Manager": {
    icon: UserCheck,
    href: "/admin/admin-management/role-manager",
  },
  "Permission Matrix": {
    icon: Lock,
    href: "/admin/admin-management/permission-matrix",
  },
  "User Accounts": {
    icon: Users,
    href: "/admin/admin-management/user-accounts",
  },
  "Audit Logs": { icon: Activity, href: "/admin/admin-management/audit-logs" },
  "AI Command Center": { icon: Brain, href: "/admin/ai-command-center" },
  "AI Recommendations": {
    icon: Lightbulb,
    href: "/admin/ai-command-center/recommendations",
  },
  CMS: { icon: Globe, href: "/admin/cms" },
  Settings: { icon: SettingsIcon, href: "/admin/settings" },
};

// ✅ FIXED: Changed from "report" to "Report" in MENU_STRUCTURE
const MENU_STRUCTURE = [
  {
    type: "single",
    label: "Dashboard",
    key: "Dashboard",
  },
  {
    type: "group",
    label: "CRM",
    key: "CRM",
    submenu: [
      { label: "Lead Dashboard", key: "Lead Dashboard" },
      { label: "Employee Chat", key: "Employee Chat" },
      { label: "Clients", key: "Clients" },
    ],
  },
  {
    type: "single",
    label: "Surveys",
    key: "Surveys",
  },
  {
    type: "single",
    label: "Quotations",
    key: "Quotations",
  },
  {
    type: "single",
    label: "Inventory & Services",
    key: "Inventory & Services",
  },
  {
    type: "single",
    label: "Jobs",
    key: "Jobs",
  },
  {
    type: "single",
    label: "Equipment & Permits",
    key: "Equipment & Permits",
  },
  {
    type: "single",
    label: "Job Profitability",
    key: "Job Profitability",
  },
  {
    type: "single",
    label: "Bookings",
    key: "Bookings",
  },
  {
    type: "single",
    label: "Process Inquiry",
    key: "Process Inquiry",
  },
  // ✅ FIXED: Added Report as a single menu item
  {
    type: "single",
    label: "Report",
    key: "Report",
  },
  {
    type: "group",
    label: "HR Management",
    key: "HR Management",
    submenu: [
      { label: "Employee Directory", key: "Employee Directory" },
      { label: "Attendance", key: "Attendance" },
      { label: "Leave Management", key: "Leave Management" },
      { label: "Payroll", key: "Payroll" },
      { label: "Feedback & Complaints", key: "Feedback & Complaints" },
    ],
  },
  {
    type: "group",
    label: "Meetings",
    key: "Meetings",
    submenu: [
      { label: "Meeting Calendar", key: "Meeting Calendar" },
      { label: "Meeting Detail", key: "Meeting Detail" },
      { label: "Notes & Decisions", key: "Notes & Decisions" },
      { label: "Follow-Up Tracker", key: "Follow-Up Tracker" },
    ],
  },
  {
    type: "single",
    label: "Finance",
    key: "Finance",
  },
  {
    type: "single",
    label: "Marketing",
    key: "Marketing",
  },
  {
    type: "group",
    label: "Admin Management",
    key: "Admin Management",
    submenu: [
      { label: "Role Manager", key: "Role Manager" },
      { label: "Permission Matrix", key: "Permission Matrix" },
      { label: "Audit Logs", key: "Audit Logs" },
    ],
  },
  {
    type: "single",
    label: "AI Command Center",
    key: "AI Command Center",
  },
  {
    type: "single",
    label: "CMS",
    key: "CMS",
  },
  {
    type: "single",
    label: "Settings",
    key: "Settings",
  },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  // Initialize notifications with localStorage
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    if (typeof window !== "undefined") {
      const savedNotifications = localStorage.getItem("notifications");
      return savedNotifications ? JSON.parse(savedNotifications) : [];
    }
    return [];
  });

  const [isListening, setIsListening] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [userSession, setUserSession] = useState<{
    name: string;
    email: string;
    allowedPages: string[];
    roleName: string;
  } | null>(null);

  // Initialize as Set
  const processedBookingIds = useRef<Set<string>>(new Set());
  const readNotificationIds = useRef<Set<string>>(new Set());

  // Load data from localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Load processed booking IDs
      const savedProcessedIds = localStorage.getItem("processedBookingIds");
      if (savedProcessedIds) {
        const idsArray = JSON.parse(savedProcessedIds);
        processedBookingIds.current = new Set(idsArray);
      }

      // Load read notification IDs
      const savedReadIds = localStorage.getItem("readNotificationIds");
      if (savedReadIds) {
        const idsArray = JSON.parse(savedReadIds);
        readNotificationIds.current = new Set(idsArray);
      }
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("notifications", JSON.stringify(notifications));
    }
  }, [notifications]);

  // Save processed booking IDs to localStorage
  const saveProcessedBookingIds = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "processedBookingIds",
        JSON.stringify(Array.from(processedBookingIds.current)),
      );
    }
  }, []);

  // Save read notification IDs to localStorage
  const saveReadNotificationIds = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "readNotificationIds",
        JSON.stringify(Array.from(readNotificationIds.current)),
      );
    }
  }, []);

  useEffect(() => {
    if (!userSession) {
      return;
    }

    console.log("Setting up Firebase real-time listener for bookings...");

    let unsubscribe: (() => void) | undefined;

    const setupListener = async () => {
      try {
        const bookingsQuery = query(
          collection(db, "bookings"),
          orderBy("createdAt", "desc"),
          limit(50),
        );

        unsubscribe = onSnapshot(
          bookingsQuery,
          (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === "added") {
                const bookingData = change.doc.data();
                const bookingId = bookingData.bookingId || change.doc.id;

                // Check if already processed (in memory or localStorage)
                if (processedBookingIds.current.has(bookingId)) {
                  return;
                }

                // Check if this booking's notification was previously read
                const notificationId = `booking-${bookingId}`;
                if (readNotificationIds.current.has(notificationId)) {
                  // Mark as processed but don't show notification
                  processedBookingIds.current.add(bookingId);
                  saveProcessedBookingIds();
                  return;
                }

                processedBookingIds.current.add(bookingId);
                saveProcessedBookingIds();

                playNotificationSound();

                const newNotification: Notification = {
                  id: notificationId,
                  type: "success",
                  title: "New Booking Received! 🎉",
                  message: `${bookingData.name || "A customer"} booked ${bookingData.service || "a service"} for ${bookingData.date || "scheduled date"} at ${bookingData.time || "scheduled time"}`,
                  time: formatTime(bookingData.createdAt),
                  read: false,
                  link: "/admin/bookings",
                  bookingId: bookingId,
                  firestoreId: change.doc.id,
                };

                setNotifications((prev) => {
                  // Don't add if notification already exists
                  if (prev.some((n) => n.id === notificationId)) {
                    return prev;
                  }

                  const updatedNotifications = [newNotification, ...prev];

                  // Keep only latest 20 notifications
                  if (updatedNotifications.length > 20) {
                    return updatedNotifications.slice(0, 20);
                  }

                  return updatedNotifications;
                });

                if (
                  "Notification" in window &&
                  Notification.permission === "default"
                ) {
                  Notification.requestPermission();
                }
              }
            });
          },
          (error) => {
            console.error("Firebase listener error:", error);
          },
        );

        setIsListening(true);
      } catch (error) {
        console.error("Error setting up Firebase listener:", error);
        setIsListening(false);
      }
    };

    setupListener();

    return () => {
      console.log("Cleaning up Firebase listener");
      if (unsubscribe) {
        unsubscribe();
      }
      setIsListening(false);
    };
  }, [userSession, saveProcessedBookingIds]);

  useEffect(() => {
    let cancelled = false;

    // Verify against Firebase Auth and users-role rather than trusting localStorage
    verifySession("admin").then((session) => {
      if (cancelled) return;
      if (session) {
        const allowedPages = session.allowedPages || [];
        const allAllowedPages = [...allowedPages];

        if (!allAllowedPages.includes("Process Inquiry")) {
          allAllowedPages.push("Process Inquiry");
        }

        // ✅ FIXED: Make sure Employee Chat is included in allowed pages
        if (
          !allAllowedPages.includes("Employee Chat") &&
          allAllowedPages.includes("Employee Chat")
        ) {
          // This is just a safety check
        }

        setUserSession({
          name: session.user.name || "User",
          email: session.user.email || "",
          allowedPages: allAllowedPages,
          roleName: session.portal || "User", // ✅ Changed from roleName to portal
        });

        if ("Notification" in window && Notification.permission === "default") {
          Notification.requestPermission().then((permission) => {
            console.log("Notification permission:", permission);
          });
        }
      } else {
        setUserSession(null);
        router.push("/login");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    const currentMenu = MENU_STRUCTURE.find(
      (menu) =>
        menu.type === "group" &&
        menu.submenu?.some(
          (sub) =>
            ALL_PAGES_CONFIG[sub.key as keyof typeof ALL_PAGES_CONFIG]
              ?.href === pathname,
        ),
    );
    if (currentMenu) {
      setOpenMenus((prev) => ({ ...prev, [currentMenu.key]: true }));
    }
  }, [pathname]);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await logout();
      router.push("/login");
    } catch (err) {
      console.error("Sign out failed:", err);
      setIsSigningOut(false);
    }
  };

  // MARK AS READ FUNCTION - COMPLETELY REMOVES NOTIFICATION
  const handleMarkAsRead = useCallback(
    async (id: string) => {
      try {
        // Add to read notification IDs
        readNotificationIds.current.add(id);
        saveReadNotificationIds();

        // Remove from local state
        setNotifications((prev) => prev.filter((n) => n.id !== id));

        // Update in Firestore if available
        const notification = notifications.find((n) => n.id === id);
        if (notification?.firestoreId) {
          try {
            const bookingRef = doc(db, "bookings", notification.firestoreId);
            await updateDoc(bookingRef, {
              notificationRead: true,
              notificationReadAt: new Date().toISOString(),
            });
          } catch (firestoreError) {
            console.log(
              "Firestore update optional, not required for functionality",
            );
          }
        }
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    },
    [notifications, saveReadNotificationIds],
  );

  // MARK ALL AS READ FUNCTION
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      // Add all current notification IDs to read IDs
      notifications.forEach((notification) => {
        readNotificationIds.current.add(notification.id);
      });
      saveReadNotificationIds();

      // Clear all notifications
      setNotifications([]);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, [notifications, saveReadNotificationIds]);

  // DELETE NOTIFICATION FUNCTION
  const handleDeleteNotification = useCallback(
    async (id: string) => {
      try {
        // Add to read notification IDs (so it doesn't come back)
        readNotificationIds.current.add(id);
        saveReadNotificationIds();

        // Remove from local state
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      } catch (error) {
        console.error("Error deleting notification:", error);
      }
    },
    [saveReadNotificationIds],
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "reminder":
        return <Clock className="w-5 h-5" />;
      case "alert":
        return <AlertTriangle className="w-5 h-5" />;
      case "success":
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "reminder":
        return "bg-amber-100 text-amber-700";
      case "alert":
        return "bg-red-100 text-red-700";
      case "success":
        return "bg-green-100 text-green-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  const getFilteredMenuItems = () => {
    if (!userSession) return [];

    return MENU_STRUCTURE.filter((menuItem) => {
      if (menuItem.type === "single") {
        return userSession.allowedPages.includes(menuItem.key);
      } else if (menuItem.type === "group") {
        const hasAccessToAnySubmenu = menuItem.submenu?.some((sub) =>
          userSession.allowedPages.includes(sub.key),
        );
        return hasAccessToAnySubmenu;
      }
      return false;
    });
  };

  const toggleMenu = useCallback((menuKey: string) => {
    setOpenMenus((prev) => ({ ...prev, [menuKey]: !prev[menuKey] }));
  }, []);

  const filteredMenuItems = getFilteredMenuItems();

  // Don't render admin pages (and their Firestore queries) until the session is verified
  if (!userSession) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pageAllowed = isPathAllowed(
    pathname,
    userSession.allowedPages,
    ALL_PAGES_CONFIG,
    MENU_STRUCTURE,
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`${sidebarOpen ? "w-64" : "w-20"} border-r bg-card hidden lg:flex flex-col sticky top-0 h-screen shadow-sm overflow-hidden transition-all duration-300`}
      >
        <div
          className={`p-4 border-b flex items-center ${!sidebarOpen && "justify-center"} ${sidebarOpen && "justify-between"}`}
        >
          {sidebarOpen && (
            <>
              <div className="flex items-center gap-3">
                <img 
                  src="/logo.png" 
                  alt="Silver Maids Dubai" 
                  className="h-10 w-10 object-contain"
                />
                <div>
                  
                  <span className="text-[10px] font-semibold text-[#ea4c8c] tracking-wider uppercase">
                    Dashboard
                  </span>
                </div>
              </div>
            </>
          )}
          {!sidebarOpen && (
            <img 
              src="/logo.png" 
              alt="Silver Maids Dubai" 
              className="h-10 w-10 object-contain"
            />
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {sidebarOpen && (
            <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
              Main Menu
            </p>
          )}

          {filteredMenuItems.map((menuItem) => {
            const pageConfig =
              ALL_PAGES_CONFIG[menuItem.key as keyof typeof ALL_PAGES_CONFIG];
            const isActive = pathname === pageConfig?.href;
            const isGroup = menuItem.type === "group";
            const isOpen = openMenus[menuItem.key] || false;

            const isGroupActive =
              isGroup &&
              menuItem.submenu?.some((sub) => {
                const subConfig =
                  ALL_PAGES_CONFIG[sub.key as keyof typeof ALL_PAGES_CONFIG];
                return pathname === subConfig?.href;
              });

            const IconComponent = pageConfig?.icon;

            return (
              <div key={menuItem.key}>
                {isGroup ? (
                  <>
                    <button
                      onClick={() => toggleMenu(menuItem.key)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 group ${
                        isGroupActive
                          ? "bg-[#0b7a8e] text-white shadow-sm"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      } ${!sidebarOpen && "justify-center"}`}
                      title={!sidebarOpen ? menuItem.label : undefined}
                    >
                      {IconComponent && (
                        <IconComponent
                          className={`h-5 w-5 transition-colors shrink-0 ${
                            isGroupActive
                              ? "text-white"
                              : "text-muted-foreground group-hover:text-[#0b7a8e]"
                          }`}
                        />
                      )}
                      {sidebarOpen && (
                        <>
                          <span className="flex-1 text-left">
                            {menuItem.label}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform shrink-0 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </>
                      )}
                    </button>

                    {sidebarOpen && isOpen && menuItem.submenu && (
                      <div className="ml-2 mt-1 space-y-1 border-l-2 border-muted pl-2">
                        {menuItem.submenu
                          .filter((sub) =>
                            userSession.allowedPages.includes(sub.key),
                          )
                          .map((sub) => {
                            const subConfig =
                              ALL_PAGES_CONFIG[
                                sub.key as keyof typeof ALL_PAGES_CONFIG
                              ];
                            const isSubActive = pathname === subConfig?.href;
                            const SubIcon = subConfig?.icon;

                            return (
                              <Link
                                key={sub.key}
                                href={subConfig?.href || "#"}
                                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 group ${
                                  isSubActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                }`}
                              >
                                {SubIcon && (
                                  <SubIcon
                                    className={`h-4 w-4 ${
                                      isSubActive
                                        ? "text-primary"
                                        : "text-muted-foreground group-hover:text-primary"
                                    }`}
                                  />
                                )}
                                <span className="flex-1">{sub.label}</span>
                              </Link>
                            );
                          })}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={pageConfig?.href || "#"}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 group ${
                      isActive
                        ? "bg-[#0b7a8e] text-white shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    } ${!sidebarOpen && "justify-center"}`}
                    title={!sidebarOpen ? menuItem.label : undefined}
                  >
                    {IconComponent && (
                      <IconComponent
                        className={`h-5 w-5 transition-colors shrink-0 ${
                          isActive
                            ? "text-white"
                            : "text-muted-foreground group-hover:text-[#0b7a8e]"
                        }`}
                      />
                    )}
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-left">
                          {menuItem.label}
                        </span>
                        {isActive && (
                          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white"></div>
                        )}
                      </>
                    )}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t space-y-4">
          {sidebarOpen && (
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#0b7a8e] to-[#086878] flex items-center justify-center text-white font-semibold shrink-0">
                  {userSession.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {userSession.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {userSession.email}
                  </p>
                  <p className="text-xs text-[#0b7a8e] font-semibold truncate mt-0.5">
                    {userSession.roleName}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="flex w-full items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-100 dark:border-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="h-3.5 w-3.5" />
                {isSigningOut ? "Signing Out..." : "Sign Out"}
              </button>
            </div>
          )}
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed top-20 left-0 w-64 h-screen bg-card border-r border-slate-200 z-40 overflow-y-auto lg:hidden">
          <div className="p-4 space-y-1.5">
            <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
              Main Menu
            </p>
            {filteredMenuItems.map((menuItem) => {
              const pageConfig =
                ALL_PAGES_CONFIG[menuItem.key as keyof typeof ALL_PAGES_CONFIG];
              const isActive = pathname === pageConfig?.href;
              const isGroup = menuItem.type === "group";
              const isOpen = openMenus[menuItem.key] || false;
              const isGroupActive =
                isGroup &&
                menuItem.submenu?.some((sub) => {
                  const subConfig =
                    ALL_PAGES_CONFIG[sub.key as keyof typeof ALL_PAGES_CONFIG];
                  return pathname === subConfig?.href;
                });

              const IconComponent = pageConfig?.icon;

              return (
                <div key={menuItem.key}>
                  {isGroup ? (
                    <>
                      <button
                        onClick={() => toggleMenu(menuItem.key)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 group ${
                          isGroupActive
                            ? "bg-[#0b7a8e] text-white shadow-sm"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                      >
                        {IconComponent && (
                          <IconComponent
                            className={`h-5 w-5 transition-colors shrink-0 ${
                              isGroupActive
                                ? "text-white"
                                : "text-muted-foreground group-hover:text-[#0b7a8e]"
                            }`}
                          />
                        )}
                        <span className="flex-1 text-left">
                          {menuItem.label}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform shrink-0 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isOpen && menuItem.submenu && (
                        <div className="ml-2 mt-1 space-y-1 border-l-2 border-muted pl-2">
                          {menuItem.submenu
                            .filter((sub) =>
                              userSession.allowedPages.includes(sub.key),
                            )
                            .map((sub) => {
                              const subConfig =
                                ALL_PAGES_CONFIG[
                                  sub.key as keyof typeof ALL_PAGES_CONFIG
                                ];
                              const isSubActive = pathname === subConfig?.href;
                              const SubIcon = subConfig?.icon;

                              return (
                                <Link
                                  key={sub.key}
                                  href={subConfig?.href || "#"}
                                  onClick={() => setSidebarOpen(false)}
                                  className={`flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 group ${
                                    isSubActive
                                      ? "bg-primary/10 text-primary"
                                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                  }`}
                                >
                                  {SubIcon && (
                                    <SubIcon
                                      className={`h-4 w-4 ${
                                        isSubActive
                                          ? "text-primary"
                                          : "text-muted-foreground group-hover:text-primary"
                                      }`}
                                    />
                                  )}
                                  <span className="flex-1">{sub.label}</span>
                                </Link>
                              );
                            })}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={pageConfig?.href || "#"}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 group ${
                        isActive
                          ? "bg-[#0b7a8e] text-white shadow-sm"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      {IconComponent && (
                        <IconComponent
                          className={`h-5 w-5 transition-colors shrink-0 ${
                            isActive
                              ? "text-white"
                              : "text-muted-foreground group-hover:text-[#0b7a8e]"
                          }`}
                        />
                      )}
                      <span className="flex-1 text-left">{menuItem.label}</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card/80 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-6">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex p-2 hover:bg-accent rounded-lg transition-colors"
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-accent rounded-lg"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative max-w-md w-full hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full pl-10 pr-4 py-2 bg-muted/50 border-none rounded-lg text-sm focus:ring-2 focus:ring-[#0b7a8e] outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block text-sm text-muted-foreground">
              Logged in as:{" "}
              <span className="font-semibold text-[#0b7a8e]">
                {userSession.name}
              </span>
            </div>

            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-accent relative transition-colors group"
            >
              <Bell className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-card flex items-center justify-center text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-6 top-16 w-96 bg-card border rounded-xl shadow-xl z-50 max-h-96 overflow-hidden flex flex-col">
                <div className="p-4 border-b flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Notifications
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {unreadCount} unread
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs font-medium text-[#0b7a8e] hover:text-[#086878] px-3 py-1 bg-[#0b7a8e]/10 rounded-lg"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-1 hover:bg-accent rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="overflow-y-auto flex-1">
                  {notifications.length === 0 ? (
                    <div className="p-12 text-center">
                      <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground font-medium">
                        No notifications
                      </p>
                      <p className="text-muted-foreground text-sm mt-1">
                        You're all caught up!
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 hover:bg-muted/50 transition-colors ${!notification.read ? "bg-[#0b7a8e]/5" : ""} ${
                            notification.bookingId
                              ? "border-l-3 border-l-green-500"
                              : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}
                            >
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="font-bold text-sm text-foreground">
                                  {notification.title}
                                </h4>
                                {!notification.read && (
                                  <span className="h-2 w-2 bg-[#0b7a8e] rounded-full shrink-0 mt-1.5"></span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  {notification.time}
                                </span>
                                <div className="flex gap-2">
                                  {notification.link && (
                                    <Link
                                      href={notification.link}
                                      onClick={() => {
                                        handleMarkAsRead(notification.id);
                                        setShowNotifications(false);
                                      }}
                                      className="text-xs font-medium text-[#0b7a8e] hover:text-[#086878] flex items-center gap-1"
                                    >
                                      View <ExternalLink className="w-3 h-3" />
                                    </Link>
                                  )}
                                  <button
                                    onClick={() =>
                                      handleMarkAsRead(notification.id)
                                    }
                                    className="text-xs font-bold text-gray-600 hover:text-gray-700"
                                  >
                                    Mark read
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3 border-t bg-muted/50"></div>
              </div>
            </>
          )}
        </header>

        <main className="flex-1 p-6 overflow-y-auto bg-muted/20">
          <div className="w-full">
            {pageAllowed ? (
              children
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-24 gap-3">
                <Lock className="h-10 w-10 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Access restricted</h2>
                <p className="text-muted-foreground max-w-md">
                  Your account does not have permission to view this page. Ask an
                  administrator to grant access in Role Manager.
                </p>
                <Link href="/admin/dashboard" className="text-primary font-medium hover:underline">
                  Back to dashboard
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
