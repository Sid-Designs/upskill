"use client"

import AuthLayout from '@/app/layouts/AuthLayout'
import api from '@/lib/api'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const LogoutPage = () => {
	const [statusMessage, setStatusMessage] = useState('Signing you out...')
	const [errorMessage, setErrorMessage] = useState('')
	const router = useRouter()

	useEffect(() => {
		const doLogout = async () => {
			try {
				const res = await api.post('/api/user/logout')
				console.log('Logout response', { status: res.status, data: res.data })

				const apiError = (res.data as any)?.error
				if (apiError) {
					setErrorMessage(apiError)
					setStatusMessage('')
					return
				}

				setStatusMessage('Signed out. Redirecting...')
				setTimeout(() => router.push('/auth/login'), 1500)
			} catch (error) {
				const err: any = error
				const message = err?.response?.data?.error || err?.message || 'Unable to log out'
				console.error('Logout error', {
					status: err?.response?.status,
					data: err?.response?.data,
					message,
				})
				setErrorMessage(message)
				setStatusMessage('')
			}
		}

		doLogout()
	}, [router])

	return (
		<AuthLayout>
			<div className="w-full h-full flex flex-col justify-center px-5 py-10 gap-6 text-center">
				<div className="space-y-2">
					<h1 className="text-2xl sm:text-3xl font-semibold">Logging out</h1>
					<p className="text-sm text-[var(--color-muted)]">We’re ending your session securely.</p>
				</div>

				{statusMessage && (
					<div className="mx-auto w-full max-w-md rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-4 py-3 text-sm text-[var(--color-foreground)]">
						{statusMessage}
					</div>
				)}

				{errorMessage && (
					<div className="mx-auto w-full max-w-md rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
						{errorMessage}
					</div>
				)}

				<div className="mx-auto w-full max-w-md text-sm text-[var(--color-muted)] space-y-2">
					<p>If you aren’t redirected, you can return to login below.</p>
					<Link href="/auth/login" className="inline-block rounded-lg border border-[var(--color-border)] px-4 py-2 font-semibold hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
						Back to login
					</Link>
				</div>
			</div>
		</AuthLayout>
	)
}

export default LogoutPage
