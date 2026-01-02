"use client"

import AuthLayout from '@/app/layouts/AuthLayout'
import api from '@/lib/api'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const SignupPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const router = useRouter()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')

    if (!email || !password) return

    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)
    try {
      const res = await api.post('/api/user/register', { email, password })
      console.log('Register response', { status: res.status, data: res.data })

      const apiError = (res.data as any)?.error
      if (apiError) {
        setErrorMessage(apiError)
        return
      }

      setSuccessMessage('Account created. Redirecting to login...')
      setTimeout(() => router.push('/auth/verify-email'), 2000)
    } catch (error) {
      const err: any = error
      const message = err?.response?.data?.error || err?.message || 'Unable to sign up'
      console.error('Register error', {
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
          <p>
            <Image
              src="/images/UpSkillLogo.png"
              alt="UpSkill Logo"
              width={140}
              height={35}
              className="inline-block mb-2"
              priority
              fetchPriority="high"
              sizes="140px"
            />
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold">Create your account</h1>
          <p className="text-xs sm:text-sm text-[var(--color-muted)]">Save your progress, organize applications, and draft better cover letters.</p>
        </div>

        <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-xl flex-col gap-6">
          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-md text-red-700">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-md text-green-700">
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

          <div className="relative group">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder=" "
              className="peer w-full rounded-lg border border-[var(--color-border)] bg-transparent pt-5 pb-3 px-4 pr-12 text-base outline-none transition-all focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
              required
              aria-label="Password"
              disabled={isSubmitting}
            />
            <label
              htmlFor="password"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[var(--color-muted)] transition-all duration-200
              peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-xs peer-focus:text-[var(--color-primary)]
              peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:-translate-y-0 peer-[&:not(:placeholder-shown)]:text-xs"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-3 my-auto h-9 px-3 text-xs font-semibold text-[var(--color-muted)] rounded-md border border-transparent hover:border-[var(--color-border)] hover:text-[var(--color-primary)] transition-colors disabled:opacity-60"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={isSubmitting}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <button
            type="submit"
            className="btn w-full py-3 text-base font-semibold shadow-sm hover:shadow-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating…' : 'Create account'}
          </button>

          <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <span className="h-px flex-1 bg-[var(--color-border)]" />
            <span>or</span>
            <span className="h-px flex-1 bg-[var(--color-border)]" />
          </div>
          
          <Link
            href="/auth/login"
            className="w-full text-center rounded-lg border border-[var(--color-border)] py-3 text-sm font-semibold transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            I already have an account
          </Link>
        </form>
      </div>
    </AuthLayout>
  )
}

export default SignupPage