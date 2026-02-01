import React, { useCallback, useRef } from 'react'
import { gsap, useGSAP } from '@/lib/gsap'
import { Sparkles, MessageSquare, FileText, TrendingUp, Lightbulb } from 'lucide-react'

// ============================================
// TYPE DEFINITIONS
// ============================================
type ChatBodyProps = {
    onQuickMessage: (msg: string) => void
}

// ============================================
// QUICK MESSAGES CONFIG
// ============================================
const quickMessages = [
    {
        text: 'How to improve my resume?',
        icon: FileText,
        color: 'bg-indigo-500',
        lightColor: 'bg-indigo-50',
        textColor: 'text-indigo-600'
    },
    {
        text: 'Career options for software developers',
        icon: TrendingUp,
        color: 'bg-amber-500',
        lightColor: 'bg-amber-50',
        textColor: 'text-amber-600'
    },
    {
        text: 'Interview preparation tips',
        icon: MessageSquare,
        color: 'bg-emerald-500',
        lightColor: 'bg-emerald-50',
        textColor: 'text-emerald-600'
    },
    {
        text: 'Skills for future job market',
        icon: Lightbulb,
        color: 'bg-rose-500',
        lightColor: 'bg-rose-50',
        textColor: 'text-rose-600'
    }
]

const ChatBody: React.FC<ChatBodyProps> = ({ onQuickMessage }) => {
    const containerRef = useRef<HTMLDivElement>(null)

    // ============================================
    // GSAP FADE ANIMATIONS
    // ============================================
    useGSAP(() => {
        if (!containerRef.current) return

        const ctx = gsap.context(() => {
            gsap.fromTo(".chat-hero-title",
                { opacity: 0 },
                { opacity: 1, duration: 0.25 }
            )
            gsap.fromTo(".chat-hero-subtitle",
                { opacity: 0 },
                { opacity: 1, duration: 0.25, delay: 0.05 }
            )
            gsap.fromTo(".quick-action-btn",
                { opacity: 0 },
                { opacity: 1, duration: 0.25, stagger: 0.04, delay: 0.1 }
            )
        }, containerRef)

        return () => ctx.revert()
    }, { scope: containerRef })

    // ============================================
    // HANDLER - Quick message button click
    // ============================================
    const handleQuickClick = useCallback((msg: string, buttonEl: HTMLButtonElement | null) => {
        if (!buttonEl) return

        // Animate button press
        gsap.to(buttonEl, {
            scale: 0.95,
            duration: 0.1,
            onComplete: () => {
                gsap.to(buttonEl, { scale: 1, duration: 0.1 })
            }
        })

        // Animate the input field
        gsap.fromTo(
            '.chat-input',
            { scale: 0.98 },
            { scale: 1, duration: 0.15 }
        )

        // Pass message to parent component
        onQuickMessage(msg)
    }, [onQuickMessage])

    // ============================================
    // RENDER
    // ============================================
    return (
        <div ref={containerRef} className="flex flex-col items-center justify-center h-full px-4 py-8">
            {/* Hero Section */}
            <div className="text-center mb-10">
                <div className="chat-hero-title flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900">
                        Ready To
                    </h1>
                    <img
                        src="/images/UpSkillLogo.png"
                        alt="UpSkill"
                        className="h-12 md:h-14 lg:h-16 object-contain"
                    />
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900">
                        Your Career
                    </h1>
                </div>
                <p className="chat-hero-subtitle text-gray-500 text-sm md:text-base max-w-md mx-auto">
                    Ask me anything about your career journey. I'm here to help!
                </p>
            </div>

            {/* Quick Actions */}
            <div className="w-full max-w-2xl">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
                    <span className="text-sm font-medium text-gray-600">Quick suggestions</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {quickMessages.map((item, index) => {
                        const Icon = item.icon
                        return (
                            <button
                                key={index}
                                onClick={(e) => handleQuickClick(item.text, e.currentTarget)}
                                className="quick-action-btn group flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all duration-200 text-left"
                            >
                                <div className={`flex-shrink-0 h-10 w-10 rounded-lg ${item.lightColor} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                                    <Icon className={`h-5 w-5 ${item.textColor}`} />
                                </div>
                                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                                    {item.text}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default ChatBody