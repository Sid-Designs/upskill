"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { aiTools } from "@/app/constants";
import api from "@/lib/api";
import { gsap, useGSAP } from "@/lib/gsap";
import { MessageSquare, Mail, FileText, RefreshCw, TrendingUp, X, Loader2, ArrowRight, Zap, BarChart2, Map } from "lucide-react";
import { useRouter } from "next/navigation";

// Cache key and duration (5 minutes)
const CACHE_KEY = "dashboard_stats_cache";
const CACHE_DURATION = 5 * 60 * 1000;

interface CachedStats {
  sessions: number;
  messages: number;
  coverLetters: number;
  timestamp: number;
  userId?: string;
}

type DashboardProps = {
  onChangeComponent: (componentName: string) => void;
};

const Dashboard = ({ onChangeComponent }: DashboardProps) => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const coverLetterModalRef = useRef<HTMLDivElement>(null);
  const roadmapModalRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  
  const [displayName, setDisplayName] = useState("User");
  const [userId, setUserId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    sessions: 0,
    messages: 0,
    coverLetters: 0,
    loading: true,
    error: ""
  });
  const [isFromCache, setIsFromCache] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [titleError, setTitleError] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  // Cover Letter Modal state
  const [isCoverLetterModalOpen, setIsCoverLetterModalOpen] = useState(false);
  const [creatingCoverLetter, setCreatingCoverLetter] = useState(false);
  const [coverLetterError, setCoverLetterError] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [formErrors, setFormErrors] = useState({
    jobTitle: "",
    companyName: "",
    jobDescription: ""
  });

  // Roadmap Modal state
  const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced"];
  const TARGET_LEVELS = ["Intermediate", "Advanced", "Expert", "Job-Ready"];
  const LEARNING_STYLES = ["Hands-on", "Video-based", "Reading", "Interactive", "Project-based"];
  const [isRoadmapModalOpen, setIsRoadmapModalOpen] = useState(false);
  const [creatingRoadmap, setCreatingRoadmap] = useState(false);
  const [roadmapError, setRoadmapError] = useState<string | null>(null);
  const [goalTitle, setGoalTitle] = useState("");
  const [durationDays, setDurationDays] = useState(30);
  const [currentSkillLevel, setCurrentSkillLevel] = useState("Beginner");
  const [targetSkillLevel, setTargetSkillLevel] = useState("Job-Ready");
  const [educationalBackground, setEducationalBackground] = useState("");
  const [priorKnowledge, setPriorKnowledge] = useState("");
  const [learningStyle, setLearningStyle] = useState<string[]>(["Hands-on"]);
  const [resourceConstraints, setResourceConstraints] = useState("");
  const [careerGoal, setCareerGoal] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [roadmapFormErrors, setRoadmapFormErrors] = useState({
    goalTitle: "",
    educationalBackground: "",
    durationDays: ""
  });

  // GSAP fade animations
  useGSAP(() => {
    if (!containerRef.current) return;
    
    const ctx = gsap.context(() => {
      gsap.fromTo(".dash-hero", 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.25 }
      );
      gsap.fromTo(".stat-card", 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.25, stagger: 0.04, delay: 0.05 }
      );
      gsap.fromTo(".activity-panel", 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.25, delay: 0.1 }
      );
      gsap.fromTo(".tools-panel", 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.25, delay: 0.12 }
      );
      gsap.fromTo(".tool-item", 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.2, stagger: 0.04, delay: 0.15 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, { scope: containerRef });

  // Animate progress bars when stats load
  useEffect(() => {
    if (!stats.loading && statsRef.current) {
      gsap.fromTo(".progress-fill",
        { width: "0%", opacity: 0 },
        { width: "var(--target-width)", opacity: 1, duration: 0.3, stagger: 0.05 }
      );
    }
  }, [stats.loading]);

  // Modal fade animation
  useEffect(() => {
    if (isCreateModalOpen && modalRef.current) {
      gsap.fromTo(modalRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.15 }
      );
    }
  }, [isCreateModalOpen]);

  // Cover Letter Modal fade animation
  useEffect(() => {
    if (isCoverLetterModalOpen && coverLetterModalRef.current) {
      gsap.fromTo(coverLetterModalRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.15 }
      );
    }
  }, [isCoverLetterModalOpen]);

  // Roadmap Modal fade animation
  useEffect(() => {
    if (isRoadmapModalOpen && roadmapModalRef.current) {
      gsap.fromTo(roadmapModalRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.15 }
      );
    }
  }, [isRoadmapModalOpen]);

  const normalizeList = (value: any): any[] => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.items)) return value.items;
    if (Array.isArray(value?.sessions)) return value.sessions;
    if (Array.isArray(value?.messages)) return value.messages;
    if (Array.isArray(value?.coverLetters)) return value.coverLetters;
    return [];
  };

  // Helper to get cached stats
  const getCachedStats = useCallback((currentUserId: string): CachedStats | null => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const data: CachedStats = JSON.parse(cached);
      const isExpired = Date.now() - data.timestamp > CACHE_DURATION;
      const isSameUser = data.userId === currentUserId;
      
      if (isExpired || !isSameUser) {
        sessionStorage.removeItem(CACHE_KEY);
        return null;
      }
      
      return data;
    } catch {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
  }, []);

  // Helper to set cached stats
  const setCachedStats = useCallback((data: Omit<CachedStats, "timestamp">) => {
    try {
      const cacheData: CachedStats = {
        ...data,
        timestamp: Date.now()
      };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch { /* ignore storage errors */ }
  }, []);

  useEffect(() => {
    let active = true;
    const fetchUser = async () => {
      try {
        const response = await api.get("/api/profile/get");
        const data = response.data || {};
        const name = (data.username || "").trim();
        const id = data._id || data.id || "";
        if (active) {
          setDisplayName(name || "User");
          setUserId(id);
        }
      } catch { /* ignore */ }
    };
    void fetchUser();
    return () => { active = false; };
  }, []);

  const fetchStats = useCallback(async (forceRefresh = false) => {
    // Check cache first (unless force refresh)
    if (!forceRefresh && userId) {
      const cached = getCachedStats(userId);
      if (cached) {
        setStats({
          sessions: cached.sessions,
          messages: cached.messages,
          coverLetters: cached.coverLetters,
          loading: false,
          error: ""
        });
        setIsFromCache(true);
        setLastUpdated(new Date(cached.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        return;
      }
    }

    setStats(prev => ({ ...prev, loading: true, error: "" }));
    setIsFromCache(false);
    
    try {
      // Parallel fetch for speed
      const [sessionRes, coverRes] = await Promise.all([
        api.get("/api/chat/session"),
        api.get("/api/chat/cover-letters")
      ]);
      
      const sessions = normalizeList(sessionRes.data);
      const coverLetters = normalizeList(coverRes.data);

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
            return acc + normalizeList(result.value?.data).length;
          }
          return acc;
        }, 0);
      }

      const newStats = {
        sessions: sessions.length,
        messages: totalMessages,
        coverLetters: coverLetters.length
      };

      // Save to cache
      if (userId) {
        setCachedStats({ ...newStats, userId });
      }

      setStats({
        ...newStats,
        loading: false,
        error: ""
      });
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch {
      setStats(prev => ({ ...prev, loading: false, error: "Failed to load stats" }));
    }
  }, [userId, getCachedStats, setCachedStats]);

  useEffect(() => { 
    if (userId !== null) {
      void fetchStats(); 
    }
  }, [fetchStats, userId]);

  const totalActivity = useMemo(() => 
    stats.sessions + stats.messages + stats.coverLetters
  , [stats]);

  const hasActivity = totalActivity > 0;

  const statCards = useMemo(() => [
    { 
      label: "Chat Sessions", 
      value: stats.sessions, 
      icon: <MessageSquare className="h-5 w-5" />,
      iconBg: "bg-indigo-500",
      iconShadow: "shadow-indigo-500/25",
      badgeBg: "bg-indigo-50",
      badgeText: "text-indigo-600"
    },
    { 
      label: "Messages", 
      value: stats.messages, 
      icon: <Mail className="h-5 w-5" />,
      iconBg: "bg-amber-500",
      iconShadow: "shadow-amber-500/25",
      badgeBg: "bg-amber-50",
      badgeText: "text-amber-600"
    },
    { 
      label: "Cover Letters", 
      value: stats.coverLetters, 
      icon: <FileText className="h-5 w-5" />,
      iconBg: "bg-emerald-500",
      iconShadow: "shadow-emerald-500/25",
      badgeBg: "bg-emerald-50",
      badgeText: "text-emerald-600"
    }
  ], [stats]);

  const breakdown = useMemo(() => [
    { label: "Sessions", value: stats.sessions },
    { label: "Messages", value: stats.messages },
    { label: "Cover Letters", value: stats.coverLetters }
  ], [stats]);

  const handleToolClick = (cmpName: string) => {
    if (cmpName === "chatBot") {
      setNewSessionTitle("");
      setTitleError("");
      setCreateError(null);
      setIsCreateModalOpen(true);
      return;
    }
    if (cmpName === "coverLetter") {
      setJobTitle("");
      setCompanyName("");
      setJobDescription("");
      setCoverLetterError(null);
      setFormErrors({ jobTitle: "", companyName: "", jobDescription: "" });
      setIsCoverLetterModalOpen(true);
      return;
    }
    if (cmpName === "roadmap") {
      setGoalTitle("");
      setDurationDays(30);
      setCurrentSkillLevel("Beginner");
      setTargetSkillLevel("Job-Ready");
      setEducationalBackground("");
      setPriorKnowledge("");
      setLearningStyle(["Hands-on"]);
      setResourceConstraints("");
      setCareerGoal("");
      setAdditionalNotes("");
      setRoadmapError(null);
      setRoadmapFormErrors({ goalTitle: "", educationalBackground: "", durationDays: "" });
      setIsRoadmapModalOpen(true);
      return;
    }
    onChangeComponent(cmpName);
  };

  const closeCreateModal = () => {
    if (creatingSession) return;
    if (modalRef.current) {
      gsap.to(modalRef.current, {
        opacity: 0, duration: 0.12,
        onComplete: () => {
          setIsCreateModalOpen(false);
          setTitleError("");
          setCreateError(null);
        }
      });
    } else {
      setIsCreateModalOpen(false);
    }
  };

  const handleCreateSession = async () => {
    const title = newSessionTitle.trim();
    if (!title) { setTitleError("Please enter a title"); return; }
    if (title.length > 100) { setTitleError("Title must be under 100 characters"); return; }

    setCreatingSession(true);
    setTitleError("");
    setCreateError(null);

    try {
      const response = await api.post("/api/chat/create-session", { type: "career_guidance", title });
      const newSession = response.data?.data;
      if (!newSession?.id) throw new Error("Failed to create session");
      
      setIsCreateModalOpen(false);
      setNewSessionTitle("");
      router.push(`/dashboard/chatbot?sessionid=${encodeURIComponent(newSession.id)}`);
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || "Something went wrong. Try again.");
    } finally {
      setCreatingSession(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); void handleCreateSession(); }
  };

  // Cover Letter Modal functions
  const closeCoverLetterModal = () => {
    if (creatingCoverLetter) return;
    if (coverLetterModalRef.current) {
      gsap.to(coverLetterModalRef.current, {
        opacity: 0, duration: 0.12,
        onComplete: () => {
          setIsCoverLetterModalOpen(false);
          setCoverLetterError(null);
          setFormErrors({ jobTitle: "", companyName: "", jobDescription: "" });
        }
      });
    } else {
      setIsCoverLetterModalOpen(false);
    }
  };

  const validateCoverLetterForm = () => {
    const errors = {
      jobTitle: "",
      companyName: "",
      jobDescription: ""
    };
    let isValid = true;

    if (!jobTitle.trim()) {
      errors.jobTitle = "Job title is required";
      isValid = false;
    } else if (jobTitle.trim().length > 100) {
      errors.jobTitle = "Job title must be less than 100 characters";
      isValid = false;
    }

    if (!companyName.trim()) {
      errors.companyName = "Company name is required";
      isValid = false;
    } else if (companyName.trim().length > 100) {
      errors.companyName = "Company name must be less than 100 characters";
      isValid = false;
    }

    if (!jobDescription.trim()) {
      errors.jobDescription = "Job description is required";
      isValid = false;
    } else if (jobDescription.trim().length > 5000) {
      errors.jobDescription = "Job description is too long (max 5000 characters)";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleCreateCoverLetter = async () => {
    if (!validateCoverLetterForm()) return;

    setCreatingCoverLetter(true);
    setCoverLetterError(null);

    try {
      const response = await api.post("/api/chat/cover-letter", {
        jobTitle: jobTitle.trim(),
        companyName: companyName.trim(),
        jobDescription: jobDescription.trim(),
      });

      const newCoverLetter = response.data?.data;
      if (!newCoverLetter?.id) {
        throw new Error("Unable to generate cover letter");
      }

      setIsCoverLetterModalOpen(false);
      setJobTitle("");
      setCompanyName("");
      setJobDescription("");
      
      // Navigate to the generated cover letter detail page
      router.push(`/dashboard/cover-letter/${newCoverLetter.id}`);
    } catch (err: any) {
      const message = err?.response?.data?.message || 
        err?.response?.data?.error || 
        "Unable to generate cover letter right now. Please try again.";
      setCoverLetterError(message);
    } finally {
      setCreatingCoverLetter(false);
    }
  };

  // Roadmap Modal Functions
  const closeRoadmapModal = () => {
    if (creatingRoadmap) return;
    if (roadmapModalRef.current) {
      gsap.to(roadmapModalRef.current, {
        opacity: 0, duration: 0.12,
        onComplete: () => {
          setIsRoadmapModalOpen(false);
          setRoadmapError(null);
          setRoadmapFormErrors({ goalTitle: "", educationalBackground: "", durationDays: "" });
        }
      });
    } else {
      setIsRoadmapModalOpen(false);
    }
  };

  const validateRoadmapForm = () => {
    const errors = { goalTitle: "", educationalBackground: "", durationDays: "" };
    let isValid = true;
    if (!goalTitle.trim()) { errors.goalTitle = "Goal title is required"; isValid = false; }
    else if (goalTitle.trim().length > 200) { errors.goalTitle = "Goal title must be less than 200 characters"; isValid = false; }
    if (!educationalBackground.trim()) { errors.educationalBackground = "Educational background is required"; isValid = false; }
    if (durationDays < 7) { errors.durationDays = "Duration must be at least 7 days"; isValid = false; }
    else if (durationDays > 365) { errors.durationDays = "Duration cannot exceed 365 days"; isValid = false; }
    setRoadmapFormErrors(errors);
    return isValid;
  };

  const toggleLearningStyle = (style: string) => {
    setLearningStyle(prev =>
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    );
  };

  const handleCreateRoadmap = async () => {
    if (!validateRoadmapForm()) return;
    setCreatingRoadmap(true);
    setRoadmapError(null);
    try {
      const response = await api.post("/api/roadmap/generate", {
        goalTitle: goalTitle.trim(),
        durationDays,
        currentSkillLevel,
        targetSkillLevel,
        educationalBackground: educationalBackground.trim(),
        priorKnowledge: priorKnowledge.split(",").map(s => s.trim()).filter(Boolean),
        learningStyle,
        resourceConstraints: resourceConstraints.trim() || null,
        careerGoal: careerGoal.trim() || null,
        additionalNotes: additionalNotes.trim() || null,
      });
      const newRoadmap = response.data?.data;
      if (!newRoadmap?.id) throw new Error("Unable to generate roadmap");
      setIsRoadmapModalOpen(false);
      router.push(`/dashboard/roadmap/${newRoadmap.id}?new=true`);
    } catch (err: any) {
      const message = err?.response?.data?.message || 
        err?.response?.data?.error || 
        "Unable to generate roadmap right now. Please try again.";
      setRoadmapError(message);
    } finally {
      setCreatingRoadmap(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div ref={containerRef} className="w-full space-y-6">
      {/* Hero Header */}
      <div className="dash-hero relative overflow-hidden bg-[var(--color-primary)] rounded-2xl p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1">{getGreeting()}</p>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
              Welcome back, {displayName}
            </h1>
            <p className="text-white/70">Track your progress and access your tools</p>
          </div>
          <button
            onClick={() => fetchStats(true)}
            disabled={stats.loading}
            className="group inline-flex items-center gap-2.5 px-5 py-3 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl text-sm font-medium text-white hover:bg-white/25 hover:border-white/30 transition-all duration-300 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 transition-transform duration-500 ${stats.loading ? "animate-spin" : "group-hover:rotate-90"}`} />
            {stats.loading ? "Syncing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card, idx) => (
          <div 
            key={card.label}
            className="stat-card group relative bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-300 overflow-hidden"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${card.iconBg} text-white shadow-lg ${card.iconShadow}`}>
                {card.icon}
              </div>
              <div className={`flex items-center gap-1.5 text-xs ${card.badgeText} ${card.badgeBg} px-2.5 py-1 rounded-full font-medium`}>
                <Zap className="h-3 w-3" />
                Live
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 tracking-tight mb-1">
              {stats.loading ? (
                <div className="h-9 w-16 bg-gray-100 rounded-lg animate-pulse" />
              ) : (
                card.value.toLocaleString()
              )}
            </div>
            <p className="text-sm text-gray-500 font-medium">{card.label}</p>
            <div className={`absolute bottom-0 left-0 right-0 h-1 ${card.iconBg} rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Activity Panel */}
        <div ref={statsRef} className="activity-panel lg:col-span-3 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[var(--color-primary)]/10">
                <BarChart2 className="h-5 w-5 text-[var(--color-primary)]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Activity Overview</h2>
                <p className="text-sm text-gray-500">Your usage breakdown</p>
              </div>
            </div>
            {lastUpdated && (
              <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                {isFromCache ? "Cached" : "Updated"} {lastUpdated}
              </span>
            )}
          </div>

          {stats.error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
              {stats.error}
            </div>
          )}

          {hasActivity ? (
            <div className="space-y-5">
              {/* Stats Summary */}
              <div className="flex items-center justify-between p-4 bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-[var(--color-primary)]" />
                  <span className="font-medium text-gray-700">Total Activity</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">{totalActivity}</span>
              </div>

              {/* Progress Bars */}
              <div className="space-y-4">
                {breakdown.map((item) => {
                  const maxValue = Math.max(stats.sessions, stats.messages, stats.coverLetters, 1);
                  const percentage = Math.round((item.value / maxValue) * 100);
                  const share = totalActivity > 0 ? Math.round((item.value / totalActivity) * 100) : 0;
                  
                  return (
                    <div key={item.label} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-gray-900">
                            {stats.loading ? "—" : item.value}
                          </span>
                          <span className="text-xs text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-md min-w-[40px] text-center font-medium">
                            {share}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="progress-fill h-full bg-[var(--color-primary)] rounded-full"
                          style={{ "--target-width": `${percentage}%` } as React.CSSProperties}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-primary)]/10 mb-4">
                <BarChart2 className="h-8 w-8 text-[var(--color-primary)]" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-1">No activity yet</h3>
              <p className="text-sm text-gray-500">Start using tools to track your progress here</p>
            </div>
          )}
        </div>

        {/* Tools Panel */}
        <div className="tools-panel lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl bg-[var(--color-primary)]/10">
              <Zap className="h-5 w-5 text-[var(--color-primary)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              <p className="text-sm text-gray-500">Launch your tools</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {aiTools.slice(0, -1).map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleToolClick(item.cmpName)}
                disabled={creatingSession && item.cmpName === "chatBot"}
                className="tool-item group w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-[var(--color-primary)]/5 border border-transparent hover:border-[var(--color-primary)]/20 rounded-xl transition-all duration-200 text-left"
              >
                <div className="h-11 w-11 rounded-xl bg-[var(--color-primary)]/10 shadow-sm flex-shrink-0 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-[var(--color-primary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-800 group-hover:text-[var(--color-primary)] transition-colors">
                    {item.tool}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">{item.description}</p>
                </div>
                <div className="flex items-center gap-1 text-gray-400 group-hover:text-[var(--color-primary)] transition-colors">
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Create Chat Modal */}
      {isCreateModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && closeCreateModal()}
        >
          <div ref={modalRef} className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-[var(--color-primary)] px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">New Chat Session</h3>
                  <p className="text-sm text-white/70">Give your conversation a name</p>
                </div>
                <button
                  onClick={closeCreateModal}
                  disabled={creatingSession}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2" htmlFor="chat-title">
                  Chat Title
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
                  placeholder="e.g. Career planning for 2026"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all"
                  disabled={creatingSession}
                  autoFocus
                />
                {(titleError || createError) && (
                  <p className="text-sm text-red-500 mt-2">{titleError || createError}</p>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={closeCreateModal}
                  disabled={creatingSession}
                  className="flex-1 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleCreateSession()}
                  disabled={creatingSession || !newSessionTitle.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-[var(--color-primary)] hover:opacity-90 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingSession && <Loader2 className="h-4 w-4 animate-spin" />}
                  {creatingSession ? "Creating..." : "Create Chat"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cover Letter Modal */}
      {isCoverLetterModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && closeCoverLetterModal()}
        >
          <div ref={coverLetterModalRef} className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-[var(--color-primary)] px-6 py-5 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Generate Cover Letter</h3>
                    <p className="text-sm text-white/70">Fill in the job details to create your letter</p>
                  </div>
                </div>
                <button
                  onClick={closeCoverLetterModal}
                  disabled={creatingCoverLetter}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2" htmlFor="dashboard-job-title">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="dashboard-job-title"
                  type="text"
                  value={jobTitle}
                  onChange={(e) => {
                    setJobTitle(e.target.value);
                    if (formErrors.jobTitle) setFormErrors(prev => ({ ...prev, jobTitle: "" }));
                    if (coverLetterError) setCoverLetterError(null);
                  }}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all"
                  disabled={creatingCoverLetter}
                  autoFocus
                />
                {formErrors.jobTitle && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.jobTitle}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2" htmlFor="dashboard-company-name">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="dashboard-company-name"
                  type="text"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    if (formErrors.companyName) setFormErrors(prev => ({ ...prev, companyName: "" }));
                    if (coverLetterError) setCoverLetterError(null);
                  }}
                  placeholder="e.g. Google, Microsoft, etc."
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all"
                  disabled={creatingCoverLetter}
                />
                {formErrors.companyName && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.companyName}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2" htmlFor="dashboard-job-description">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="dashboard-job-description"
                  value={jobDescription}
                  onChange={(e) => {
                    setJobDescription(e.target.value);
                    if (formErrors.jobDescription) setFormErrors(prev => ({ ...prev, jobDescription: "" }));
                    if (coverLetterError) setCoverLetterError(null);
                  }}
                  placeholder="Paste the job description here..."
                  rows={6}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all resize-none"
                  disabled={creatingCoverLetter}
                />
                {formErrors.jobDescription && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.jobDescription}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">{jobDescription.length}/5000 characters</p>
              </div>

              {coverLetterError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600">{coverLetterError}</p>
                </div>
              )}
              
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={closeCoverLetterModal}
                  disabled={creatingCoverLetter}
                  className="flex-1 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleCreateCoverLetter()}
                  disabled={creatingCoverLetter || !jobTitle.trim() || !companyName.trim() || !jobDescription.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-[var(--color-primary)] hover:opacity-90 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingCoverLetter && <Loader2 className="h-4 w-4 animate-spin" />}
                  {creatingCoverLetter ? "Generating..." : "Generate Letter"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Roadmap Modal */}
      {isRoadmapModalOpen && (
        <div
          ref={roadmapModalRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && closeRoadmapModal()}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-[var(--color-primary)] relative overflow-hidden flex-shrink-0">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Map className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Generate Career Pathway</h3>
                    <p className="text-sm text-white/70">Create a personalized learning roadmap</p>
                  </div>
                </div>
                <button
                  onClick={closeRoadmapModal}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  disabled={creatingRoadmap}
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {/* Goal Title */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2" htmlFor="dashboard-goal-title">
                  Learning Goal <span className="text-red-500">*</span>
                </label>
                <input
                  id="dashboard-goal-title"
                  type="text"
                  value={goalTitle}
                  onChange={(e) => {
                    setGoalTitle(e.target.value);
                    if (roadmapFormErrors.goalTitle) setRoadmapFormErrors(prev => ({ ...prev, goalTitle: "" }));
                    if (roadmapError) setRoadmapError(null);
                  }}
                  placeholder="e.g. Learn React.js, Master Python, etc."
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all"
                  disabled={creatingRoadmap}
                  autoFocus
                />
                {roadmapFormErrors.goalTitle && (
                  <p className="text-sm text-red-500 mt-1">{roadmapFormErrors.goalTitle}</p>
                )}
              </div>

              {/* Duration */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2" htmlFor="dashboard-duration-days">
                  Duration (Days): <span className="font-bold text-[var(--color-primary)]">{durationDays}</span>
                </label>
                <input
                  id="dashboard-duration-days"
                  type="range"
                  min={7}
                  max={365}
                  value={durationDays}
                  onChange={(e) => {
                    setDurationDays(Number(e.target.value));
                    if (roadmapFormErrors.durationDays) setRoadmapFormErrors(prev => ({ ...prev, durationDays: "" }));
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
                  disabled={creatingRoadmap}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1 week</span>
                  <span>1 year</span>
                </div>
                {roadmapFormErrors.durationDays && (
                  <p className="text-sm text-red-500 mt-1">{roadmapFormErrors.durationDays}</p>
                )}
              </div>

              {/* Skill Levels */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Current Level</label>
                  <select
                    value={currentSkillLevel}
                    onChange={(e) => setCurrentSkillLevel(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all bg-white"
                    disabled={creatingRoadmap}
                  >
                    {SKILL_LEVELS.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Target Level</label>
                  <select
                    value={targetSkillLevel}
                    onChange={(e) => setTargetSkillLevel(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all bg-white"
                    disabled={creatingRoadmap}
                  >
                    {TARGET_LEVELS.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Educational Background */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2" htmlFor="dashboard-education-bg">
                  Educational Background <span className="text-red-500">*</span>
                </label>
                <input
                  id="dashboard-education-bg"
                  type="text"
                  value={educationalBackground}
                  onChange={(e) => {
                    setEducationalBackground(e.target.value);
                    if (roadmapFormErrors.educationalBackground) setRoadmapFormErrors(prev => ({ ...prev, educationalBackground: "" }));
                    if (roadmapError) setRoadmapError(null);
                  }}
                  placeholder="e.g. CS degree, Self-taught, Bootcamp graduate"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all"
                  disabled={creatingRoadmap}
                />
                {roadmapFormErrors.educationalBackground && (
                  <p className="text-sm text-red-500 mt-1">{roadmapFormErrors.educationalBackground}</p>
                )}
              </div>

              {/* Prior Knowledge */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2" htmlFor="dashboard-prior-knowledge">
                  Prior Knowledge <span className="text-gray-400 font-normal">(comma-separated)</span>
                </label>
                <input
                  id="dashboard-prior-knowledge"
                  type="text"
                  value={priorKnowledge}
                  onChange={(e) => setPriorKnowledge(e.target.value)}
                  placeholder="e.g. HTML, CSS, JavaScript basics"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all"
                  disabled={creatingRoadmap}
                />
              </div>

              {/* Learning Style */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Preferred Learning Style</label>
                <div className="flex flex-wrap gap-2">
                  {LEARNING_STYLES.map(style => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => toggleLearningStyle(style)}
                      disabled={creatingRoadmap}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        learningStyle.includes(style)
                          ? "bg-[var(--color-primary)] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      } disabled:opacity-50`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Career Goal */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2" htmlFor="dashboard-career-goal">
                  Career Goal <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id="dashboard-career-goal"
                  type="text"
                  value={careerGoal}
                  onChange={(e) => setCareerGoal(e.target.value)}
                  placeholder="e.g. Frontend Developer at a tech company"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all"
                  disabled={creatingRoadmap}
                />
              </div>

              {/* Resource Constraints */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2" htmlFor="dashboard-resource-constraints">
                  Resource Constraints <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id="dashboard-resource-constraints"
                  type="text"
                  value={resourceConstraints}
                  onChange={(e) => setResourceConstraints(e.target.value)}
                  placeholder="e.g. Free resources only, 2 hours/day"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all"
                  disabled={creatingRoadmap}
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2" htmlFor="dashboard-additional-notes">
                  Additional Notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="dashboard-additional-notes"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Any other preferences or requirements..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all resize-none"
                  disabled={creatingRoadmap}
                />
              </div>

              {roadmapError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600">{roadmapError}</p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={closeRoadmapModal}
                  disabled={creatingRoadmap}
                  className="flex-1 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleCreateRoadmap()}
                  disabled={creatingRoadmap || !goalTitle.trim() || !educationalBackground.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-[var(--color-primary)] hover:opacity-90 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingRoadmap && <Loader2 className="h-4 w-4 animate-spin" />}
                  {creatingRoadmap ? "Generating..." : "Generate Pathway"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;