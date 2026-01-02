'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

type UserStatus = 'active' | 'pending' | 'blocked' | undefined

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const [isChecking, setIsChecking] = useState(true)
    const [message, setMessage] = useState('Checking your account...')

    useEffect(() => {
        let isMounted = true

        const verifySession = async () => {
            try {
                const res = await api.get('/api/user/me')
                const user = (res.data as any)?.user

                if (!isMounted) return

                if (!user) {
                    router.replace('/auth/login')
                    return
                }

                const status: UserStatus = user.status
                if (status && status !== 'active') {
                    router.replace('/auth/verify-email')
                    return
                }

                setMessage('')
                setIsChecking(false)
            } catch (err: any) {
                if (!isMounted) return
                const errorMessage = err?.response?.data?.error || err?.message || 'Unable to verify session'
                setMessage(errorMessage)
                router.replace('/auth/login')
            }
        }

        verifySession()

        return () => {
            isMounted = false
        }
    }, [router])

    if (isChecking) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-[var(--color-surface,#f8fafc)] text-[var(--color-muted,#6b7280)]">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-primary,#111827)] border-t-transparent" />
                    <p className="text-sm">{message}</p>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
