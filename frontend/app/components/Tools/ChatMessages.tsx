import React, { useEffect, useRef } from 'react'

type Message = {
    role: 'user' | 'assistant'
    content: string
}

type Props = {
    messages: Message[]
    loading: boolean
}

const ChatMessages: React.FC<Props> = ({ messages, loading }) => {
    const bottomRef = useRef<HTMLDivElement | null>(null)

    const lastMessage = messages[messages.length - 1]

    const showAiError =
        !loading &&
        messages.length > 0 &&
        lastMessage?.role === 'user'

    return (
        <div className="flex w-full max-w-[75%] flex-col gap-5 px-4 py-6 overflow-y-auto">

            {/* Empty State */}
            {messages.length === 0 && !loading && (
                <div className="text-center text-sm text-gray-400 py-12">
                    Ask anything to start the conversation.
                </div>
            )}

            {/* Messages */}
            {messages.map((msg, index) => {
                const isUser = msg.role === 'user'

                return (
                    <div
                        key={index}
                        className={`flex flex-col gap-1 max-w-[80%] ${
                            isUser ? 'ml-auto items-end' : 'mr-auto items-start'
                        }`}
                    >
                        {/* Label */}
                        <span className="text-xs text-gray-400">
                            {isUser ? 'You' : 'AI Assistant'}
                        </span>

                        {/* Bubble */}
                        <div
                            className={`px-4 py-3 rounded-xl text-sm leading-relaxed break-words
                                ${isUser
                                    ? 'bg-black text-white'
                                    : 'bg-gray-100 text-black'
                                }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                )
            })}

            {/* AI Thinking */}
            {loading && (
                <div className="flex flex-col gap-1 max-w-[80%] mr-auto">
                    <span className="text-xs text-gray-400">AI Assistant</span>
                    <div className="bg-gray-100 px-4 py-3 rounded-xl text-sm text-gray-600 animate-pulse">
                        Thinking…
                    </div>
                </div>
            )}

            {/* AI Error Response */}
            {showAiError && (
                <div className="flex flex-col gap-1 max-w-[80%] mr-auto">
                    <span className="text-xs text-gray-400">AI Assistant</span>
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                        I couldn’t generate a response. Please try again.
                    </div>
                </div>
            )}

            <div ref={bottomRef} />
        </div>
    )
}

export default ChatMessages
