"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { gsap, useGSAP } from '@/lib/gsap'
import {
  Search,
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
  Eye,
  Briefcase,
  Mail,
  ExternalLink
} from 'lucide-react'

// Cache key and duration (5 minutes)
const COVER_LETTER_CACHE_KEY = "cover_letters_cache"
const CACHE_DURATION = 5 * 60 * 1000

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

interface CachedCoverLetters {
  letters: CoverLetter[]
  timestamp: number
  userId?: string
}

const ITEMS_PER_PAGE = 10

const CoverLetter: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const containerRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const deleteModalRef = useRef<HTMLDivElement>(null)
  const coverLetterCardRef = useRef<HTMLDivElement>(null)
  const resultContentRef = useRef<HTMLDivElement>(null)
  const sawGeneratingRef = useRef<boolean>(false)
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFromCache, setIsFromCache] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
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
  const [generationStep, setGenerationStep] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [isCompletingSteps, setIsCompletingSteps] = useState(false)
  const [resultVisible, setResultVisible] = useState(false)

  const searchParams = useSearchParams()
  const letterIdFromSearch = searchParams.get('letterid')
  const isNewParam = searchParams.get('new') === 'true' // Check if this is a newly created cover letter
  const pathSegments = (pathname ?? '').split('/').filter(Boolean)
  const coverLetterIndex = pathSegments.indexOf('cover-letter')
  const letterIdFromPath = coverLetterIndex !== -1 && coverLetterIndex < pathSegments.length - 1
    ? pathSegments[coverLetterIndex + 1]
    : null
  const letterId = letterIdFromSearch || letterIdFromPath
  
  // Track if this is a newly created cover letter (to force animation)
  const isNewlyCreatedRef = useRef<boolean>(false)

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

  // GSAP fade animations
  useGSAP(() => {
    if (!containerRef.current || letterId) return
    
    const ctx = gsap.context(() => {
      gsap.fromTo(".cover-hero", 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.4 }
      )
      gsap.fromTo(".cover-stats", 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.4, stagger: 0.06, delay: 0.1 }
      )
      gsap.fromTo(".cover-content", 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.4, delay: 0.2 }
      )
    }, containerRef)

    return () => ctx.revert()
  }, { scope: containerRef, dependencies: [letterId] })

  // Modal fade animations
  useEffect(() => {
    if (isCreateModalOpen && modalRef.current) {
      gsap.fromTo(modalRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25 }
      )
    }
  }, [isCreateModalOpen])

  useEffect(() => {
    if (showDeleteModal && deleteModalRef.current) {
      gsap.fromTo(deleteModalRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25 }
      )
    }
  }, [showDeleteModal])

  // Auto-scroll to cover letter card when page loads with a letterId
  useEffect(() => {
    if (letterId && !selectedLetterLoading && selectedLetter && coverLetterCardRef.current) {
      // Small delay to ensure DOM is ready
      const scrollTimeout = setTimeout(() => {
        coverLetterCardRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start'
        })
      }, 300)
      
      return () => clearTimeout(scrollTimeout)
    }
  }, [letterId, selectedLetterLoading, selectedLetter])

  // Fade-in animation when result appears
  useEffect(() => {
    if (showResult && resultContentRef.current) {
      // Only do fade animation if not already visible
      if (!resultVisible) {
        // Small delay then fade in
        const fadeTimeout = setTimeout(() => {
          setResultVisible(true)
          gsap.fromTo(resultContentRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
          )
        }, 100)
        
        return () => clearTimeout(fadeTimeout)
      }
    }
  }, [showResult, resultVisible])

  // Fetch user ID
  useEffect(() => {
    let active = true
    const fetchUser = async () => {
      try {
        const response = await api.get("/api/profile/get")
        const data = response.data || {}
        const id = data._id || data.id || ""
        if (active) setUserId(id)
      } catch { /* ignore */ }
    }
    void fetchUser()
    return () => { active = false }
  }, [])

  // Helper to get cached cover letters
  const getCachedCoverLetters = useCallback((currentUserId: string): CachedCoverLetters | null => {
    try {
      const cached = sessionStorage.getItem(COVER_LETTER_CACHE_KEY)
      if (!cached) return null
      
      const data: CachedCoverLetters = JSON.parse(cached)
      const isExpired = Date.now() - data.timestamp > CACHE_DURATION
      const isSameUser = data.userId === currentUserId
      
      if (isExpired || !isSameUser) {
        sessionStorage.removeItem(COVER_LETTER_CACHE_KEY)
        return null
      }
      
      return data
    } catch {
      sessionStorage.removeItem(COVER_LETTER_CACHE_KEY)
      return null
    }
  }, [])

  // Helper to set cached cover letters
  const setCachedCoverLetters = useCallback((letters: CoverLetter[], currentUserId: string) => {
    try {
      const cacheData: CachedCoverLetters = {
        letters,
        timestamp: Date.now(),
        userId: currentUserId
      }
      sessionStorage.setItem(COVER_LETTER_CACHE_KEY, JSON.stringify(cacheData))
    } catch { /* ignore storage errors */ }
  }, [])

  // Clear cache
  const clearCoverLetterCache = useCallback(() => {
    try {
      sessionStorage.removeItem(COVER_LETTER_CACHE_KEY)
    } catch { /* ignore */ }
  }, [])

  const fetchCoverLetters = useCallback(async (forceRefresh = false) => {
    // Check cache first (unless force refreshing)
    if (!forceRefresh && userId) {
      const cached = getCachedCoverLetters(userId)
      if (cached) {
        setCoverLetters(cached.letters)
        setLastUpdated(new Date(cached.timestamp))
        setIsFromCache(true)
        setLoading(false)
        setRefreshing(false)
        return
      }
    }

    setLoading(true)
    setError(null)
    setIsFromCache(false)
    
    try {
      const response = await api.get<CoverLettersResponse>('/api/chat/cover-letters')
      const payload = response.data

      if (payload?.success && Array.isArray(payload.data)) {
        setCoverLetters(payload.data)
        setCurrentPage(1)
        setLastUpdated(new Date())
        
        // Cache the results
        if (userId) {
          setCachedCoverLetters(payload.data, userId)
        }
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
  }, [userId, getCachedCoverLetters, setCachedCoverLetters])

  useEffect(() => {
    if (userId) {
      fetchCoverLetters()
    }
  }, [userId, fetchCoverLetters])

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
      // Reset the generating tracker
      sawGeneratingRef.current = false
      isNewlyCreatedRef.current = false
      return
    }

    let isMounted = true

    // Reset states for new letter
    sawGeneratingRef.current = false
    // If this is a newly created cover letter, mark it for forced animation
    if (isNewParam) {
      isNewlyCreatedRef.current = true
    }
    setShowResult(false)
    setGenerationStep(0)
    setIsGenerating(isNewParam) // Start generating animation immediately for new letters
    setIsCompletingSteps(false)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letterId, fetchSelectedLetterDetailData])

  useEffect(() => {
    if (!letterId) {
      return
    }

    let pollingInterval: NodeJS.Timeout | null = null
    let pollAttempts = 0
    const MAX_POLL_ATTEMPTS = 60 // Poll for max 60 seconds
    let isMounted = true

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
    const streamUrl = `${baseUrl}/api/cover-letter/stream?coverLetterId=${letterId}`
    let es: EventSource | null = null

    const cleanupStream = () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
        pollingInterval = null
      }
      if (es && es.readyState !== EventSource.CLOSED) {
        es.close()
      }
    }

    // Start polling as primary method (SSE may fail due to auth issues)
    const startPolling = () => {
      if (pollingInterval) return
      
      pollAttempts = 0
      pollingInterval = setInterval(async () => {
        if (!isMounted) {
          if (pollingInterval) {
            clearInterval(pollingInterval)
            pollingInterval = null
          }
          return
        }
        
        pollAttempts++
        
        try {
          const payload = await fetchSelectedLetterDetailData()
          if (payload && isMounted) {
            // Update the selected letter with latest data
            setSelectedLetter(payload)
            
            // Check if cover letter is completed or failed
            if (payload.status === 'completed' || payload.status === 'failed') {
              console.log('[Polling] Cover letter status:', payload.status)
              setIsGenerating(false)
              
              if (payload.status === 'failed') {
                setStatusMessage(payload.generatedText || 'Failed to generate cover letter.')
              } else {
                setStatusMessage(null)
              }
              
              if (pollingInterval) {
                clearInterval(pollingInterval)
                pollingInterval = null
              }
            }
          }
        } catch (err) {
          console.error('[Polling] Error:', err)
        }
        
        // Stop polling after max attempts
        if (pollAttempts >= MAX_POLL_ATTEMPTS) {
          console.log('[Polling] Max attempts reached')
          if (pollingInterval) {
            clearInterval(pollingInterval)
            pollingInterval = null
          }
        }
      }, 1500) // Poll every 1.5 seconds
    }

    // Try SSE connection (may fail due to missing credentials)
    try {
      es = new EventSource(streamUrl)

      es.addEventListener('completed', async () => {
        if (!isMounted) return
        cleanupStream()
        const payload = await fetchSelectedLetterDetailData()
        if (payload && isMounted) {
          setSelectedLetter(payload)
        }
        setIsGenerating(false)
        setStatusMessage(null)
      })

      es.addEventListener('failed', async (event) => {
        if (!isMounted) return
        cleanupStream()
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
      })

      es.onerror = () => {
        console.warn('SSE error - falling back to polling')
        // SSE failed (likely auth issue), ensure polling is running
        startPolling()
      }
    } catch (error) {
      console.warn('Failed to create EventSource:', error)
    }

    // Always start polling immediately as the primary method
    // SSE may not work due to authentication issues with EventSource
    startPolling()

    return () => {
      isMounted = false
      cleanupStream()
    }
  }, [letterId, fetchSelectedLetterDetailData])

  useEffect(() => {
    if (selectedLetter?.status === 'generating') {
      // Mark that we saw this letter being generated
      sawGeneratingRef.current = true
      setIsGenerating(true)
      setShowResult(false)
      setIsCompletingSteps(false)
    } else if (selectedLetter?.status === 'completed' && selectedLetter?.generatedText?.trim()) {
      // Check if this is a newly created cover letter OR we saw it generating
      const shouldShowAnimation = sawGeneratingRef.current || isNewlyCreatedRef.current
      
      if (shouldShowAnimation && !showResult && !isCompletingSteps) {
        // Show the completing animation through all steps
        setIsCompletingSteps(true)
        setIsGenerating(false)
        // Reset the newly created flag after starting animation
        isNewlyCreatedRef.current = false
      } else if (!shouldShowAnimation) {
        // Page was refreshed with already completed letter - show result immediately
        setShowResult(true)
        setResultVisible(true)
        setGenerationStep(4)
        setIsGenerating(false)
      }
    } else if (selectedLetter?.status === 'failed') {
      setIsGenerating(false)
      setShowResult(true)
      setResultVisible(true)
      setIsCompletingSteps(false)
      isNewlyCreatedRef.current = false
    } else if (!selectedLetter?.status && selectedLetter?.generatedText?.trim()) {
      // Check if newly created (without status field but has content)
      const shouldShowAnimation = sawGeneratingRef.current || isNewlyCreatedRef.current
      if (shouldShowAnimation && !showResult && !isCompletingSteps) {
        setIsCompletingSteps(true)
        setIsGenerating(false)
        isNewlyCreatedRef.current = false
      } else if (!shouldShowAnimation) {
        // Already completed, show result immediately
        setShowResult(true)
        setResultVisible(true)
        setGenerationStep(4)
        setIsGenerating(false)
      }
    }
  }, [selectedLetter, showResult, isCompletingSteps])

  // Animate through generation steps
  useEffect(() => {
    if (!isGenerating && !isCompletingSteps) return

    const interval = setInterval(() => {
      setGenerationStep(prev => {
        const nextStep = prev + 1
        
        // If completing steps after generation is done
        if (isCompletingSteps) {
          if (nextStep >= 4) {
            // All steps complete, show result after a brief delay
            setTimeout(() => {
              setShowResult(true)
              setResultVisible(true)
              setIsGenerating(false)
              setIsCompletingSteps(false)
            }, 800)
            clearInterval(interval)
            return 4
          }
          return nextStep
        }
        
        // Normal generation - loop between step 2 and 3
        if (nextStep >= 4) {
          return 2
        }
        return nextStep
      })
    }, isCompletingSteps ? 600 : 2500) // Faster when completing steps

    return () => clearInterval(interval)
  }, [isGenerating, isCompletingSteps])

  const handleRefresh = () => {
    setRefreshing(true)
    clearCoverLetterCache()
    fetchCoverLetters(true)
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

      // Close modal and navigate to detail page immediately
      setIsCreateModalOpen(false)
      setJobTitle('')
      setCompanyName('')
      setJobDescription('')

      // Refresh the list in background
      fetchCoverLetters()

      // Navigate to the generated cover letter detail page with ?new=true
      // This ensures the generation animation plays through all steps
      router.push(`/dashboard/cover-letter/${newCoverLetter.id}?new=true`)
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

  // Handle sending cover letter via Gmail in a popup window
  const handleSendViaGmail = (letter: CoverLetter) => {
    if (!letter.generatedText) return
    
    const subject = encodeURIComponent(`Application for ${letter.jobTitle} Position - ${letter.companyName}`)
    
    // Remove subject line from body - start from greeting
    let bodyText = letter.generatedText
    // Remove "Subject:" line if present at the beginning
    bodyText = bodyText.replace(/^Subject:.*?\n+/i, '').trim()
    
    const body = encodeURIComponent(bodyText)
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`
    
    // Calculate popup dimensions and position (centered)
    const popupWidth = 700
    const popupHeight = 600
    const left = Math.max(0, (window.screen.width - popupWidth) / 2)
    const top = Math.max(0, (window.screen.height - popupHeight) / 2)
    
    // Open Gmail in a popup window
    window.open(
      gmailUrl,
      'GmailCompose',
      `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
    )
  }

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
          {/* Back Button */}
          <button
            onClick={() => router.push('/dashboard/cover-letter')}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to all cover letters
          </button>

          {selectedLetterLoading ? (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden p-8">
              <div className="space-y-4">
                <div className="h-8 w-1/3 rounded-lg bg-gray-200 animate-pulse" />
                <div className="h-4 w-1/4 rounded bg-gray-200 animate-pulse" />
                <div className="h-32 rounded-xl bg-gray-200 animate-pulse mt-6" />
                <div className="h-64 rounded-xl bg-gray-200 animate-pulse" />
              </div>
            </div>
          ) : selectedLetterError ? (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 rounded-2xl mb-4">
                <AlertTriangle className="w-8 h-8 text-rose-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load cover letter</h3>
              <p className="text-sm text-gray-500 mb-6">{selectedLetterError}</p>
              <button
                onClick={() => router.push('/dashboard/cover-letter')}
                className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-xl hover:opacity-90 transition-colors"
              >
                Return to history
              </button>
            </div>
          ) : selectedLetter ? (
            <>
              {/* Hero Header */}
              <div className="relative overflow-hidden bg-[var(--color-primary)] rounded-2xl p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
                
                <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
                      <Briefcase className="h-4 w-4 text-white" />
                      <span className="text-sm font-medium text-white">Cover Letter</span>
                      {selectedLetter.status && (
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                          selectedLetter.status === 'completed' ? 'bg-emerald-500/20 text-emerald-100' :
                          selectedLetter.status === 'generating' ? 'bg-blue-500/20 text-blue-100' :
                          'bg-rose-500/20 text-rose-100'
                        }`}>
                          {selectedLetter.status === 'generating' && <Loader2 className="w-3 h-3 animate-spin inline mr-1" />}
                          {selectedLetter.status}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <h1 className="text-3xl font-bold text-white tracking-tight">
                        {selectedLetter.jobTitle || 'Untitled Position'}
                      </h1>
                      <div className="flex flex-wrap items-center gap-3 text-white/70">
                        <span className="font-medium text-white/90">{selectedLetter.companyName || 'Company not specified'}</span>
                        {formattedDetailCreatedAt && (
                          <span className="flex items-center gap-1.5 text-sm">
                            <Clock className="w-3.5 h-3.5" />
                            {formattedDetailCreatedAt}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {statusMessage && (
                      <p className="text-rose-200 font-medium text-sm bg-rose-500/20 px-3 py-1.5 rounded-lg inline-block">{statusMessage}</p>
                    )}
                    {isGenerating && (
                      <p className="text-blue-200 font-medium text-sm bg-blue-500/20 px-3 py-1.5 rounded-lg inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating your cover letter...
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Job Description Card */}
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      Job Description
                    </h2>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {selectedLetter.jobDescription ? `${selectedLetter.jobDescription.length} chars` : 'Not provided'}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {selectedLetter.jobDescription || 'No job description provided.'}
                  </p>
                </div>
              </div>

              {/* Generated Letter Card */}
              <div ref={coverLetterCardRef} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden scroll-mt-6">
                <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-[var(--color-primary)]/5 to-transparent">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
                      Generated Cover Letter
                    </h2>
                    {showResult && hasGeneratedText && resultVisible && (
                      <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Ready to send
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  {/* Only show the result and actions after all steps are completed */}
                  {generationStep < 4 ? (
                    <div className="py-8">
                      {/* Generation Steps */}
                      <div className="max-w-md mx-auto">
                        <div className="flex items-center justify-center mb-8">
                          <div className="relative">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary)]/70 flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/20">
                              <Sparkles className="w-8 h-8 text-white animate-pulse" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                              <Loader2 className="w-3 h-3 text-white animate-spin" />
                            </div>
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                          Crafting Your Cover Letter
                        </h3>
                        <p className="text-sm text-gray-500 text-center mb-8">
                          Our AI is creating a personalized cover letter for you
                        </p>
                        {/* Steps Progress */}
                        <div className="space-y-4">
                          {[
                            { label: 'Analyzing job requirements', icon: FileText },
                            { label: 'Reviewing your profile', icon: Eye },
                            { label: 'Matching skills & experience', icon: Briefcase },
                            { label: 'Writing personalized content', icon: Sparkles },
                          ].map((step, index) => {
                            const StepIcon = step.icon
                            const isCompleted = generationStep > index
                            const isCurrent = generationStep === index
                            return (
                              <div
                                key={index}
                                className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${
                                  isCompleted 
                                    ? 'bg-emerald-50 border border-emerald-200' 
                                    : isCurrent 
                                      ? 'bg-blue-50 border border-blue-200' 
                                      : 'bg-gray-50 border border-gray-100'
                                }`}
                              >
                                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                                  isCompleted 
                                    ? 'bg-emerald-500 text-white' 
                                    : isCurrent 
                                      ? 'bg-blue-500 text-white' 
                                      : 'bg-gray-200 text-gray-400'
                                }`}>
                                  {isCompleted ? (
                                    <Check className="w-5 h-5" />
                                  ) : isCurrent ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                  ) : (
                                    <StepIcon className="w-5 h-5" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`font-medium transition-colors duration-500 ${
                                    isCompleted 
                                      ? 'text-emerald-700' 
                                      : isCurrent 
                                        ? 'text-blue-700' 
                                        : 'text-gray-400'
                                  }`}>
                                    {step.label}
                                  </p>
                                  {isCurrent && (
                                    <p className="text-xs text-blue-500 mt-0.5 animate-pulse">
                                      In progress...
                                    </p>
                                  )}
                                  {isCompleted && (
                                    <p className="text-xs text-emerald-500 mt-0.5">
                                      Completed
                                    </p>
                                  )}
                                </div>
                                {isCompleted && (
                                  <div className="flex-shrink-0">
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                        {/* Progress bar */}
                        <div className="mt-8">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                            <span>Progress</span>
                            <span>{generationStep >= 4 ? '100' : Math.min(Math.round(((generationStep + 1) / 4) * 100), 95)}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-[var(--color-primary)] to-blue-500 rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${generationStep >= 4 ? 100 : Math.min(((generationStep + 1) / 4) * 100, 95)}%` }}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 text-center mt-6">
                          This usually takes 15-30 seconds
                        </p>
                      </div>
                    </div>
                  ) : (
                    showResult && hasGeneratedText && (
                      <div ref={resultContentRef} className="prose prose-sm max-w-none" style={{ opacity: resultVisible ? 1 : 0, transition: 'opacity 0.3s ease' }}>
                        <div className="rounded-xl bg-gray-50 border border-gray-100 p-6 text-gray-800 leading-relaxed whitespace-pre-line font-[system-ui] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                          {selectedLetter.generatedText}
                        </div>
                      </div>
                    )
                  )}
                </div>
                
                {/* Action Buttons - only show after all steps are completed */}
                {generationStep >= 4 && showResult && hasGeneratedText && (
                  <div className="px-6 pb-6 animate-fade-in" style={{ opacity: resultVisible ? 1 : 0, transition: 'opacity 0.3s ease' }}>
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                      {/* Send via Gmail - Primary Action */}
                      <button
                        onClick={() => handleSendViaGmail(selectedLetter)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm hover:shadow-md"
                      >
                        <svg className="w-5 h-5" viewBox="52 42 88 66" xmlns="http://www.w3.org/2000/svg">
                          <path fill="#4285f4" d="M58 108h14V74L52 59v43c0 3.32 2.69 6 6 6"/>
                          <path fill="#34a853" d="M120 108h14c3.32 0 6-2.69 6-6V59l-20 15"/>
                          <path fill="#fbbc04" d="M120 48v26l20-15v-8c0-7.42-8.47-11.65-14.4-7.2"/>
                          <path fill="#ea4335" d="M72 74V48l24 18 24-18v26L96 92"/>
                          <path fill="#c5221f" d="M52 51v8l20 15V48l-5.6-4.2c-5.94-4.45-14.4-.22-14.4 7.2"/>
                        </svg>
                        Send via Gmail
                        <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-50" />
                      </button>
                      {/* Copy Button */}
                      <button
                        onClick={(e) => handleCopyContent(selectedLetter, e)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 hover:border-gray-300 transition-all"
                      >
                        {copiedLetterId === selectedLetter.id ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy to Clipboard
                          </>
                        )}
                      </button>
                      {/* Download Button */}
                      <button
                        onClick={(e) => handleDownload(selectedLetter, e)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 hover:border-gray-300 transition-all"
                      >
                        <Download className="w-4 h-4" />
                        Download TXT
                      </button>
                    </div>
                    {/* Gmail hint */}
                    <p className="text-xs text-gray-400 mt-4 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      Opens Gmail in a popup window with subject and body pre-filled. Just enter the recipient&apos;s email and send. Close the popup when done.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden p-12 text-center">
              <p className="text-sm text-gray-500">No information available for this cover letter.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <div ref={containerRef} className="w-full pb-6 space-y-6">
        {/* Hero Header */}
        <div className="cover-hero relative overflow-hidden bg-[var(--color-primary)] rounded-2xl p-8">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          
          <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
                <Briefcase className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white">Cover Letters</span>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  Your Cover Letters
                </h1>
                <p className="text-white/70 max-w-xl leading-relaxed">
                  Generate and manage personalized cover letters for your job applications.
                </p>
              </div>
              
              {/* Cache indicator */}
              {!loading && lastUpdated && (
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Clock className="w-4 h-4" />
                  <span>
                    {isFromCache ? 'Cached' : 'Updated'} at {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-2 md:mt-0">
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[var(--color-primary)] rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Sparkles className="w-4 h-4" />
                Generate New
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="cover-stats bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--color-primary)]/10 rounded-xl">
                  <FileText className="w-6 h-6 text-[var(--color-primary)]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Letters</p>
                  <p className="text-2xl font-bold text-gray-900">{coverLetters.length}</p>
                </div>
              </div>
            </div>
            
            <div className="cover-stats bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <Check className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">This Week</p>
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
            
            <div className="cover-stats bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">This Month</p>
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

        {/* Main Content Card */}
        <div className="cover-content bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Search Header */}
          <div className="p-6 border-b border-gray-100">
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
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="p-8">
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 animate-pulse">
                    <div className="w-12 h-12 rounded-xl bg-gray-200" />
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
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Cover Letters</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-xl hover:opacity-90 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredLetters.length === 0 && (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[var(--color-primary)]/10 rounded-2xl mb-6">
                <Briefcase className="w-10 h-10 text-[var(--color-primary)]" />
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
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Clear Search
                </button>
              ) : (
                <button
                  onClick={openCreateModal}
                  className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-xl hover:opacity-90 transition-colors inline-flex items-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate Cover Letter
                </button>
              )}
            </div>
          )}

          {/* Letters List */}
          {!loading && !error && formattedLetters.length > 0 && (
            <div className="divide-y divide-gray-100">
              {formattedLetters.map((letter) => (
                <div
                  key={letter.id}
                  className="group p-5 hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                  onClick={(e) => handleView(letter.id, e)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="p-3 bg-[var(--color-primary)]/10 rounded-xl text-[var(--color-primary)] flex-shrink-0 group-hover:bg-[var(--color-primary)]/15 transition-colors">
                        <Briefcase className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-[var(--color-primary)] transition-colors">
                            {letter.jobTitle || 'Untitled Position'}
                          </h3>
                          {letter.status && (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(letter.status)} flex items-center gap-1`}>
                              {getStatusIcon(letter.status)}
                              {letter.status}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="font-medium text-gray-700">{letter.companyName}</span>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{letter.dateLabel} at {letter.timeLabel}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          handleView(letter.id, e)
                        }}
                        className="p-2 text-gray-400 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors"
                        title="View cover letter"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => handleCopyContent(letter, e)}
                        className="p-2 text-gray-400 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedLetterId === letter.id ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={(e) => handleDownload(letter, e)}
                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Download as text file"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => confirmDelete(letter, e)}
                        disabled={deletingLetterId === letter.id}
                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete cover letter"
                      >
                        {deletingLetterId === letter.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results Count */}
          {!loading && !error && formattedLetters.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold">{startIndex + 1}-{Math.min(endIndex, filteredLetters.length)}</span> of{' '}
                <span className="font-semibold">{filteredLetters.length}</span> cover letters
                {filteredLetters.length !== coverLetters.length && ' (filtered)'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {showPagination && !loading && !error && filteredLetters.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="text-sm text-gray-600">
              Page <span className="font-semibold">{currentPage}</span> of{' '}
              <span className="font-semibold">{totalPages}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="First page"
              >
                <ChevronsLeft className="w-5 h-5" />
              </button>

              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                      className={`w-10 h-10 rounded-xl transition-colors ${currentPage === pageNum
                          ? 'bg-[var(--color-primary)] text-white border border-[var(--color-primary)]'
                          : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
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
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <RightIcon className="w-5 h-5" />
              </button>

              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
      </div>

      {/* New Cover Letter Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div ref={modalRef} className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header with primary color */}
            <div className="flex items-center justify-between p-6 bg-[var(--color-primary)] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-white">Generate New Cover Letter</h2>
              </div>
              <button
                onClick={closeCreateModal}
                className="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                disabled={creatingCoverLetter}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body - Scrollable */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-colors bg-gray-50 focus:bg-white"
                  disabled={creatingCoverLetter}
                />
                {formErrors.jobTitle && (
                  <p className="mt-1 text-sm text-rose-600">{formErrors.jobTitle}</p>
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-colors bg-gray-50 focus:bg-white"
                  disabled={creatingCoverLetter}
                />
                {formErrors.companyName && (
                  <p className="mt-1 text-sm text-rose-600">{formErrors.companyName}</p>
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-colors resize-none bg-gray-50 focus:bg-white"
                  disabled={creatingCoverLetter}
                  maxLength={5000}
                />
                <div className="flex justify-between items-center mt-1">
                  {formErrors.jobDescription ? (
                    <p className="text-sm text-rose-600">{formErrors.jobDescription}</p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Provide a detailed job description for better results
                    </p>
                  )}
                  <span className={`text-sm ${jobDescription.length > 4500 ? 'text-rose-600' : 'text-gray-500'}`}>
                    {jobDescription.length}/5000
                  </span>
                </div>
              </div>

              {createError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
                  <p className="text-sm text-rose-600">{createError}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
              <button
                onClick={closeCreateModal}
                className="px-5 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                disabled={creatingCoverLetter}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCoverLetter}
                disabled={creatingCoverLetter}
                className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-xl hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium shadow-lg shadow-[var(--color-primary)]/25"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div ref={deleteModalRef} className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            {/* Rose colored header */}
            <div className="p-6 bg-rose-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">Delete Cover Letter</h3>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-2">
                Are you sure you want to delete the cover letter for:
              </p>
              <p className="font-semibold text-gray-900 mb-4">
                {letterToDelete.jobTitle} at {letterToDelete.companyName}
              </p>
              <p className="text-sm text-gray-500">This action cannot be undone.</p>
            </div>
            
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setLetterToDelete(null)
                }}
                className="px-5 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                disabled={deletingLetterId === letterToDelete.id}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCoverLetter}
                disabled={deletingLetterId === letterToDelete.id}
                className="px-6 py-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium"
              >
                {deletingLetterId === letterToDelete.id ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CoverLetter