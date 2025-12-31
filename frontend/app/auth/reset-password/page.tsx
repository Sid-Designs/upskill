"use client"

import AuthLayout from '@/app/layouts/AuthLayout'
import api from '@/lib/api'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

const ResetPasswordPage = () => {
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const searchParams = useSearchParams()
    const token = searchParams.get('token') ?? ''
    const hasToken = Boolean(token)
    const router = useRouter()

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        const newPassword = String(formData.get('newPassword') ?? '')
        const confirmPassword = String(formData.get('confirmPassword') ?? '')

        if (!hasToken) {
            setErrorMessage('Missing or invalid reset token. Try your email link again.')
            return
        }

        if (!newPassword || !confirmPassword) {
            setErrorMessage('Please fill out both password fields')
            return
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage('Passwords do not match')
            return
        }

        setErrorMessage('')
        setSuccessMessage('')
        setIsSubmitting(true)
        try {
            const res = await api.post('/api/user/reset-password', { token, newPassword })
            const apiError = (res.data as any)?.error
            if (apiError) {
                setErrorMessage(apiError)
                return
            }

            setSuccessMessage('Password updated! Redirecting to login…')
            setTimeout(() => router.push('/auth/login'), 1200)
        } catch (error) {
            const err: any = error
            const message = err?.response?.data?.error || err?.message || 'Unable to reset password'
            setErrorMessage(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AuthLayout>
            <div className="w-full h-full flex flex-col justify-center px-5 py-8 sm:px-8 sm:py-10 gap-8">
                <div className="text-center space-y-2">
                    <p className="text-xl sm:text-2xl font-semibold text-[var(--color-primary)]">Reset your password</p>
                    <h1 className="text-2xl sm:text-3xl font-semibold">Create a new one</h1>
                    <p className="text-xs sm:text-sm text-[var(--color-muted)]">
                        {hasToken
                            ? 'Choose a strong password and confirm it to finish resetting.'
                            : 'We could not find a reset token. Try your email link again.'}
                    </p>
                </div>

                <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
                    <div className="text-xs sm:text-sm text-center text-[var(--color-muted)] break-all">
                        <span className="font-semibold text-[var(--color-foreground)]">Reset token:</span>{' '}
                        {hasToken ? token : 'missing'}
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        {errorMessage && (
                            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-md text-red-700">{errorMessage}</div>
                        )}
                        {successMessage && (
                            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-md text-green-700">{successMessage}</div>
                        )}
                        <div className="relative group">
                            <input
                                id="newPassword"
                                name="newPassword"
                                type={showNew ? 'text' : 'password'}
                                autoComplete="new-password"
                                placeholder=" "
                                className="peer w-full rounded-lg border border-[var(--color-border)] bg-transparent pt-5 pb-3 px-4 pr-12 text-base outline-none transition-all focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                                required
                                aria-label="New password"
                                disabled={!hasToken || isSubmitting}
                            />
                            <label
                                htmlFor="newPassword"
                                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[var(--color-muted)] transition-all duration-200
								peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-xs peer-focus:text-[var(--color-primary)]
								peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:-translate-y-0 peer-[&:not(:placeholder-shown)]:text-xs"
                            >
                                New password
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowNew((prev) => !prev)}
                                className="absolute inset-y-0 right-3 my-auto h-9 px-3 text-xs font-semibold text-[var(--color-muted)] rounded-md border border-transparent hover:border-[var(--color-border)] hover:text-[var(--color-primary)] transition-colors"
                                aria-label={showNew ? 'Hide password' : 'Show password'}
                                disabled={!hasToken || isSubmitting}
                            >
                                {showNew ? 'Hide' : 'Show'}
                            </button>
                        </div>

                        <div className="relative group">
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirm ? 'text' : 'password'}
                                autoComplete="new-password"
                                placeholder=" "
                                className="peer w-full rounded-lg border border-[var(--color-border)] bg-transparent pt-5 pb-3 px-4 pr-12 text-base outline-none transition-all focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                                required
                                aria-label="Confirm password"
                                disabled={!hasToken || isSubmitting}
                            />
                            <label
                                htmlFor="confirmPassword"
                                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[var(--color-muted)] transition-all duration-200
								peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-xs peer-focus:text-[var(--color-primary)]
								peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:-translate-y-0 peer-[&:not(:placeholder-shown)]:text-xs"
                            >
                                Confirm password
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowConfirm((prev) => !prev)}
                                className="absolute inset-y-0 right-3 my-auto h-9 px-3 text-xs font-semibold text-[var(--color-muted)] rounded-md border border-transparent hover:border-[var(--color-border)] hover:text-[var(--color-primary)] transition-colors"
                                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                disabled={!hasToken || isSubmitting}
                            >
                                {showConfirm ? 'Hide' : 'Show'}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={!hasToken || isSubmitting}
                            className="btn w-full py-3 text-base font-semibold shadow-sm hover:shadow-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Updating…' : 'Update password'}
                        </button>
                    </form>

                    <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                        <span className="h-px flex-1 bg-[var(--color-border)]" />
                        <span>Need help?</span>
                        <span className="h-px flex-1 bg-[var(--color-border)]" />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs sm:text-sm">
                        <Link
                            href="/auth/login"
                            className="w-full text-center rounded-lg border border-[var(--color-border)] py-3 text-sm font-semibold transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                        >
                            Request a new reset link
                        </Link>
                    </div>
                </div>
            </div>
        </AuthLayout>
    )
}

export default ResetPasswordPage
