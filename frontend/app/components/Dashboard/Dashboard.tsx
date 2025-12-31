"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { aiTools } from "@/app/constants";
import api from "@/lib/api";
import { MessageSquare, Mail, FileText, RefreshCw, TrendingUp, PieChart, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type DashboardProps = {
  onChangeComponent: (componentName: string) => void;
};

type StatCardProps = {
  label: string;
  value: number;
  icon: ReactNode;
  color: string;
  loading?: boolean;
};

const Dashboard = ({ onChangeComponent }: DashboardProps) => {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("User");
  const [stats, setStats] = useState({
    sessions: 0,
    messages: 0,
    coverLetters: 0,
    loading: false,
    error: ""
  });
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [titleError, setTitleError] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const normalizeList = (value: any): any[] => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.items)) return value.items;
    if (Array.isArray(value?.sessions)) return value.sessions;
    if (Array.isArray(value?.messages)) return value.messages;
    if (Array.isArray(value?.coverLetters)) return value.coverLetters;
    return [];
  };

  useEffect(() => {
    let active = true;

    const fetchUser = async () => {
      try {
        const response = await api.get("/api/profile/get");
        const data = response.data || {};
        const name = (data.username || "").trim();
        if (active) {
          setDisplayName(name || "User");
        }
      } catch {
        /* ignore failures and keep fallback */
      }
    };

    void fetchUser();
    return () => {
      active = false;
    };
  }, []);

  const fetchStats = useCallback(async () => {
    setStats(prev => ({ ...prev, loading: true, error: "" }));
    try {
      const sessionRes = await api.get("/api/chat/session");
      const sessions = normalizeList(sessionRes.data);

      let totalMessages = 0;
      if (sessions.length > 0) {
        const messageResults = await Promise.allSettled(
          sessions.map((session: any) => {
            const id = session?._id || session?.id;
            if (!id) return Promise.resolve({ data: [] });
            return api.get(`/api/chat/session/${id}/messages`);
          })
        );

        totalMessages = messageResults.reduce((acc, result) => {
          if (result.status === "fulfilled") {
            const msgs = normalizeList(result.value?.data);
            return acc + msgs.length;
          }
          return acc;
        }, 0);
      }

      const coverRes = await api.get("/api/chat/cover-letters");
      const coverLetters = normalizeList(coverRes.data);

      setStats({
        sessions: sessions.length,
        messages: totalMessages,
        coverLetters: coverLetters.length,
        loading: false,
        error: ""
      });
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      setStats(prev => ({ ...prev, loading: false, error: "Could not load activity" }));
    }
  }, []);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const hasActivity = useMemo(() => {
    return stats.sessions + stats.messages + stats.coverLetters > 0;
  }, [stats.sessions, stats.messages, stats.coverLetters]);

  const totalActivity = useMemo(() => {
    return stats.sessions + stats.messages + stats.coverLetters;
  }, [stats.sessions, stats.messages, stats.coverLetters]);

  const breakdown = useMemo(() => ([
    { label: "Sessions", value: stats.sessions, color: "bg-indigo-500" },
    { label: "Messages", value: stats.messages, color: "bg-amber-500" },
    { label: "Cover letters", value: stats.coverLetters, color: "bg-emerald-500" }
  ]), [stats.sessions, stats.messages, stats.coverLetters]);

  const statCards = useMemo(() => ([
    { 
      label: "Chat sessions", 
      value: stats.sessions, 
      icon: <MessageSquare className="h-5 w-5" />, 
      color: "text-indigo-600",
      bgColor: "bg-indigo-50"
    },
    { 
      label: "Messages", 
      value: stats.messages, 
      icon: <Mail className="h-5 w-5" />, 
      color: "text-amber-600",
      bgColor: "bg-amber-50"
    },
    { 
      label: "Cover letters", 
      value: stats.coverLetters, 
      icon: <FileText className="h-5 w-5" />, 
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    }
  ]), [stats.sessions, stats.messages, stats.coverLetters]);

  const lastUpdatedLabel = lastUpdated ? `Updated at ${lastUpdated}` : "Awaiting first refresh";

  const handleToolClick = (cmpName: string) => {
    if (cmpName === "chatBot") {
      setNewSessionTitle("");
      setTitleError("");
      setCreateError(null);
      setIsCreateModalOpen(true);
      return;
    }
    onChangeComponent(cmpName);
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
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {displayName} 👋</h1>
            <p className="text-gray-600">Here's your activity summary</p>
          </div>
          <button
            onClick={fetchStats}
            disabled={stats.loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${stats.loading ? "animate-spin" : ""}`} />
            {stats.loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Stats & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {statCards.map((card) => (
              <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className={`${card.bgColor} p-2.5 rounded-lg`}>
                    <div className={card.color}>
                      {card.icon}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.loading ? (
                        <div className="h-7 w-12 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        card.value.toLocaleString()
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{card.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Activity Overview */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Activity Overview</h2>
                <p className="text-gray-500 text-sm">Your usage breakdown</p>
              </div>
              <PieChart className="h-5 w-5 text-gray-400" />
            </div>

            {stats.error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                {stats.error}
              </div>
            )}

            {hasActivity ? (
              <>
                {/* Donut Chart */}
                <div className="flex flex-col lg:flex-row items-center gap-8 mb-8">
                  <div className="relative">
                    <div className="h-48 w-48 rounded-full" 
                      style={{
                        background: `conic-gradient(
                          #6366f1 0deg ${(stats.sessions / totalActivity) * 360}deg,
                          #f59e0b ${(stats.sessions / totalActivity) * 360}deg ${((stats.sessions + stats.messages) / totalActivity) * 360}deg,
                          #10b981 ${((stats.sessions + stats.messages) / totalActivity) * 360}deg 360deg
                        )`
                      }}
                    >
                      <div className="absolute inset-8 bg-white rounded-full flex flex-col items-center justify-center">
                        <div className="text-2xl font-bold text-gray-900">{totalActivity}</div>
                        <div className="text-sm text-gray-500">Total</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    {breakdown.map((item) => {
                      const percentage = totalActivity === 0 ? 0 : Math.round((item.value / totalActivity) * 100);
                      return (
                        <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`h-3 w-3 rounded-full ${item.color}`}></div>
                            <span className="font-medium text-gray-800">{item.label}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">{item.value}</div>
                            <div className="text-sm text-gray-500">{percentage}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Activity Bars */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-gray-700">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-medium">Relative Activity</span>
                  </div>
                  {breakdown.map((item) => {
                    const maxValue = Math.max(stats.sessions, stats.messages, stats.coverLetters, 1);
                    const width = Math.round((item.value / maxValue) * 100);
                    return (
                      <div key={item.label} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.label}</span>
                          <span className="font-medium text-gray-900">{item.value}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${item.color} transition-all duration-500`}
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">No activity yet</div>
                <p className="text-gray-500 text-sm">Start a chat or generate a cover letter to see insights here.</p>
              </div>
            )}

            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className={`h-2 w-2 rounded-full ${stats.loading ? "bg-blue-400 animate-pulse" : "bg-gray-300"}`}></div>
                <span>{stats.loading ? "Updating..." : lastUpdatedLabel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Tools */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Featured Tools</h2>
              <p className="text-gray-500 text-sm">Pick a flow to continue</p>
            </div>
            
            <div className="space-y-3">
              {aiTools.slice(0, -1).map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleToolClick(item.cmpName)}
                  className="w-full text-left p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all duration-200 bg-white"
                  disabled={creatingSession && item.cmpName === "chatBot"}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <img 
                        src={item.icon} 
                        alt={item.tool} 
                        className="h-12 w-12 rounded-lg object-cover border border-gray-100"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">{item.tool}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                    </div>
                    <div className="text-[var(--color-primary)] font-medium text-sm whitespace-nowrap">
                      {creatingSession && item.cmpName === "chatBot" ? "Creating..." : `${item.btnText} →`}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
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

export default Dashboard;