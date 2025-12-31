"use client"

import AuthLayout from '@/app/layouts/AuthLayout'
import api from '@/lib/api'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const ForgotPasswordPage = () => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()

    if (!email) {
      setErrorMessage('Please enter your email')
      return
    }

    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)
    try {
      const res = await api.post('/api/user/forgot-password', { email })
      const apiError = (res.data as any)?.error
      if (apiError) {
        setErrorMessage(apiError)
        return
      }

      setSuccessMessage('Reset link sent! Redirecting…')
      setTimeout(() => router.push('/auth/reset-password'), 1200)
    } catch (error) {
      const err: any = error
      const message = err?.response?.data?.error || err?.message || 'Unable to send reset link'
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <div className="w-full h-full flex flex-col justify-center px-5 py-8 sm:px-8 sm:py-10 gap-8">
        <div className="text-center space-y-2">
          <p className="text-xl sm:text-2xl font-semibold text-[var(--color-primary)]">Forgot your password?</p>
          <h1 className="text-2xl sm:text-3xl font-semibold">Send a reset link</h1>
          <p className="text-xs sm:text-sm text-[var(--color-muted)]">Enter your account email and we’ll email you a secure reset link.</p>
        </div>

        <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-xl flex-col gap-6">
			{errorMessage && (
				<div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-md text-red-700">{errorMessage}</div>
			)}
			{successMessage && (
				<div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-md text-green-700">{successMessage}</div>
			)}
          <div className="relative group">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder=" "
              className="peer w-full rounded-lg border border-[var(--color-border)] bg-transparent pt-5 pb-3 px-4 text-base outline-none transition-all focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
              required
              aria-label="Email"
              disabled={isSubmitting}
            />
            <label
              htmlFor="email"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[var(--color-muted)] transition-all duration-200
              peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-xs peer-focus:text-[var(--color-primary)]
              peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:-translate-y-0 peer-[&:not(:placeholder-shown)]:text-xs"
            >
              Email
            </label>
          </div>

      <button
        type="submit"
        className="btn w-full py-3 text-base font-semibold shadow-sm hover:shadow-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Sending…' : 'Send reset link'}
      </button>

          <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <span className="h-px flex-1 bg-[var(--color-border)]" />
            <span>Remembered it?</span>
            <span className="h-px flex-1 bg-[var(--color-border)]" />
          </div>

          <Link
            href="/auth/login"
            className="w-full text-center rounded-lg border border-[var(--color-border)] py-3 text-sm font-semibold transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            Back to login
          </Link>
        </form>

        <div className="mx-auto w-full max-w-xl text-center text-xs sm:text-sm text-[var(--color-muted)]">
          <p>We’ll email a link that’s valid for a short time. Check your spam folder if it doesn’t arrive.</p>
        </div>
      </div>
    </AuthLayout>
  )
}

export default ForgotPasswordPage