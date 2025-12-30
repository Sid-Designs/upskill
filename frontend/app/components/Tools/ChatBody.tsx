import React, { useState } from 'react'
import { gsap } from '@/lib/gsap'

// ============================================
// TYPE DEFINITIONS
// ============================================
type ChatBodyProps = {
    onQuickMessage: (msg: string) => void
}

const ChatBody: React.FC<ChatBodyProps> = ({ onQuickMessage }) => {
    // ============================================
    // STATE - Track which quick button was clicked
    // ============================================
    const [activeIndex, setActiveIndex] = useState<number | null>(null)

    // ============================================
    // QUICK MESSAGES - Predefined questions
    // TODO: Customize these based on your use case
    // ============================================
    const quickMessages = [
        'How to improve my resume?',
        'Career options for software developers',
        'Interview preparation tips',
        'Skills for future job market'
    ]

    // ============================================
    // HANDLER - Quick message button click
    // Triggers animation and sends message to parent
    // ============================================
    const handleQuickClick = (msg: string, index: number) => {
        // Pass message to parent component
        onQuickMessage(msg)
        
        // Set active state for visual feedback
        setActiveIndex(index)

        // Animate the input field (GSAP animation)
        gsap.fromTo(
            '.chat-input',
            { scale: 0.98 },
            { scale: 1, duration: 0.2 }
        )
    }

    // ============================================
    // RENDER - Landing screen with quick actions
    // ============================================
    return (
        <>
            {/* Main Heading with Logo */}
            <div className="flex-col md:flex-row center gap-4 text-5xl lg:text-6xl font-bold text-[#222] text-center">
                Ready To&nbsp;
                <img
                    src="/images/UpSkillLogo.png"
                    alt="UpSkill"
                    className="w-[150px] md:w-[140px] lg:w-[180px]"
                />
                &nbsp;Your Career
            </div>

            {/* Quick Action Buttons */}
            <div className="quickBtn center py-12 gap-4 hidden md:flex">
                {quickMessages.map((msg, index) => (
                    <button
                        key={msg}
                        onClick={() => handleQuickClick(msg, index)}
                        className={activeIndex === index ? 'activeQuickBtn' : ''}
                    >
                        {msg}
                    </button>
                ))}
            </div>
        </>
    )
}

export default ChatBody