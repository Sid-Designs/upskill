"use client"

import AuthLayout from '@/app/layouts/AuthLayout'
import api from '@/lib/api'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type UserStatus = 'active' | 'pending' | null

const VerifyEmailPage = () => {
	const searchParams = useSearchParams()
	const token = searchParams.get('token') || ''
	const router = useRouter()

	const [status, setStatus] = useState<UserStatus>(null)
	const [email, setEmail] = useState('')
	const [message, setMessage] = useState('Checking your account...')
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(true)
	const [isVerifying, setIsVerifying] = useState(false)

	useEffect(() => {
		const checkStatus = async () => {
			try {
				const res = await api.get('/api/user/me')
				const user = (res.data as any)?.user

				if (user?.status === 'active') {
					setStatus('active')
					setEmail(user?.email || '')
					setMessage('You are verified now.')
					setIsLoading(false)
					return
				}

				setStatus('pending')
				setEmail(user?.email || '')
				setMessage('Please verify your email using the link we sent.')
			} catch (err: any) {
				setError(err?.response?.data?.error || err?.message || 'Unable to fetch account status')
				setMessage('')
			} finally {
				setIsLoading(false)
			}
		}

		checkStatus()
	}, [router])

	useEffect(() => {
		const verifyWithToken = async () => {
			if (!token) return
			setIsVerifying(true)
			try {
				const startedAt = performance.now()
				const res = await api.get(`/api/user/verify-email?token=${encodeURIComponent(token)}`)
				const apiError = (res.data as any)?.error
				if (apiError) {
					setError(apiError)
					return
				}
				// Keep a bit of "drama" so the user sees the verifying state before the refresh
				const elapsed = performance.now() - startedAt
				const remaining = Math.max(0, 1200 - elapsed)
				await new Promise((resolve) => setTimeout(resolve, remaining))

				setError('')
				setMessage('Email verified. Refreshing...')
				setIsVerifying(false)

				setTimeout(() => {
					if (typeof window !== 'undefined') {
						window.location.replace('/auth/verify-email')
					} else {
						router.replace('/auth/verify-email')
					}
				}, 900)
			} catch (err: any) {
				const message = err?.response?.data?.error || err?.message || 'Verification failed'
				setError(message)
			} finally {
				// If we already cleared verifying above, keep it; otherwise clear now
				setIsVerifying((current) => (current ? false : current))
			}
		}

		verifyWithToken()
	}, [router, token])

	const tokenNotice = token ? `We detected a verification token. If valid, we will confirm and redirect.` : ''

	return (
		<AuthLayout>
			<div className="w-full h-full flex flex-col justify-center px-5 py-8 sm:px-8 sm:py-10 gap-8">
				<div className="text-center space-y-2">
					<p className="text-xl sm:text-2xl font-semibold text-[var(--color-primary)]">Verify your email</p>
					<h1 className="text-2xl sm:text-3xl font-semibold">Almost done</h1>
					<p className="text-xs sm:text-sm text-[var(--color-muted)]">
						{message || 'Check your inbox and click the verification link to activate your account.'}
					</p>
				</div>

				<div className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/70 px-4 py-5 text-sm text-[var(--color-foreground)] shadow-sm">
					{isLoading ? (
						<div className="space-y-3 animate-pulse">
							<div className="h-4 w-28 rounded bg-[var(--color-secondary)]/80" />
							<div className="h-4 w-36 rounded bg-[var(--color-secondary)]/80" />
							<div className="h-4 w-24 rounded bg-[var(--color-secondary)]/80" />
							<p className="text-[var(--color-muted)] text-xs">Hold on—we're checking your verification status.</p>
						</div>
					) : (
						<>
							{email && (
								<div className="flex items-center justify-between text-xs sm:text-sm">
									<span className="text-[var(--color-muted)]">Email</span>
									<span className="font-semibold">{email}</span>
								</div>
							)}
							{status && (
								<div className="flex items-center justify-between text-xs sm:text-sm">
									<span className="text-[var(--color-muted)]">Status</span>
									<span className="font-semibold capitalize">{status}</span>
								</div>
							)}
						</>
					)}

					{tokenNotice && (
						<div className="rounded-md border border-[var(--color-border)] bg-[var(--color-secondary)]/60 px-3 py-2 text-xs sm:text-sm text-[var(--color-muted)]">
							{tokenNotice}
							{isVerifying && <span className="ml-1 text-[var(--color-primary)]">(verifying...)</span>}
						</div>
					)}

					{error && (
						<div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs sm:text-sm text-red-700">
							{error}
						</div>
					)}

					<div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
						<span className="h-px flex-1 bg-[var(--color-border)]" />
						<span>Need help?</span>
						<span className="h-px flex-1 bg-[var(--color-border)]" />
					</div>

					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs sm:text-sm">
						<Link href="/auth/login" className="text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors">
							Back to login
						</Link>
						<Link href="/auth/resend-email" className="text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors">
							Resend verification email
						</Link>
					</div>
				</div>
			</div>
		</AuthLayout>
	)
}

export default VerifyEmailPage
