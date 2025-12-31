"use client"

import AuthLayout from '@/app/layouts/AuthLayout'
import api from '@/lib/api'
import Link from 'next/link'
import { useState } from 'react'

const ResendEmailPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    if (!email) return

    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)
    try {
      const res = await api.post('/api/user/resend-verification', { email })
      console.log('Resend verification response', { status: res.status, data: res.data })
      const apiError = (res.data as any)?.error
      if (apiError) {
        setErrorMessage(apiError)
        return
      }
      setSuccessMessage('Verification email sent. Check your inbox.')
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Unable to resend verification email'
      console.error('Resend verification error', {
        status: err?.response?.status,
        data: err?.response?.data,
        message,
      })
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <div className="w-full h-full flex flex-col justify-center px-5 py-8 sm:px-8 sm:py-10 gap-8">
        <div className="text-center space-y-2">
          <p className="text-xl sm:text-2xl font-semibold text-[var(--color-primary)]">Check your inbox</p>
          <h1 className="text-2xl sm:text-3xl font-semibold">Verify your email</h1>
          <p className="text-xs sm:text-sm text-[var(--color-muted)]">
            We sent a verification link to your email.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs sm:text-sm text-red-700">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-xs sm:text-sm text-green-700">
              {successMessage}
            </div>
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
            {isSubmitting ? 'Sending…' : 'Resend verification link'}
          </button>

          <p className="text-[var(--color-muted)] text-xs sm:text-sm text-center">
            Didn’t get the email? It can take a minute. Check your spam folder or request another link below.
          </p>
        </form>

        <div className="text-center text-xs sm:text-sm text-[var(--color-muted)]">
          <Link href="/auth/login" className="hover:text-[var(--color-primary)] transition-colors">
            Back to login
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}

export default ResendEmailPage