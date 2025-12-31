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

/* ------------------------------ COMPONENT ------------------------------ */

const ChatBot: React.FC = () => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionid')
  const router = useRouter()
  const pathname = usePathname() ?? '/'

  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [sending, setSending] = useState(false)
  const [statusText, setStatusText] = useState<string | null>(null)
  const [hasStarted, setHasStarted] = useState(false)
  const [creatingSession, setCreatingSession] = useState(false)
  
  // New state for title popup
  const [showTitlePopup, setShowTitlePopup] = useState(false)
  const [chatTitle, setChatTitle] = useState('')
  const [titleError, setTitleError] = useState('')

  /* ------------------------ FETCH MESSAGES (DB = TRUTH) ------------------------ */

  const handleError = (err: unknown): string => {
    if (typeof err === 'object' && err !== null && 'response' in err) {
      const response = (err as { response?: { status?: number } }).response
      if (response?.status === 429)
        return 'Too many requests. Please try again later.'
    }
    return 'An unexpected error occurred.'
  }

  const fetchMessages = useCallback(async () => {
    if (!sessionId) return

    try {
      const res = await api.get<{ data: ApiMessage[] }>(
        `/api/chat/session/${sessionId}/messages`
      )

      const list = Array.isArray(res.data?.data) ? res.data.data : []

      const sorted = list
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
        )
        .map(m => ({
          id: m.id,
          role: m.role,
          content: m.content ?? '',
          status: m.status
        }))

      if (sorted.length > 0) {
        setMessages(sorted)
        setHasStarted(true)
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err)
      setStatusText(handleError(err))
    }
  }, [sessionId])

  const openNewChatPopup = () => {
    if (creatingSession) return
    setChatTitle('')
    setTitleError('')
    setShowTitlePopup(true)
  }

  const handleCreateChatSession = async () => {
    if (creatingSession) return

    // Validate title
    if (!chatTitle.trim()) {
      setTitleError('Please enter a chat title')
      return
    }

    if (chatTitle.trim().length > 100) {
      setTitleError('Title must be less than 100 characters')
      return
    }

    setCreatingSession(true)
    setTitleError('')
    setStatusText(null)

    try {
      const response = await api.post('/api/chat/create-session', {
        type: 'career_guidance',
        title: chatTitle.trim(),
      })

      const newSessionId =
        response.data?.data?.id ??
        response.data?.data?._id ??
        response.data?.data

      if (!newSessionId) {
        throw new Error('Unable to start a new chat session')
      }

      setMessages([])
      setMessage('')
      setIsThinking(false)
      setHasStarted(false)
      setShowTitlePopup(false)
      setChatTitle('')

      const params = new URLSearchParams(searchParams.toString())
      params.set('sessionid', newSessionId)

      const nextPath = `${pathname}?${params.toString()}`

      await router.push(nextPath)
    } catch (err: unknown) {
      console.error('Failed to create chat session:', err)
      setStatusText(handleError(err))
    } finally {
      setCreatingSession(false)
    }
  }

  const handleNewChat = async () => {
    openNewChatPopup()
  }

  /* ------------------------ SSE CONNECTION ------------------------ */

  useEffect(() => {
    if (!sessionId) return

    // Initial load (refresh-safe)
    fetchMessages()

    const es = new EventSource(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/chat/stream?sessionId=${sessionId}`
    )

    eventSourceRef.current = es

    es.addEventListener('connected', () => {
      console.log('[SSE] Connected')
    })

    es.addEventListener('completed', async () => {
      await fetchMessages()
      setIsThinking(false)
      setStatusText(null)
    })

    es.addEventListener('failed', async (e) => {
      await fetchMessages()
      setIsThinking(false)

      try {
        const data = JSON.parse((e as MessageEvent).data)

        if (data?.reason === 'rate_limited') {
          setStatusText('Too many requests. Please try again later.')
        } else if (data?.reason === 'insufficient_credits') {
          setStatusText('Insufficient credits.')
        } else {
          setStatusText('AI failed. Please try again.')
        }
      } catch {
        setStatusText('AI failed. Please try again.')
      }
    })

    es.onerror = () => {
      // SSE auto-reconnects internally
      console.warn('[SSE] Connection error')
    }

    return () => {
      es.close()
      eventSourceRef.current = null
    }
  }, [sessionId, fetchMessages])

  /* --------------------------- SEND MESSAGE ----------------------------- */

  const sendMessage = async () => {
    if (!message.trim() || sending || isThinking || !sessionId) return

    const content = message.trim()

    setMessage('')
    setSending(true)
    setIsThinking(true)
    setHasStarted(true)
    setStatusText(null)

    // Optimistic UI
    setMessages(prev => [...prev, { role: 'user', content }])

    try {
      await api.post('/api/chat/send-message', {
        chatSessionId: sessionId,
        content
      })
    } catch (err: unknown) {
      console.error('Send failed:', err)
      setStatusText(handleError(err))
      setIsThinking(false)

      // Remove optimistic message
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }

  /* ------------------------------- INPUT -------------------------------- */

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = textareaRef.current
    if (!el) return

    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
    setMessage(e.currentTarget.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Handle Enter key in title input
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCreateChatSession()
    }
  }

  /* ------------------------------- RENDER ------------------------------- */

  // Ensure `messages` conforms to the expected type
  const formatMessages = (messages: ChatMessage[]): ChatMessage[] => {
    return messages.map((msg) => {
      if (msg.role === 'assistant' && msg.content === 'Thinking…') {
        return { ...msg, role: 'assistant' as Role }
      }
      if (msg.role === 'user' || msg.role === 'assistant') {
        return msg
      }
      throw new Error('Invalid message role')
    })
  }

  const formattedMessages = useMemo(() => {
    const appendedMessages = isThinking
      ? [{ role: 'assistant', content: 'Thinking…' } as ChatMessage]
      : []

    return formatMessages([...messages, ...appendedMessages])
  }, [messages, isThinking])

  return (
    <main className="relative">
      {/* Title Popup Modal */}
      {showTitlePopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">New Chat</h2>
              <button
                onClick={() => setShowTitlePopup(false)}
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
                value={chatTitle}
                onChange={(e) => {
                  setChatTitle(e.target.value)
                  if (titleError) setTitleError('')
                }}
                onKeyDown={handleTitleKeyDown}
                placeholder="Enter a title for your chat..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                disabled={creatingSession}
                autoFocus
              />
              {titleError && (
                <p className="mt-2 text-sm text-red-600">{titleError}</p>
              )}
              <p className="mt-2 text-sm text-gray-500">
                Give your chat a descriptive title (e.g., "Frontend Developer Career Path")
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setShowTitlePopup(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                disabled={creatingSession}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChatSession}
                disabled={creatingSession || !chatTitle.trim()}
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

      <header className="flex justify-between items-center p-4 sticky top-0 z-10">
        <button
          type="button"
          className="newChatBtn px-4 py-2"
          onClick={handleNewChat}
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
        <div className="chatTitle">Hi, Siddhesh</div>
        <button className="expBtn px-4 py-2 hidden md:flex">
          Contact Expert
        </button>
      </header>

      <div className="h-[70vh] center flex-col chatBody mt-4">
        {!hasStarted ? (
          <ChatBody onQuickMessage={setMessage} />
        ) : (
          <ChatMessages
            messages={formattedMessages}
            loading={isThinking}
          />
        )}
      </div>

      <div className="searchSection flex flex-col pt-4 gap-4">
        <div className="searchBar flex p-4 relative w-[90%] lg:w-[60%]">
          <textarea
            ref={textareaRef}
            value={message}
            placeholder="Let's shape your career path together…"
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
            className="chat-input"
            disabled={isThinking || sending}
            style={{ height: '40px', overflow: 'hidden' }}
          />

          <button
            className="p-2"
            onClick={sendMessage}
            disabled={isThinking || sending || !message.trim()}
          >
            {sending ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <ArrowUp />
            )}
          </button>
        </div>

        {statusText && (
          <p className="text-xs text-center text-red-500 px-4">
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