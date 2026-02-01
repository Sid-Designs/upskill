'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import '@/public/styles/ChatBot.css'
import { ArrowUp, Loader2, X } from 'lucide-react'
import ChatBody from './ChatBody'
import ChatMessages from './ChatMessages'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import api from '@/lib/api'

/* -------------------------------- TYPES -------------------------------- */

type Role = 'user' | 'assistant'

type ChatMessage = {
  id?: string
  role: Role
  content: string
  status?: 'pending' | 'completed' | 'failed'
}

type ApiMessage = {
  id: string
  role: Role
  content: string
  status: 'pending' | 'completed' | 'failed'
  createdAt: string
}

/* -------------------------------- HELPERS -------------------------------- */

const getErrorMessage = (err: unknown): string => {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const response = (err as { response?: { status?: number; data?: { message?: string } } }).response
    if (response?.status === 429) return 'Too many requests. Please try again later.'
    if (response?.status === 401) return 'Session expired. Please refresh the page.'
    if (response?.status === 403) return 'You don\'t have permission to perform this action.'
    if (response?.data?.message) return response.data.message
  }
  if (err instanceof Error) return err.message
  return 'An unexpected error occurred.'
}

/* ------------------------------ COMPONENT ------------------------------ */

const ChatBot: React.FC = () => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)

  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionid')
  const router = useRouter()
  const pathname = usePathname() ?? '/'

  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [thinkingPhase, setThinkingPhase] = useState(0)
  const [sending, setSending] = useState(false)
  const [statusText, setStatusText] = useState<string | null>(null)
  const [hasStarted, setHasStarted] = useState(false)
  const [creatingSession, setCreatingSession] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(!!sessionId)
  
  // Title popup state
  const [showTitlePopup, setShowTitlePopup] = useState(false)
  const [chatTitle, setChatTitle] = useState('')
  const [titleError, setTitleError] = useState('')

  // Track mounted state for async operations
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Cycle through thinking phases when AI is generating
  useEffect(() => {
    if (!isThinking) {
      setThinkingPhase(0)
      return
    }

    setThinkingPhase(1)
    
    const timers = [
      setTimeout(() => isMountedRef.current && setThinkingPhase(2), 1500),
      setTimeout(() => isMountedRef.current && setThinkingPhase(3), 3500),
      setTimeout(() => isMountedRef.current && setThinkingPhase(4), 6000),
    ]

    return () => timers.forEach(t => clearTimeout(t))
  }, [isThinking])

  /* ------------------------ CREATE SESSION ------------------------ */

  const resetChatState = useCallback(() => {
    setMessages([])
    setMessage('')
    setIsThinking(false)
    setHasStarted(false)
    setStatusText(null)
  }, [])

  const openNewChatPopup = useCallback(() => {
    if (creatingSession) return
    setChatTitle('')
    setTitleError('')
    setShowTitlePopup(true)
  }, [creatingSession])

  const closePopup = useCallback(() => {
    if (creatingSession) return
    setShowTitlePopup(false)
    setChatTitle('')
    setTitleError('')
  }, [creatingSession])

  const handleCreateChatSession = useCallback(async () => {
    if (creatingSession) return

    const title = chatTitle.trim()
    
    if (!title) {
      setTitleError('Please enter a chat title')
      return
    }

    if (title.length > 100) {
      setTitleError('Title must be less than 100 characters')
      return
    }

    setCreatingSession(true)
    setTitleError('')
    setStatusText(null)

    try {
      const response = await api.post('/api/chat/create-session', {
        type: 'career_guidance',
        title,
      })

      const newSessionId = response.data?.data?.id ?? response.data?.data?._id

      if (!newSessionId) {
        throw new Error('Unable to start a new chat session')
      }

      if (!isMountedRef.current) return

      resetChatState()
      setShowTitlePopup(false)
      setChatTitle('')

      const params = new URLSearchParams(searchParams.toString())
      params.set('sessionid', newSessionId)
      router.push(`${pathname}?${params.toString()}`)
    } catch (err) {
      if (!isMountedRef.current) return
      console.error('Failed to create chat session:', err)
      setStatusText(getErrorMessage(err))
    } finally {
      if (isMountedRef.current) setCreatingSession(false)
    }
  }, [chatTitle, creatingSession, pathname, resetChatState, router, searchParams])

  /* ------------------------ SSE CONNECTION ------------------------ */

  // Helper to fetch and update messages
  const fetchAndUpdateMessages = useCallback(async () => {
    if (!sessionId) return null
    
    try {
      const res = await api.get<{ data: ApiMessage[] }>(
        `/api/chat/session/${sessionId}/messages`
      )
      
      const data = res.data
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
      
      const sorted = list
        .sort((a: ApiMessage, b: ApiMessage) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map((m: ApiMessage) => ({
          id: m.id,
          role: m.role,
          content: m.content ?? '',
          status: m.status
        }))

      return sorted
    } catch (err) {
      console.error('Failed to fetch messages:', err)
      return null
    }
  }, [sessionId])

  useEffect(() => {
    if (!sessionId) {
      setIsInitialLoading(false)
      setMessages([])
      setHasStarted(false)
      return
    }

    // Set loading state
    setIsInitialLoading(true)

    // Create abort controller for initial fetch
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    // Polling interval ref
    let pollingInterval: NodeJS.Timeout | null = null
    let pollAttempts = 0
    const MAX_POLL_ATTEMPTS = 30 // Poll for max 30 seconds
    
    // Initial load
    const loadMessages = async () => {
      try {
        const res = await api.get<{ data: ApiMessage[] }>(
          `/api/chat/session/${sessionId}/messages`,
          { signal: abortController.signal }
        )

        if (!isMountedRef.current || abortController.signal.aborted) return

        const data = res.data
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []

        const sorted = list
          .sort((a: ApiMessage, b: ApiMessage) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          .map((m: ApiMessage) => ({
            id: m.id,
            role: m.role,
            content: m.content ?? '',
            status: m.status
          }))

        setMessages(sorted)
        if (sorted.length > 0) setHasStarted(true)
      } catch (err) {
        if (abortController.signal.aborted) return
        if (!isMountedRef.current) return
        console.error('Failed to fetch messages:', err)
        setStatusText(getErrorMessage(err))
      } finally {
        if (isMountedRef.current && !abortController.signal.aborted) {
          setIsInitialLoading(false)
        }
      }
    }

    loadMessages()

    // Setup SSE
    const sseUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/chat/stream?sessionId=${sessionId}`
    const es = new EventSource(sseUrl)
    eventSourceRef.current = es

    const handleConnected = () => {
      console.log('[SSE] Connected')
    }

    const handleCompleted = async () => {
      if (!isMountedRef.current) return
      
      // Stop polling if running
      if (pollingInterval) {
        clearInterval(pollingInterval)
        pollingInterval = null
      }
      
      // Refetch messages on completion
      const sorted = await fetchAndUpdateMessages()
      if (sorted && isMountedRef.current) {
        setMessages(sorted)
        if (sorted.length > 0) setHasStarted(true)
      }
      setIsThinking(false)
      setStatusText(null)
    }

    const handleFailed = async (e: Event) => {
      if (!isMountedRef.current) return
      
      // Stop polling if running
      if (pollingInterval) {
        clearInterval(pollingInterval)
        pollingInterval = null
      }
      
      // Refetch messages on failure
      const sorted = await fetchAndUpdateMessages()
      if (sorted && isMountedRef.current) {
        setMessages(sorted)
      }
      setIsThinking(false)

      try {
        const data = JSON.parse((e as MessageEvent).data)
        const errorMessages: Record<string, string> = {
          rate_limited: 'Too many requests. Please try again later.',
          insufficient_credits: 'Insufficient credits.',
        }
        setStatusText(errorMessages[data?.reason] || 'AI failed. Please try again.')
      } catch {
        setStatusText('AI failed. Please try again.')
      }
    }

    const handleError = () => {
      console.warn('[SSE] Connection error - will auto-reconnect')
    }

    // Start polling as fallback when AI is thinking (checks for completed messages)
    const startPolling = () => {
      if (pollingInterval) return
      
      pollAttempts = 0
      pollingInterval = setInterval(async () => {
        if (!isMountedRef.current) {
          if (pollingInterval) clearInterval(pollingInterval)
          return
        }
        
        pollAttempts++
        
        const sorted = await fetchAndUpdateMessages()
        if (sorted) {
          // Check if there's a completed AI message (last message is assistant with status completed)
          const lastMsg = sorted[sorted.length - 1]
          if (lastMsg?.role === 'assistant' && lastMsg?.status === 'completed') {
            console.log('[Polling] Found completed AI response')
            setMessages(sorted)
            setIsThinking(false)
            setHasStarted(true)
            if (pollingInterval) {
              clearInterval(pollingInterval)
              pollingInterval = null
            }
          }
        }
        
        // Stop polling after max attempts
        if (pollAttempts >= MAX_POLL_ATTEMPTS) {
          console.log('[Polling] Max attempts reached')
          if (pollingInterval) {
            clearInterval(pollingInterval)
            pollingInterval = null
          }
        }
      }, 1000) // Poll every 1 second
    }

    es.addEventListener('connected', handleConnected)
    es.addEventListener('completed', handleCompleted)
    es.addEventListener('failed', handleFailed)
    es.onerror = handleError

    // Expose startPolling for use in sendMessage
    ;(window as any).__startChatPolling = startPolling

    return () => {
      // Cleanup polling
      if (pollingInterval) {
        clearInterval(pollingInterval)
        pollingInterval = null
      }
      
      // Cleanup abort controller
      abortController.abort()
      abortControllerRef.current = null
      
      // Cleanup SSE
      es.removeEventListener('connected', handleConnected)
      es.removeEventListener('completed', handleCompleted)
      es.removeEventListener('failed', handleFailed)
      es.onerror = null
      es.close()
      eventSourceRef.current = null
      
      // Cleanup global
      delete (window as any).__startChatPolling
    }
  }, [sessionId, fetchAndUpdateMessages])

  /* --------------------------- SEND MESSAGE ----------------------------- */

  const sendMessage = useCallback(async () => {
    const content = message.trim()
    if (!content || sending || isThinking || !sessionId) return

    setMessage('')
    setSending(true)
    setIsThinking(true)
    setHasStarted(true)
    setStatusText(null)

    // Optimistic UI update
    const optimisticMessage: ChatMessage = { role: 'user', content }
    setMessages(prev => [...prev, optimisticMessage])

    try {
      await api.post('/api/chat/send-message', {
        chatSessionId: sessionId,
        content
      })
      
      // Start polling as fallback in case SSE notification is missed
      if (typeof (window as any).__startChatPolling === 'function') {
        (window as any).__startChatPolling()
      }
    } catch (err) {
      if (!isMountedRef.current) return
      console.error('Send failed:', err)
      setStatusText(getErrorMessage(err))
      setIsThinking(false)
      // Rollback optimistic update
      setMessages(prev => prev.filter(m => m !== optimisticMessage))
    } finally {
      if (isMountedRef.current) {
        setSending(false)
        textareaRef.current?.focus()
      }
    }
  }, [message, sending, isThinking, sessionId])

  /* ------------------------------- INPUT -------------------------------- */

  const MAX_HEIGHT = 100 // Max textarea height in px
  const MAX_CHARS = 1000 // Max character limit
  const SHOW_COUNTER_AT = 750 // Show counter when characters reach this threshold

  const handleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = textareaRef.current
    if (!el) return

    let value = e.currentTarget.value
    
    // Enforce character limit
    if (value.length > MAX_CHARS) {
      value = value.slice(0, MAX_CHARS)
      e.currentTarget.value = value
    }

    // Reset to auto to get accurate scrollHeight
    el.style.height = 'auto'
    
    // If content exceeds max height, cap it and enable scroll
    if (el.scrollHeight > MAX_HEIGHT) {
      el.style.height = `${MAX_HEIGHT}px`
      el.style.overflowY = 'auto'
    } else {
      el.style.height = `${el.scrollHeight}px`
      el.style.overflowY = 'hidden'
    }
    
    setMessage(value)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }, [sendMessage])

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCreateChatSession()
    }
    if (e.key === 'Escape') {
      closePopup()
    }
  }, [handleCreateChatSession, closePopup])

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setChatTitle(e.target.value)
    if (titleError) setTitleError('')
  }, [titleError])

  /* ------------------------------- RENDER ------------------------------- */

  const formattedMessages = useMemo(() => {
    return messages
  }, [messages])

  const isInputDisabled = isThinking || sending || !sessionId
  const isSendDisabled = isInputDisabled || !message.trim()

  return (
    <main className="relative h-[calc(100vh-40px)] overflow-hidden">
      {/* Title Popup Modal */}
      {showTitlePopup && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && closePopup()}
        >
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-[var(--color-primary)] px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">New Chat Session</h2>
                  <p className="text-sm text-white/70">Give your conversation a name</p>
                </div>
                <button
                  onClick={closePopup}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  disabled={creatingSession}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              <div>
                <label htmlFor="chat-title" className="block text-sm font-medium text-gray-700 mb-2">
                  Chat Title
                </label>
                <input
                  id="chat-title"
                  type="text"
                  value={chatTitle}
                  onChange={handleTitleChange}
                  onKeyDown={handleTitleKeyDown}
                  placeholder="e.g. Frontend Developer Career Path"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none transition-all"
                  disabled={creatingSession}
                  autoFocus
                  maxLength={100}
                />
                {titleError && (
                  <p className="mt-2 text-sm text-red-500">{titleError}</p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-3">
                <button
                  onClick={closePopup}
                  className="flex-1 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  disabled={creatingSession}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateChatSession}
                  disabled={creatingSession || !chatTitle.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-[var(--color-primary)] hover:opacity-90 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>
      )}

      <header className="flex justify-between items-center p-4 sticky top-0 z-10">
        <button
          type="button"
          className="newChatBtn px-4 py-2"
          onClick={openNewChatPopup}
          disabled={creatingSession}
        >
          {creatingSession ? (
            <span className="flex items-center gap-2 justify-center">
              <Loader2 className="animate-spin" size={16} />
              Creating
            </span>
          ) : (
            'New Chat'
          )}
        </button>
        <div className="chatTitle">Career Assistant</div>
        <button className="expBtn px-4 py-2 hidden md:flex">
          Contact Expert
        </button>
      </header>

      <div className="h-[calc(100%-180px)] center flex-col chatBody mt-4">
        {isInitialLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-[var(--color-primary)]" size={32} />
          </div>
        ) : !hasStarted ? (
          <ChatBody onQuickMessage={setMessage} />
        ) : (
          <ChatMessages
            messages={formattedMessages}
            loading={isThinking}
            thinkingPhase={thinkingPhase}
          />
        )}
      </div>

      <div className="searchSection absolute bottom-0 left-0 right-0 flex flex-col pt-4 gap-4 bg-[var(--color-background)]">
        <div className="searchBar flex p-4 relative w-[90%] lg:w-[60%]">
          <textarea
            ref={textareaRef}
            value={message}
            placeholder={sessionId ? "Let's shape your career path together…" : "Select or create a chat session to start"}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
            className="chat-input"
            disabled={isInputDisabled}
          />

          {/* Character counter - positioned inside, bottom-left */}
          {message.length >= SHOW_COUNTER_AT && (
            <span className={`absolute bottom-2 left-4 text-[10px] px-1.5 py-0.5 rounded-md transition-all ${
              message.length >= MAX_CHARS 
                ? 'text-red-600 bg-red-50 font-medium' 
                : message.length >= 900 
                  ? 'text-amber-600 bg-amber-50' 
                  : 'text-gray-500 bg-gray-100'
            }`}>
              {message.length}/{MAX_CHARS}
            </span>
          )}

          <button
            className="p-2"
            onClick={sendMessage}
            disabled={isSendDisabled}
            aria-label="Send message"
          >
            {sending ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <ArrowUp />
            )}
          </button>
        </div>

        {statusText && (
          <p className="text-xs text-center text-red-500 px-4" role="alert">
            {statusText}
          </p>
        )}

        <p className="text-xs text-center text-gray-500 px-4">
          Responses are generated by AI for learning purposes only.
        </p>
      </div>
    </main>
  )
}

export default ChatBot