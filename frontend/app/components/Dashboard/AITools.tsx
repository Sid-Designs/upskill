"use client";

import { aiTools } from "@/app/constants";
import api from "@/lib/api";
import { gsap, useGSAP } from "@/lib/gsap";
import {
  ArrowRight,
  Clock,
  FileText,
  Loader2,
  Lock,
  MapPin,
  Sparkles,
  Target,
  X,
  Zap,
  MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

const routeMap: Record<string, string> = {
  chatBot: "chatbot",
  coverLetter: "cover-letter",
  roadmap: "roadmap",
};

const toolConfig: Record<string, { 
  icon: React.ReactNode; 
  gradient: string;
  iconBg: string;
  accentColor: string;
}> = {
  chatBot: {
    icon: <Zap className="h-5 w-5" />,
    gradient: "from-indigo-500 to-violet-600",
    iconBg: "bg-indigo-500",
    accentColor: "text-indigo-600"
  },
  coverLetter: {
    icon: <FileText className="h-5 w-5" />,
    gradient: "from-amber-500 to-orange-600",
    iconBg: "bg-amber-500",
    accentColor: "text-amber-600"
  },
  roadmap: {
    icon: <MapPin className="h-5 w-5" />,
    gradient: "from-emerald-500 to-teal-600",
    iconBg: "bg-emerald-500",
    accentColor: "text-emerald-600"
  },
};

const tags: Record<string, { text: string }[]> = {
  chatBot: [
    { text: "Career chat" },
    { text: "Real-time" },
    { text: "Actionable" },
  ],
  coverLetter: [
    { text: "ATS-friendly" },
    { text: "Role-tuned" },
    { text: "Tone control" },
  ],
  roadmap: [
    { text: "Milestones" },
    { text: "Skills-first" },
    { text: "Goal aligned" },
  ],
};

const features = [
  {
    icon: <Clock className="h-5 w-5" />,
    title: "Real-time Guidance",
    description: "Instant, context-aware responses",
    color: "text-indigo-600",
    bg: "bg-indigo-50"
  },
  {
    icon: <Target className="h-5 w-5" />,
    title: "Personalized",
    description: "Tailored to your goals",
    color: "text-amber-600",
    bg: "bg-amber-50"
  },
  {
    icon: <Lock className="h-5 w-5" />,
    title: "Private & Secure",
    description: "Your data stays with you",
    color: "text-emerald-600",
    bg: "bg-emerald-50"
  },
];

const AITools = () => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const coverLetterModalRef = useRef<HTMLDivElement>(null);
  const tools = aiTools.slice(0, 3);
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

  // GSAP fade animations
  useGSAP(() => {
    if (!containerRef.current) return;
    
    const ctx = gsap.context(() => {
      gsap.fromTo(".hero-section", 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.25 }
      );
      gsap.fromTo(".feature-card", 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.25, stagger: 0.04, delay: 0.05 }
      );
      gsap.fromTo(".tool-card", 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.25, stagger: 0.05, delay: 0.1 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, { scope: containerRef });

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

  const handleLaunch = (cmpName: string) => {
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
    const route = routeMap[cmpName] ?? "dashboard";
    router.push(`/dashboard/${route}`);
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

  return (
    <div ref={containerRef} className="w-full space-y-6 pb-6">
      {/* Hero Section */}
      <div className="hero-section relative overflow-hidden bg-[var(--color-primary)] rounded-2xl p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        
        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
                <Sparkles className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white">AI Assistants</span>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  Your Career Co-Pilots
                </h1>
                <p className="text-white/70 max-w-xl leading-relaxed">
                  Specialized tools that work together—keeping your progress consistent across every step of your journey.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 self-start">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium text-white">Active & Ready</span>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
            {features.map((feature, idx) => (
              <div 
                key={idx}
                className="feature-card group flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 p-4 hover:bg-white/15 transition-all duration-300"
              >
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center text-white">
                  {feature.icon}
                </div>
                <div>
                  <div className="font-semibold text-white">{feature.title}</div>
                  <div className="text-xs text-white/60">{feature.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {tools.map((tool, idx) => {
          const config = toolConfig[tool.cmpName] || {
            icon: <Zap className="h-5 w-5" />,
            gradient: "from-gray-500 to-gray-600",
            iconBg: "bg-gray-500",
            accentColor: "text-gray-600"
          };
          
          return (
            <div
              key={`${tool.tool}-${idx}`}
              className="tool-card group relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300 overflow-hidden"
            >
              {/* Top gradient accent */}
              <div className={`h-1 bg-gradient-to-r ${config.gradient}`} />
              
              <div className="p-6 flex flex-col gap-5">
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 rounded-xl ${config.iconBg} text-white flex items-center justify-center shadow-lg`}>
                    {config.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{tool.tool}</h3>
                      <span className={`text-xs font-medium rounded-full ${config.accentColor} bg-gray-100 px-2.5 py-1`}>
                        Assistant
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                      {tool.description}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {(tags[tool.cmpName] ?? []).map((tag, tagIdx) => (
                    <span
                      key={tagIdx}
                      className="rounded-lg bg-gray-50 border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600"
                    >
                      {tag.text}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    Synced with your profile
                  </span>
                  <button
                    className={`group/btn inline-flex items-center gap-2 rounded-lg bg-gradient-to-r ${config.gradient} text-white px-4 py-2.5 text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all shadow-sm`}
                    onClick={() => handleLaunch(tool.cmpName)}
                    disabled={creatingSession && tool.cmpName === "chatBot"}
                  >
                    {creatingSession && tool.cmpName === "chatBot" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        {tool.btnText}
                        <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="text-center">
        <p className="text-xs text-gray-500 inline-flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-gray-400" />
          All assistants sync with your profile and progress
          <span className="h-1 w-1 rounded-full bg-gray-400" />
        </p>
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
                <label className="text-sm font-medium text-gray-700 block mb-2" htmlFor="chat-title-modal">
                  Chat Title
                </label>
                <input
                  id="chat-title-modal"
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
          <div ref={coverLetterModalRef} className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Generate Cover Letter</h3>
                  <p className="text-sm text-white/70">Fill in the job details to create your letter</p>
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
            
            <div className="p-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2" htmlFor="job-title">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="job-title"
                  type="text"
                  value={jobTitle}
                  onChange={(e) => {
                    setJobTitle(e.target.value);
                    if (formErrors.jobTitle) setFormErrors(prev => ({ ...prev, jobTitle: "" }));
                    if (coverLetterError) setCoverLetterError(null);
                  }}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                  disabled={creatingCoverLetter}
                  autoFocus
                />
                {formErrors.jobTitle && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.jobTitle}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2" htmlFor="company-name">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="company-name"
                  type="text"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    if (formErrors.companyName) setFormErrors(prev => ({ ...prev, companyName: "" }));
                    if (coverLetterError) setCoverLetterError(null);
                  }}
                  placeholder="e.g. Google, Microsoft, etc."
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                  disabled={creatingCoverLetter}
                />
                {formErrors.companyName && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.companyName}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2" htmlFor="job-description">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="job-description"
                  value={jobDescription}
                  onChange={(e) => {
                    setJobDescription(e.target.value);
                    if (formErrors.jobDescription) setFormErrors(prev => ({ ...prev, jobDescription: "" }));
                    if (coverLetterError) setCoverLetterError(null);
                  }}
                  placeholder="Paste the job description here..."
                  rows={6}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all resize-none"
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
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingCoverLetter && <Loader2 className="h-4 w-4 animate-spin" />}
                  {creatingCoverLetter ? "Generating..." : "Generate Letter"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AITools;