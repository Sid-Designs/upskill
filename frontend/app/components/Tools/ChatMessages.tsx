import React, { useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'

type Message = {
    role: 'user' | 'assistant'
    content: string
}

type Props = {
    messages: ReadonlyArray<Message>
    loading: boolean
    bottomOffset?: number
}

// Helper function to parse and format text with markdown-style bold (**text**)
const formatMessageContent = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = []
    const regex = /\*\*([^*]+)\*\*/g
    let lastIndex = 0
    let match
    let key = 0

    while ((match = regex.exec(text)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
            parts.push(
                <span key={key++}>
                    {text.substring(lastIndex, match.index)}
                </span>
            )
        }
        
        // Add bold text
        parts.push(
            <strong key={key++} className="font-semibold">
                {match[1]}
            </strong>
        )
        
        lastIndex = match.index + match[0].length
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
        parts.push(
            <span key={key++}>
                {text.substring(lastIndex)}
            </span>
        )
    }
    
    return parts.length > 0 ? parts : text
}

const ChatMessages: React.FC<Props> = ({ messages, loading, bottomOffset }) => {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
    const bottomRef = useRef<HTMLDivElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map())

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

    // GSAP animations for new messages
    useEffect(() => {
        const lastIndex = messages.length - 1
        const messageElement = messageRefs.current.get(lastIndex)
        
        if (messageElement && messages[lastIndex]) {
            // Only animate if the message is from assistant (AI responses)
            if (messages[lastIndex].role === 'assistant') {
                // Reset initial state for animation
                gsap.set(messageElement, {
                    opacity: 0,
                    y: 10,
                    scale: 0.98
                })
                
                // Animate in
                gsap.to(messageElement, {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.3,
                    ease: "power2.out",
                    delay: 0.1
                })
                
                // Character-by-character reveal for text
                const textElements = messageElement.querySelectorAll('span, strong')
                textElements.forEach((el, i) => {
                    gsap.fromTo(el,
                        {
                            opacity: 0,
                            y: 5
                        },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 0.2,
                            delay: 0.15 + (i * 0.03),
                            ease: "power2.out"
                        }
                    )
                })
            } else {
                // User messages - subtle animation
                gsap.fromTo(messageElement,
                    {
                        opacity: 0,
                        x: -10
                    },
                    {
                        opacity: 1,
                        x: 0,
                        duration: 0.25,
                        ease: "power2.out"
                    }
                )
            }
        }
    }, [messages])

    // Auto-scroll to bottom
    useEffect(() => {
        if (bottomRef.current) {
            // Smooth scroll for new messages
            gsap.to(containerRef.current, {
                scrollTop: containerRef.current?.scrollHeight || 0,
                duration: 0.4,
                ease: "power2.out"
            })
        }
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
                            I couldn't generate a response. Please try again.
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