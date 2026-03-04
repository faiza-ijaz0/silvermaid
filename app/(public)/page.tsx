"use client"

import { 
  CheckCircle2, ArrowRight, Star, Shield, Clock, Users, Award, Sparkles, 
  ShieldCheck, Zap, ChevronLeft, ChevronRight,
  Home, Building2, Wind, ShieldAlert, Utensils, Construction,
  Sofa, Layout, Waves, Dumbbell, Calendar, BookOpen, ArrowUpRight
} from 'lucide-react'
import { motion, useScroll, useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { INITIAL_BLOG_POSTS } from '@/lib/blog-data'
import { INITIAL_TESTIMONIALS } from '@/lib/testimonials-data'

// Reusable CTA Button Component
interface CTAButtonProps {
  text: string
  href: string
  variant?: "primary" | "secondary" | "dark" 
  icon?: React.ComponentType<{ className?: string }> | null
  className?: string
}

const CTAButton = ({ text, href, variant = "primary", icon: Icon = null, className = "" }: CTAButtonProps) => {
  const baseStyles = "px-8 py-3.5 rounded-full font-bold text-sm transition-all duration-200"
  const variants = {
    primary: "bg-primary text-white hover:bg-pink-700 shadow-md shadow-primary/20",
    secondary: "bg-white text-primary hover:bg-slate-50 shadow-md",
    dark: "bg-slate-900 text-white hover:bg-slate-800 shadow-md",
  }
  
  return (
    <a 
      href={href}
      className={`${baseStyles} ${variants[variant]} inline-flex items-center gap-2 hover:-translate-y-0.5 ${className}`}
    >
      {text}
      {Icon && <Icon className="h-4 w-4" />}
    </a>
  )
}

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const sliderRef = useRef<HTMLDivElement>(null)

  // Light scroll-reveal animation variants
  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' as const } })
  }
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6, ease: 'easeOut' as const } }
  }

  const [isClient, setIsClient] = useState(false)
  const [sliderIndex, setSliderIndex] = useState(0)
  const [blogSliderIndex, setBlogSliderIndex] = useState(0)
  const [testimonialSliderIndex, setTestimonialSliderIndex] = useState(0)
  const [airQuality, setAirQuality] = useState(72)
  const [airQualityStatus, setAirQualityStatus] = useState("Moderate")
  const [airQualityColor, setAirQualityColor] = useState("text-amber-500")
  const [loading, setLoading] = useState(true)
  const [textIndex, setTextIndex] = useState(0)

  const heroTexts = [
    "We Clean\nYou Relax",
    "Pure Air\nPure Health",
    "Certified\nExcellence",
    "Family\nSafe Always",
    "Sparkle &\nShine Daily",
    "Trust Our\nExpertise"
  ]

  // Services data with Icons
  const services = [
    { title: "Residential Cleaning", href: "/services/residential-cleaning", icon: <Home className="h-7 w-7" />, description: "Regular hourly cleaning for homes", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6958?auto=format&fit=crop&q=80&w=800", tag: "Regular" },
    { title: "Villa Deep Cleaning", href: "/services/villa-deep-cleaning", icon: <Building2 className="h-7 w-7" />, description: "Complete interior and exterior sanitization", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800", tag: "Deep" },
    { title: "AC Duct Cleaning", href: "/services/ac-duct-cleaning", icon: <Wind className="h-7 w-7" />, description: "Professional air duct sterilization", image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=800", tag: "Technical" },
    { title: "Office Deep Cleaning", href: "/services/office-deep-cleaning", icon: <ShieldAlert className="h-7 w-7" />, description: "Corporate space sanitization", image: "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&q=80&w=800", tag: "Deep" },
    { title: "Kitchen Deep Cleaning", href: "/services/kitchen-deep-cleaning", icon: <Utensils className="h-7 w-7" />, description: "Heavy-duty degreasing and hood cleaning", image: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&q=80&w=800", tag: "Deep" },
    { title: "Apartment Deep Cleaning", href: "/services/apartment-deep-cleaning", icon: <Building2 className="h-7 w-7" />, description: "Move-in or move-out cleaning", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=800", tag: "Deep" },
    { title: "Post Construction Cleaning", href: "/services/post-construction-cleaning", icon: <Construction className="h-7 w-7" />, description: "Remove dust and construction residue", image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&q=80&w=800", tag: "Specialist" },
    { title: "Sofa Deep Cleaning", href: "/services/sofa-deep-cleaning", icon: <Sofa className="h-7 w-7" />, description: "Professional upholstery cleaning", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800", tag: "Specialist" },
    { title: "Window Cleaning", href: "/services/window-cleaning", icon: <Layout className="h-7 w-7" />, description: "Interior and exterior window service", image: "https://images.unsplash.com/photo-1584775524340-3fb88cd59b13?auto=format&fit=crop&q=80&w=800", tag: "Regular" },
    { title: "Carpet Deep Cleaning", href: "/services/carpets-deep-cleaning", icon: <Sparkles className="h-7 w-7" />, description: "Professional carpet and rug cleaning", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800", tag: "Deep" },
    { title: "Water Tank Cleaning", href: "/services/water-tank-cleaning", icon: <Waves className="h-7 w-7" />, description: "Safe water tank sanitization", image: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&q=80&w=800", tag: "Technical" },
    { title: "Gym Deep Cleaning", href: "/services/gym-deep-cleaning", icon: <Dumbbell className="h-7 w-7" />, description: "Equipment and facility sanitization", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800", tag: "Deep" }
  ]

  // Blog posts data - using actual blog posts from database
  const blogs = INITIAL_BLOG_POSTS.slice(0, 6).map(post => ({
    title: post.title,
    excerpt: post.excerpt,
    image: post.image,
    category: post.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    date: new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    readTime: `${post.readTime} min read`,
    href: `/blog/${post.slug}`
  }))

  // Testimonials data from database
  const testimonials = INITIAL_TESTIMONIALS.slice(0, 8).map(testimonial => ({
    id: testimonial.id,
    name: testimonial.name,
    role: testimonial.role,
    image: testimonial.image,
    text: testimonial.text,
    rating: testimonial.rating
  }))

  const getAirQualityStatus = (aqi: number) => {
    if (aqi <= 50) return { status: "Good", color: "text-green-500" }
    if (aqi <= 100) return { status: "Moderate", color: "text-yellow-500" }
    if (aqi <= 150) return { status: "Unhealthy for Sensitive Groups", color: "text-orange-500" }
    if (aqi <= 200) return { status: "Unhealthy", color: "text-red-500" }
    if (aqi <= 300) return { status: "Very Unhealthy", color: "text-red-700" }
    return { status: "Hazardous", color: "text-red-900" }
  }
useEffect(() => {
  setIsClient(true)
  let isMounted = true
  let retryCount = 0
  const maxRetries = 2
  
  const fetchAirQualityData = async () => {
    if (!isMounted) return
    
    try {
      setLoading(true)
      
      // API call with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout

      const response = await fetch(
        'https://air-quality-api.open-meteo.com/v1/air_quality?latitude=25.2048&longitude=55.2708&current=us_aqi',
        {
          signal: controller.signal,
          cache: 'no-store',
          next: { revalidate: 0 }
        }
      ).catch(err => {
        if (err.name === 'AbortError') {
          throw new Error('Request timeout')
        }
        throw err
      })

      clearTimeout(timeoutId)
      
      if (!isMounted) return
      
     
      
      const data = await response.json()
      
      if (!isMounted) return
      
      // Check if data exists and has the expected structure
      if (data?.current?.us_aqi) {
        const aqi = Math.round(data.current.us_aqi)
        const { status, color } = getAirQualityStatus(aqi)
        
        setAirQuality(Math.min(aqi, 100))
        setAirQualityStatus(status)
        setAirQualityColor(color)
      } else {
        // Use fallback data if API response is invalid
        useFallbackData()
      }
      
    } catch (error) {
      console.error('Air quality fetch error:', error)
      
      if (!isMounted) return
      
      // Retry logic
      if (retryCount < maxRetries) {
        retryCount++
        setTimeout(() => {
          if (isMounted) fetchAirQualityData()
        }, 1000 * retryCount)
      } else {
        // Use fallback data after max retries
        useFallbackData()
      }
    } finally {
      if (isMounted) {
        setLoading(false)
      }
    }
  }
  
  // Fallback function - ye hamesha kaam karega chahe API fail ho
  const useFallbackData = () => {
    console.log('Using fallback air quality data')
    setAirQuality(72)
    setAirQualityStatus("Moderate")
    setAirQualityColor("text-amber-500")
  }
  
  // Call the function
  fetchAirQualityData()
  
  // Refresh every 10 minutes
  const airQualityInterval = setInterval(() => {
    if (isMounted) {
      retryCount = 0 // Reset retry count
      fetchAirQualityData()
    }
  }, 10 * 60 * 1000)

  // Hero text rotation (ye to chalta hi rahega)
  const textInterval = setInterval(() => {
    if (isMounted) {
      setTextIndex((prev) => (prev + 1) % heroTexts.length)
    }
  }, 4000)
  
  return () => {
    isMounted = false
    clearInterval(airQualityInterval)
    clearInterval(textInterval)
  }
}, []) // Empty dependency array - sirf ek baar run hoga

  // Auto-scroll services slider to the left (slow speed)
  useEffect(() => {
    let isMounted = true
    const interval = setInterval(() => {
      if (isMounted) {
        setSliderIndex((prev) => {
          const maxIndex = services.length - 4
          return prev >= maxIndex ? 0 : prev + 1
        })
      }
    }, 4000)
    
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [services.length])

  // Auto-scroll blog slider to the right (slow speed)
  useEffect(() => {
    let isMounted = true
    const interval = setInterval(() => {
      if (isMounted) {
        setBlogSliderIndex((prev) => {
          const maxIndex = blogs.length - 3
          return prev <= 0 ? maxIndex : prev - 1
        })
      }
    }, 4500)
    
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [blogs.length])

  // Only use scroll animations on client side
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  return (
    <div ref={containerRef} className="flex flex-col overflow-hidden selection:bg-primary selection:text-white">

      {/* Hero Section - Clean Premium */}
      <section 
        className="relative pt-16 pb-24 px-4 md:px-8 min-h-[88vh] flex items-center overflow-hidden"
      >
        {/* Subtle background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50/80 to-pink-50/30" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#ea4c8c]/5 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto relative z-20">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            {/* Left Content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
              className="w-full lg:w-3/5 space-y-8"
            >
              <div>
                <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 mb-6">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[11px] font-semibold text-primary uppercase tracking-[0.12em]">Professional Cleaning Solutions</span>
                </motion.div>

                <div className="relative">
                  <motion.h1 
                    key={textIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl md:text-7xl font-black text-[#0b7a8e] leading-[0.95] tracking-tight"
                  >
                    {heroTexts[textIndex].split('\n')[0]} <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">
                      {heroTexts[textIndex].split('\n')[1]}
                    </span>
                  </motion.h1>
                </div>

                <motion.p variants={fadeUp} className="mt-6 text-base md:text-lg text-slate-500 max-w-lg leading-relaxed">
                  Experience the future of home wellness with our AI-optimized cleaning schedules and eco-friendly protocols.
                </motion.p>

                <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-5 mt-10">
                  <CTAButton 
                    text="Get Started" 
                    href="/booking" 
                    variant="primary" 
                    icon={ArrowUpRight}
                  />
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-10 h-10 rounded-full border-3 border-white overflow-hidden shadow-sm">
                        <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    <div className="w-10 h-10 rounded-full border-3 border-white bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500">
                      20K+
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Right Content: Video Card & Widgets */}
            <div className="w-full lg:w-2/5 relative">
              <div className="relative aspect-square max-w-[460px] mx-auto">
                
                {/* Main Video Card */}
                <div className="absolute inset-0 bg-slate-900 rounded-3xl overflow-hidden shadow-2xl z-20">
                  <video 
                    className="w-full h-full object-cover opacity-60"
                    autoPlay
                    loop
                    muted
                    playsInline
                  >
                    <source src="https://videos.pexels.com/video-files/4109343/4109343-uhd_2732_1440_25fps.mp4" type="video/mp4" />
                    <img 
                      src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800" 
                      className="w-full h-full object-cover opacity-60"
                      alt="Professional Cleaning Service"
                    />
                  </video>
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                  
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-3 w-3 fill-primary text-primary" />)}
                      </div>
                      <span className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">Premium Rated</span>
                    </div>
                  </div>
                </div>

                {/* Air Quality Widget */}
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.6, ease: 'easeOut' }}
                  className="absolute -top-8 -right-8 w-40 h-40 bg-white rounded-2xl p-5 shadow-xl z-30 border border-slate-100"
                >
                  <div className="flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start">
                      <Wind className="h-5 w-5 text-[#ea4c8c]" />
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-slate-900 leading-none">{airQuality}</div>
                      <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Air Quality Index</div>
                    </div>
                  </div>
                </motion.div>

                {/* Verified Badge Widget */}
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.8, ease: 'easeOut' }}
                  className="absolute -bottom-6 -left-6 bg-white rounded-xl p-4 shadow-xl z-30 border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">Verified Pros</div>
                      <div className="text-[10px] text-slate-500">Background Checked</div>
                    </div>
                  </div>
                </motion.div>

                {/* Subtle Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/10 rounded-full blur-[100px] z-0" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Banner */}
      <section className="relative z-30 -mt-8 px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="max-w-5xl mx-auto bg-slate-900 rounded-2xl p-8 md:p-10 shadow-xl text-white"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Satisfied Clients", value: "20,000+", icon: Users },
              { label: "Service Rating", value: "4.9/5.0", icon: Star },
              { label: "Expert Cleaners", value: "250+", icon: Award },
              { label: "City Coverage", value: "100%", icon: Building2 },
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <stat.icon className="h-4 w-4 text-[#ea4c8c]" />
                  <span className="text-xl md:text-2xl font-black tracking-tight">{stat.value}</span>
                </div>
                <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Quick Service Icons */}
      <section className="py-20 px-4 overflow-hidden bg-gradient-to-b from-white to-slate-50/50 relative">
        <div className="container mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/8 text-primary font-semibold text-[11px] uppercase tracking-wider mb-3">
              <Sparkles className="h-3 w-3" />
              Quick Services
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">Everything You Need</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm">Comprehensive cleaning solutions delivered with precision and care</p>
          </motion.div>
          
          <style>{`
            @keyframes scroll-left {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .service-slider {
              display: flex;
              gap: 1.5rem;
              animation: scroll-left 60s linear infinite;
              will-change: transform;
            }
            .service-slider:hover {
              animation-play-state: paused;
            }
          `}</style>
          <div className="relative flex overflow-x-hidden">
            <div className="service-slider">
              {[...services, ...services].map((service, i) => (
                <a 
                  key={i}
                  href={service.href}
                  className="flex flex-col items-center justify-center shrink-0 w-40 p-6 bg-white border border-slate-100 rounded-2xl hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group cursor-pointer"
                >
                  <div className="h-14 w-14 rounded-xl bg-primary/8 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 mb-4">
                    {service.icon}
                  </div>
                  <span className="text-[11px] font-semibold text-center text-slate-700 leading-tight group-hover:text-primary transition-colors whitespace-normal">
                    {service.title}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Vision Mission Values */}
      <section className="py-20 bg-white relative">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/8 text-primary font-semibold text-[11px] uppercase tracking-wider mb-4">
              <Shield className="h-3 w-3" />
              Our Foundation
            </span>
            <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-3">
              Built on <span className="text-primary">Trust</span> & Excellence
            </h3>
            <p className="text-slate-500 text-base leading-relaxed">
              Setting new standards in the cleaning industry with unwavering commitment to quality and transparency
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={fadeUp}
              custom={0}
              className="group relative p-10 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:border-primary/20 transition-all duration-300 flex flex-col"
            >
              <div className="h-14 w-14 rounded-xl bg-primary/8 flex items-center justify-center text-primary mb-5">
                <Zap className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-black mb-3 text-slate-900">Our Vision</h3>
              <p className="text-slate-500 leading-relaxed">
                To be the first choice for customers, employees and suppliers in the region we operate
              </p>
            </motion.div>
            
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={fadeUp}
              custom={1}
              className="group relative p-10 bg-slate-900 rounded-2xl shadow-lg flex flex-col text-white"
            >
              <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center text-white mb-5">
                <Shield className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-black mb-3">Our Mission</h3>
              <p className="text-slate-400 leading-relaxed">
                To provide reliable, flexible and consistent solutions to our internal and external stakeholders in our hygiene business
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={fadeUp}
              custom={2}
              className="group relative p-10 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:border-primary/20 transition-all duration-300 flex flex-col"
            >
              <div className="h-14 w-14 rounded-xl bg-primary/8 flex items-center justify-center text-primary mb-5">
                <Award className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-black mb-5 text-slate-900">Core Values</h3>
              <ul className="space-y-3">
                {[
                  "Honouring our words",
                  "Trust",
                  "Reliability",
                  "Long term approach"
                ].map((val, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-slate-600">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span className="text-sm font-medium">{val}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Slider Section */}
      <section className="py-20 bg-slate-50/50 overflow-hidden relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/8 text-primary font-semibold text-[11px] uppercase tracking-wider mb-4">
                <Sparkles className="h-3 w-3" />
                Our Services
              </span>
              <h3 className="text-3xl lg:text-4xl font-black text-slate-900 leading-tight tracking-tight mb-3">
                Exceptional Care for <span className="text-primary">Every Space</span>
              </h3>
              <p className="text-slate-500 text-base leading-relaxed">
                Specialized teams equipped with cutting-edge technology delivering pristine results
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSliderIndex(Math.max(0, sliderIndex - 1))}
                disabled={sliderIndex === 0}
                className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-primary hover:text-white hover:border-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setSliderIndex(Math.min(services.length - 4, sliderIndex + 1))}
                disabled={sliderIndex >= services.length - 4}
                className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white hover:bg-pink-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Services Slider */}
          <div className="relative overflow-hidden">
            <motion.div 
              ref={sliderRef}
              className="flex gap-5"
              animate={{ x: -sliderIndex * 300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {services.map((service, i) => (
                <div key={i} className="relative h-72 w-68 rounded-2xl overflow-hidden shadow-md shrink-0 group">
                  <a href={service.href} className="block h-full w-full">
                    <img 
                      src={service.image} 
                      alt={service.title} 
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
                    
                    <div className="absolute top-4 left-4 z-10">
                      <span className="px-3 py-1 rounded-full bg-primary/90 text-[10px] font-semibold uppercase tracking-wider text-white">
                        {service.tag}
                      </span>
                    </div>

                    <div className="absolute bottom-5 left-5 right-5 z-10">
                      <h3 className="text-lg font-bold text-white mb-1">{service.title}</h3>
                      <p className="text-slate-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 mb-3">
                        {service.description}
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-white text-[11px] font-semibold">
                        Book Service <ArrowRight className="h-3 w-3 text-primary" />
                      </span>
                    </div>
                  </a>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Slider Indicators */}
          <div className="flex items-center justify-center gap-1.5 mt-6">
            {Array.from({ length: Math.ceil(services.length / 4) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setSliderIndex(i * 4)}
                className={`h-1.5 rounded-full transition-all ${i * 4 === sliderIndex ? 'w-6 bg-primary' : 'w-1.5 bg-slate-300 hover:bg-slate-400'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-slate-900 text-white overflow-hidden relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 text-primary font-semibold text-[11px] uppercase tracking-wider border border-primary/20">
                  <Award className="h-3 w-3" />
                  The Difference
                </span>
                <h3 className="text-3xl lg:text-5xl font-black tracking-tight leading-tight">
                  Why Choose <span className="text-primary">Silver Maid</span>?
                </h3>
                <p className="text-slate-400 text-base leading-relaxed">Elevating hygiene standards with certified excellence and innovation</p>
              </div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
                className="space-y-8"
              >
                {[
                  {
                    title: "Advanced Bio-Protocols",
                    desc: "We use laboratory-tested solutions that are 99.9% effective against pathogens while remaining family safe.",
                    icon: ShieldCheck
                  },
                  {
                    title: "Dubai Municipality Approved",
                    desc: "Full compliance with the highest government standards for commercial and residential hygiene.",
                    icon: Award
                  },
                  {
                    title: "Zero-Latency Booking",
                    desc: "Our real-time scheduling engine allows you to confirm your expert cleaner in under 60 seconds.",
                    icon: Zap
                  }
                ].map((item, i) => (
                  <motion.div key={i} variants={fadeUp} custom={i} className="flex gap-5 group">
                    <div className="h-14 w-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold mb-1.5">{item.title}</h4>
                      <p className="text-slate-400 text-sm leading-relaxed max-w-md">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={fadeUp}
              className="relative"
            >
              <div className="bg-slate-800/60 rounded-2xl p-10 border border-white/5">
                <h4 className="text-2xl font-black mb-8 tracking-tight">Direct Support</h4>
                <div className="space-y-8">
                  <div className="flex items-center gap-5">
                    <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center font-bold text-lg">800</div>
                    <div>
                      <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">Toll Free Support</div>
                      <div className="text-2xl font-black tracking-tight">800 4663 9675</div>
                    </div>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="grid gap-4">
                    {[
                      "Instant WhatsApp Booking",
                      "Same-Day Urgent Deep Clean",
                      "Key-Drop Service Available",
                      "Flexible Payment Plans Available"
                    ].map((text, i) => (
                      <div key={i} className="flex items-center gap-3 group">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-slate-300 text-sm font-medium">{text}</span>
                      </div>
                    ))}
                  </div>
                  <a 
                    href="https://wa.me/80046639675"
                    className="block w-full h-12 bg-white text-slate-900 rounded-xl text-center leading-[3rem] font-bold text-sm hover:bg-slate-100 transition-colors"
                  >
                    Chat via WhatsApp
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-20 bg-white overflow-hidden relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/8 text-primary font-semibold text-[11px] uppercase tracking-wider mb-4">
                <BookOpen className="h-3 w-3" />
                Expert Insights
              </span>
              <h3 className="text-3xl lg:text-4xl font-black text-slate-900 leading-tight tracking-tight mb-3">
                Knowledge & <span className="text-primary">Expert Tips</span>
              </h3>
              <p className="text-slate-500 text-base leading-relaxed">
                Stay informed with professional cleaning insights and maintenance guides
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setBlogSliderIndex(Math.max(0, blogSliderIndex - 1))}
                disabled={blogSliderIndex === 0}
                className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-primary hover:text-white hover:border-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setBlogSliderIndex(Math.min(blogs.length - 3, blogSliderIndex + 1))}
                disabled={blogSliderIndex >= blogs.length - 3}
                className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white hover:bg-pink-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Blog Slider */}
          <div className="relative overflow-hidden">
            <motion.div 
              className="flex gap-5"
              animate={{ x: -blogSliderIndex * 380 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {blogs.map((blog, i) => (
                <article key={i} className="relative w-[360px] rounded-2xl overflow-hidden shadow-sm border border-slate-100 shrink-0 bg-white group hover:shadow-lg transition-shadow duration-300">
                  <a href={blog.href} className="block cursor-pointer">
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={blog.image} 
                        alt={blog.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 rounded-full bg-primary/90 text-[10px] font-semibold uppercase tracking-wider text-white">
                          {blog.category}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{blog.date}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{blog.readTime}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {blog.title}
                      </h3>
                      <p className="text-slate-500 text-sm leading-relaxed mb-4 line-clamp-2">
                        {blog.excerpt}
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-primary text-[11px] font-semibold">
                        Read Article <ArrowUpRight className="h-3 w-3" />
                      </span>
                    </div>
                  </a>
                </article>
              ))}
            </motion.div>
          </div>

          {/* Slider Indicators */}
          <div className="flex items-center justify-center gap-1.5 mt-6">
            {Array.from({ length: Math.ceil(blogs.length / 3) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setBlogSliderIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === blogSliderIndex ? 'w-6 bg-primary' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>

          <div className="text-center mt-10">
            <a
              href="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-bold text-sm hover:bg-pink-700 transition-colors shadow-md shadow-primary/20"
            >
              <BookOpen className="h-4 w-4" />
              View All Articles
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-slate-50/50 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/8 text-primary font-semibold text-[11px] uppercase tracking-wider mb-4">
              <Star className="h-3 w-3 fill-current" />
              Testimonials
            </span>
            <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">What Our Clients Say</h3>
            <p className="text-slate-500 max-w-xl mx-auto text-sm">Real feedback from thousands across the UAE</p>
          </div>

          {/* Infinite Testimonials Carousel */}
          <div className="relative overflow-hidden">
            <motion.div 
              className="flex gap-5"
              animate={{ x: [0, -testimonials.length * 380] }}
              transition={{
                duration: testimonials.length * 6,
                repeat: Infinity,
                ease: "linear",
                repeatType: "loop"
              }}
            >
              {[...testimonials, ...testimonials].map((testimonial, i) => (
                <div
                  key={i}
                  className="w-[360px] rounded-2xl shrink-0 bg-white border border-slate-100 p-7 flex flex-col shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="flex text-primary mb-4 gap-0.5">
                    {[...Array(testimonial.rating)].map((_, idx) => <Star key={idx} className="h-3.5 w-3.5 fill-current" />)}
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6 grow">
                    &ldquo;{testimonial.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-auto">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name} 
                      className="w-10 h-10 rounded-lg object-cover" 
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{testimonial.name}</h4>
                      <p className="text-primary text-[11px] font-medium">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Edge Fades */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-50 to-transparent pointer-events-none z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none z-10" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="bg-gradient-to-br from-primary to-pink-700 rounded-2xl p-12 md:p-16 relative overflow-hidden shadow-xl"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),transparent_70%)]" />
            
            <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8">
              <div>
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4">
                  Experience the Gold Standard
                </h2>
                <p className="text-lg text-white/85 max-w-xl mx-auto leading-relaxed">
                  Join 20,000+ satisfied clients across the UAE. Transform your space into a pristine, healthy environment.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <a 
                  href="/book-service" 
                  className="bg-white text-primary px-8 py-3.5 rounded-full font-bold text-sm hover:bg-slate-50 transition-colors inline-flex items-center gap-2"
                >
                  Start Booking Now <ArrowRight className="h-4 w-4" />
                </a>
                <a 
                  href="/quote" 
                  className="bg-white/15 text-white border border-white/25 px-8 py-3.5 rounded-full font-bold text-sm hover:bg-white/25 transition-colors inline-flex items-center gap-2"
                >
                  Check Availability <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pre-Footer CTA */}
      <section className="py-12 px-4 bg-slate-50 border-t border-slate-100">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-lg">
              <h2 className="text-2xl lg:text-3xl font-black text-slate-900 mb-2 tracking-tight">Ready to Transform Your Space?</h2>
              <p className="text-slate-500 text-sm">Join thousands of satisfied customers enjoying pristine, healthy environments across the UAE</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <a
                href="/book-service"
                className="px-7 py-3 rounded-full bg-primary text-white font-bold text-sm hover:bg-pink-700 transition-colors shadow-md shadow-primary/20 inline-flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Schedule Now
              </a>
              <a
                href="/quote"
                className="px-7 py-3 rounded-full bg-white text-slate-700 font-bold text-sm hover:bg-slate-100 transition-colors border border-slate-200 inline-flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                Get Free Quote
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
    
