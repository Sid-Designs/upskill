import React, { useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Sparkles, Brain, Lightbulb, MessageSquare } from 'lucide-react'

type Message = {
    role: 'user' | 'assistant'
    content: string
}

type Props = {
    messages: ReadonlyArray<Message>
    loading: boolean
    thinkingPhase?: number
    bottomOffset?: number
}

// Thinking phase messages for user engagement
const thinkingMessages = [
    { text: 'Processing your request...', icon: Sparkles },
    { text: 'Analyzing your question...', icon: Brain },
    { text: 'Generating personalized advice...', icon: Lightbulb },
    { text: 'Almost there! Crafting your response...', icon: MessageSquare },
]

// Helper function to parse and format text with markdown styling
const formatMessageContent = (text: string): React.ReactNode => {
    // Split by lines to handle block-level elements
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    let key = 0
    let inCodeBlock = false
    let codeBlockContent: string[] = []
    let codeBlockLang = ''

    const formatInlineText = (line: string): React.ReactNode => {
        const parts: React.ReactNode[] = []
        // Handle bold (**text**), italic (*text*), and inline code (`code`)
        const regex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)/g
        let lastIndex = 0
        let match
        let partKey = 0

        while ((match = regex.exec(line)) !== null) {
            // Add text before the match
            if (match.index > lastIndex) {
                parts.push(<span key={partKey++}>{line.substring(lastIndex, match.index)}</span>)
            }

            if (match[1]) {
                // Bold text **text**
                parts.push(<strong key={partKey++} className="font-semibold">{match[2]}</strong>)
            } else if (match[3]) {
                // Italic text *text*
                parts.push(<em key={partKey++} className="italic">{match[4]}</em>)
            } else if (match[5]) {
                // Inline code `code`
                parts.push(
                    <code key={partKey++} className="bg-black/10 px-1.5 py-0.5 rounded text-xs font-mono">
                        {match[6]}
                    </code>
                )
            }

            lastIndex = match.index + match[0].length
        }

        // Add remaining text
        if (lastIndex < line.length) {
            parts.push(<span key={partKey++}>{line.substring(lastIndex)}</span>)
        }

        return parts.length > 0 ? parts : line
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        // Handle code blocks ```
        if (line.startsWith('```')) {
            if (!inCodeBlock) {
                inCodeBlock = true
                codeBlockLang = line.slice(3).trim()
                codeBlockContent = []
            } else {
                // End of code block
                elements.push(
                    <div key={key++} className="my-2 rounded-lg overflow-hidden">
                        {codeBlockLang && (
                            <div className="bg-black/20 px-3 py-1 text-xs font-mono opacity-70">
                                {codeBlockLang}
                            </div>
                        )}
                        <pre className="bg-black/10 p-3 overflow-x-auto text-xs font-mono leading-relaxed">
                            <code>{codeBlockContent.join('\n')}</code>
                        </pre>
                    </div>
                )
                inCodeBlock = false
                codeBlockContent = []
                codeBlockLang = ''
            }
            continue
        }

        if (inCodeBlock) {
            codeBlockContent.push(line)
            continue
        }

        // Handle headings
        if (line.startsWith('### ')) {
            elements.push(
                <h3 key={key++} className="text-base font-bold mt-3 mb-1 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                    {formatInlineText(line.slice(4))}
                </h3>
            )
        } else if (line.startsWith('## ')) {
            elements.push(
                <h2 key={key++} className="text-lg font-bold mt-4 mb-2">
                    {formatInlineText(line.slice(3))}
                </h2>
            )
        } else if (line.startsWith('# ')) {
            elements.push(
                <h1 key={key++} className="text-xl font-bold mt-4 mb-2">
                    {formatInlineText(line.slice(2))}
                </h1>
            )
        }
        // Handle bullet points (-, *, •)
        else if (/^[\-\*•]\s/.test(line)) {
            elements.push(
                <div key={key++} className="flex items-start gap-2 ml-2 my-0.5">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-current opacity-50 shrink-0" />
                    <span>{formatInlineText(line.slice(2))}</span>
                </div>
            )
        }
        // Handle numbered lists (1. 2. etc)
        else if (/^\d+\.\s/.test(line)) {
            const num = line.match(/^(\d+)\./)?.[1]
            const content = line.replace(/^\d+\.\s/, '')
            elements.push(
                <div key={key++} className="flex items-start gap-2 ml-2 my-0.5">
                    <span className="font-semibold opacity-70 shrink-0 min-w-[1.25rem]">{num}.</span>
                    <span>{formatInlineText(content)}</span>
                </div>
            )
        }
        // Handle horizontal rule (---)
        else if (line.trim() === '---' || line.trim() === '***') {
            elements.push(<hr key={key++} className="my-3 border-current opacity-20" />)
        }
        // Handle blockquotes (>)
        else if (line.startsWith('> ')) {
            elements.push(
                <blockquote key={key++} className="border-l-2 border-current/30 pl-3 ml-1 my-2 italic opacity-90">
                    {formatInlineText(line.slice(2))}
                </blockquote>
            )
        }
        // Empty line
        else if (line.trim() === '') {
            elements.push(<div key={key++} className="h-2" />)
        }
        // Regular paragraph
        else {
            elements.push(<p key={key++} className="my-0.5">{formatInlineText(line)}</p>)
        }
    }

    return elements.length > 0 ? <div className="space-y-0.5">{elements}</div> : text
}

const ChatMessages: React.FC<Props> = ({ messages, loading, thinkingPhase = 0, bottomOffset }) => {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
    const bottomRef = useRef<HTMLDivElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
    const thinkingRef = useRef<HTMLDivElement | null>(null)
    
    // Track display phase with smooth transitions
    const [displayPhase, setDisplayPhase] = useState(0)

    const lastMessage = messages[messages.length - 1]

    const showAiError = useMemo(() => (
        !loading && messages.length > 0 && lastMessage?.role === 'user'
    ), [loading, messages, lastMessage])

    const copyToClipboard = async (text: string, index: number) => {
        try {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                await navigator.clipboard.writeText(text)
            } else {
                const textarea = document.createElement('textarea')
                textarea.value = text
                textarea.style.position = 'fixed'
                textarea.style.left = '-9999px'
                document.body.appendChild(textarea)
                textarea.focus()
                textarea.select()
                document.execCommand('copy')
                document.body.removeChild(textarea)
            }
            setCopiedIndex(index)
            window.setTimeout(() => setCopiedIndex(null), 1500)
        } catch {
            // Silently ignore copy errors to avoid UI noise
        }
    }

    // Track if this is initial load vs new AI response
    const prevLoadingRef = useRef(false)
    const isInitialLoadRef = useRef(true)
    const prevMessageCountRef = useRef(0)
    
    // Scroll to bottom on initial load / refresh / opening existing chat
    useEffect(() => {
        if (isInitialLoadRef.current && messages.length > 0 && containerRef.current) {
            // Initial load - scroll to bottom immediately
            gsap.to(containerRef.current, {
                scrollTop: containerRef.current.scrollHeight,
                duration: 0.3,
                ease: "power2.out"
            })
            isInitialLoadRef.current = false
            prevMessageCountRef.current = messages.length
        }
    }, [messages])
    
    // Auto-scroll behavior for AI responses
    useEffect(() => {
        if (!containerRef.current) return
        
        // While AI is generating - scroll to bottom to show thinking indicator
        if (loading) {
            gsap.to(containerRef.current, {
                scrollTop: containerRef.current.scrollHeight,
                duration: 0.4,
                ease: "power2.out"
            })
        }
        
        // When AI finishes responding (new message added), scroll to show the AI message from top
        const hasNewMessage = messages.length > prevMessageCountRef.current
        if (prevLoadingRef.current && !loading && hasNewMessage) {
            // Find the last assistant message
            const assistantMessages = containerRef.current.querySelectorAll('[data-role="assistant"]')
            const lastAssistantMessage = assistantMessages[assistantMessages.length - 1] as HTMLElement
            
            if (lastAssistantMessage) {
                // Scroll to show the message from the top with some padding
                const containerTop = containerRef.current.getBoundingClientRect().top
                const messageTop = lastAssistantMessage.getBoundingClientRect().top
                const currentScroll = containerRef.current.scrollTop
                const targetScroll = currentScroll + (messageTop - containerTop) - 20 // 20px padding from top
                
                gsap.to(containerRef.current, {
                    scrollTop: Math.max(0, targetScroll),
                    duration: 0.5,
                    ease: "power2.out"
                })
            }
        }
        
        prevLoadingRef.current = loading
        prevMessageCountRef.current = messages.length
    }, [messages, loading])

    // Animation for typing indicator
    useEffect(() => {
        if (loading) {
            const dots = document.querySelectorAll('.typing-dot')
            if (dots.length > 0) {
                gsap.to(dots, {
                    opacity: 0.3,
                    y: -3,
                    duration: 0.6,
                    repeat: -1,
                    yoyo: true,
                    stagger: 0.2,
                    ease: "power1.inOut"
                })
            }
        }
    }, [loading])

    // Smooth thinking phase transitions
    const [isTransitioning, setIsTransitioning] = useState(false)
    const prevThinkingPhaseRef = useRef(0)
    const prevLoadingStateRef = useRef(false)
    
    // Smooth thinking phase transitions using timeouts for delayed updates
    useEffect(() => {
        // Reset when loading stops
        if (!loading && prevLoadingStateRef.current) {
            const resetTimer = setTimeout(() => {
                setDisplayPhase(0)
                setIsTransitioning(false)
            }, 100)
            prevLoadingStateRef.current = loading
            prevThinkingPhaseRef.current = 0
            return () => clearTimeout(resetTimer)
        }
        
        // Phase changed while loading - smooth transition
        if (loading && thinkingPhase > 0 && thinkingPhase !== prevThinkingPhaseRef.current) {
            // Start fade out
            setIsTransitioning(true)
            
            // After fade out, update display and fade in
            const timer = setTimeout(() => {
                setDisplayPhase(thinkingPhase)
                setIsTransitioning(false)
            }, 200) // Match CSS transition duration
            
            prevThinkingPhaseRef.current = thinkingPhase
            prevLoadingStateRef.current = loading
            return () => clearTimeout(timer)
        }
        
        prevLoadingStateRef.current = loading
    }, [thinkingPhase, loading])

    return (
        <div className="flex w-full flex-col gap-6 px-4 py-6 pb-0">
            <div
                className="w-full relative chat-scroll"
                style={{
                    margin: '0 auto',
                    minWidth: 'min(24rem, 100%)',
                    maxWidth: 'min(64rem, 100%)',
                    maxHeight: `calc(80vh - ${(bottomOffset ?? 18)}px - env(safe-area-inset-bottom))`,
                    paddingTop: '0.5rem',
                    paddingBottom: `calc(${(bottomOffset ?? 96)}px + env(safe-area-inset-bottom))`,
                    overflowY: 'auto',
                    overscrollBehavior: 'contain',
                    scrollBehavior: 'smooth',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    borderRadius: '14px',
                }}
                ref={containerRef}
                role="log"
                aria-live="polite"
                aria-relevant="additions"
                aria-busy={loading}
            >
                <style>{`
                    .chat-scroll::-webkit-scrollbar{display:none;}
                    @keyframes gentlePulse {
                        0%, 100% { opacity: 0.7; }
                        50% { opacity: 1; }
                    }
                    @keyframes thinkingSlideIn {
                        from { opacity: 0; transform: translateY(10px) scale(0.95); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    @keyframes thinkingSlideOut {
                        from { opacity: 1; transform: translateY(0) scale(1); }
                        to { opacity: 0; transform: translateY(-10px) scale(0.95); }
                    }
                    .thinking-text-enter {
                        animation: thinkingSlideIn 0.25s ease-out forwards;
                    }
                    .thinking-text-exit {
                        animation: thinkingSlideOut 0.2s ease-in forwards;
                    }
                `}</style>

                {/* Empty State */}
                {messages.length === 0 && !loading && (
                    <div className="text-center text-sm text-gray-400 py-12 animate-pulse">
                        Ask anything to start the conversation.
                    </div>
                )}

                {/* Messages */}
                <ul className="flex flex-col gap-6">
                    {messages.map((msg, index) => {
                        const isUser = msg.role === 'user'
                        const itemAlignment = isUser ? 'self-end items-end' : 'self-start items-start'
                        const bubbleColors = isUser
                            ? 'border text-black'
                            : 'bg-[var(--color-primary)] text-white'

                        return (
                            <li
                                key={`${msg.role}-${index}`}
                                data-role={msg.role}
                                className={`flex flex-col gap-2 w-full ${itemAlignment}`}
                            >
                                <span 
                                    className="text-xs text-gray-400"
                                    style={{
                                        animation: 'gentlePulse 2s ease-in-out'
                                    }}
                                >
                                    {isUser ? 'You' : 'AI Assistant'}
                                </span>
                                <div
                                    ref={(el) => {
                                        if (el) messageRefs.current.set(index, el)
                                        else messageRefs.current.delete(index)
                                    }}
                                    className={`group relative px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-md ${bubbleColors}`}
                                    style={{
                                        width: 'fit-content',
                                        maxWidth: 'min(56rem, 70%)',
                                        overflowWrap: 'anywhere',
                                        willChange: 'transform, opacity',
                                        transformOrigin: isUser ? 'bottom right' : 'bottom left',
                                    }}
                                >
                                    <div className="message-content">
                                        {formatMessageContent(msg.content)}
                                    </div>

                                    {/* Action bar */}
                                    <div
                                        className={`absolute top-2 ${isUser ? 'left-2' : 'right-2'} flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
                                    >
                                        {!isUser && (
                                            <button
                                                type="button"
                                                title={copiedIndex === index ? 'Copied' : 'Copy message'}
                                                aria-label={copiedIndex === index ? 'Copied' : 'Copy message'}
                                                onClick={() => copyToClipboard(msg.content, index)}
                                                className="rounded-md border border-gray-200 bg-white/80 backdrop-blur px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 shadow transition-all duration-200 hover:scale-105"
                                                style={{
                                                    animation: copiedIndex === index 
                                                        ? 'gentlePulse 0.5s ease-in-out 2' 
                                                        : 'none'
                                                }}
                                            >
                                                {copiedIndex === index ? '✓ Copied' : 'Copy'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </li>
                        )
                    })}
                </ul>

                {/* AI Thinking Indicator with smooth transitions */}
                {loading && (
                    <div 
                        ref={thinkingRef}
                        className="flex flex-col gap-2 w-fit max-w-[85%] mr-auto mt-4 transition-all duration-300"
                        role="status"
                        aria-live="polite"
                        style={{
                            animation: 'thinkingSlideIn 0.3s ease-out forwards'
                        }}
                    >
                        <span className="text-xs text-gray-400">AI Assistant</span>
                        <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary)]/80 text-white px-5 py-4 rounded-2xl shadow-lg">
                            <div className="flex items-center gap-3">
                                {/* Animated Icon with smooth transition */}
                                <div className="relative">
                                    <div 
                                        className={`h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center transition-all duration-300 ${isTransitioning ? 'scale-90 opacity-60' : 'scale-100 opacity-100'}`}
                                    >
                                        {displayPhase >= 1 && displayPhase <= 4 ? (
                                            (() => {
                                                const IconComponent = thinkingMessages[displayPhase - 1]?.icon || Sparkles
                                                return <IconComponent className="h-4 w-4 text-white" style={{ animation: 'gentlePulse 1.5s ease-in-out infinite' }} />
                                            })()
                                        ) : (
                                            <Sparkles className="h-4 w-4 text-white" style={{ animation: 'gentlePulse 1.5s ease-in-out infinite' }} />
                                        )}
                                    </div>
                                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full animate-ping" />
                                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full" />
                                </div>
                                
                                {/* Thinking Message with smooth fade transition */}
                                <div className="flex-1 overflow-hidden">
                                    <p 
                                        className={`text-sm font-medium transition-all duration-200 ${isTransitioning ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}
                                    >
                                        {displayPhase >= 1 && displayPhase <= 4 
                                            ? thinkingMessages[displayPhase - 1]?.text 
                                            : 'Processing your request...'}
                                    </p>
                                    
                                    {/* Progress dots with smooth transitions */}
                                    <div className="flex items-center gap-1 mt-2">
                                        {[1, 2, 3, 4].map((step) => (
                                            <div
                                                key={step}
                                                className="h-1.5 rounded-full transition-all duration-500 ease-out"
                                                style={{
                                                    width: step <= displayPhase ? '24px' : '6px',
                                                    backgroundColor: step <= displayPhase ? 'white' : 'rgba(255,255,255,0.3)',
                                                    transform: step === displayPhase && !isTransitioning ? 'scaleY(1.2)' : 'scaleY(1)'
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Typing animation */}
                            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/20">
                                <span className="typing-dot h-2 w-2 bg-white/70 rounded-full" />
                                <span className="typing-dot h-2 w-2 bg-white/70 rounded-full" />
                                <span className="typing-dot h-2 w-2 bg-white/70 rounded-full" />
                                <span className="text-xs text-white/70 ml-2">Typing response...</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* AI Error Response with animation */}
                {showAiError && (
                    <div 
                        className="flex flex-col gap-1 w-fit max-w-[80%] mr-auto" 
                        role="alert"
                        ref={(el) => {
                            if (el) {
                                gsap.fromTo(el,
                                    { opacity: 0, scale: 0.9 },
                                    { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(1.7)" }
                                )
                            }
                        }}
                    >
                        <span className="text-xs text-gray-400">AI Assistant</span>
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                            I couldn&apos;t generate a response. Please try again.
                        </div>
                    </div>
                )}

                {/* Bottom sentinel for auto-scroll and arrow visibility */}
                <div ref={bottomRef} aria-hidden />

                {/* Spacer to ensure last messages are not covered by an external footer/input */}
                <div aria-hidden style={{ height: `${(bottomOffset ?? 96)}px` }} />
            </div>
        </div>
    )
}

export default React.memo(ChatMessages)