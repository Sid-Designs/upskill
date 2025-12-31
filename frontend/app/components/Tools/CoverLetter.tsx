"use client"

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import {
  Search,
  Filter,
  Calendar,
  FileText,
  Clock,
  ChevronRight,
  RefreshCw,
  Sparkles,
  ChevronLeft,
  ChevronRight as RightIcon,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
  Copy,
  Check,
  Download,
  Eye
} from 'lucide-react'

type CoverLetter = {
  id: string
  jobTitle: string
  companyName: string
  createdAt: string
  // Optional fields returned by the detail endpoint
  jobDescription?: string
  generatedText?: string | null
  status?: 'generating' | 'completed' | 'failed'
  provider?: string | null
  updatedAt?: string
}

type CoverLettersResponse = {
  success: boolean
  data: CoverLetter[]
}

type CreateCoverLetterResponse = {
  success: boolean
  data: CoverLetter
}

const ITEMS_PER_PAGE = 10

const CoverLetterHistory: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [creatingCoverLetter, setCreatingCoverLetter] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [deletingLetterId, setDeletingLetterId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [letterToDelete, setLetterToDelete] = useState<CoverLetter | null>(null)
  const [copiedLetterId, setCopiedLetterId] = useState<string | null>(null)
  const [selectedLetter, setSelectedLetter] = useState<CoverLetter | null>(null)
  const [selectedLetterLoading, setSelectedLetterLoading] = useState(false)
  const [selectedLetterError, setSelectedLetterError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const letterIdFromSearch = searchParams.get('letterid')
  const pathSegments = (pathname ?? '').split('/').filter(Boolean)
  const coverLetterIndex = pathSegments.indexOf('cover-letter')
  const letterIdFromPath = coverLetterIndex !== -1 && coverLetterIndex < pathSegments.length - 1
    ? pathSegments[coverLetterIndex + 1]
    : null
  const letterId = letterIdFromSearch || letterIdFromPath

  // Form state
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobDescription, setJobDescription] = useState('')

  // Form errors
  const [formErrors, setFormErrors] = useState({
    jobTitle: '',
    companyName: '',
    jobDescription: ''
  })

  useEffect(() => {
    fetchCoverLetters()
  }, [])

  const fetchSelectedLetterDetailData = useCallback(async () => {
    if (!letterId) return null

    const response = await api.get<{ success: boolean; data: CoverLetter }>(
      `/api/chat/cover-letter/${letterId}`
    )

    return response.data?.data ?? null
  }, [letterId])

  useEffect(() => {
    if (!letterId) {
      setSelectedLetter(null)
      setSelectedLetterError(null)
      setSelectedLetterLoading(false)
      return
    }

    let isMounted = true

    setSelectedLetterLoading(true)
    setSelectedLetterError(null)

    fetchSelectedLetterDetailData()
      .then((payload) => {
        if (!payload) {
          throw new Error('Cover letter not found')
        }

        if (isMounted) {
          setSelectedLetter(payload)
        }
      })
      .catch((err: any) => {
        console.error('Error fetching cover letter detail:', err)
        if (isMounted) {
          setSelectedLetterError(err.response?.data?.message || 'Unable to load cover letter details right now.')
          setSelectedLetter(null)
        }
      })
      .finally(() => {
        if (isMounted) {
          setSelectedLetterLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [letterId, fetchSelectedLetterDetailData])

  useEffect(() => {
    if (!letterId) {
      return
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
    const streamUrl = `${baseUrl}/api/cover-letter/stream?coverLetterId=${letterId}`
    const es = new EventSource(streamUrl)

    const cleanupStream = () => {
      if (es.readyState !== EventSource.CLOSED) {
        es.close()
      }
    }

    es.addEventListener('completed', async () => {
      const payload = await fetchSelectedLetterDetailData()
      if (payload) {
        setSelectedLetter(payload)
      }
      setIsGenerating(false)
      setStatusMessage(null)
      cleanupStream()
    })

    es.addEventListener('failed', async (event) => {
      setIsGenerating(false)

      try {
        const data = JSON.parse((event as MessageEvent).data)

        if (data.reason === 'insufficient_credits') {
          setStatusMessage('Insufficient credits.')
        } else if (data.reason === 'profile_incomplete') {
          setStatusMessage('Please complete your profile.')
        } else {
          setStatusMessage('Failed to generate cover letter.')
        }
      } catch (error) {
        console.warn('Failed to parse SSE failure payload', error)
        setStatusMessage('Failed to generate cover letter.')
      }

      cleanupStream()
    })

    es.onerror = () => {
      console.warn('SSE error')
    }

    return () => {
      cleanupStream()
    }
  }, [letterId, fetchSelectedLetterDetailData])

  useEffect(() => {
    if (selectedLetter?.status === 'generating') {
      setIsGenerating(true)
    } else {
      setIsGenerating(false)
      setStatusMessage(null)
    }
  }, [selectedLetter])

  const fetchCoverLetters = async () => {
    setLoading(true)
    setError(null)
    try {
      // Updated API endpoint
      const response = await api.get<CoverLettersResponse>('/api/chat/cover-letters')
      const payload = response.data

      if (payload?.success && Array.isArray(payload.data)) {
        setCoverLetters(payload.data)
        setCurrentPage(1)
      } else {
        setError('Unable to load cover letters right now.')
      }
    } catch (err) {
      console.error('Error fetching cover letters:', err)
      setError('Unable to load cover letters right now.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchCoverLetters()
  }

  const validateForm = () => {
    const errors = {
      jobTitle: '',
      companyName: '',
      jobDescription: ''
    }
    let isValid = true

    if (!jobTitle.trim()) {
      errors.jobTitle = 'Job title is required'
      isValid = false
    } else if (jobTitle.trim().length > 100) {
      errors.jobTitle = 'Job title must be less than 100 characters'
      isValid = false
    }

    if (!companyName.trim()) {
      errors.companyName = 'Company name is required'
      isValid = false
    } else if (companyName.trim().length > 100) {
      errors.companyName = 'Company name must be less than 100 characters'
      isValid = false
    }

    if (!jobDescription.trim()) {
      errors.jobDescription = 'Job description is required'
      isValid = false
    } else if (jobDescription.trim().length > 5000) {
      errors.jobDescription = 'Job description is too long (max 5000 characters)'
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const openCreateModal = () => {
    setJobTitle('')
    setCompanyName('')
    setJobDescription('')
    setCreateError(null)
    setFormErrors({
      jobTitle: '',
      companyName: '',
      jobDescription: ''
    })
    setIsCreateModalOpen(true)
  }

  const closeCreateModal = () => {
    if (creatingCoverLetter) return
    setIsCreateModalOpen(false)
    setCreateError(null)
  }

  const handleCreateCoverLetter = async () => {
    if (!validateForm()) return

    setCreatingCoverLetter(true)
    setCreateError(null)

    try {
      const response = await api.post<CreateCoverLetterResponse>('/api/chat/cover-letter', {
        jobTitle: jobTitle.trim(),
        companyName: companyName.trim(),
        jobDescription: jobDescription.trim(),
      })

      const newCoverLetter = response.data?.data

      if (!newCoverLetter?.id) {
        throw new Error('Unable to generate cover letter')
      }

      setIsCreateModalOpen(false)
      setJobTitle('')
      setCompanyName('')
      setJobDescription('')

      // Refresh the list to show the new cover letter
      fetchCoverLetters()

      // Navigate to the generated cover letter detail page
      router.push(`/dashboard/cover-letter/${newCoverLetter.id}`)
    } catch (err: any) {
      console.error('Unable to generate cover letter:', err)
      const message = err.response?.data?.message ||
        err.response?.data?.error ||
        'Unable to generate cover letter right now. Please try again.'
      setCreateError(message)
    } finally {
      setCreatingCoverLetter(false)
    }
  }

  const handleDeleteCoverLetter = async () => {
    if (!letterToDelete) return

    setDeletingLetterId(letterToDelete.id)

    try {
      const response = await api.delete(`/api/chat/cover-letter/${letterToDelete.id}`)

      if (response.data?.success) {
        setCoverLetters(prev => prev.filter(letter => letter.id !== letterToDelete.id))
      } else {
        throw new Error('Failed to delete cover letter')
      }
    } catch (err: any) {
      console.error('Error deleting cover letter:', err)
      alert(err.response?.data?.message || 'Failed to delete cover letter')
    } finally {
      setDeletingLetterId(null)
      setShowDeleteModal(false)
      setLetterToDelete(null)
    }
  }

  const confirmDelete = (letter: CoverLetter, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setLetterToDelete(letter)
    setShowDeleteModal(true)
  }

  const fetchLetterGeneratedText = async (letter: CoverLetter) => {
    if (letter.generatedText && letter.generatedText.trim()) {
      return letter.generatedText
    }

    const response = await api.get<{ success: boolean; data: CoverLetter }>(
      `/api/chat/cover-letter/${letter.id}`
    )

    return response.data?.data?.generatedText
  }

  const handleCopyContent = async (letter: CoverLetter, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    try {
      const content = await fetchLetterGeneratedText(letter)

      if (content) {
        await navigator.clipboard.writeText(content)
        setCopiedLetterId(letter.id)
        setTimeout(() => setCopiedLetterId(null), 2000)
      } else {
        throw new Error('No content available')
      }
    } catch (err) {
      console.error('Failed to copy:', err)
      alert('Unable to copy cover letter content. Please try viewing it first.')
    }
  }

  const handleDownload = async (letter: CoverLetter, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    try {
      const content = await fetchLetterGeneratedText(letter)

      if (content) {
        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Cover Letter - ${letter.jobTitle} at ${letter.companyName}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        throw new Error('No content available')
      }
    } catch (err) {
      console.error('Failed to download:', err)
      alert('Unable to download cover letter. Please try viewing it first.')
    }
  }

  const filteredLetters = useMemo(() => {
    let filtered = coverLetters

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(letter =>
        letter.jobTitle?.toLowerCase().includes(query) ||
        letter.companyName?.toLowerCase().includes(query)
      )
    }

    return filtered.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [coverLetters, searchQuery])

  const totalPages = Math.ceil(filteredLetters.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedLetters = filteredLetters.slice(startIndex, endIndex)

  const formattedLetters = useMemo(() => (
    paginatedLetters.map(letter => {
      const date = new Date(letter.createdAt)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      let dateLabel: string
      if (diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
        if (diffHours === 0) {
          const diffMinutes = Math.floor(diffTime / (1000 * 60))
          dateLabel = diffMinutes < 1 ? 'Just now' : `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
        } else {
          dateLabel = `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
        }
      } else if (diffDays === 1) {
        dateLabel = 'Yesterday'
      } else if (diffDays < 7) {
        dateLabel = `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
      } else if (diffDays < 30) {
        const diffWeeks = Math.floor(diffDays / 7)
        dateLabel = `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`
      } else {
        dateLabel = new Intl.DateTimeFormat('en', {
          month: 'short',
          day: 'numeric'
        }).format(date)
      }

      return {
        ...letter,
        dateLabel,
        timeLabel: new Intl.DateTimeFormat('en', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }).format(date),
        fullDate: new Intl.DateTimeFormat('en', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }).format(date)
      }
    })
  ), [paginatedLetters])

  const pageNumbers = useMemo(() => {
    const delta = 2
    const range: (number | string)[] = []

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i)
      } else if (
        (i === currentPage - delta - 1 && currentPage > delta + 2) ||
        (i === currentPage + delta + 1 && currentPage < totalPages - delta - 1)
      ) {
        range.push('...')
      }
    }

    return range.filter((item, index, arr) => {
      if (item === '...' && arr[index - 1] === '...') return false
      return true
    })
  }, [currentPage, totalPages])

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-800'

    const colors = {
      generating: 'bg-blue-100 text-blue-800',
      completed: 'bg-emerald-100 text-emerald-800',
      failed: 'bg-rose-100 text-rose-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status?: string) => {
    if (!status) return <Loader2 className="w-4 h-4" />

    const icons = {
      generating: <Loader2 className="w-4 h-4 animate-spin" />,
      completed: <Check className="w-4 h-4" />,
      failed: <AlertTriangle className="w-4 h-4" />
    }
    return icons[status as keyof typeof icons] || <Loader2 className="w-4 h-4" />
  }

  const handleView = (letterId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    router.push(`/dashboard/cover-letter/${letterId}`)
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const goToFirstPage = () => goToPage(1)
  const goToLastPage = () => goToPage(totalPages)
  const goToNextPage = () => goToPage(currentPage + 1)
  const goToPrevPage = () => goToPage(currentPage - 1)

  const showPagination = totalPages > 1

  if (letterId) {
    const createdAtDate = selectedLetter?.createdAt ? new Date(selectedLetter.createdAt) : null
    const formattedDetailCreatedAt = createdAtDate
      ? new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(createdAtDate)
      : null
    const hasGeneratedText = Boolean(selectedLetter?.generatedText?.trim())

    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={() => router.push('/dashboard/cover-letter')}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to history
            </button>
            <p className="text-sm text-gray-500">
              Viewing {selectedLetter?.jobTitle || 'this cover letter'}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 space-y-6">
              {selectedLetterLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-4 rounded bg-gray-200 animate-pulse" />
                  ))}
                </div>
              ) : selectedLetterError ? (
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Unable to load cover letter</h3>
                  <p className="text-sm text-gray-500">{selectedLetterError}</p>
                  <button
                    onClick={() => router.push('/dashboard/cover-letter')}
                    className="px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Return to history
                  </button>
                </div>
              ) : selectedLetter ? (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Cover Letter</p>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {selectedLetter.jobTitle || 'Untitled Position'}
                    </h1>
                    <p className="text-sm text-gray-600 flex flex-wrap items-center gap-1">
                      <span>{selectedLetter.companyName || 'Company not specified'}</span>
                      {formattedDetailCreatedAt && (
                        <span className="text-xs text-gray-400">· {formattedDetailCreatedAt}</span>
                      )}
                    </p>
                    {statusMessage && (
                      <p className="text-sm text-rose-600 font-medium">{statusMessage}</p>
                    )}
                    {isGenerating && (
                      <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Generating...</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-gray-500">
                      <span>Job Description</span>
                      <span>{selectedLetter.jobDescription ? `${selectedLetter.jobDescription.length} chars` : 'Not provided'}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {selectedLetter.jobDescription || 'No job description provided.'}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-gray-500">
                      <span>Generated Letter</span>
                      {selectedLetter.status && (
                        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-[11px]">
                          {selectedLetter.status}
                        </span>
                      )}
                    </div>
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-900 leading-relaxed whitespace-pre-line max-h-[60vh] overflow-y-auto">
                      {selectedLetter.generatedText || 'The cover letter is still being generated. Please check back soon.'}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={(e) => handleCopyContent(selectedLetter, e)}
                      disabled={selectedLetterLoading || !hasGeneratedText}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-semibold text-sm transition-colors ${hasGeneratedText ? 'border-blue-600 text-blue-600 hover:bg-blue-50' : 'border-gray-300 text-gray-400 cursor-not-allowed'}`}
                    >
                      <Copy className="w-4 h-4" />
                      Copy Letter
                    </button>
                    <button
                      onClick={(e) => handleDownload(selectedLetter, e)}
                      disabled={selectedLetterLoading || !hasGeneratedText}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-semibold text-sm transition-colors ${hasGeneratedText ? 'border-emerald-600 text-emerald-600 hover:bg-emerald-50' : 'border-gray-300 text-gray-400 cursor-not-allowed'}`}
                    >
                      <Download className="w-4 h-4" />
                      Download as TXT
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No information available for this cover letter.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen p-4">
        <div className="max-w-8xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  Cover Letter
                </h1>
                <p className="text-gray-600">
                  Browse and manage your generated cover letters
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate New
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by job title or company..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Cover Letters</p>
                    <p className="text-2xl font-bold text-gray-900">{coverLetters.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">This Week</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {coverLetters.filter(letter => {
                        const letterDate = new Date(letter.createdAt)
                        const now = new Date()
                        const diffDays = Math.floor((now.getTime() - letterDate.getTime()) / (1000 * 60 * 60 * 24))
                        return diffDays <= 7
                      }).length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {coverLetters.filter(letter => {
                        const letterDate = new Date(letter.createdAt)
                        const now = new Date()
                        return letterDate.getMonth() === now.getMonth() &&
                          letterDate.getFullYear() === now.getFullYear()
                      }).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
            {/* Loading State */}
            {loading && (
              <div className="p-8">
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 animate-pulse">
                      <div className="w-12 h-12 rounded-lg bg-gray-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-1/3 bg-gray-200 rounded" />
                        <div className="h-3 w-1/4 bg-gray-200 rounded" />
                      </div>
                      <div className="h-8 w-24 bg-gray-200 rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
                  <FileText className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load History</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredLetters.length === 0 && (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-2xl mb-6">
                  <FileText className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No cover letters yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {searchQuery
                    ? 'No cover letters match your search criteria.'
                    : 'Generate your first cover letter to see it appear here.'}
                </p>
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Clear Search
                  </button>
                ) : (
                  <button
                    onClick={openCreateModal}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    Generate Cover Letter
                  </button>
                )}
              </div>
            )}

            {/* Letters List */}
            {!loading && !error && formattedLetters.length > 0 && (
              <>
                <div className="divide-y divide-gray-100">
                  {formattedLetters.map((letter) => (
                    <div
                      key={letter.id}
                      className="group p-6 hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                      onClick={(e) => handleView(letter.id, e)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="p-3 bg-blue-100 rounded-lg text-blue-600 flex-shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {letter.jobTitle || 'Untitled Position'}
                              </h3>
                              {letter.status && (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(letter.status)} flex items-center gap-1`}>
                                  {getStatusIcon(letter.status)}
                                  {letter.status}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium">{letter.companyName}</span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                <span>{letter.dateLabel} at {letter.timeLabel}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>ID: {letter.id.substring(0, 8)}...</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              e.preventDefault()
                              handleView(letter.id, e)
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View cover letter"
                          >
                            <Eye className="w-5 h-5" />
                          </button>

                          <button
                            onClick={(e) => handleCopyContent(letter, e)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Copy to clipboard"
                          >
                            {copiedLetterId === letter.id ? (
                              <Check className="w-5 h-5" />
                            ) : (
                              <Copy className="w-5 h-5" />
                            )}
                          </button>

                          <button
                            onClick={(e) => handleDownload(letter, e)}
                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Download as text file"
                          >
                            <Download className="w-5 h-5" />
                          </button>

                          <button
                            onClick={(e) => confirmDelete(letter, e)}
                            disabled={deletingLetterId === letter.id}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete cover letter"
                          >
                            {deletingLetterId === letter.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Trash2 className="w-5 h-5" />
                            )}
                          </button>

                          <ChevronRight
                            className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Results Count */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-semibold">{startIndex + 1}-{Math.min(endIndex, filteredLetters.length)}</span> of{' '}
                    <span className="font-semibold">{filteredLetters.length}</span> cover letters
                    {filteredLetters.length !== coverLetters.length && ' (filtered)'}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Pagination */}
          {showPagination && !loading && !error && filteredLetters.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="text-sm text-gray-600">
                Page <span className="font-semibold">{currentPage}</span> of{' '}
                <span className="font-semibold">{totalPages}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="First page"
                >
                  <ChevronsLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-1">
                  {pageNumbers.map((pageNum, index) => (
                    pageNum === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-400">
                        ...
                      </span>
                    ) : (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum as number)}
                        className={`w-10 h-10 rounded-lg transition-colors ${currentPage === pageNum
                            ? 'bg-blue-600 text-white border border-blue-600'
                            : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
                          }`}
                        aria-label={`Page ${pageNum}`}
                        aria-current={currentPage === pageNum ? 'page' : undefined}
                      >
                        {pageNum}
                      </button>
                    )
                  ))}
                </div>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <RightIcon className="w-5 h-5" />
                </button>

                <button
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Last page"
                >
                  <ChevronsRight className="w-5 h-5" />
                </button>
              </div>

              <div className="text-sm text-gray-500">
                {ITEMS_PER_PAGE} per page
              </div>
            </div>
          )}

          {/* Generate New Button (if no pagination shown) */}
          {!showPagination && !loading && !error && filteredLetters.length > 0 && (
            <div className="mt-6 text-center">
              <button
                onClick={openCreateModal}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2 shadow-sm"
              >
                <Sparkles className="w-5 h-5" />
                Generate New Cover Letter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Cover Letter Popup Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-800">Generate New Cover Letter</h2>
              <button
                onClick={closeCreateModal}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                disabled={creatingCoverLetter}
              >
                <X size={24} />
              </button>
            </div>

            {/* Body - Scrollable */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label htmlFor="job-title" className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  id="job-title"
                  type="text"
                  value={jobTitle}
                  onChange={(e) => {
                    setJobTitle(e.target.value)
                    if (formErrors.jobTitle) setFormErrors(prev => ({ ...prev, jobTitle: '' }))
                  }}
                  placeholder="e.g., Senior Frontend Developer"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  disabled={creatingCoverLetter}
                />
                {formErrors.jobTitle && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.jobTitle}</p>
                )}
              </div>

              <div>
                <label htmlFor="company-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  id="company-name"
                  type="text"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value)
                    if (formErrors.companyName) setFormErrors(prev => ({ ...prev, companyName: '' }))
                  }}
                  placeholder="e.g., Google, Microsoft, etc."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  disabled={creatingCoverLetter}
                />
                {formErrors.companyName && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.companyName}</p>
                )}
              </div>

              <div>
                <label htmlFor="job-description" className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description *
                </label>
                <textarea
                  id="job-description"
                  value={jobDescription}
                  onChange={(e) => {
                    setJobDescription(e.target.value)
                    if (formErrors.jobDescription) setFormErrors(prev => ({ ...prev, jobDescription: '' }))
                  }}
                  placeholder="Paste the job description here... (Max 5000 characters)"
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  disabled={creatingCoverLetter}
                  maxLength={5000}
                />
                <div className="flex justify-between items-center mt-1">
                  {formErrors.jobDescription ? (
                    <p className="text-sm text-red-600">{formErrors.jobDescription}</p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Provide a detailed job description for better results
                    </p>
                  )}
                  <span className={`text-sm ${jobDescription.length > 4500 ? 'text-red-600' : 'text-gray-500'}`}>
                    {jobDescription.length}/5000
                  </span>
                </div>
              </div>

              {createError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{createError}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t flex-shrink-0">
              <button
                onClick={closeCreateModal}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                disabled={creatingCoverLetter}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCoverLetter}
                disabled={creatingCoverLetter}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {creatingCoverLetter ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Generate Cover Letter
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && letterToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Cover Letter</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">
                Are you sure you want to delete the cover letter for{' '}
                <span className="font-semibold">{letterToDelete.jobTitle}</span> at{' '}
                <span className="font-semibold">{letterToDelete.companyName}</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Created: {new Date(letterToDelete.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setLetterToDelete(null)
                }}
                disabled={deletingLetterId === letterToDelete.id}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCoverLetter}
                disabled={deletingLetterId === letterToDelete.id}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingLetterId === letterToDelete.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Cover Letter'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CoverLetterHistory