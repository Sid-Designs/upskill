"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { gsap, useGSAP } from '@/lib/gsap'
import { 
  Search, 
  Filter, 
  Calendar, 
  MessageSquare, 
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
  History as HistoryIcon
} from 'lucide-react'

// Cache key and duration (5 minutes)
const HISTORY_CACHE_KEY = "history_sessions_cache"
const CACHE_DURATION = 5 * 60 * 1000

type ChatSession = {
  id: string
  userId: string
  type: string
  title: string
  status: string
  createdAt: string
  updatedAt: string
}

type ChatSessionsResponse = {
  success: boolean
  data: ChatSession[]
}

type CreateSessionResponse = {
  success: boolean
  data: ChatSession
}

interface CachedHistory {
  sessions: ChatSession[]
  timestamp: number
  userId?: string
}

const ITEMS_PER_PAGE = 10

const History: React.FC = () => {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const deleteModalRef = useRef<HTMLDivElement>(null)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFromCache, setIsFromCache] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>("")
  const [userId, setUserId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newSessionTitle, setNewSessionTitle] = useState('')
  const [creatingSession, setCreatingSession] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null)
  const [titleError, setTitleError] = useState('')

  // GSAP fade animations
  useGSAP(() => {
    if (!containerRef.current) return
    
    const ctx = gsap.context(() => {
      gsap.fromTo(".history-hero", 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.4 }
      )
      gsap.fromTo(".history-stats", 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.4, stagger: 0.06, delay: 0.1 }
      )
      gsap.fromTo(".history-content", 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.4, delay: 0.2 }
      )
    }, containerRef)

    return () => ctx.revert()
  }, { scope: containerRef })

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

  // Helper to get cached history
  const getCachedHistory = useCallback((currentUserId: string): CachedHistory | null => {
    try {
      const cached = sessionStorage.getItem(HISTORY_CACHE_KEY)
      if (!cached) return null
      
      const data: CachedHistory = JSON.parse(cached)
      const isExpired = Date.now() - data.timestamp > CACHE_DURATION
      const isSameUser = data.userId === currentUserId
      
      if (isExpired || !isSameUser) {
        sessionStorage.removeItem(HISTORY_CACHE_KEY)
        return null
      }
      
      return data
    } catch {
      sessionStorage.removeItem(HISTORY_CACHE_KEY)
      return null
    }
  }, [])

  // Helper to set cached history
  const setCachedHistory = useCallback((sessions: ChatSession[], currentUserId: string) => {
    try {
      const cacheData: CachedHistory = {
        sessions,
        timestamp: Date.now(),
        userId: currentUserId
      }
      sessionStorage.setItem(HISTORY_CACHE_KEY, JSON.stringify(cacheData))
    } catch { /* ignore storage errors */ }
  }, [])

  // Clear cache when session is deleted
  const clearHistoryCache = useCallback(() => {
    try {
      sessionStorage.removeItem(HISTORY_CACHE_KEY)
    } catch { /* ignore */ }
  }, [])

  const fetchSessions = useCallback(async (forceRefresh = false) => {
    // Check cache first (unless force refresh)
    if (!forceRefresh && userId) {
      const cached = getCachedHistory(userId)
      if (cached) {
        setSessions(cached.sessions)
        setIsFromCache(true)
        setLastUpdated(new Date(cached.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
        setLoading(false)
        setRefreshing(false)
        setCurrentPage(1)
        return
      }
    }

    setLoading(true)
    setError(null)
    setIsFromCache(false)
    
    try {
      const response = await api.get<ChatSessionsResponse>('/api/chat/session')
      const payload = response.data
      if (payload?.success && Array.isArray(payload.data)) {
        setSessions(payload.data)
        setCurrentPage(1)
        setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
        
        // Save to cache
        if (userId) {
          setCachedHistory(payload.data, userId)
        }
      } else {
        setError('Unable to load chat history right now.')
      }
    } catch (err) {
      setError('Unable to load chat history right now.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [userId, getCachedHistory, setCachedHistory])

  // Fetch sessions when userId is available
  useEffect(() => {
    if (userId !== null) {
      void fetchSessions()
    }
  }, [fetchSessions, userId])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchSessions(true)
  }

  const openCreateModal = () => {
    setNewSessionTitle('')
    setCreateError(null)
    setTitleError('')
    setIsCreateModalOpen(true)
  }

  const closeCreateModal = () => {
    if (creatingSession) return
    if (modalRef.current) {
      gsap.to(modalRef.current, {
        opacity: 0, duration: 0.2,
        onComplete: () => {
          setIsCreateModalOpen(false)
          setCreateError(null)
          setTitleError('')
        }
      })
    } else {
      setIsCreateModalOpen(false)
      setCreateError(null)
      setTitleError('')
    }
  }

  const handleCreateSession = async () => {
    const title = newSessionTitle.trim()

    // Validate title
    if (!title) {
      setTitleError('Please enter a chat title')
      return
    }

    if (title.length > 100) {
      setTitleError('Title must be less than 100 characters')
      return
    }

    setCreatingSession(true)
    setCreateError(null)
    setTitleError('')

    try {
      const response = await api.post<CreateSessionResponse>('/api/chat/create-session', {
        type: 'career_guidance',
        title,
      })

      const newSession = response.data?.data

      if (!newSession?.id) {
        throw new Error('Unable to create chat session')
      }

      setIsCreateModalOpen(false)
      setNewSessionTitle('')

      router.push(`/dashboard/chatbot?sessionid=${encodeURIComponent(newSession.id)}`)
    } catch (err) {
      console.error('Unable to create chat session:', err)
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Unable to start the conversation right now.'
      setCreateError(message)
    } finally {
      setCreatingSession(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCreateSession()
    }
  }

  // Delete session function
  const handleDeleteSession = async () => {
    if (!sessionToDelete) return

    setDeletingSessionId(sessionToDelete.id)
    
    try {
      const response = await api.delete(`/api/chat/session/${sessionToDelete.id}`)
      
      if (response.data?.success) {
        setSessions(prev => prev.filter(session => session.id !== sessionToDelete.id))
        // Clear cache when session is deleted
        clearHistoryCache()
        console.log('Session deleted successfully')
      } else {
        throw new Error('Failed to delete session')
      }
    } catch (err) {
      console.error('Error deleting session:', err)
    } finally {
      setDeletingSessionId(null)
      setShowDeleteModal(false)
      setSessionToDelete(null)
    }
  }

  const confirmDelete = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation()
    setSessionToDelete(session)
    setShowDeleteModal(true)
  }

  const filteredSessions = useMemo(() => {
    let filtered = sessions

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(session =>
        session.title?.toLowerCase().includes(query) ||
        session.type?.toLowerCase().includes(query)
      )
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(session => session.type === filterType)
    }

    return filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [sessions, searchQuery, filterType])

  const totalPages = Math.ceil(filteredSessions.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedSessions = filteredSessions.slice(startIndex, endIndex)

  const formattedSessions = useMemo(() => (
    paginatedSessions.map(session => {
      const date = new Date(session.createdAt)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
      
      let dateLabel: string
      if (diffDays === 0) {
        dateLabel = 'Today'
      } else if (diffDays === 1) {
        dateLabel = 'Yesterday'
      } else if (diffDays < 7) {
        dateLabel = `${diffDays} days ago`
      } else {
        dateLabel = new Intl.DateTimeFormat('en', {
          month: 'short',
          day: 'numeric'
        }).format(date)
      }

      return {
        ...session,
        dateLabel,
        timeLabel: new Intl.DateTimeFormat('en', {
          hour: '2-digit',
          minute: '2-digit'
        }).format(date),
        fullDate: new Intl.DateTimeFormat('en', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(date)
      }
    })
  ), [paginatedSessions])

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

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-emerald-100 text-emerald-800',
      pending: 'bg-amber-100 text-amber-800',
      completed: 'bg-blue-100 text-blue-800',
      failed: 'bg-rose-100 text-rose-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      general: <MessageSquare className="w-4 h-4" />,
      technical: <Sparkles className="w-4 h-4" />,
      support: <MessageSquare className="w-4 h-4" />
    }
    return icons[type as keyof typeof icons] || <MessageSquare className="w-4 h-4" />
  }

  const formatType = (value: string) => {
    return value.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const handleOpen = (sessionId: string) => {
    router.push(`/dashboard/chatbot?sessionid=${encodeURIComponent(sessionId)}`)
  }

  const uniqueTypes = useMemo(() => {
    const types = ['all', ...new Set(sessions.map(s => s.type))]
    return types.filter(Boolean)
  }, [sessions])

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

  return (
    <>
      <div ref={containerRef} className="w-full pb-6 space-y-6">
        {/* Hero Header */}
        <div className="history-hero relative overflow-hidden bg-[var(--color-primary)] rounded-2xl p-8">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          
          <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
                <HistoryIcon className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white">Chat History</span>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  Your Conversations
                </h1>
                <p className="text-white/70 max-w-xl leading-relaxed">
                  Browse and continue your previous conversations with the AI assistant.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 self-start">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2.5 text-white hover:bg-white/25 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              {lastUpdated && (
                <span className="text-xs text-white/60 bg-white/10 px-3 py-1 rounded-full">
                  {isFromCache ? 'Cached' : 'Updated'} {lastUpdated}
                </span>
              )}
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="relative flex flex-col sm:flex-row gap-3 mt-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
              <Filter className="w-5 h-5 text-white/50 flex-shrink-0" />
              {uniqueTypes.map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setFilterType(type)
                    setCurrentPage(1)
                  }}
                  className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition-colors ${
                    filterType === type
                      ? 'bg-white text-[var(--color-primary)] font-medium'
                      : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                  }`}
                >
                  {type === 'all' ? 'All Types' : formatType(type)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="history-stats bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Conversations</p>
                  <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
                </div>
              </div>
            </div>
            <div className="history-stats bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {sessions.filter(s => s.status === 'active').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="history-stats bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/25">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {sessions.filter(s => {
                      const sessionDate = new Date(s.createdAt)
                      const now = new Date()
                      return sessionDate.getMonth() === now.getMonth() && 
                             sessionDate.getFullYear() === now.getFullYear()
                    }).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="history-content bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Loading State */}
            {loading && (
              <div className="p-8">
                <div className="space-y-4">
                  {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
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
                <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 rounded-2xl mb-4">
                  <MessageSquare className="w-8 h-8 text-rose-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load History</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredSessions.length === 0 && (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-2xl mb-6">
                  <MessageSquare className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No conversations yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {searchQuery || filterType !== 'all' 
                    ? 'No conversations match your search criteria. Try adjusting your filters.'
                    : 'Start your first conversation to see it appear here.'}
                </p>
                {searchQuery || filterType !== 'all' ? (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setFilterType('all')
                    }}
                    className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Clear Filters
                  </button>
                ) : (
                  <button
                    onClick={openCreateModal}
                    className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Start New Conversation
                  </button>
                )}
              </div>
            )}

            {/* Sessions List */}
            {!loading && !error && formattedSessions.length > 0 && (
              <>
                <div className="divide-y divide-gray-100">
                  {formattedSessions.map((session) => (
                    <div
                      key={session.id}
                      className="group p-6 hover:bg-gray-50 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div 
                          className="flex items-start gap-4 flex-1 min-w-0 cursor-pointer"
                          onClick={() => handleOpen(session.id)}
                        >
                          <div className="p-3 bg-primary/10 rounded-xl text-primary flex-shrink-0">
                            {getTypeIcon(session.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {session.title || 'Untitled Conversation'}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                                {session.status}
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1.5">
                                <div className="p-1 bg-gray-100 rounded">
                                  {getTypeIcon(session.type)}
                                </div>
                                <span>{formatType(session.type)}</span>
                              </div>
                              
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                <span>{session.dateLabel} • {session.timeLabel}</span>
                              </div>
                            </div>
                            
                            {session.title && (
                              <p className="mt-3 text-gray-700 line-clamp-2">
                                Conversation started on {session.fullDate}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <button
                            onClick={(e) => confirmDelete(session, e)}
                            disabled={deletingSessionId === session.id}
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete conversation"
                          >
                            {deletingSessionId === session.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Trash2 className="w-5 h-5" />
                            )}
                          </button>
                          
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight 
                              className="w-5 h-5 text-gray-400 cursor-pointer"
                              onClick={() => handleOpen(session.id)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Results Count */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-semibold">{startIndex + 1}-{Math.min(endIndex, filteredSessions.length)}</span> of{' '}
                    <span className="font-semibold">{filteredSessions.length}</span> conversations
                    {filteredSessions.length !== sessions.length && ' (filtered)'}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Pagination */}
          {showPagination && !loading && !error && filteredSessions.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="text-sm text-gray-600">
                Page <span className="font-semibold">{currentPage}</span> of{' '}
                <span className="font-semibold">{totalPages}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="First page"
                >
                  <ChevronsLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                        className={`w-10 h-10 rounded-lg transition-colors ${
                          currentPage === pageNum
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
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <RightIcon className="w-5 h-5" />
                </button>

                <button
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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

          {/* Start New Chat Button (if no pagination shown) */}
          {!showPagination && !loading && !error && filteredSessions.length > 0 && (
            <div className="text-center">
              <button
                onClick={openCreateModal}
                className="px-6 py-3 bg-[var(--color-primary)] text-white rounded-xl hover:opacity-90 transition-all inline-flex items-center gap-2 font-medium"
              >
                <MessageSquare className="w-5 h-5" />
                Start New Conversation
              </button>
            </div>
          )}
        </div>
      

      {/* New Chat Modal */}
      {isCreateModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && closeCreateModal()}
        >
          <div ref={modalRef} className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-[var(--color-primary)] px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">New Chat Session</h3>
                  <p className="text-sm text-white/70">Give your conversation a name</p>
                </div>
                <button
                  onClick={closeCreateModal}
                  disabled={creatingSession}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2" htmlFor="chat-title">
                  Chat Title
                </label>
                <input
                  id="chat-title"
                  type="text"
                  value={newSessionTitle}
                  onChange={(e) => {
                    setNewSessionTitle(e.target.value)
                    if (titleError) setTitleError('')
                    if (createError) setCreateError(null)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Frontend Developer Career Path"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all"
                  disabled={creatingSession}
                  autoFocus
                />
                {(titleError || createError) && (
                  <p className="text-sm text-red-500 mt-2">{titleError || createError}</p>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={closeCreateModal}
                  disabled={creatingSession}
                  className="flex-1 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSession}
                  disabled={creatingSession || !newSessionTitle.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-[var(--color-primary)] hover:opacity-90 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingSession && <Loader2 className="h-4 w-4 animate-spin" />}
                  {creatingSession ? 'Creating...' : 'Create Chat'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && sessionToDelete && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={(e) => e.target === e.currentTarget && !deletingSessionId && (setShowDeleteModal(false), setSessionToDelete(null))}
        >
          <div ref={deleteModalRef} className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="bg-rose-500 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete Conversation</h3>
                  <p className="text-sm text-white/70">This action cannot be undone</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-gray-700">
                  Are you sure you want to delete <span className="font-semibold">{sessionToDelete.title || 'Untitled Conversation'}</span>?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Type: {formatType(sessionToDelete.type)} • Created: {new Date(sessionToDelete.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setSessionToDelete(null)
                  }}
                  disabled={deletingSessionId === sessionToDelete.id}
                  className="flex-1 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSession}
                  disabled={deletingSessionId === sessionToDelete.id}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-colors disabled:opacity-50"
                >
                  {deletingSessionId === sessionToDelete.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default History