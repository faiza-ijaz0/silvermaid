'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { verifySession } from '@/lib/auth'

// Verifies the employee against Firebase Auth and users-role before any page renders, and
// refreshes the stored session so pages read the employeeId from the user's own record.
export default function EmployeeLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    let cancelled = false

    verifySession('employee').then((session) => {
      if (cancelled) return
      if (session) {
        setVerified(true)
      } else {
        router.replace('/login/employee')
      }
    })

    return () => {
      cancelled = true
    }
  }, [router])

  if (!verified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <>{children}</>
}
