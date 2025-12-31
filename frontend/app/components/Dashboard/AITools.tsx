"use client";

import { aiTools } from "@/app/constants";
import api from "@/lib/api";
import {
  ArrowUpRight,
  Clock,
  FileText,
  Loader2,
  Lock,
  MapPin,
  Paintbrush,
  Sparkles,
  Target,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const routeMap: Record<string, string> = {
  chatBot: "chatbot",
  coverLetter: "cover-letter",
  roadmap: "roadmap",
};

const toolIcons: Record<string, React.ReactNode> = {
  chatBot: <Zap className="h-5 w-5 text-slate-700" />,
  coverLetter: <FileText className="h-5 w-5 text-slate-700" />,
  roadmap: <MapPin className="h-5 w-5 text-slate-700" />,
};

const tags: Record<string, { text: string; color: string }[]> = {
  chatBot: [
    { text: "Career chat", color: "bg-slate-50 text-slate-700 border-slate-200" },
    { text: "Real-time", color: "bg-slate-50 text-slate-700 border-slate-200" },
    { text: "Actionable", color: "bg-slate-50 text-slate-700 border-slate-200" },
  ],
  coverLetter: [
    { text: "ATS-friendly", color: "bg-slate-50 text-slate-700 border-slate-200" },
    { text: "Role-tuned", color: "bg-slate-50 text-slate-700 border-slate-200" },
    { text: "Tone control", color: "bg-slate-50 text-slate-700 border-slate-200" },
  ],
  roadmap: [
    { text: "Milestones", color: "bg-slate-50 text-slate-700 border-slate-200" },
    { text: "Skills-first", color: "bg-slate-50 text-slate-700 border-slate-200" },
    { text: "Goal aligned", color: "bg-slate-50 text-slate-700 border-slate-200" },
  ],
};

const AITools = () => {
  const router = useRouter();
  const tools = aiTools.slice(0, 3);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [titleError, setTitleError] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const handleLaunch = (cmpName: string) => {
    if (cmpName === "chatBot") {
      setNewSessionTitle("");
      setTitleError("");
      setCreateError(null);
      setIsCreateModalOpen(true);
      return;
    }
    const route = routeMap[cmpName] ?? "dashboard";
    router.push(`/dashboard/${route}`);
  };

  const closeCreateModal = () => {
    if (creatingSession) return;
    setIsCreateModalOpen(false);
    setTitleError("");
    setCreateError(null);
  };

  const handleCreateSession = async () => {
    const title = newSessionTitle.trim();

    if (!title) {
      setTitleError("Please enter a chat title");
      return;
    }

    if (title.length > 100) {
      setTitleError("Title must be less than 100 characters");
      return;
    }

    setCreatingSession(true);
    setTitleError("");
    setCreateError(null);

    try {
      const response = await api.post("/api/chat/create-session", {
        type: "career_guidance",
        title,
      });

      const newSession = response.data?.data;
      if (!newSession?.id) {
        throw new Error("Unable to create chat session");
      }

      setIsCreateModalOpen(false);
      setNewSessionTitle("");
      router.push(`/dashboard/chatbot?sessionid=${encodeURIComponent(newSession.id)}`);
    } catch (err: any) {
      const message = err?.response?.data?.message || "Unable to start the conversation right now.";
      setCreateError(message);
    } finally {
      setCreatingSession(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleCreateSession();
    }
  };

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
        <div className="relative flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 shadow-sm text-[var(--color-primary)]">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-medium">AI Assistants</span>
                </div>
                <div className="h-px w-8 bg-gradient-to-r from-gray-300 to-transparent" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                  Your Career Co-Pilots
                </h2>
                <p className="text-sm md:text-base text-gray-600 max-w-3xl leading-relaxed">
                  Specialized tools that work together—keeping your progress consistent across every step of your journey.
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 self-start rounded-full bg-white border border-gray-300 px-3 py-1.5 shadow-sm">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-gray-700">Active & Ready</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-slate-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-slate-300 transition-all">
                <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                  <Clock className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Real-time Guidance</div>
                  <div className="text-xs text-gray-500 mt-0.5">Instant, context-aware responses</div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-slate-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-slate-300 transition-all">
                <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                  <Target className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Personalized</div>
                  <div className="text-xs text-gray-500 mt-0.5">Tailored to your goals</div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-slate-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-slate-300 transition-all">
                <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                  <Lock className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Private & Secure</div>
                  <div className="text-xs text-gray-500 mt-0.5">Your data stays with you</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {tools.map((tool, idx) => (
          <div
            key={`${tool.tool}-${idx}`}
            className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-5 flex flex-col gap-4 hover:shadow-[0_12px_32px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 min-h-[260px]"
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center">
                  {toolIcons[tool.cmpName] || <Paintbrush className="h-4 w-4 text-gray-600" />}
                </div>
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-lg font-bold text-gray-900 tracking-tight">{tool.tool}</div>
                  <span className="text-[11px] font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1">
                    Assistant
                  </span>
                </div>
                <div className="text-sm text-gray-600 leading-relaxed line-clamp-3" title={tool.description}>
                  {tool.description}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(tags[tool.cmpName] ?? []).map((tag, tagIdx) => (
                <span
                  key={tagIdx}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${tag.color}`}
                >
                  {tag.text}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm mt-auto pt-3 border-t border-gray-100">
              <span className="text-gray-600 text-sm leading-snug">
                Seamlessly integrated with your dashboard
              </span>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] text-white px-4 py-2.5 text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all group/btn shadow-sm whitespace-nowrap"
                onClick={() => handleLaunch(tool.cmpName)}
                disabled={creatingSession && tool.cmpName === "chatBot"}
              >
                {creatingSession && tool.cmpName === "chatBot" ? "Creating..." : tool.btnText}
                <ArrowUpRight className="h-4 w-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center pt-4">
        <p className="text-xs text-gray-500 inline-flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-gray-400" />
          All assistants sync with your profile and progress
          <span className="h-1 w-1 rounded-full bg-gray-400" />
        </p>
      </div>

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <div className="text-sm font-medium text-gray-500">New chat</div>
                <div className="text-lg font-semibold text-gray-900">Name your conversation</div>
              </div>
              <button
                onClick={closeCreateModal}
                className="text-gray-500 hover:text-gray-800 transition"
                disabled={creatingSession}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3 flex flex-col">
              <label className="text-sm font-medium text-gray-700" htmlFor="chat-title">
                Chat title
              </label>
              <input
                id="chat-title"
                type="text"
                value={newSessionTitle}
                onChange={(e) => {
                  setNewSessionTitle(e.target.value);
                  if (titleError) setTitleError("");
                  if (createError) setCreateError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Frontend career next steps"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/30 outline-none"
                disabled={creatingSession}
                autoFocus
              />
              {titleError ? <p className="text-xs text-red-600">{titleError}</p> : null}
              {createError ? <p className="text-xs text-red-600">{createError}</p> : null}
              <p className="text-xs text-gray-500">Keep it concise so you can find it later.</p>
            </div>
            <div className="flex items-center justify-end gap-3 border-t px-5 py-4">
              <button
                onClick={closeCreateModal}
                className="text-sm text-gray-700 hover:text-gray-900 transition"
                disabled={creatingSession}
              >
                Cancel
              </button>
              <button
                onClick={() => void handleCreateSession()}
                disabled={creatingSession || !newSessionTitle.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {creatingSession ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {creatingSession ? "Creating..." : "Create chat"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AITools;