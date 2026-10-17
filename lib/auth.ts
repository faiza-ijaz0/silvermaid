import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
  onAuthStateChanged,
  User
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

export interface UserRole {
  id: string
  email: string
  name: string
  allowedPages: string[]
  createdAt: string
  updatedAt: string
  portal: 'admin' | 'employee'  // ✅ Added portal field
  employeeId?: string            // ✅ Added employeeId field
  employeeName?: string          // ✅ Added employeeName field
  roleName?:string
}

export interface SessionData {
  name(arg0: string, name: any): unknown
  roleName: string
  user: {
    uid: string
    email: string | null
    name: string | null
  }
  allowedPages: string[]
  portal: 'admin' | 'employee'   // ✅ Changed from roleName to portal
  employeeId?: string             // ✅ This is a property, not a method
  employeeName?: string           // ✅ Added employeeName
  loggedInAt?: string
}

export async function createUserWithRole(
  email: string, 
  password: string, 
  name: string, 
  allowedPages: string[], 
  portal: 'admin' | 'employee',
  employeeId?: string,
  employeeName?: string
) {
  try {
    console.log('📝 Creating user:', { email, name, portal, employeeId });
    
    // Firebase authentication mein user create karna
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    
    // User profile update
    await updateProfile(userCredential.user, {
      displayName: name
    })
    
    // Firestore mein user-role collection mein store karna
    const userRoleRef = doc(db, 'users-role', userCredential.user.uid)
    
    const userData: any = {
      email,
      name,
      allowedPages,
      portal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // Add employee fields if portal is employee
    if (portal === 'employee') {
      userData.employeeId = employeeId || ''
      userData.employeeName = employeeName || name
    }
    
    await setDoc(userRoleRef, userData)
    
    console.log('✅ User created successfully:', userCredential.user.uid)
    return { success: true, userId: userCredential.user.uid }
  } catch (error: any) {
    console.error('❌ Error creating user:', error)
    return { success: false, error: error.message }
  }
}

export async function getUserRole(uid: string): Promise<UserRole | null> {
  try {
    const userRoleRef = doc(db, 'users-role', uid)
    const docSnap = await getDoc(userRoleRef)
    
    if (docSnap.exists()) {
      const data = docSnap.data()
      // deleteUserRole marks records as deleted instead of removing them
      if (data.deleted) return null
      return {
        id: docSnap.id,
        email: data.email || '',
        name: data.name || '',
        allowedPages: data.allowedPages || [],
        createdAt: data.createdAt || '',
        updatedAt: data.updatedAt || '',
        portal: data.portal || 'admin',
        employeeId: data.employeeId || '',
        employeeName: data.employeeName || ''
      } as UserRole
    }
    return null
  } catch (error) {
    console.error('Error fetching user role:', error)
    return null
  }
}

export async function updateUserRole(uid: string, data: Partial<UserRole>) {
  try {
    const userRoleRef = doc(db, 'users-role', uid)
    await updateDoc(userRoleRef, {
      ...data,
      updatedAt: new Date().toISOString()
    })
    return { success: true }
  } catch (error: any) {
    console.error('Error updating user role:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteUserRole(uid: string) {
  try {
    const userRoleRef = doc(db, 'users-role', uid)
    await setDoc(userRoleRef, { deleted: true })
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting user role:', error)
    return { success: false, error: error.message }
  }
}

export async function validateCredentials(portal: 'admin' | 'employee', email: string, password: string) {
  try {
    console.log(`🔐 Validating ${portal} credentials for:`, email);
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    console.log('✅ Firebase Auth successful:', userCredential.user.uid);
    
    const userRole = await getUserRole(userCredential.user.uid)
    
    if (!userRole) {
      console.log('❌ User role not found in Firestore');
      return { 
        success: false, 
        message: 'User role not found. Please contact administrator.',
        redirectTo: null
      }
    }
    
    console.log('📄 User role from Firestore:', { 
      portal: userRole.portal,
      name: userRole.name,
      allowedPages: userRole.allowedPages 
    });
    
    // ✅ Check if portal matches
    if (userRole.portal !== portal) {
      console.log(`❌ Portal mismatch: expected ${portal}, got ${userRole.portal}`);
      return { 
        success: false, 
        message: portal === 'admin' 
          ? 'This is an employee account. Please use Employee Login.'
          : 'This is an admin account. Please use Admin Login.',
        redirectTo: null
      }
    }
    
    const session = buildSession(userCredential.user, userRole)

    // Determine redirect path based on portal
    const redirectTo = portal === 'admin' ? '/admin/dashboard' : '/employee/chat'
    
    return { 
      success: true, 
      session,
      redirectTo
    }
  } catch (error: any) {
    console.error('❌ Login error:', error)
    
    let message = 'Login failed. Please check your credentials.'
    if (error.code === 'auth/user-not-found') {
      message = 'User not found.'
    } else if (error.code === 'auth/wrong-password') {
      message = 'Incorrect password.'
    } else if (error.code === 'auth/invalid-email') {
      message = 'Invalid email format.'
    } else if (error.code === 'auth/too-many-requests') {
      message = 'Too many failed attempts. Please try again later.'
    }
    
    return { 
      success: false, 
      message, 
      error: error.code,
      redirectTo: null
    }
  }
}

export function storeSession(session: SessionData) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userSession', JSON.stringify(session))
    // Also set a cookie for middleware
    document.cookie = `userSession=${JSON.stringify(session)}; path=/; max-age=86400`
  }
}

export function getSession(): SessionData | null {
  if (typeof window !== 'undefined') {
    const session = localStorage.getItem('userSession')
    return session ? JSON.parse(session) : null
  }
  return null
}

export function clearSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('userSession')
    document.cookie = 'userSession=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
  }
}

export async function logout() {
  try {
    await signOut(auth)
    clearSession()
    return { success: true }
  } catch (error: any) {
    console.error('Logout error:', error)
    return { success: false, error: error.message }
  }
}

function buildSession(firebaseUser: User, userRole: UserRole): SessionData {
  return {
    user: {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: userRole.name
    },
    allowedPages: userRole.allowedPages,
    portal: userRole.portal,
    employeeId: userRole.employeeId,
    employeeName: userRole.employeeName,
    loggedInAt: new Date().toISOString(),
    roleName: '',
    name: function (arg0: string, name: any): unknown {
      throw new Error('Function not implemented.')
    }
  }
}

// Resolves with the signed-in Firebase user once Auth has restored its persisted state.
function waitForAuthUser(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

// Rebuilds the portal session from Firebase Auth and the user's users-role record instead of
// trusting localStorage, which the browser user can edit. Returns null when the visitor is not
// signed in or does not belong to the portal. This gates the UI only; Firestore security rules
// must still enforce access to the data itself.
export async function verifySession(portal: 'admin' | 'employee'): Promise<SessionData | null> {
  const firebaseUser = await waitForAuthUser()
  if (!firebaseUser) {
    clearSession()
    return null
  }

  const userRole = await getUserRole(firebaseUser.uid)
  if (!userRole || userRole.portal !== portal) {
    return null
  }

  const session = buildSession(firebaseUser, userRole)
  const previous = getSession()
  if (previous?.user?.uid === firebaseUser.uid && previous.loggedInAt) {
    session.loggedInAt = previous.loggedInAt
  }
  storeSession(session)
  return session
}

export type PortalType = 'admin' | 'manager' | 'supervisor' | 'employee' | 'client' | 'guest';