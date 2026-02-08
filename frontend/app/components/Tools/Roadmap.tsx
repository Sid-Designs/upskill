"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { gsap, useGSAP } from '@/lib/gsap'
import {
  Search,
  Calendar,
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
  Check,
  Download,
  Eye,
  Map,
  Target,
  BookOpen,
  Code,
  Layers,
  ChevronDown,
  ChevronUp,
  Play,
  ExternalLink,
  LayoutList,
  Lock,
  Github,
  CheckCircle2,
  XCircle,
  Send,
} from 'lucide-react'

// ── Comprehensive Markdown renderer for AI feedback text ──
const renderMarkdownText = (text: string): React.ReactNode => {
  if (!text) return null

  // Split by newlines for block-level handling
  const lines = text.split(/\n/)
  const elements: React.ReactNode[] = []
  let listItems: { type: 'ul' | 'ol'; items: React.ReactNode[] } | null = null
  let keyIndex = 0

  const flushList = () => {
    if (listItems) {
      if (listItems.type === 'ul') {
        elements.push(
          <ul key={`list-${keyIndex++}`} className="list-disc list-inside space-y-1 my-2 ml-2">
            {listItems.items.map((item, i) => (
              <li key={i} className="text-gray-700">{item}</li>
            ))}
          </ul>
        )
      } else {
        elements.push(
          <ol key={`list-${keyIndex++}`} className="list-decimal list-inside space-y-1 my-2 ml-2">
            {listItems.items.map((item, i) => (
              <li key={i} className="text-gray-700">{item}</li>
            ))}
          </ol>
        )
      }
      listItems = null
    }
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    
    // Empty line - flush list and add spacing
    if (!trimmed) {
      flushList()
      if (elements.length > 0) {
        elements.push(<span key={`br-${keyIndex++}`} className="block h-2" />)
      }
      return
    }

    // Bullet list item: - item or * item (but not **bold**)
    const bulletMatch = trimmed.match(/^[-•]\s+(.+)$/)
    if (bulletMatch) {
      if (!listItems || listItems.type !== 'ul') {
        flushList()
        listItems = { type: 'ul', items: [] }
      }
      listItems.items.push(renderMarkdownInline(bulletMatch[1]))
      return
    }

    // Numbered list item: 1. item or 1) item
    const numMatch = trimmed.match(/^\d+[.)]\s+(.+)$/)
    if (numMatch) {
      if (!listItems || listItems.type !== 'ol') {
        flushList()
        listItems = { type: 'ol', items: [] }
      }
      listItems.items.push(renderMarkdownInline(numMatch[1]))
      return
    }

    // Heading-like: ### Heading or **Heading:**
    const headingMatch = trimmed.match(/^#{1,3}\s+(.+)$/)
    if (headingMatch) {
      flushList()
      elements.push(
        <span key={`h-${keyIndex++}`} className="block font-bold text-gray-900 mt-3 mb-1">
          {renderMarkdownInline(headingMatch[1])}
        </span>
      )
      return
    }

    // Bold line that ends with colon (like **Section:**)
    const boldHeadingMatch = trimmed.match(/^\*\*(.+?):\*\*$/)
    if (boldHeadingMatch) {
      flushList()
      elements.push(
        <span key={`bh-${keyIndex++}`} className="block font-bold text-gray-900 mt-3 mb-1">
          {boldHeadingMatch[1]}:
        </span>
      )
      return
    }

    // Regular paragraph
    flushList()
    elements.push(
      <span key={`p-${keyIndex++}`} className={idx > 0 && elements.length > 0 ? 'block mt-1' : ''}>
        {renderMarkdownInline(trimmed)}
      </span>
    )
  })

  flushList()
  return elements.length === 1 ? elements[0] : <>{elements}</>
}

const renderMarkdownInline = (text: string): React.ReactNode => {
  if (!text) return null
  
  // Process: `code`, ****bold****, ***bold***, **bold**, *italic*, __underline__, URLs
  const parts: React.ReactNode[] = []
  // Improved regex to handle multiple asterisks patterns:
  // - `code` backticks
  // - ****text**** (4 asterisks - treat as bold)
  // - ***text*** (3 asterisks - bold+italic, render as bold)
  // - **text** (2 asterisks - bold)
  // - *text* (1 asterisk - italic, but not if preceded/followed by word char)
  // - __underline__
  // - URLs
  const regex = /(`[^`]+`)|(\*{3,4}[^*]+\*{3,4})|(\*\*(?:[^*]|\*(?!\*))+\*\*)|(?<!\w)(\*[^*\n]+\*)(?!\w)|(__[^_]+__)|(\bhttps?:\/\/[^\s<>]+)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let keyIdx = 0

  while ((match = regex.exec(text)) !== null) {
    // Push text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    if (match[1]) {
      // `code` → inline code
      const code = match[1].slice(1, -1)
      parts.push(
        <code key={`code-${keyIdx++}`} className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-800 text-[13px] font-mono border border-gray-200">
          {code}
        </code>
      )
    } else if (match[2]) {
      // ***text*** or ****text**** → bold (strip 3-4 asterisks from each side)
      const content = match[2].replace(/^\*{3,4}|\*{3,4}$/g, '')
      parts.push(<strong key={`bold-${keyIdx++}`} className="font-bold text-gray-900">{content}</strong>)
    } else if (match[3]) {
      // **bold** - standard bold
      const bold = match[3].slice(2, -2)
      parts.push(<strong key={`bold-${keyIdx++}`} className="font-semibold text-gray-900">{bold}</strong>)
    } else if (match[4]) {
      // *italic* - single asterisks (not inside words)
      const italic = match[4].slice(1, -1)
      parts.push(<em key={`em-${keyIdx++}`} className="italic">{italic}</em>)
    } else if (match[5]) {
      // __underline__
      const underline = match[5].slice(2, -2)
      parts.push(<span key={`u-${keyIdx++}`} className="underline">{underline}</span>)
    } else if (match[6]) {
      // URL
      parts.push(
        <a key={`link-${keyIdx++}`} href={match[6]} target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">
          {match[6].length > 40 ? match[6].slice(0, 37) + '...' : match[6]}
        </a>
      )
    }

    lastIndex = match.index + match[0].length
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length === 0 ? text : parts.length === 1 ? parts[0] : <>{parts}</>
}

// Cache
const ROADMAP_CACHE_KEY = "roadmaps_cache"
const CACHE_DURATION = 5 * 60 * 1000

// Types
type RoadmapNode = {
  nodeId: string
  title: string
  objective: string
  estimatedHours?: number
  difficulty?: number
  successCriteria?: string
  resources: string[]
  practiceTask: string
  project: string
  proTip?: string
}

type RoadmapWeek = {
  weekNumber: number
  focus: string
  weekSummary?: string
  nodes: RoadmapNode[]
}

type RoadmapPhase = {
  phaseTitle: string
  description: string
  learningOutcomes?: string[]
  weeks: RoadmapWeek[]
}

type RoadmapContent = {
  title: string
  durationDays: number
  summary?: string
  phases: RoadmapPhase[]
  capstoneProject?: {
    title: string
    description: string
    requirements: string[]
    techStack: string[]
    evaluationCriteria: string[]
    estimatedHours?: number
    difficulty?: number
  }
  raw?: string
}

type CapstoneSubmission = {
  githubUrl: string
  verdict: 'pass' | 'partial' | 'fail'
  score: number
  requirementResults: { requirement: string; met: boolean; feedback: string }[]
  strengths: string[]
  improvements: string[]
  overallFeedback: string
  submittedAt: string
}

type RoadmapItem = {
  id: string
  goalTitle: string
  durationDays: number
  currentSkillLevel: string
  targetSkillLevel: string
  educationalBackground?: string
  priorKnowledge?: string[]
  learningStyle?: string[]
  resourceConstraints?: string
  careerGoal?: string
  additionalNotes?: string
  generatedContent?: RoadmapContent | null
  status?: 'pending' | 'completed' | 'failed'
  provider?: string | null
  completedNodes?: string[]
  totalNodes?: number
  completedNodesCount?: number
  progressPercent?: number
  learningStatus?: 'not_started' | 'in_progress' | 'completed'
  capstoneStatus?: 'not_started' | 'submitted' | 'passed' | 'failed'
  capstoneSubmissions?: CapstoneSubmission[]
  createdAt: string
  updatedAt?: string
}

type RoadmapsResponse = {
  success: boolean
  data: RoadmapItem[]
}

type CreateRoadmapResponse = {
  success: boolean
  data: RoadmapItem
}

interface CachedRoadmaps {
  items: RoadmapItem[]
  timestamp: number
  userId?: string
}

const ITEMS_PER_PAGE = 10

const PHASE_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', accent: 'bg-blue-500', light: 'bg-blue-100', icon: 'text-blue-500' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', accent: 'bg-emerald-500', light: 'bg-emerald-100', icon: 'text-emerald-500' },
  { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', accent: 'bg-violet-500', light: 'bg-violet-100', icon: 'text-violet-500' },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', accent: 'bg-amber-500', light: 'bg-amber-100', icon: 'text-amber-500' },
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', accent: 'bg-rose-500', light: 'bg-rose-100', icon: 'text-rose-500' },
]

const Roadmap: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const containerRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const deleteModalRef = useRef<HTMLDivElement>(null)
  const roadmapCardRef = useRef<HTMLDivElement>(null)
  const resultContentRef = useRef<HTMLDivElement>(null)
  const sawGeneratingRef = useRef<boolean>(false)
  const completionStartedRef = useRef<boolean>(false)
  const hasScrolledRef = useRef<boolean>(false)

  const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFromCache, setIsFromCache] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [creatingRoadmap, setCreatingRoadmap] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<RoadmapItem | null>(null)
  const [selectedRoadmap, setSelectedRoadmap] = useState<RoadmapItem | null>(null)
  const [selectedLoading, setSelectedLoading] = useState(false)
  const [selectedError, setSelectedError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [generationStep, setGenerationStep] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [isCompletingSteps, setIsCompletingSteps] = useState(false)
  const [resultVisible, setResultVisible] = useState(false)
  // Interactive state
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([0]))
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set())
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [completedNodes, setCompletedNodes] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'detail' | 'visual'>('detail')
  const progressSaveTimer = useRef<NodeJS.Timeout | null>(null)
  const isSavingProgress = useRef(false)
  // Capstone state
  const [capstoneGithubUrl, setCapstoneGithubUrl] = useState('')
  const [capstoneSubmitting, setCapstoneSubmitting] = useState(false)
  const [capstoneError, setCapstoneError] = useState<string | null>(null)
  const [capstoneResult, setCapstoneResult] = useState<CapstoneSubmission | null>(null)
  const [showCapstoneHistory, setShowCapstoneHistory] = useState(false)

  const searchParams = useSearchParams()
  const roadmapIdFromSearch = searchParams.get('roadmapid')
  const isNewParam = searchParams.get('new') === 'true'
  const pathSegments = (pathname ?? '').split('/').filter(Boolean)
  const roadmapIndex = pathSegments.indexOf('roadmap')
  const roadmapIdFromPath = roadmapIndex !== -1 && roadmapIndex < pathSegments.length - 1
    ? pathSegments[roadmapIndex + 1]
    : null
  const roadmapId = roadmapIdFromSearch || roadmapIdFromPath

  const isNewlyCreatedRef = useRef<boolean>(false)

  // Form state
  const [goalTitle, setGoalTitle] = useState('')
  const [durationDays, setDurationDays] = useState(30)
  const [currentSkillLevel, setCurrentSkillLevel] = useState('Beginner')
  const [targetSkillLevel, setTargetSkillLevel] = useState('Job-Ready')
  const [educationalBackground, setEducationalBackground] = useState('')
  const [priorKnowledge, setPriorKnowledge] = useState('')
  const [learningStyle, setLearningStyle] = useState<string[]>(['Hands-on'])
  const [resourceConstraints, setResourceConstraints] = useState('')
  const [careerGoal, setCareerGoal] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')

  const [formErrors, setFormErrors] = useState({
    goalTitle: '',
    educationalBackground: '',
    durationDays: ''
  })

  // GSAP fade animations
  useGSAP(() => {
    if (!containerRef.current || roadmapId) return
    const ctx = gsap.context(() => {
      gsap.fromTo(".roadmap-hero", { opacity: 0 }, { opacity: 1, duration: 0.4 })
      gsap.fromTo(".roadmap-stats", { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.06, delay: 0.1 })
      gsap.fromTo(".roadmap-content", { opacity: 0 }, { opacity: 1, duration: 0.4, delay: 0.2 })
    }, containerRef)
    return () => ctx.revert()
  }, { scope: containerRef, dependencies: [roadmapId] })

  useEffect(() => {
    if (isCreateModalOpen && modalRef.current) {
      gsap.fromTo(modalRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 })
    }
  }, [isCreateModalOpen])

  useEffect(() => {
    if (showDeleteModal && deleteModalRef.current) {
      gsap.fromTo(deleteModalRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 })
    }
  }, [showDeleteModal])

  useEffect(() => {
    if (roadmapId && !selectedLoading && selectedRoadmap && roadmapCardRef.current && !hasScrolledRef.current) {
      hasScrolledRef.current = true
      const scrollTimeout = setTimeout(() => {
        roadmapCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
      return () => clearTimeout(scrollTimeout)
    }
  }, [roadmapId, selectedLoading, selectedRoadmap])

  // Reset scroll ref when roadmapId changes
  useEffect(() => {
    hasScrolledRef.current = false
  }, [roadmapId])

  useEffect(() => {
    if (showResult && resultContentRef.current && !resultVisible) {
      const fadeTimeout = setTimeout(() => {
        setResultVisible(true)
        gsap.fromTo(resultContentRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
        )
      }, 100)
      return () => clearTimeout(fadeTimeout)
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

  // Cache helpers
  const getCachedRoadmaps = useCallback((currentUserId: string): CachedRoadmaps | null => {
    try {
      const cached = sessionStorage.getItem(ROADMAP_CACHE_KEY)
      if (!cached) return null
      const data: CachedRoadmaps = JSON.parse(cached)
      const isExpired = Date.now() - data.timestamp > CACHE_DURATION
      const isSameUser = data.userId === currentUserId
      if (isExpired || !isSameUser) {
        sessionStorage.removeItem(ROADMAP_CACHE_KEY)
        return null
      }
      return data
    } catch {
      sessionStorage.removeItem(ROADMAP_CACHE_KEY)
      return null
    }
  }, [])

  const setCachedRoadmaps = useCallback((items: RoadmapItem[], currentUserId: string) => {
    try {
      const cacheData: CachedRoadmaps = { items, timestamp: Date.now(), userId: currentUserId }
      sessionStorage.setItem(ROADMAP_CACHE_KEY, JSON.stringify(cacheData))
    } catch { /* ignore */ }
  }, [])

  const clearRoadmapCache = useCallback(() => {
    try { sessionStorage.removeItem(ROADMAP_CACHE_KEY) } catch { /* ignore */ }
  }, [])

  const fetchRoadmaps = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && userId) {
      const cached = getCachedRoadmaps(userId)
      if (cached) {
        setRoadmaps(cached.items)
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
      const response = await api.get<RoadmapsResponse>('/api/roadmap/')
      const payload = response.data
      if (payload?.success && Array.isArray(payload.data)) {
        setRoadmaps(payload.data)
        setCurrentPage(1)
        setLastUpdated(new Date())
        if (userId) setCachedRoadmaps(payload.data, userId)
      } else {
        setError('Unable to load roadmaps right now.')
      }
    } catch (err) {
      console.error('Error fetching roadmaps:', err)
      setError('Unable to load roadmaps right now.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [userId, getCachedRoadmaps, setCachedRoadmaps])

  useEffect(() => {
    if (userId) fetchRoadmaps()
  }, [userId, fetchRoadmaps])

  // Fetch single roadmap detail
  const fetchRoadmapDetail = useCallback(async () => {
    if (!roadmapId) return null
    const response = await api.get<{ success: boolean; data: RoadmapItem }>(`/api/roadmap/${roadmapId}`)
    return response.data?.data ?? null
  }, [roadmapId])

  // Load selected roadmap detail
  useEffect(() => {
    if (!roadmapId) {
      setSelectedRoadmap(null)
      setSelectedError(null)
      setSelectedLoading(false)
      sawGeneratingRef.current = false
      completionStartedRef.current = false
      isNewlyCreatedRef.current = false
      return
    }
    let isMounted = true
    sawGeneratingRef.current = false
    completionStartedRef.current = false
    if (isNewParam) isNewlyCreatedRef.current = true
    setShowResult(false)
    setGenerationStep(0)
    setIsGenerating(isNewParam)
    setIsCompletingSteps(false)
    setSelectedLoading(true)
    setSelectedError(null)
    setExpandedPhases(new Set([0]))
    setExpandedWeeks(new Set())
    setExpandedNodes(new Set())

    fetchRoadmapDetail()
      .then((payload) => {
        if (!payload) throw new Error('Roadmap not found')
        if (isMounted) {
          setSelectedRoadmap(payload)
          // Load persisted progress
          if (payload.completedNodes && Array.isArray(payload.completedNodes)) {
            setCompletedNodes(new Set(payload.completedNodes))
          } else {
            setCompletedNodes(new Set())
          }
          // Load persisted capstone result
          if (payload.capstoneSubmissions && payload.capstoneSubmissions.length > 0) {
            setCapstoneResult(payload.capstoneSubmissions[payload.capstoneSubmissions.length - 1])
            if (payload.capstoneSubmissions[payload.capstoneSubmissions.length - 1].githubUrl) {
              setCapstoneGithubUrl(payload.capstoneSubmissions[payload.capstoneSubmissions.length - 1].githubUrl)
            }
          } else {
            setCapstoneResult(null)
          }
          setCapstoneError(null)
        }
      })
      .catch((err: any) => {
        console.error('Error fetching roadmap detail:', err)
        if (isMounted) {
          setSelectedError(err.response?.data?.message || 'Unable to load roadmap details.')
          setSelectedRoadmap(null)
        }
      })
      .finally(() => { if (isMounted) setSelectedLoading(false) })

    return () => { isMounted = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadmapId, fetchRoadmapDetail])

  // SSE + Polling
  useEffect(() => {
    if (!roadmapId) return
    let pollingInterval: NodeJS.Timeout | null = null
    let pollAttempts = 0
    const MAX_POLL_ATTEMPTS = 120
    let isMounted = true
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
    const streamUrl = `${baseUrl}/api/roadmap/stream?roadmapId=${roadmapId}`
    let es: EventSource | null = null

    const cleanupStream = () => {
      if (pollingInterval) { clearInterval(pollingInterval); pollingInterval = null }
      if (es && es.readyState !== EventSource.CLOSED) es.close()
    }

    const startPolling = () => {
      if (pollingInterval) return
      pollAttempts = 0
      pollingInterval = setInterval(async () => {
        if (!isMounted) { if (pollingInterval) { clearInterval(pollingInterval); pollingInterval = null }; return }
        pollAttempts++
        try {
          const payload = await fetchRoadmapDetail()
          if (payload && isMounted) {
            setSelectedRoadmap(payload)
            if (payload.status === 'completed' || payload.status === 'failed') {
              setIsGenerating(false)
              if (payload.status === 'failed') {
                const failMsg = typeof payload.generatedContent === 'string'
                  ? payload.generatedContent
                  : (payload.generatedContent as any)?.raw || 'Failed to generate roadmap.'
                setStatusMessage(failMsg)
              } else {
                setStatusMessage(null)
              }
              if (pollingInterval) { clearInterval(pollingInterval); pollingInterval = null }
            }
          }
        } catch (err) { console.error('[Polling] Error:', err) }
        if (pollAttempts >= MAX_POLL_ATTEMPTS) {
          if (pollingInterval) { clearInterval(pollingInterval); pollingInterval = null }
        }
      }, 2000)
    }

    try {
      es = new EventSource(streamUrl)
      es.addEventListener('completed', async () => {
        if (!isMounted) return
        cleanupStream()
        const payload = await fetchRoadmapDetail()
        if (payload && isMounted) setSelectedRoadmap(payload)
        setIsGenerating(false)
        setStatusMessage(null)
      })
      es.addEventListener('failed', async (event) => {
        if (!isMounted) return
        cleanupStream()
        setIsGenerating(false)
        try {
          const data = JSON.parse((event as MessageEvent).data)
          if (data.reason === 'insufficient_credits') setStatusMessage('Insufficient credits.')
          else if (data.reason === 'profile_incomplete') setStatusMessage('Please complete your profile.')
          else setStatusMessage('Failed to generate roadmap.')
        } catch { setStatusMessage('Failed to generate roadmap.') }
      })
      es.onerror = () => { startPolling() }
    } catch { /* ignore */ }

    startPolling()

    return () => { isMounted = false; cleanupStream() }
  }, [roadmapId, fetchRoadmapDetail])

  // Status tracking
  useEffect(() => {
    if (selectedRoadmap?.status === 'pending') {
      sawGeneratingRef.current = true
      setIsGenerating(true)
      setShowResult(false)
      setIsCompletingSteps(false)
    } else if (selectedRoadmap?.status === 'completed' && selectedRoadmap?.generatedContent && !(selectedRoadmap.generatedContent as any)?.raw) {
      const shouldAnimate = sawGeneratingRef.current || isNewlyCreatedRef.current
      if (shouldAnimate && !showResult && !isCompletingSteps && !completionStartedRef.current) {
        completionStartedRef.current = true
        setIsCompletingSteps(true)
        setIsGenerating(false)
        isNewlyCreatedRef.current = false
      } else if (!shouldAnimate && !completionStartedRef.current) {
        setShowResult(true)
        setResultVisible(true)
        setGenerationStep(4)
        setIsGenerating(false)
      }
    } else if (selectedRoadmap?.status === 'failed') {
      setIsGenerating(false)
      setShowResult(true)
      setResultVisible(true)
      setIsCompletingSteps(false)
      completionStartedRef.current = false
      isNewlyCreatedRef.current = false
    }
  }, [selectedRoadmap, showResult, isCompletingSteps])

  // Generation step animation
  useEffect(() => {
    if (!isGenerating && !isCompletingSteps) return

    if (isCompletingSteps) {
      // Fast-forward remaining steps to completion
      const interval = setInterval(() => {
        setGenerationStep(prev => {
          const next = prev + 1
          if (next >= 4) {
            clearInterval(interval)
            setTimeout(() => {
              setShowResult(true)
              setResultVisible(true)
              setIsGenerating(false)
              setIsCompletingSteps(false)
            }, 800)
            return 4
          }
          return next
        })
      }, 600)
      return () => clearInterval(interval)
    }

    // While generating: advance steps 0→1→2, then hold at 2 (no rollback)
    const interval = setInterval(() => {
      setGenerationStep(prev => {
        if (prev >= 2) {
          clearInterval(interval)
          return 2
        }
        return prev + 1
      })
    }, 2500)
    return () => clearInterval(interval)
  }, [isGenerating, isCompletingSteps])

  const handleRefresh = () => {
    setRefreshing(true)
    clearRoadmapCache()
    fetchRoadmaps(true)
  }

  const validateForm = () => {
    const errors = { goalTitle: '', educationalBackground: '', durationDays: '' }
    let isValid = true
    if (!goalTitle.trim()) { errors.goalTitle = 'Goal title is required'; isValid = false }
    else if (goalTitle.trim().length > 200) { errors.goalTitle = 'Goal title must be less than 200 characters'; isValid = false }
    if (!educationalBackground.trim()) { errors.educationalBackground = 'Educational background is required'; isValid = false }
    if (durationDays < 7) { errors.durationDays = 'Duration must be at least 7 days'; isValid = false }
    else if (durationDays > 365) { errors.durationDays = 'Duration cannot exceed 365 days'; isValid = false }
    setFormErrors(errors)
    return isValid
  }

  const openCreateModal = () => {
    setGoalTitle('')
    setDurationDays(30)
    setCurrentSkillLevel('Beginner')
    setTargetSkillLevel('Job-Ready')
    setEducationalBackground('')
    setPriorKnowledge('')
    setLearningStyle(['Hands-on'])
    setResourceConstraints('')
    setCareerGoal('')
    setAdditionalNotes('')
    setCreateError(null)
    setFormErrors({ goalTitle: '', educationalBackground: '', durationDays: '' })
    setIsCreateModalOpen(true)
  }

  const closeCreateModal = () => {
    if (creatingRoadmap) return
    setIsCreateModalOpen(false)
    setCreateError(null)
  }

  const toggleLearningStyle = (style: string) => {
    setLearningStyle(prev =>
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    )
  }

  const handleCreateRoadmap = async () => {
    if (!validateForm()) return
    setCreatingRoadmap(true)
    setCreateError(null)
    try {
      const response = await api.post<CreateRoadmapResponse>('/api/roadmap/generate', {
        goalTitle: goalTitle.trim(),
        durationDays,
        currentSkillLevel,
        targetSkillLevel,
        educationalBackground: educationalBackground.trim(),
        priorKnowledge: priorKnowledge.split(',').map(s => s.trim()).filter(Boolean),
        learningStyle,
        resourceConstraints: resourceConstraints.trim() || null,
        careerGoal: careerGoal.trim() || null,
        additionalNotes: additionalNotes.trim() || null,
      })
      const newRoadmap = response.data?.data
      if (!newRoadmap?.id) throw new Error('Unable to generate roadmap')
      setIsCreateModalOpen(false)
      clearRoadmapCache()
      fetchRoadmaps(true)
      router.push(`/dashboard/roadmap/${newRoadmap.id}?new=true`)
    } catch (err: any) {
      console.error('Unable to generate roadmap:', err)
      const message = err.response?.data?.message || err.response?.data?.error || 'Unable to generate roadmap right now. Please try again.'
      setCreateError(message)
    } finally {
      setCreatingRoadmap(false)
    }
  }

  const handleDeleteRoadmap = async () => {
    if (!itemToDelete) return
    setDeletingId(itemToDelete.id)
    try {
      const response = await api.delete(`/api/roadmap/${itemToDelete.id}`)
      if (response.data?.success) {
        setRoadmaps(prev => prev.filter(r => r.id !== itemToDelete.id))
        clearRoadmapCache()
      } else throw new Error('Failed to delete roadmap')
    } catch (err: any) {
      console.error('Error deleting roadmap:', err)
      alert(err.response?.data?.message || 'Failed to delete roadmap')
    } finally {
      setDeletingId(null)
      setShowDeleteModal(false)
      setItemToDelete(null)
    }
  }

  const confirmDelete = (item: RoadmapItem, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setItemToDelete(item)
    setShowDeleteModal(true)
  }

  const handleDownloadJSON = (roadmap: RoadmapItem, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!roadmap.generatedContent) return
    const blob = new Blob([JSON.stringify(roadmap.generatedContent, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Roadmap - ${roadmap.goalTitle}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Interactive toggles
  const togglePhase = (index: number) => {
    setExpandedPhases(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const toggleWeek = (key: string) => {
    setExpandedWeeks(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }

  const saveProgress = useCallback((nodes: Set<string>) => {
    if (!roadmapId) return
    if (progressSaveTimer.current) clearTimeout(progressSaveTimer.current)
    progressSaveTimer.current = setTimeout(async () => {
      if (isSavingProgress.current) return
      isSavingProgress.current = true
      try {
        const res = await api.patch(`/api/roadmap/${roadmapId}/progress`, {
          completedNodes: Array.from(nodes),
        })
        // Update selectedRoadmap with server-computed progress
        if (res.data?.data) {
          setSelectedRoadmap(prev => prev ? {
            ...prev,
            completedNodes: res.data.data.completedNodes,
            totalNodes: res.data.data.totalNodes,
            progressPercent: res.data.data.progressPercent,
            learningStatus: res.data.data.learningStatus,
          } : prev)
        }
      } catch (err) {
        console.error('Failed to save progress:', err)
      } finally {
        isSavingProgress.current = false
      }
    }, 800)
  }, [roadmapId])

  // Build flat ordered list of all nodeIds from roadmap content
  const orderedNodeIds = useMemo(() => {
    const content = selectedRoadmap?.generatedContent as RoadmapContent | null
    if (!content?.phases) return [] as string[]
    const ids: string[] = []
    content.phases.forEach(phase => {
      phase.weeks.forEach(week => {
        week.nodes.forEach(node => { ids.push(node.nodeId) })
      })
    })
    return ids
  }, [selectedRoadmap])

  // Check if a node can be toggled (sequential order enforcement)
  const canToggleNode = useCallback((nodeId: string): { allowed: boolean; reason: string } => {
    const idx = orderedNodeIds.indexOf(nodeId)
    if (idx === -1) return { allowed: false, reason: 'Node not found' }
    const isDone = completedNodes.has(nodeId)

    if (isDone) {
      // Can uncheck only if no LATER nodes are checked
      for (let i = idx + 1; i < orderedNodeIds.length; i++) {
        if (completedNodes.has(orderedNodeIds[i])) {
          return { allowed: false, reason: 'Complete later nodes first to undo this one' }
        }
      }
      return { allowed: true, reason: '' }
    } else {
      // Can check only if ALL previous nodes are done
      for (let i = 0; i < idx; i++) {
        if (!completedNodes.has(orderedNodeIds[i])) {
          return { allowed: false, reason: 'Complete previous nodes first' }
        }
      }
      return { allowed: true, reason: '' }
    }
  }, [orderedNodeIds, completedNodes])

  const toggleNodeComplete = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const { allowed } = canToggleNode(nodeId)
    if (!allowed) return

    setCompletedNodes(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      saveProgress(next)

      return next
    })
  }

  // ── Capstone submission ──
  const submitCapstone = async () => {
    if (!roadmapId || !capstoneGithubUrl.trim()) return
    const urlPattern = /^https?:\/\/(www\.)?github\.com\/[^/]+\/[^/]+/
    if (!urlPattern.test(capstoneGithubUrl.trim())) {
      setCapstoneError('Please enter a valid GitHub URL (e.g. https://github.com/you/your-project)')
      return
    }

    setCapstoneSubmitting(true)
    setCapstoneError(null)
    setCapstoneResult(null)

    try {
      const res = await api.post(`/api/roadmap/${roadmapId}/verify-capstone`, {
        githubUrl: capstoneGithubUrl.trim(),
      }, { timeout: 120000 })
      if (res.data?.data?.submission) {
        setCapstoneResult(res.data.data.submission)
        // Update selectedRoadmap with new capstone status
        setSelectedRoadmap(prev => prev ? {
          ...prev,
          capstoneStatus: res.data.data.capstoneStatus,
          learningStatus: res.data.data.learningStatus,
          capstoneSubmissions: [...(prev.capstoneSubmissions || []), res.data.data.submission],
        } : prev)
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string }, status?: number }, code?: string }
      let msg = 'Something went wrong. Please try again.'
      if (axiosErr.code === 'ECONNABORTED' || axiosErr.code === 'ERR_NETWORK') {
        msg = 'Request timed out — the AI review is taking longer than usual. Refresh the page to check if your submission went through.'
      } else if (axiosErr.response?.data?.message) {
        msg = axiosErr.response.data.message
      } else if (axiosErr.response?.status === 429) {
        msg = 'Too many requests. Please wait a moment before trying again.'
      }
      setCapstoneError(msg)
    } finally {
      setCapstoneSubmitting(false)
    }
  }

  // Calculate progress
  const getProgress = (content: RoadmapContent | null) => {
    if (!content?.phases) return { completed: 0, total: 0, percent: 0 }
    let total = 0
    let completed = 0
    content.phases.forEach(phase => {
      phase.weeks.forEach(week => {
        week.nodes.forEach(node => {
          total++
          if (completedNodes.has(node.nodeId)) completed++
        })
      })
    })
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }

  const filteredRoadmaps = useMemo(() => {
    let filtered = roadmaps
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(r => r.goalTitle?.toLowerCase().includes(query))
    }
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [roadmaps, searchQuery])

  const totalPages = Math.ceil(filteredRoadmaps.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedRoadmaps = filteredRoadmaps.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const formattedRoadmaps = useMemo(() => (
    paginatedRoadmaps.map(item => {
      const date = new Date(item.createdAt)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      let dateLabel: string
      if (diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
        if (diffHours === 0) {
          const diffMinutes = Math.floor(diffTime / (1000 * 60))
          dateLabel = diffMinutes < 1 ? 'Just now' : `${diffMinutes} min ago`
        } else dateLabel = `${diffHours}h ago`
      } else if (diffDays === 1) dateLabel = 'Yesterday'
      else if (diffDays < 7) dateLabel = `${diffDays}d ago`
      else dateLabel = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date)
      return { ...item, dateLabel }
    })
  ), [paginatedRoadmaps])

  const pageNumbers = useMemo(() => {
    const delta = 2
    const range: (number | string)[] = []
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) range.push(i)
      else if ((i === currentPage - delta - 1 && currentPage > delta + 2) || (i === currentPage + delta + 1 && currentPage < totalPages - delta - 1)) range.push('...')
    }
    return range.filter((item, index, arr) => !(item === '...' && arr[index - 1] === '...'))
  }, [currentPage, totalPages])

  const handleView = (id: string, e?: React.MouseEvent) => {
    if (e) { e.stopPropagation(); e.preventDefault() }
    router.push(`/dashboard/roadmap/${id}`)
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  }

  // ===================== DETAIL VIEW =====================
  if (roadmapId) {
    const content = selectedRoadmap?.generatedContent as RoadmapContent | null
    const hasContent = content && content.phases && !content.raw
    const progress = getProgress(hasContent ? content : null)
    const createdAtDate = selectedRoadmap?.createdAt ? new Date(selectedRoadmap.createdAt) : null
    const formattedDate = createdAtDate
      ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).format(createdAtDate)
      : null

    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Back */}
          <button
            onClick={() => router.push('/dashboard/roadmap')}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to all roadmaps
          </button>

          {selectedLoading ? (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden p-8">
              <div className="space-y-4">
                <div className="h-8 w-1/3 rounded-lg bg-gray-200 animate-pulse" />
                <div className="h-4 w-1/4 rounded bg-gray-200 animate-pulse" />
                <div className="h-32 rounded-xl bg-gray-200 animate-pulse mt-6" />
                <div className="h-64 rounded-xl bg-gray-200 animate-pulse" />
              </div>
            </div>
          ) : selectedError ? (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 rounded-2xl mb-4">
                <AlertTriangle className="w-8 h-8 text-rose-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load roadmap</h3>
              <p className="text-sm text-gray-500 mb-6">{selectedError}</p>
              <button onClick={() => router.push('/dashboard/roadmap')} className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-xl hover:opacity-90 transition-colors">
                Return to roadmaps
              </button>
            </div>
          ) : selectedRoadmap ? (
            <>
              {/* Hero Header */}
              <div className="relative overflow-hidden bg-[var(--color-primary)] rounded-2xl p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
                <div className="relative space-y-4">
                  <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
                    <Map className="h-4 w-4 text-white" />
                    <span className="text-sm font-medium text-white">Learning Roadmap</span>
                    {selectedRoadmap.status && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                        selectedRoadmap.status === 'completed' ? 'bg-emerald-500/20 text-emerald-100' :
                        selectedRoadmap.status === 'pending' ? 'bg-blue-500/20 text-blue-100' :
                        'bg-rose-500/20 text-rose-100'
                      }`}>
                        {selectedRoadmap.status === 'pending' && <Loader2 className="w-3 h-3 animate-spin inline mr-1" />}
                        {selectedRoadmap.status === 'pending' ? 'Generating...' : selectedRoadmap.status === 'completed' ? 'Generated' : 'Failed'}
                      </span>
                    )}
                    {selectedRoadmap.status === 'completed' && selectedRoadmap.learningStatus && (
                      <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        selectedRoadmap.learningStatus === 'completed' ? 'bg-green-400/20 text-green-100' :
                        selectedRoadmap.learningStatus === 'in_progress' ? 'bg-amber-400/20 text-amber-100' :
                        'bg-white/10 text-white/70'
                      }`}>
                        {selectedRoadmap.learningStatus === 'completed' ? '✓ Completed' :
                         selectedRoadmap.learningStatus === 'in_progress' ? '📖 Learning' :
                         'Ready to Start'}
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">{selectedRoadmap.goalTitle}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-white/70 text-sm">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{selectedRoadmap.durationDays} days</span>
                    <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5" />{selectedRoadmap.currentSkillLevel} → {selectedRoadmap.targetSkillLevel}</span>
                    {formattedDate && <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{formattedDate}</span>}
                  </div>
                  {showResult && hasContent && (
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 max-w-xs">
                        <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                          <span>Progress</span>
                          <span>{progress.completed}/{progress.total} nodes ({progress.percent}%)</span>
                        </div>
                        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${progress.percent}%` }} />
                        </div>
                      </div>
                    </div>
                  )}
                  {statusMessage && <p className="text-rose-200 font-medium text-sm bg-rose-500/20 px-3 py-1.5 rounded-lg inline-block">{statusMessage}</p>}
                  {isGenerating && (
                    <p className="text-blue-200 font-medium text-sm bg-blue-500/20 px-3 py-1.5 rounded-lg inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />Generating your roadmap...
                    </p>
                  )}
                </div>
              </div>

              {/* Generation Steps / Content */}
              <div ref={roadmapCardRef} className="scroll-mt-6">
                {generationStep < 4 ? (
                  <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden p-6">
                    <div className="py-8">
                      <div className="max-w-md mx-auto">
                        <div className="flex items-center justify-center mb-8">
                          <div className="relative">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary)]/70 flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/20">
                              <Map className="w-8 h-8 text-white animate-pulse" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                              <Loader2 className="w-3 h-3 text-white animate-spin" />
                            </div>
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Building Your Roadmap</h3>
                        <p className="text-sm text-gray-500 text-center mb-8">Our AI is creating a personalized learning path for you</p>
                        <div className="space-y-4">
                          {[
                            { label: 'Analyzing your goals & background', icon: Target },
                            { label: 'Reviewing your profile', icon: Eye },
                            { label: 'Structuring learning phases', icon: Layers },
                            { label: 'Creating week-by-week plan', icon: Map },
                          ].map((step, index) => {
                            const StepIcon = step.icon
                            const isCompleted = generationStep > index
                            const isCurrent = generationStep === index
                            return (
                              <div key={index} className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${isCompleted ? 'bg-emerald-50 border border-emerald-200' : isCurrent ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-100'}`}>
                                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${isCompleted ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                  {isCompleted ? <Check className="w-5 h-5" /> : isCurrent ? <Loader2 className="w-5 h-5 animate-spin" /> : <StepIcon className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`font-medium transition-colors duration-500 ${isCompleted ? 'text-emerald-700' : isCurrent ? 'text-blue-700' : 'text-gray-400'}`}>{step.label}</p>
                                  {isCurrent && <p className="text-xs text-blue-500 mt-0.5 animate-pulse">In progress...</p>}
                                  {isCompleted && <p className="text-xs text-emerald-500 mt-0.5">Completed</p>}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        <div className="mt-8">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                            <span>Progress</span>
                            <span>{generationStep >= 4 ? '100' : Math.min(Math.round(((generationStep + 1) / 4) * 100), 95)}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[var(--color-primary)] to-blue-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${generationStep >= 4 ? 100 : Math.min(((generationStep + 1) / 4) * 100, 95)}%` }} />
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 text-center mt-6">Roadmaps take 30-60 seconds to generate</p>
                      </div>
                    </div>
                  </div>
                ) : showResult && hasContent ? (
                  <div ref={resultContentRef} style={{ opacity: resultVisible ? 1 : 0, transition: 'opacity 0.3s ease' }}>
                    {/* Toolbar */}
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[var(--color-primary)]" />
                        {content.title || 'Your Learning Roadmap'}
                      </h2>
                      <div className="flex items-center gap-2">
                        {/* View mode toggle */}
                        <div className="flex items-center bg-gray-100 rounded-xl p-1">
                          <button
                            onClick={() => setViewMode('detail')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'detail' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            <LayoutList className="w-3.5 h-3.5" />Detail
                          </button>
                          <button
                            onClick={() => setViewMode('visual')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'visual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            <Target className="w-3.5 h-3.5" />Focus
                          </button>
                        </div>
                        <button onClick={(e) => handleDownloadJSON(selectedRoadmap, e)} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 hover:border-gray-300 transition-all">
                          <Download className="w-4 h-4" />JSON
                        </button>
                      </div>
                    </div>

                    {/* ====== VISUAL: FOCUSED SINGLE-TASK GUIDED VIEW ====== */}
                    {viewMode === 'visual' ? (() => {
                      // Find the current (first incomplete) task with its context
                      let currentTask: RoadmapNode | null = null
                      let currentPhase: RoadmapPhase | null = null
                      let currentWeek: RoadmapWeek | null = null
                      let currentPhaseIdx = 0
                      let currentNodeIdxInWeek = 0
                      let globalNodeIdx = 0
                      let foundIdx = -1

                      for (let pi = 0; pi < content.phases.length && !currentTask; pi++) {
                        for (let wi = 0; wi < content.phases[pi].weeks.length && !currentTask; wi++) {
                          for (let ni = 0; ni < content.phases[pi].weeks[wi].nodes.length; ni++) {
                            const node = content.phases[pi].weeks[wi].nodes[ni]
                            if (!completedNodes.has(node.nodeId)) {
                              currentTask = node
                              currentPhase = content.phases[pi]
                              currentWeek = content.phases[pi].weeks[wi]
                              currentPhaseIdx = pi
                              currentNodeIdxInWeek = ni
                              foundIdx = globalNodeIdx
                              break
                            }
                            globalNodeIdx++
                          }
                          if (!currentTask) globalNodeIdx = globalNodeIdx // already incremented
                        }
                      }

                      const allDone = !currentTask
                      const totalPhases = content.phases.length

                      // Build a flat list of steps for the progress trail
                      const flatSteps: { nodeId: string; title: string; phaseIdx: number; weekIdx: number }[] = []
                      content.phases.forEach((phase, pi) => {
                        phase.weeks.forEach((week, wi) => {
                          week.nodes.forEach(node => {
                            flatSteps.push({ nodeId: node.nodeId, title: node.title, phaseIdx: pi, weekIdx: wi })
                          })
                        })
                      })

                      return (
                      <div className="relative bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

                        {/* ── Progress Trail ── */}
                        <div className="px-6 pt-6 pb-4">
                          {/* Phase breadcrumb */}
                          <div className="flex items-center gap-2 mb-5 flex-wrap">
                            {content.phases.map((phase, pi) => {
                              const phaseNodeCount = phase.weeks.reduce((s, w) => s + w.nodes.length, 0)
                              const phaseDoneCount = phase.weeks.reduce((s, w) => s + w.nodes.filter(n => completedNodes.has(n.nodeId)).length, 0)
                              const phaseDone = phaseDoneCount === phaseNodeCount && phaseNodeCount > 0
                              const isCurrent = pi === currentPhaseIdx && !allDone
                              return (
                                <React.Fragment key={pi}>
                                  {pi > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />}
                                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                    phaseDone ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                    isCurrent ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm' :
                                    'bg-gray-50 text-gray-400 border border-gray-100'
                                  }`}>
                                    {phaseDone ? <Check className="w-3 h-3" /> : isCurrent ? <Play className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                    <span className="hidden sm:inline">{phase.phaseTitle}</span>
                                    <span className="sm:hidden">P{pi + 1}</span>
                                  </div>
                                </React.Fragment>
                              )
                            })}
                            {allDone && (
                              <>
                                <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                  <Check className="w-3 h-3" /> Complete
                                </div>
                              </>
                            )}
                          </div>

                          {/* Step progress dots */}
                          <div className="flex items-center gap-0.5 mb-1">
                            {flatSteps.map((step, idx) => {
                              const isDone = completedNodes.has(step.nodeId)
                              const isCurr = !allDone && foundIdx === idx
                              return (
                                <div
                                  key={step.nodeId}
                                  title={step.title}
                                  className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                                    isDone ? 'bg-emerald-400' :
                                    isCurr ? 'bg-blue-400 animate-pulse' :
                                    'bg-gray-200'
                                  }`}
                                />
                              )
                            })}
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                            <span>{progress.completed} of {progress.total} completed</span>
                            <span className="font-semibold">{progress.percent}%</span>
                          </div>
                        </div>

                        {/* ── Current Task Area ── */}
                        {allDone ? (
                          /* � CAPSTONE PROJECT CHALLENGE */
                          <div className="px-6 pb-8 pt-4">
                            {(() => {
                              const capstone = content.capstoneProject
                              const capStatus = selectedRoadmap?.capstoneStatus
                              const submissions = selectedRoadmap?.capstoneSubmissions || []
                              const latestSubmission = capstoneResult || (submissions.length > 0 ? submissions[submissions.length - 1] : null)
                              const isPassed = capStatus === 'passed'

                              // No capstone in generated content (old roadmaps)
                              if (!capstone) {
                                return (
                                  <div className="text-center py-12 space-y-5">
                                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 shadow-2xl shadow-emerald-200/60 mx-auto">
                                      <Check className="w-12 h-12 text-white" />
                                    </div>
                                    <div>
                                      <h2 className="text-2xl font-bold text-gray-900">All Tasks Complete!</h2>
                                      <p className="text-gray-500 mt-2 max-w-md mx-auto">You&apos;ve completed all {progress.total} tasks across {totalPhases} phases. Amazing dedication!</p>
                                    </div>
                                  </div>
                                )
                              }

                              return (
                                <div className="space-y-6">
                                  {/* ── Header ── */}
                                  <div className="text-center space-y-3">
                                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-xl mx-auto ${
                                      isPassed
                                        ? 'bg-gradient-to-br from-emerald-400 to-green-500 shadow-emerald-200/60'
                                        : 'bg-gradient-to-br from-[var(--color-primary)] to-blue-600 shadow-blue-200/60'
                                    }`}>
                                      {isPassed ? <Check className="w-10 h-10 text-white" /> : <Code className="w-10 h-10 text-white" />}
                                    </div>
                                    <div>
                                      <h2 className="text-2xl font-bold text-gray-900">
                                        {isPassed ? '🎓 Capstone Verified!' : '🚀 Final Challenge — Capstone Project'}
                                      </h2>
                                      <p className="text-gray-500 mt-1 text-sm max-w-lg mx-auto">
                                        {isPassed
                                          ? 'Your capstone project passed the AI code review. Your learning journey is complete!'
                                          : 'Build this real-world project, push it to GitHub, and submit for AI code review.'}
                                      </p>
                                    </div>
                                  </div>

                                  {/* ── Project Brief Card ── */}
                                  <div className="relative border border-gray-200 rounded-2xl bg-white overflow-hidden shadow-sm">
                                    <div className="h-1 bg-gradient-to-r from-[var(--color-primary)] via-blue-500 to-violet-500" />
                                    <div className="p-6 space-y-5">
                                      {/* Title row */}
                                      <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                                          <Target className="w-6 h-6 text-[var(--color-primary)]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h3 className="text-lg font-bold text-gray-900">{capstone.title}</h3>
                                          <p className="text-sm text-gray-500 mt-1 leading-relaxed">{capstone.description}</p>
                                        </div>
                                      </div>

                                      {/* Tech Stack + Time */}
                                      <div className="flex flex-wrap gap-2">
                                        {capstone.techStack.map((tech, i) => (
                                          <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--color-primary)]/5 text-[var(--color-primary)] border border-[var(--color-primary)]/15">
                                            {tech}
                                          </span>
                                        ))}
                                        {capstone.estimatedHours && (
                                          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> ~{capstone.estimatedHours}h estimated
                                          </span>
                                        )}
                                      </div>

                                      {/* Requirements Checklist */}
                                      <div className="bg-gray-50 rounded-xl p-4">
                                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                          <LayoutList className="w-3.5 h-3.5 text-[var(--color-primary)]" /> Project Requirements
                                        </h4>
                                        <div className="space-y-2.5">
                                          {capstone.requirements.map((req, i) => {
                                            const reqResult = latestSubmission?.requirementResults?.find(r => r.requirement === req)
                                            const isMet = reqResult?.met
                                            const isFailed = reqResult && !reqResult.met
                                            return (
                                              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                                                isMet ? 'bg-emerald-50 border border-emerald-100' :
                                                isFailed ? 'bg-rose-50 border border-rose-100' :
                                                'bg-white border border-gray-100'
                                              }`}>
                                                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                                                  isMet ? 'bg-emerald-500' :
                                                  isFailed ? 'bg-rose-500' :
                                                  'bg-gray-200'
                                                }`}>
                                                  {isMet ? (
                                                    <Check className="w-3.5 h-3.5 text-white" />
                                                  ) : isFailed ? (
                                                    <X className="w-3.5 h-3.5 text-white" />
                                                  ) : (
                                                    <span className="text-xs font-bold text-gray-500">{i + 1}</span>
                                                  )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <div className={`text-sm font-medium leading-relaxed ${isMet ? 'text-emerald-800' : isFailed ? 'text-rose-800' : 'text-gray-700'}`}>{renderMarkdownText(req)}</div>
                                                  {reqResult?.feedback && (
                                                    <div className={`text-xs mt-1.5 leading-relaxed ${isMet ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                      {isMet ? '✓ ' : '→ '}{renderMarkdownText(reqResult.feedback)}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* ── AI Review Results (prominent block) ── */}
                                  {latestSubmission && (
                                    <div className="space-y-4">
                                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
                                        AI Code Review — Attempt #{submissions.length || 1}
                                      </h3>

                                      {/* Score + Verdict Hero */}
                                      <div className={`rounded-2xl border-2 p-6 ${
                                        latestSubmission.verdict === 'pass'
                                          ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-300'
                                          : latestSubmission.verdict === 'partial'
                                          ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300'
                                          : 'bg-gradient-to-br from-rose-50 to-red-50 border-rose-300'
                                      }`}>
                                        <div className="flex items-center gap-6">
                                          {/* Score Circle */}
                                          <div className="flex-shrink-0">
                                            <div className={`relative w-20 h-20 rounded-full flex items-center justify-center border-4 ${
                                              latestSubmission.verdict === 'pass' ? 'border-emerald-400 bg-emerald-100' :
                                              latestSubmission.verdict === 'partial' ? 'border-amber-400 bg-amber-100' :
                                              'border-rose-400 bg-rose-100'
                                            }`}>
                                              <span className={`text-2xl font-black ${
                                                latestSubmission.verdict === 'pass' ? 'text-emerald-700' :
                                                latestSubmission.verdict === 'partial' ? 'text-amber-700' :
                                                'text-rose-700'
                                              }`}>{latestSubmission.score}</span>
                                              <span className={`absolute -bottom-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                latestSubmission.verdict === 'pass' ? 'bg-emerald-500 text-white' :
                                                latestSubmission.verdict === 'partial' ? 'bg-amber-500 text-white' :
                                                'bg-rose-500 text-white'
                                              }`}>/100</span>
                                            </div>
                                          </div>

                                          {/* Verdict + Feedback */}
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                              {latestSubmission.verdict === 'pass' ? (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                              ) : latestSubmission.verdict === 'partial' ? (
                                                <AlertTriangle className="w-5 h-5 text-amber-600" />
                                              ) : (
                                                <XCircle className="w-5 h-5 text-rose-600" />
                                              )}
                                              <span className={`text-lg font-bold ${
                                                latestSubmission.verdict === 'pass' ? 'text-emerald-700' :
                                                latestSubmission.verdict === 'partial' ? 'text-amber-700' : 'text-rose-700'
                                              }`}>
                                                {latestSubmission.verdict === 'pass' ? 'All Requirements Met — Passed!' :
                                                 latestSubmission.verdict === 'partial' ? 'Almost There — Partially Complete' : 'Not Yet — Needs More Work'}
                                              </span>
                                            </div>
                                            {latestSubmission.overallFeedback && (
                                              <div className="text-sm text-gray-700 leading-relaxed">{renderMarkdownText(latestSubmission.overallFeedback)}</div>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Strengths + Improvements side by side */}
                                      {((latestSubmission.strengths?.length > 0) || (latestSubmission.improvements?.length > 0 && latestSubmission.verdict !== 'pass')) && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          {/* Strengths */}
                                          {latestSubmission.strengths && latestSubmission.strengths.length > 0 && (
                                            <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4">
                                              <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> What You Did Well
                                              </h4>
                                              <ul className="space-y-2">
                                                {latestSubmission.strengths.map((s, i) => (
                                                  <li key={i} className="flex items-start gap-2 text-sm text-emerald-800">
                                                    <span className="text-emerald-400 mt-1 flex-shrink-0">•</span>
                                                    <span className="leading-relaxed">{renderMarkdownText(s)}</span>
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}

                                          {/* Improvements */}
                                          {latestSubmission.improvements && latestSubmission.improvements.length > 0 && latestSubmission.verdict !== 'pass' && (
                                            <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
                                              <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                <AlertTriangle className="w-3.5 h-3.5" /> What To Fix
                                              </h4>
                                              <ul className="space-y-2">
                                                {latestSubmission.improvements.map((s, i) => (
                                                  <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                                                    <span className="text-amber-400 mt-1 flex-shrink-0">→</span>
                                                    <span className="leading-relaxed">{renderMarkdownText(s)}</span>
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Previous Submissions */}
                                  {submissions.length > 1 && (
                                    <div>
                                      <button
                                        onClick={() => setShowCapstoneHistory(!showCapstoneHistory)}
                                        className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1.5 transition-colors"
                                      >
                                        {showCapstoneHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                        View {submissions.length - 1} previous submission{submissions.length > 2 ? 's' : ''}
                                      </button>
                                      {showCapstoneHistory && (
                                        <div className="mt-3 space-y-2">
                                          {submissions.slice(0, -1).reverse().map((sub, i) => (
                                            <div key={i} className="flex items-center justify-between text-sm bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                                              <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                                  sub.verdict === 'pass' ? 'bg-emerald-500' : sub.verdict === 'partial' ? 'bg-amber-500' : 'bg-rose-500'
                                                }`}>
                                                  {sub.score}
                                                </div>
                                                <div>
                                                  <p className="text-xs font-medium text-gray-700">
                                                    {sub.verdict === 'pass' ? 'Passed' : sub.verdict === 'partial' ? 'Partial' : 'Failed'}
                                                  </p>
                                                  <p className="text-xs text-gray-400">
                                                    {new Date(sub.submittedAt).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                  </p>
                                                </div>
                                              </div>
                                              <a href={sub.githubUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1">
                                                <ExternalLink className="w-3 h-3" /> Repo
                                              </a>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* ── GitHub Submission Area ── */}
                                  {!isPassed && (() => {
                                    const freeLimit = 5
                                    const freeLeft = Math.max(0, freeLimit - submissions.length)
                                    const isFree = freeLeft > 0
                                    return (
                                    <div className="space-y-4">
                                      {/* How to Submit Guide - Show only if no submission yet */}
                                      {!latestSubmission && (
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-5 space-y-4">
                                          <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
                                              <BookOpen className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                              <p className="text-sm font-bold text-gray-900">How to Submit Your Project</p>
                                              <p className="text-xs text-gray-500">Follow these steps to submit your capstone project</p>
                                            </div>
                                          </div>

                                          <div className="grid gap-3">
                                            {/* Step 1 */}
                                            <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-blue-100">
                                              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold">1</div>
                                              <div>
                                                <p className="text-sm font-semibold text-gray-900">Create a GitHub Repository</p>
                                                <p className="text-xs text-gray-500 mt-0.5">Go to <a href="https://github.com/new" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">github.com/new</a> and create a <strong>public</strong> repository for your project.</p>
                                              </div>
                                            </div>

                                            {/* Step 2 */}
                                            <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-blue-100">
                                              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold">2</div>
                                              <div>
                                                <p className="text-sm font-semibold text-gray-900">Build Your Project</p>
                                                <p className="text-xs text-gray-500 mt-0.5">Create your project locally following the requirements above. Make sure to implement all the listed features.</p>
                                              </div>
                                            </div>

                                            {/* Step 3 */}
                                            <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-blue-100">
                                              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold">3</div>
                                              <div>
                                                <p className="text-sm font-semibold text-gray-900">Push Your Code</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                  Initialize git and push your code:
                                                </p>
                                                <div className="mt-2 bg-gray-900 rounded-lg p-2.5 text-xs font-mono text-gray-100 space-y-0.5 overflow-x-auto">
                                                  <p><span className="text-gray-500">$</span> git init</p>
                                                  <p><span className="text-gray-500">$</span> git add .</p>
                                                  <p><span className="text-gray-500">$</span> git commit -m <span className="text-emerald-400">&quot;Initial commit&quot;</span></p>
                                                  <p><span className="text-gray-500">$</span> git branch -M main</p>
                                                  <p><span className="text-gray-500">$</span> git remote add origin <span className="text-blue-400">your-repo-url</span></p>
                                                  <p><span className="text-gray-500">$</span> git push -u origin main</p>
                                                </div>
                                              </div>
                                            </div>

                                            {/* Step 4 */}
                                            <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-blue-100">
                                              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold">4</div>
                                              <div>
                                                <p className="text-sm font-semibold text-gray-900">Copy & Paste Your Repo URL</p>
                                                <p className="text-xs text-gray-500 mt-0.5">Copy your repository URL (e.g., <code className="px-1 py-0.5 bg-gray-100 rounded text-gray-700">https://github.com/username/project</code>) and paste it below.</p>
                                              </div>
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-100 rounded-lg px-3 py-2">
                                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                            <span><strong>Important:</strong> Make sure your repository is <strong>public</strong> so our AI can review your code.</span>
                                          </div>
                                        </div>
                                      )}

                                    <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 space-y-4">
                                      <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
                                            <Github className="w-5 h-5 text-white" />
                                          </div>
                                          <div>
                                            <p className="text-sm font-bold text-gray-900">
                                              {latestSubmission ? 'Resubmit Your Project' : 'Submit Your Project'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              {latestSubmission
                                                ? 'Fix the issues above and submit again'
                                                : 'Push your code to a public GitHub repo and paste the link below'}
                                            </p>
                                          </div>
                                        </div>
                                        <div className={`flex-shrink-0 px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap ${isFree ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                          {isFree ? `${freeLeft} free review${freeLeft !== 1 ? 's' : ''} left` : '5 credits per review'}
                                        </div>
                                      </div>

                                      <div className="flex gap-2">
                                        <div className="relative flex-1">
                                          <Github className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                          <input
                                            type="url"
                                            value={capstoneGithubUrl}
                                            onChange={(e) => { setCapstoneGithubUrl(e.target.value); setCapstoneError(null) }}
                                            placeholder="https://github.com/you/your-project"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition-all placeholder:text-gray-400"
                                            disabled={capstoneSubmitting}
                                            onKeyDown={(e) => { if (e.key === 'Enter' && !capstoneSubmitting && capstoneGithubUrl.trim()) submitCapstone() }}
                                          />
                                        </div>
                                        <button
                                          onClick={submitCapstone}
                                          disabled={capstoneSubmitting || !capstoneGithubUrl.trim()}
                                          className="px-6 py-3 rounded-xl bg-[var(--color-primary)] text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
                                        >
                                          {capstoneSubmitting ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                            <Send className="w-4 h-4" />
                                          )}
                                          <span className="hidden sm:inline">{capstoneSubmitting ? 'Reviewing...' : latestSubmission ? 'Resubmit' : 'Submit'}</span>
                                        </button>
                                      </div>

                                      {capstoneSubmitting && (
                                        <div className="flex items-center gap-3 bg-blue-50 rounded-xl border border-blue-100 px-4 py-3">
                                          <div className="relative">
                                            <Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary)]" />
                                          </div>
                                          <div>
                                            <p className="text-sm font-semibold text-gray-900">AI is reviewing your code...</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Fetching repository files and analyzing against requirements. This takes 15-30 seconds.</p>
                                          </div>
                                        </div>
                                      )}

                                      {capstoneError && (
                                        <div className="flex items-start gap-3 bg-rose-50 rounded-xl border border-rose-200 px-4 py-3">
                                          <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                                          <div>
                                            <p className="text-sm font-medium text-rose-800">{capstoneError}</p>
                                            <p className="text-xs text-rose-600 mt-1">Make sure the repository is public and the URL is correct.</p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    </div>
                                    )
                                  })()}

                                  {/* ── Passed — Final Celebration ── */}
                                  {isPassed && (
                                    <div className="space-y-4">
                                      {/* Achievement Card */}
                                      <div className="text-center bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-6 space-y-3">
                                        <p className="text-base font-bold text-emerald-800">🏆 Roadmap Complete — Capstone Verified</p>
                                        <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                                          <span className="flex items-center gap-1.5"><Layers className="w-4 h-4 text-[var(--color-primary)]" /> {totalPhases} Phases</span>
                                          <span className="flex items-center gap-1.5"><Target className="w-4 h-4 text-blue-500" /> {progress.total} Tasks</span>
                                          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Capstone Passed</span>
                                        </div>
                                        {latestSubmission?.githubUrl && (
                                          <a href={latestSubmission.githubUrl} target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors mt-2">
                                            <Github className="w-4 h-4" /> View Capstone on GitHub <ExternalLink className="w-3 h-3" />
                                          </a>
                                        )}
                                      </div>

                                      {/* Share & Certificate Section */}
                                      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 border border-blue-200 rounded-2xl p-6 space-y-5">
                                        <div className="text-center space-y-1">
                                          <h3 className="text-lg font-bold text-gray-900">🎉 Share Your Achievement</h3>
                                          <p className="text-sm text-gray-500">Celebrate your success! Share on LinkedIn or download your certificate.</p>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                          {/* Share on LinkedIn Post */}
                                          <a
                                            href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(latestSubmission?.githubUrl || window.location.href)}&title=${encodeURIComponent(`🚀 I completed the "${content.title}" learning roadmap on UpSkill!`)}&summary=${encodeURIComponent(`Just completed ${progress.total} tasks across ${totalPhases} phases and passed the ${capstone.title} capstone project with AI code review! #UpSkill #Learning #${content.title.replace(/\s+/g, '')}`)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A66C2] text-white text-sm font-semibold hover:bg-[#004182] transition-colors shadow-md hover:shadow-lg"
                                          >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                            Share Achievement
                                          </a>

                                          {/* Add to LinkedIn Profile (Certification) */}
                                          <a
                                            href={`https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(`${content.title} - Capstone Verified`)}&organizationName=${encodeURIComponent('UpSkill AI')}&issueYear=${new Date(latestSubmission?.submittedAt || Date.now()).getFullYear()}&issueMonth=${new Date(latestSubmission?.submittedAt || Date.now()).getMonth() + 1}&certUrl=${encodeURIComponent(latestSubmission?.githubUrl || window.location.href)}&certId=${encodeURIComponent(selectedRoadmap?.id || '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#0A66C2] border-2 border-[#0A66C2] text-sm font-semibold hover:bg-[#0A66C2]/5 transition-colors shadow-sm"
                                          >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                            Add Certification
                                          </a>

                                          {/* Download Certificate as PDF */}
                                          <button
                                            onClick={() => {
                                              const certId = selectedRoadmap?.id || 'N/A'
                                              const completionDate = new Date(latestSubmission?.submittedAt || Date.now())
                                              const formattedDate = completionDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                              const verifyUrl = `${window.location.origin}/verify/${certId}`
                                              
                                              // Simple QR Code generator function (alphanumeric encoding)
                                              const generateQRCodeSVG = (text: string, size: number = 80): string => {
                                                // Use a simple QR code API via embedded image
                                                const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&format=svg`
                                                return `<img src="${qrApiUrl}" alt="QR Code" style="width:${size}px;height:${size}px;" />`
                                              }
                                              
                                              // Professional PDF-ready certificate HTML with app theme colors
                                              const certificateHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate - ${content.title} | UpSkill AI</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    @page {
      size: 297mm 210mm;
      margin: 0;
    }
    
    @media print {
      html, body {
        width: 297mm;
        height: 210mm;
        margin: 0;
        padding: 0;
        overflow: hidden;
      }
      body { 
        -webkit-print-color-adjust: exact; 
        print-color-adjust: exact;
        background: white !important;
        padding: 0 !important;
      }
      .no-print { display: none !important; }
      .certificate-wrapper { 
        padding: 0 !important; 
        background: white !important;
        min-height: auto !important;
        height: 210mm !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      .certificate { 
        box-shadow: none !important;
        width: 280mm !important;
        height: 195mm !important;
        padding: 25px 35px !important;
        margin: 0 auto !important;
      }
    }
    
    body {
      font-family: 'Plus Jakarta Sans', 'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 30px 20px;
    }
    
    .certificate-wrapper {
      width: 100%;
      max-width: 900px;
    }
    
    .certificate {
      background: linear-gradient(145deg, #ffffff 0%, #f8fafc 50%, #f5f6f7 100%);
      border-radius: 20px;
      padding: 35px 45px;
      position: relative;
      box-shadow: 0 25px 80px -20px rgba(0, 0, 0, 0.4);
      overflow: hidden;
    }
    
    /* Top bar - using app primary color #0064e0 */
    .certificate::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: #0064e0;
    }
    
    /* Inner border */
    .certificate::after {
      content: '';
      position: absolute;
      top: 16px;
      left: 16px;
      right: 16px;
      bottom: 16px;
      border: 2px solid rgba(0, 100, 224, 0.12);
      border-radius: 14px;
      pointer-events: none;
    }
    
    .corner-accent {
      position: absolute;
      width: 80px;
      height: 80px;
      opacity: 0.06;
    }
    .corner-accent.top-left { top: 25px; left: 25px; }
    .corner-accent.top-right { top: 25px; right: 25px; transform: rotate(90deg); }
    .corner-accent.bottom-left { bottom: 25px; left: 25px; transform: rotate(-90deg); }
    .corner-accent.bottom-right { bottom: 25px; right: 25px; transform: rotate(180deg); }
    
    .header {
      text-align: center;
      margin-bottom: 20px;
      position: relative;
      z-index: 1;
    }
    
    .logo-section {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 15px;
    }
    
    .logo-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 100, 224, 0.25);
    }
    
    .logo-icon svg {
      width: 22px;
      height: 22px;
      color: white;
    }
    
    .logo-text {
      font-size: 22px;
      font-weight: 800;
      color: #0064e0;
      letter-spacing: -0.5px;
    }
    
    .title {
      font-size: 34px;
      font-weight: 800;
      color: #1a1a1a;
      margin-bottom: 4px;
      letter-spacing: -0.5px;
      line-height: 1.1;
    }
    
    .subtitle {
      font-size: 13px;
      color: #6b7280;
      font-weight: 500;
    }
    
    .content {
      text-align: center;
      position: relative;
      z-index: 1;
    }
    
    .awarded-to {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 2.5px;
      color: #6b7280;
      font-weight: 600;
      margin-bottom: 6px;
    }
    
    .roadmap-title {
      font-size: 26px;
      font-weight: 700;
      color: #0064e0;
      margin-bottom: 12px;
      line-height: 1.2;
    }
    
    .description {
      font-size: 12px;
      color: #475569;
      max-width: 520px;
      margin: 0 auto 18px;
      line-height: 1.6;
    }
    
    .capstone-card {
      background: rgba(0, 100, 224, 0.08);
      border: 1px solid rgba(0, 100, 224, 0.15);
      border-radius: 12px;
      padding: 12px 20px;
      margin: 0 auto 18px;
      max-width: 420px;
      display: inline-block;
    }
    
    .capstone-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    
    .capstone-icon {
      width: 18px;
      height: 18px;
      color: #0064e0;
    }
    
    .capstone-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #0052c2;
      font-weight: 700;
    }
    
    .capstone-title {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a1a;
    }
    
    .stats-grid {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin: 18px 0;
    }
    
    .stat-item {
      text-align: center;
    }
    
    .stat-icon {
      width: 32px;
      height: 32px;
      margin: 0 auto 6px;
      background: rgba(0, 100, 224, 0.1);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .stat-icon svg {
      width: 16px;
      height: 16px;
      color: #0064e0;
    }
    
    .stat-value {
      font-size: 22px;
      font-weight: 800;
      color: #1a1a1a;
      line-height: 1;
    }
    
    .stat-label {
      font-size: 9px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
      margin-top: 3px;
    }
    
    .badges {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin: 15px 0;
      flex-wrap: wrap;
    }
    
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: 50px;
      font-size: 11px;
      font-weight: 600;
    }
    
    .badge-verified {
      background: #43a047;
      color: white;
      box-shadow: 0 3px 10px rgba(67, 160, 71, 0.25);
    }
    
    .badge-ai {
      background: #0064e0;
      color: white;
      box-shadow: 0 3px 10px rgba(0, 100, 224, 0.25);
    }
    
    .badge svg {
      width: 13px;
      height: 13px;
    }
    
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
      position: relative;
      z-index: 1;
    }
    
    .footer-left {
      text-align: left;
    }
    
    .issue-date {
      font-size: 10px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
      margin-bottom: 2px;
    }
    
    .date-value {
      font-size: 13px;
      color: #1a1a1a;
      font-weight: 600;
    }
    
    .footer-center {
      text-align: center;
    }
    
    .qr-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      margin-left: 25px;
    }
    
    .qr-code {
      background: white;
      padding: 6px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    
    .verify-text {
      font-size: 8px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }
    
    .footer-right {
      text-align: right;
    }
    
    .cert-id-label {
      font-size: 10px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
      margin-bottom: 2px;
    }
    
    .cert-id-value {
      font-size: 11px;
      color: #475569;
      font-family: 'DM Sans', monospace;
      font-weight: 500;
    }
    
    /* Action buttons (hidden in print) */
    .actions {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-top: 25px;
    }
    
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      font-family: inherit;
    }
    
    .btn-primary {
      background: #0064e0;
      color: white;
      box-shadow: 0 4px 15px rgba(0, 100, 224, 0.35);
    }
    
    .btn-primary:hover {
      background: #0052c2;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 100, 224, 0.45);
    }
    
    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
    }
    
    .btn svg {
      width: 16px;
      height: 16px;
    }
    
    .verify-link {
      text-align: center;
      margin-top: 15px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
    }
    
    .verify-link a {
      color: #60a5fa;
      text-decoration: none;
    }
    
    .verify-link a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="certificate-wrapper">
    <div class="certificate">
      <!-- Corner decorations -->
      <svg class="corner-accent top-left" viewBox="0 0 100 100" fill="none">
        <path d="M0 0 L100 0 L100 15 L15 15 L15 100 L0 100 Z" fill="#0064e0"/>
      </svg>
      <svg class="corner-accent top-right" viewBox="0 0 100 100" fill="none">
        <path d="M0 0 L100 0 L100 15 L15 15 L15 100 L0 100 Z" fill="#0064e0"/>
      </svg>
      <svg class="corner-accent bottom-left" viewBox="0 0 100 100" fill="none">
        <path d="M0 0 L100 0 L100 15 L15 15 L15 100 L0 100 Z" fill="#0064e0"/>
      </svg>
      <svg class="corner-accent bottom-right" viewBox="0 0 100 100" fill="none">
        <path d="M0 0 L100 0 L100 15 L15 15 L15 100 L0 100 Z" fill="#0064e0"/>
      </svg>
      
      <div class="header">
        <div class="logo-section">
          <div class="logo-icon">
            <img src="https://upskillai.vercel.app/images/UpSkillLogoIcon.png" alt="UpSkill AI Logo" width="32" height="32"/>
          </div>
          <span class="logo-text">UpSkill AI</span>
        </div>
        <h1 class="title">Certificate of Achievement</h1>
        <p class="subtitle">Professional Learning Pathway Completion</p>
      </div>
      
      <div class="content">
        <p class="awarded-to">This is to certify the successful completion of</p>
        <h2 class="roadmap-title">${content.title}</h2>
        <p class="description">
          Having demonstrated exceptional dedication by completing a comprehensive ${totalPhases}-phase learning roadmap 
          with ${progress.total} structured tasks and passing rigorous AI-powered code review for the capstone project.
        </p>
        
        <div class="capstone-card">
          <div class="capstone-header">
            <svg class="capstone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span class="capstone-label">Capstone Project</span>
          </div>
          <p class="capstone-title">${capstone.title}</p>
        </div>
        
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
            </div>
            <div class="stat-value">${totalPhases}</div>
            <div class="stat-label">Phases</div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div class="stat-value">${progress.total}</div>
            <div class="stat-label">Tasks</div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="8" r="7"/>
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
              </svg>
            </div>
            <div class="stat-value">${latestSubmission?.score || 100}</div>
            <div class="stat-label">Score</div>
          </div>
        </div>
        
        <div class="badges">
          <span class="badge badge-verified">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            Verified Complete
          </span>
          <span class="badge badge-ai">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
              <circle cx="7.5" cy="14.5" r="1.5"/>
              <circle cx="16.5" cy="14.5" r="1.5"/>
            </svg>
            AI Code Review Passed
          </span>
        </div>
      </div>
      
      <div class="footer">
        <div class="footer-left">
          <p class="issue-date">Issue Date</p>
          <p class="date-value">${formattedDate}</p>
        </div>
        <div class="footer-center">
          <div class="qr-section">
            <div class="qr-code">
              ${generateQRCodeSVG(verifyUrl, 65)}
            </div>
            <span class="verify-text">Scan to Verify</span>
          </div>
        </div>
        <div class="footer-right">
          <p class="cert-id-label">Certificate ID</p>
          <p class="cert-id-value">${certId.length > 24 ? certId.slice(0, 12) + '...' + certId.slice(-8) : certId}</p>
        </div>
      </div>
    </div>
    
    <div class="actions no-print">
      <button class="btn btn-primary" onclick="window.print()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Save as PDF
      </button>
      <button class="btn btn-secondary" onclick="window.close()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        Close
      </button>
    </div>
    
    <p class="verify-link no-print">
      Verify this certificate at: <a href="${verifyUrl}" target="_blank">${verifyUrl}</a>
    </p>
  </div>
</body>
</html>`
                                              
                                              // Open in new window for better print experience
                                              const printWindow = window.open('', '_blank')
                                              if (printWindow) {
                                                printWindow.document.write(certificateHtml)
                                                printWindow.document.close()
                                              }
                                            }}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-semibold hover:from-emerald-600 hover:to-green-600 transition-all shadow-md hover:shadow-lg"
                                          >
                                            <Download className="w-4 h-4" />
                                            Download Certificate
                                          </button>
                                        </div>

                                        <p className="text-xs text-center text-gray-400">
                                          Clicking LinkedIn buttons will open LinkedIn in a new tab — no login required here.
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })()}
                          </div>
                        ) : currentTask && currentPhase && currentWeek && (
                          /* 📋 CURRENT TASK FOCUSED VIEW */
                          <div className="px-6 pb-6 pt-2 space-y-5">
                            {/* Task location badge */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${PHASE_COLORS[currentPhaseIdx % PHASE_COLORS.length].bg} ${PHASE_COLORS[currentPhaseIdx % PHASE_COLORS.length].text} ${PHASE_COLORS[currentPhaseIdx % PHASE_COLORS.length].border} border`}>
                                <Layers className="w-3 h-3" /> {currentPhase.phaseTitle}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">
                                Week {currentWeek.weekNumber} — {currentWeek.focus}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
                                Task {currentNodeIdxInWeek + 1} of {currentWeek.nodes.length}
                              </span>
                            </div>

                            {/* ── Main Task Card ── */}
                            <div className="relative border-2 border-blue-200 rounded-2xl bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30 shadow-lg shadow-blue-100/40 overflow-hidden">
                              {/* Decorative top accent */}
                              <div className="h-1.5 bg-gradient-to-r from-blue-400 via-blue-500 to-violet-500" />

                              <div className="p-6 space-y-5">
                                {/* Task title + number */}
                                <div className="flex items-start gap-4">
                                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-200/50">
                                    {foundIdx + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-bold text-gray-900 leading-snug">{currentTask.title}</h3>
                                    <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{currentTask.objective}</p>
                                    {/* Meta badges */}
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                      {currentTask.estimatedHours && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                                          <Clock className="w-3 h-3" /> ~{currentTask.estimatedHours}h
                                        </span>
                                      )}
                                      {currentTask.difficulty && (
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                                          currentTask.difficulty <= 2 ? 'bg-emerald-50 text-emerald-700' :
                                          currentTask.difficulty <= 3 ? 'bg-amber-50 text-amber-700' :
                                          'bg-rose-50 text-rose-700'
                                        }`}>
                                          {'★'.repeat(currentTask.difficulty)}{'☆'.repeat(5 - currentTask.difficulty)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Success Criteria */}
                                {currentTask.successCriteria && (
                                  <div className="bg-emerald-50/60 rounded-xl border border-emerald-100 px-4 py-3">
                                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Done When
                                    </p>
                                    <p className="text-sm text-gray-700 leading-relaxed">{currentTask.successCriteria}</p>
                                  </div>
                                )}

                                {/* ── What to do section ── */}
                                <div className="space-y-3">
                                  {/* Resources */}
                                  {currentTask.resources && currentTask.resources.length > 0 && (
                                    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                        <BookOpen className="w-3.5 h-3.5 text-blue-500" /> Learning Resources
                                      </h4>
                                      <div className="space-y-2">
                                        {currentTask.resources.map((res, i) => {
                                          const isUrl = res.startsWith('http://') || res.startsWith('https://')
                                          return (
                                            <div key={i} className="flex items-start gap-2.5 group/res">
                                              <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center mt-0.5">
                                                {isUrl ? <ExternalLink className="w-3 h-3 text-blue-500" /> : <BookOpen className="w-3 h-3 text-blue-500" />}
                                              </div>
                                              {isUrl ? (
                                                <a href={res} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all leading-relaxed">{res}</a>
                                              ) : (
                                                <p className="text-sm text-gray-700 leading-relaxed">{res}</p>
                                              )}
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Practice Task */}
                                  {currentTask.practiceTask && (
                                    <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl border border-blue-100 p-4 shadow-sm">
                                      <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Play className="w-3.5 h-3.5" /> Practice Task
                                      </h4>
                                      <p className="text-sm text-gray-800 leading-relaxed">{currentTask.practiceTask}</p>
                                    </div>
                                  )}

                                  {/* Project */}
                                  {currentTask.project && (
                                    <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-100 p-4 shadow-sm">
                                      <h4 className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Code className="w-3.5 h-3.5" /> Build This Project
                                      </h4>
                                      <p className="text-sm text-gray-800 leading-relaxed">{currentTask.project}</p>
                                    </div>
                                  )}

                                  {/* Pro Tip */}
                                  {currentTask.proTip && (
                                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-100 p-4 shadow-sm">
                                      <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5" /> Pro Tip
                                      </h4>
                                      <p className="text-sm text-gray-800 leading-relaxed italic">{currentTask.proTip}</p>
                                    </div>
                                  )}
                                </div>

                                {/* ── Complete Button ── */}
                                <button
                                  onClick={(e) => toggleNodeComplete(currentTask!.nodeId, e)}
                                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-base hover:from-emerald-600 hover:to-green-600 transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:shadow-emerald-300/50 hover:scale-[1.01] active:scale-[0.99]"
                                >
                                  <Check className="w-5 h-5" /> I&apos;ve Completed This Task
                                </button>
                              </div>
                            </div>

                            {/* ── Up Next Preview ── */}
                            {foundIdx + 1 < flatSteps.length && (
                              <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                  <ChevronRight className="w-3 h-3" /> Up Next
                                </p>
                                <div className="flex items-center gap-3">
                                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-sm">
                                    {foundIdx + 2}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-600 truncate">{flatSteps[foundIdx + 1].title}</p>
                                    <p className="text-xs text-gray-400">
                                      {content.phases[flatSteps[foundIdx + 1].phaseIdx]?.phaseTitle} · Week {content.phases[flatSteps[foundIdx + 1].phaseIdx]?.weeks[flatSteps[foundIdx + 1].weekIdx]?.weekNumber}
                                    </p>
                                  </div>
                                  <Lock className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                </div>
                              </div>
                            )}

                          </div>
                        )}
                      </div>
                      )
                    })() : (
                    /* ====== DETAIL VIEW (existing) ====== */
                    <div className="space-y-4">
                      {/* Capstone Project Card - Detail View */}
                      {content.capstoneProject && (
                        <div className="rounded-2xl border border-violet-200 overflow-hidden shadow-sm bg-gradient-to-br from-violet-50 to-purple-50">
                          <div className="p-5">
                            <div className="flex items-start gap-4 mb-4">
                              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-violet-500 text-white flex items-center justify-center shadow-md">
                                <Sparkles className="w-6 h-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-violet-900">Capstone Project</h3>
                                  {selectedRoadmap?.capstoneStatus === 'passed' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                                      <Check className="w-3 h-3" /> Passed
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">{content.capstoneProject.title}</p>
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-700 mb-4 leading-relaxed">{content.capstoneProject.description}</p>
                            
                            {/* Tech Stack */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              {content.capstoneProject.techStack.map((tech, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-violet-100 text-violet-700 border border-violet-200">
                                  {tech}
                                </span>
                              ))}
                              {content.capstoneProject.estimatedHours && (
                                <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white text-gray-600 border border-gray-200 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> ~{content.capstoneProject.estimatedHours}h
                                </span>
                              )}
                            </div>
                            
                            {/* Requirements Preview */}
                            <div className="bg-white rounded-xl p-4 border border-violet-100">
                              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <LayoutList className="w-3.5 h-3.5 text-violet-500" /> Requirements ({content.capstoneProject.requirements.length})
                              </h4>
                              <div className="space-y-2">
                                {content.capstoneProject.requirements.slice(0, 4).map((req, i) => (
                                  <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                                    <span className="leading-relaxed">{renderMarkdownText(req)}</span>
                                  </div>
                                ))}
                                {content.capstoneProject.requirements.length > 4 && (
                                  <p className="text-xs text-violet-600 font-medium ml-7">+{content.capstoneProject.requirements.length - 4} more requirements...</p>
                                )}
                              </div>
                            </div>
                            
                            {/* CTA to Focus View */}
                            <div className="mt-4 text-center">
                              <button
                                onClick={() => setViewMode('visual')}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-xl font-semibold text-sm hover:bg-violet-600 transition-colors shadow-md"
                              >
                                <Target className="w-4 h-4" />
                                {progress.completed === progress.total ? 'Start Capstone' : 'Complete Tasks to Unlock'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {content.phases.map((phase, phaseIdx) => {
                        const colors = PHASE_COLORS[phaseIdx % PHASE_COLORS.length]
                        const isExpanded = expandedPhases.has(phaseIdx)
                        const phaseNodeCount = phase.weeks.reduce((sum, w) => sum + w.nodes.length, 0)
                        const phaseCompleted = phase.weeks.reduce((sum, w) => sum + w.nodes.filter(n => completedNodes.has(n.nodeId)).length, 0)

                        return (
                          <div key={phaseIdx} className={`rounded-2xl border ${colors.border} overflow-hidden shadow-sm`}>
                            {/* Phase Header */}
                            <button
                              onClick={() => togglePhase(phaseIdx)}
                              className={`w-full flex items-center justify-between p-5 ${colors.bg} hover:brightness-95 transition-all`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl ${colors.accent} text-white flex items-center justify-center font-bold text-sm shadow-sm`}>
                                  {phaseIdx + 1}
                                </div>
                                <div className="text-left">
                                  <h3 className={`font-semibold ${colors.text}`}>{phase.phaseTitle}</h3>
                                  <p className="text-xs text-gray-500 mt-0.5">{phase.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500 bg-white px-2.5 py-1 rounded-full">
                                  {phaseCompleted}/{phaseNodeCount} done
                                </span>
                                {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                              </div>
                            </button>

                            {/* Phase Content - Weeks */}
                            {isExpanded && (
                              <div className="p-4 space-y-3 bg-white">
                                {phase.weeks.map((week, weekIdx) => {
                                  const weekKey = `${phaseIdx}-${weekIdx}`
                                  const isWeekExpanded = expandedWeeks.has(weekKey)
                                  const weekCompleted = week.nodes.filter(n => completedNodes.has(n.nodeId)).length

                                  return (
                                    <div key={weekKey} className="rounded-xl border border-gray-100 overflow-hidden">
                                      {/* Week Header */}
                                      <button
                                        onClick={() => toggleWeek(weekKey)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className={`w-8 h-8 rounded-lg ${colors.light} ${colors.icon} flex items-center justify-center text-xs font-bold`}>
                                            W{week.weekNumber}
                                          </div>
                                          <div className="text-left">
                                            <p className="font-medium text-gray-900 text-sm">Week {week.weekNumber}</p>
                                            <p className="text-xs text-gray-500">{week.focus}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-gray-400">{weekCompleted}/{week.nodes.length}</span>
                                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full ${colors.accent} rounded-full transition-all duration-300`} style={{ width: `${week.nodes.length > 0 ? (weekCompleted / week.nodes.length) * 100 : 0}%` }} />
                                          </div>
                                          {isWeekExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                        </div>
                                      </button>

                                      {/* Week Nodes */}
                                      {isWeekExpanded && (
                                        <div className="px-4 pb-4 space-y-2">
                                          {week.nodes.map((node) => {
                                            const isNodeExpanded = expandedNodes.has(node.nodeId)
                                            const isDone = completedNodes.has(node.nodeId)
                                            const { allowed: canToggle, reason: lockReason } = canToggleNode(node.nodeId)
                                            const isLocked = !isDone && !canToggle

                                            return (
                                              <div key={node.nodeId} className={`rounded-lg border transition-all duration-200 ${isDone ? 'border-emerald-200 bg-emerald-50/50' : isLocked ? 'border-gray-100 bg-gray-50/30 opacity-60' : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'}`}>
                                                {/* Node Header */}
                                                <button
                                                  onClick={() => toggleNode(node.nodeId)}
                                                  className="w-full flex items-center gap-3 p-3 text-left"
                                                >
                                                  {/* Checkbox */}
                                                  <div
                                                    onClick={(e) => toggleNodeComplete(node.nodeId, e)}
                                                    title={!canToggle ? lockReason : isDone ? 'Mark incomplete' : 'Mark complete'}
                                                    className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 cursor-pointer' : isLocked ? 'border-gray-300 bg-gray-100 cursor-not-allowed' : 'border-gray-300 hover:border-[var(--color-primary)] cursor-pointer'}`}
                                                  >
                                                    {isDone && <Check className="w-3 h-3 text-white" />}
                                                    {isLocked && <Lock className="w-2.5 h-2.5 text-gray-400" />}
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium ${isDone ? 'text-emerald-700 line-through' : isLocked ? 'text-gray-400' : 'text-gray-900'}`}>{node.title}</p>
                                                    <p className="text-xs text-gray-500 truncate">{node.objective}</p>
                                                    {isLocked && <p className="text-[10px] text-amber-500 mt-0.5 flex items-center gap-1"><Lock className="w-2.5 h-2.5" />{lockReason}</p>}
                                                  </div>
                                                  {isNodeExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                                                </button>

                                                {/* Node Details */}
                                                {isNodeExpanded && (
                                                  <div className="px-3 pb-3 ml-8 space-y-3">
                                                    <div>
                                                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Objective</p>
                                                      <p className="text-sm text-gray-700">{node.objective}</p>
                                                    </div>
                                                    {node.resources && node.resources.length > 0 && (
                                                      <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"><BookOpen className="w-3 h-3" /> Resources</p>
                                                        <div className="space-y-1">
                                                          {node.resources.map((res, i) => (
                                                            <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                                              <ExternalLink className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-400" />
                                                              <span>{res}</span>
                                                            </div>
                                                          ))}
                                                        </div>
                                                      </div>
                                                    )}
                                                    {node.practiceTask && (
                                                      <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Play className="w-3 h-3" /> Practice Task</p>
                                                        <p className="text-sm text-gray-700 bg-blue-50 p-2.5 rounded-lg border border-blue-100">{node.practiceTask}</p>
                                                      </div>
                                                    )}
                                                    {node.project && (
                                                      <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Code className="w-3 h-3" /> Project</p>
                                                        <p className="text-sm text-gray-700 bg-violet-50 p-2.5 rounded-lg border border-violet-100">{node.project}</p>
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            )
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    )}
                  </div>
                ) : showResult && selectedRoadmap?.status === 'failed' ? (
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 rounded-2xl mb-4">
                      <AlertTriangle className="w-8 h-8 text-rose-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Generation Failed</h3>
                    <p className="text-sm text-gray-500 mb-6">{statusMessage || 'Failed to generate roadmap.'}</p>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-12 text-center">
              <p className="text-sm text-gray-500">No information available for this roadmap.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ===================== LIST VIEW =====================
  return (
    <>
      <div ref={containerRef} className="w-full pb-6 space-y-6">
        {/* Hero */}
        <div className="roadmap-hero relative overflow-hidden bg-[var(--color-primary)] rounded-2xl p-8">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
                <Map className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white">Learning Roadmaps</span>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white tracking-tight">Your Roadmaps</h1>
                <p className="text-white/70 max-w-xl leading-relaxed">Generate personalized, AI-powered learning roadmaps to achieve your career goals.</p>
              </div>
              {!loading && lastUpdated && (
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Clock className="w-4 h-4" />
                  <span>{isFromCache ? 'Cached' : 'Updated'} at {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-2 md:mt-0">
              <button onClick={openCreateModal} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[var(--color-primary)] rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl">
                <Sparkles className="w-4 h-4" />Generate New
              </button>
              <button onClick={handleRefresh} disabled={refreshing} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50">
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />{refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="roadmap-content bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text" placeholder="Search by goal title..." value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] focus:bg-white transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 animate-pulse">
                  <div className="w-12 h-12 rounded-xl bg-gray-200" />
                  <div className="flex-1 space-y-2"><div className="h-4 w-1/3 bg-gray-200 rounded" /><div className="h-3 w-1/4 bg-gray-200 rounded" /></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 rounded-2xl mb-4"><AlertTriangle className="w-8 h-8 text-rose-600" /></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
              <p className="text-sm text-gray-500 mb-6">{error}</p>
              <button onClick={handleRefresh} className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-xl hover:opacity-90 transition-colors">Try Again</button>
            </div>
          ) : filteredRoadmaps.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-4"><Map className="w-8 h-8 text-gray-400" /></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{searchQuery ? 'No matching roadmaps' : 'No roadmaps yet'}</h3>
              <p className="text-sm text-gray-500 mb-6">{searchQuery ? 'Try a different search term' : 'Generate your first AI-powered learning roadmap'}</p>
              {!searchQuery && (
                <button onClick={openCreateModal} className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-xl hover:opacity-90 transition-colors inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />Generate Roadmap
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {formattedRoadmaps.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleView(item.id)}
                  className="group p-5 hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="p-3 bg-[var(--color-primary)]/10 rounded-xl flex-shrink-0">
                        <Map className="w-5 h-5 text-[var(--color-primary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <h3 className="text-base font-semibold text-gray-900 truncate">{item.goalTitle}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                            item.status === 'failed' ? 'bg-rose-100 text-rose-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {item.status === 'pending' ? 'Generating...' : item.status === 'failed' ? 'Failed' : 'Ready'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{item.durationDays} days</span>
                          <span>{item.currentSkillLevel} → {item.targetSkillLevel}</span>
                          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{item.dateLabel}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => confirmDelete(item, e)}
                        disabled={deletingId === item.id}
                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">{startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredRoadmaps.length)} of {filteredRoadmaps.length}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => goToPage(1)} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronsLeft className="w-4 h-4" /></button>
                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                {pageNumbers.map((page, i) => (
                  typeof page === 'number' ? (
                    <button key={i} onClick={() => goToPage(page)} className={`w-8 h-8 rounded-lg text-sm font-medium ${currentPage === page ? 'bg-[var(--color-primary)] text-white' : 'hover:bg-gray-100 text-gray-600'}`}>{page}</button>
                  ) : <span key={i} className="px-1 text-gray-400">...</span>
                ))}
                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"><RightIcon className="w-4 h-4" /></button>
                <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronsRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div ref={modalRef} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Generate New Roadmap</h2>
                <p className="text-sm text-gray-500 mt-1">Tell us about your learning goals</p>
              </div>
              <button onClick={closeCreateModal} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-5">
              {/* Goal Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">What do you want to learn? *</label>
                <input type="text" value={goalTitle} onChange={e => setGoalTitle(e.target.value)} placeholder="e.g., Full Stack Web Development with React & Node.js" className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${formErrors.goalTitle ? 'border-rose-300' : 'border-gray-200'}`} />
                {formErrors.goalTitle && <p className="text-xs text-rose-500 mt-1">{formErrors.goalTitle}</p>}
              </div>

              {/* Duration + Skill Levels */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (days) *</label>
                  <input type="number" value={durationDays} onChange={e => setDurationDays(Number(e.target.value))} min={7} max={365} className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${formErrors.durationDays ? 'border-rose-300' : 'border-gray-200'}`} />
                  {formErrors.durationDays && <p className="text-xs text-rose-500 mt-1">{formErrors.durationDays}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Level</label>
                  <select value={currentSkillLevel} onChange={e => setCurrentSkillLevel(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white">
                    <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Level</label>
                  <select value={targetSkillLevel} onChange={e => setTargetSkillLevel(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white">
                    <option>Job-Ready</option><option>Interview-Ready</option><option>Advanced</option>
                  </select>
                </div>
              </div>

              {/* Education */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Educational Background *</label>
                <input type="text" value={educationalBackground} onChange={e => setEducationalBackground(e.target.value)} placeholder="e.g., MCA Student, BSc Computer Science" className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${formErrors.educationalBackground ? 'border-rose-300' : 'border-gray-200'}`} />
                {formErrors.educationalBackground && <p className="text-xs text-rose-500 mt-1">{formErrors.educationalBackground}</p>}
              </div>

              {/* Prior Knowledge */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Prior Knowledge <span className="text-gray-400">(comma separated)</span></label>
                <input type="text" value={priorKnowledge} onChange={e => setPriorKnowledge(e.target.value)} placeholder="e.g., HTML, CSS, Basic JavaScript" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
              </div>

              {/* Learning Style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Learning Style</label>
                <div className="flex flex-wrap gap-2">
                  {['Hands-on', 'Projects', 'Videos', 'Reading'].map(style => (
                    <button key={style} type="button" onClick={() => toggleLearningStyle(style)} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${learningStyle.includes(style) ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Career Goal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Career Goal</label>
                <input type="text" value={careerGoal} onChange={e => setCareerGoal(e.target.value)} placeholder="e.g., Full Stack Developer at a startup" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
              </div>

              {/* Resource Constraints */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Resource Constraints</label>
                <input type="text" value={resourceConstraints} onChange={e => setResourceConstraints(e.target.value)} placeholder="e.g., Free resources only, 2 hours/day" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Notes</label>
                <textarea value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)} rows={2} placeholder="Any specific requirements or preferences..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none" />
              </div>

              {createError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />{createError}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={closeCreateModal} disabled={creatingRoadmap} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50">Cancel</button>
              <button onClick={handleCreateRoadmap} disabled={creatingRoadmap} className="flex-1 px-4 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-semibold hover:opacity-90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2">
                {creatingRoadmap ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4" />Generate Roadmap</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && itemToDelete && (
        <div ref={deleteModalRef} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-rose-100 rounded-2xl mb-4"><Trash2 className="w-7 h-7 text-rose-600" /></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Delete Roadmap?</h3>
              <p className="text-sm text-gray-500">This will permanently delete &quot;{itemToDelete.goalTitle}&quot;</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setItemToDelete(null) }} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleDeleteRoadmap} disabled={!!deletingId} className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2">
                {deletingId ? <><Loader2 className="w-4 h-4 animate-spin" />Deleting...</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Roadmap
