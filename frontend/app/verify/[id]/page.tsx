"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import Link from 'next/link'
import HideLayoutOnDashboard from '@/app/components/Dashboard/HideLayoutOnDashboard'
import { CheckCircle2, XCircle, Loader2, Award, Calendar, Target, Layers, ExternalLink, ArrowLeft } from 'lucide-react'

type CertificateData = {
  valid: boolean
  message: string
  certificate?: {
    id: string
    title: string
    phases: number
    tasksCompleted: number
    totalTasks: number
    capstoneProject: string | null
    capstoneStatus: string
    score: number | null
    completedAt: string | null
    githubUrl: string | null
  }
}

export default function VerifyCertificatePage() {
  const params = useParams()
  const certificateId = params?.id as string
  
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<CertificateData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const verifyCertificate = async () => {
      if (!certificateId) {
        setError('No certificate ID provided')
        setLoading(false)
        return
      }

      try {
        // Use public verification endpoint (no auth required)
        const response = await api.get(`/api/roadmap/verify/${certificateId}`)
        setData(response.data)
      } catch (err: unknown) {
        const axiosError = err as { response?: { data?: { message?: string } } }
        const message = axiosError?.response?.data?.message || 'Failed to verify certificate'
        setError(message)
        setData({ valid: false, message: 'Certificate verification failed' })
      } finally {
        setLoading(false)
      }
    }

    verifyCertificate()
  }, [certificateId])

  const cert = data?.certificate

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
      <HideLayoutOnDashboard />
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-2xl">
          {loading ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Loader2 className="w-12 h-12 text-[var(--color-primary)] animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700">Verifying Certificate...</p>
              <p className="text-sm text-gray-500 mt-1">Please wait while we verify this certificate</p>
            </div>
          ) : error && !data ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Error</h1>
              <p className="text-gray-500">{error}</p>
            </div>
          ) : data?.valid && cert ? (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Success Header */}
              <div className="bg-gradient-to-r from-[var(--color-success)] to-emerald-500 p-8 text-center text-white">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h1 className="text-2xl font-bold mb-1">Certificate Verified</h1>
                <p className="text-white/80 text-sm">{data.message}</p>
              </div>

              {/* Certificate Details */}
              <div className="p-8 space-y-6">
                {/* Roadmap Title */}
                <div className="text-center pb-6 border-b border-gray-100">
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Learning Roadmap Completed</p>
                  <h2 className="text-2xl font-bold text-[var(--color-primary)]">
                    {cert.title}
                  </h2>
                </div>

                {/* Capstone Project */}
                {cert.capstoneProject && (
                  <div className="bg-[var(--color-primary)]/5 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-[var(--color-primary)] mb-1">
                      <Award className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-wider font-semibold">Capstone Project Verified</span>
                    </div>
                    <p className="font-semibold text-gray-900">{cert.capstoneProject}</p>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-2">
                      <Layers className="w-5 h-5 text-[var(--color-primary)]" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{cert.phases}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Phases</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-2">
                      <Target className="w-5 h-5 text-[var(--color-primary)]" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{cert.tasksCompleted}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Tasks Done</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{cert.score || 100}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Score</p>
                  </div>
                </div>

                {/* Completion Date */}
                {cert.completedAt && (
                  <div className="flex items-center justify-between text-sm pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Completed on</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {new Date(cert.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                )}

                {/* GitHub Link */}
                {cert.githubUrl && (
                  <a
                    href={cert.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    View Capstone Project on GitHub
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                {/* Certificate ID */}
                <div className="text-center pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400">Certificate ID</p>
                  <p className="text-xs font-mono text-gray-500 mt-1">{certificateId}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Certificate Not Valid</h1>
              <p className="text-gray-500 max-w-md mx-auto">{data?.message || 'This certificate could not be verified.'}</p>
              <p className="text-xs text-gray-400 mt-4">Certificate ID: {certificateId}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
