"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
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
  X
} from 'lucide-react'

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

const ITEMS_PER_PAGE = 10

const History: React.FC = () => {
  const router = useRouter()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get<ChatSessionsResponse>('/api/chat/session')
      const payload = response.data
      if (payload?.success && Array.isArray(payload.data)) {
        setSessions(payload.data)
        setCurrentPage(1)
      } else {
        setError('Unable to load chat history right now.')
      }
    } catch (err) {
      setError('Unable to load chat history right now.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchSessions()
  }

  const openCreateModal = () => {
    setNewSessionTitle('')
    setCreateError(null)
    setTitleError('')
    setIsCreateModalOpen(true)
  }

  const closeCreateModal = () => {
    if (creatingSession) return
    setIsCreateModalOpen(false)
    setCreateError(null)
    setTitleError('')
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
      <div className="min-h-screen p-4">
        <div className="max-w-8xl mx-auto">
          {/* Header */}
          <div className="mb-8 md:mb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  Chat History
                </h1>
                <p className="text-gray-600">
                  Browse and continue your previous conversations
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
                <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
                {uniqueTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      setFilterType(type)
                      setCurrentPage(1)
                    }}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      filterType === type
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Conversations</p>
                    <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Sessions</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {sessions.filter(s => s.status === 'active').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
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
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
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
            <div className="mt-6 text-center">
              <button
                onClick={openCreateModal}
                className="px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Start New Conversation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Popup Modal - Updated Design */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">New Chat</h2>
              <button
                onClick={closeCreateModal}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                disabled={creatingSession}
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <label htmlFor="chat-title" className="block text-sm font-medium text-gray-700 mb-2">
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
                placeholder="Enter a title for your chat..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                disabled={creatingSession}
                autoFocus
              />
              {titleError && (
                <p className="mt-2 text-sm text-red-600">{titleError}</p>
              )}
              {createError && (
                <p className="mt-2 text-sm text-red-600">{createError}</p>
              )}
              <p className="mt-2 text-sm text-gray-500">
                Give your chat a descriptive title (e.g., "Frontend Developer Career Path")
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t">
              <button
                onClick={closeCreateModal}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                disabled={creatingSession}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSession}
                disabled={creatingSession || !newSessionTitle.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {creatingSession ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Creating...
                  </>
                ) : (
                  'Create Chat'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && sessionToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-rose-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Conversation</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
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
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSession}
                disabled={deletingSessionId === sessionToDelete.id}
                className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingSessionId === sessionToDelete.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Conversation'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default History