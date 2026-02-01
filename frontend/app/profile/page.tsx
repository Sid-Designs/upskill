"use client"

import React, { useCallback, useEffect, useRef, useState } from 'react'
import api from '@/lib/api'
import { gsap, useGSAP } from '@/lib/gsap'
import Image from 'next/image'
import { 
  User, 
  Save, 
  X, 
  Pencil, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  Coins,
  Briefcase,
  MessageSquare,
  Trophy,
  RefreshCw,
  Camera
} from 'lucide-react'

// Cache configuration
const PROFILE_CACHE_KEY = "profile_cache"
const CACHE_DURATION = 5 * 60 * 1000

interface ProfilePreferences {
  skill: string
  aiPreferenceTone: string
  experience: string
  totalCredits: string
}

interface ProfileData {
  username: string
  bio: string
  avatarUrl: string
  preferences: ProfilePreferences
}

interface CachedProfile {
  data: ProfileData
  timestamp: number
  userId?: string
}

const defaultProfile: ProfileData = {
  username: '',
  bio: '',
  avatarUrl: '',
  preferences: {
    skill: '',
    aiPreferenceTone: '',
    experience: '',
    totalCredits: '0'
  }
}

const Page = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [profile, setProfile] = useState<ProfileData>(defaultProfile)
  const [editedProfile, setEditedProfile] = useState<ProfileData>(defaultProfile)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences'>('profile')

  // GSAP animations
  useGSAP(() => {
    if (!containerRef.current || loading) return
    
    const ctx = gsap.context(() => {
      gsap.fromTo(".animate-item", 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power3.out" }
      )
    }, containerRef)

    return () => ctx.revert()
  }, { scope: containerRef, dependencies: [loading] })

  // Cache helpers
  const getCachedProfile = useCallback((currentUserId: string): CachedProfile | null => {
    try {
      const cached = sessionStorage.getItem(PROFILE_CACHE_KEY)
      if (!cached) return null
      
      const data: CachedProfile = JSON.parse(cached)
      const isExpired = Date.now() - data.timestamp > CACHE_DURATION
      const isSameUser = data.userId === currentUserId
      
      if (isExpired || !isSameUser) {
        sessionStorage.removeItem(PROFILE_CACHE_KEY)
        return null
      }
      
      return data
    } catch {
      sessionStorage.removeItem(PROFILE_CACHE_KEY)
      return null
    }
  }, [])

  const setCachedProfile = useCallback((data: ProfileData, currentUserId: string) => {
    try {
      const cacheData: CachedProfile = {
        data,
        timestamp: Date.now(),
        userId: currentUserId
      }
      sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cacheData))
    } catch { /* ignore */ }
  }, [])

  const clearProfileCache = useCallback(() => {
    try {
      sessionStorage.removeItem(PROFILE_CACHE_KEY)
    } catch { /* ignore */ }
  }, [])

  // Fetch profile
  const fetchProfile = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && userId) {
      const cached = getCachedProfile(userId)
      if (cached) {
        setProfile(cached.data)
        setLoading(false)
        return
      }
    }

    setLoading(true)
    setError(null)
    
    try {
      const response = await api.get('/api/profile/get')
      const data = response.data
      const prefs = data.preferences ?? {}
      
      let credits = 0
      if (typeof data.credits === 'number') {
        credits = data.credits
      } else if (typeof data.credits === 'string') {
        credits = parseInt(data.credits, 10) || 0
      } else if (prefs.totalCredits !== undefined) {
        credits = typeof prefs.totalCredits === 'number' ? prefs.totalCredits : parseInt(prefs.totalCredits, 10) || 0
      }
      
      const profileData: ProfileData = {
        username: data.username || '',
        bio: data.bio || '',
        avatarUrl: data.avatarUrl || '',
        preferences: {
          skill: prefs.skill || '',
          aiPreferenceTone: prefs.aiPreferenceTone || '',
          experience: prefs.experience || (prefs.exp ? String(prefs.exp) + ' years' : ''),
          totalCredits: String(credits)
        }
      }
      
      setProfile(profileData)
      
      if (userId) {
        setCachedProfile(profileData, userId)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError('Unable to load profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [userId, getCachedProfile, setCachedProfile])

  // Fetch user ID first
  useEffect(() => {
    let active = true
    const fetchUser = async () => {
      try {
        const response = await api.get("/api/profile/get")
        const data = response.data || {}
        const id = data._id || data.id || ""
        if (active) setUserId(id)
      } catch { /* ignore */ }
    }
    void fetchUser()
    return () => { active = false }
  }, [])

  // Load profile when userId is available
  useEffect(() => {
    if (userId) {
      clearProfileCache()
      fetchProfile(true)
    }
  }, [userId, fetchProfile, clearProfileCache])

  const handleEdit = () => {
    setEditedProfile({ ...profile })
    setIsEditing(true)
  }

  const handleCancel = () => {
    if (saving) return
    setIsEditing(false)
    setEditedProfile({ ...profile })
  }

  const handleSave = async () => {
    if (!editedProfile.username.trim() || !editedProfile.bio.trim()) {
      return
    }

    setSaving(true)
    
    try {
      await api.put('/api/profile/update', {
        username: editedProfile.username.trim(),
        bio: editedProfile.bio.trim(),
        avatarUrl: editedProfile.avatarUrl.trim(),
        preferences: {
          ...editedProfile.preferences,
          skill: editedProfile.preferences.skill.trim(),
          aiPreferenceTone: editedProfile.preferences.aiPreferenceTone.trim(),
          experience: editedProfile.preferences.experience.trim()
        }
      })
      
      setProfile(editedProfile)
      clearProfileCache()
      if (userId) {
        setCachedProfile(editedProfile, userId)
      }
      setIsEditing(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Error saving profile:', err)
      setError('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-[var(--color-primary)] rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Loading profile...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !profile.username) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-10 text-center max-w-sm shadow-xl shadow-slate-200/50">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Oops!</h3>
          <p className="text-slate-500 mb-6">{error}</p>
          <button
            onClick={() => fetchProfile(true)}
            className="w-full py-3 bg-[var(--color-primary)] text-white rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const currentData = isEditing ? editedProfile : profile

  return (
    <>
      <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-5xl w-full">
          
          {/* Success Toast */}
          {saveSuccess && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-emerald-500 text-white px-5 py-3 rounded-full shadow-lg shadow-emerald-500/30 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Profile updated!</span>
              </div>
            </div>
          )}

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Left Column - Profile Card */}
            <div className="animate-item lg:col-span-1">
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden sticky top-6">
                {/* Cover */}
                <div className="h-24 bg-gradient-to-r from-[var(--color-primary)] to-indigo-500 relative">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMCAwaDQwdjQwSDB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
                </div>
                
                {/* Avatar */}
                <div className="relative px-6 pb-6">
                  <div className="-mt-12 mb-4">
                    <div className="w-24 h-24 rounded-2xl bg-white shadow-lg overflow-hidden border-4 border-white relative group">
                      {currentData.avatarUrl ? (
                        <img
                          src={currentData.avatarUrl}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/UpSkillLogoIcon.png'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full p-2">
                          <Image
                            src="/images/UpSkillLogoIcon.png"
                            alt="Profile"
                            width={80}
                            height={80}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      {isEditing && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Name & Bio */}
                  <div className="space-y-3">
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editedProfile.username}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, username: e.target.value }))}
                          placeholder="Your name"
                          className="w-full text-2xl font-bold text-slate-800 bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 focus:border-[var(--color-primary)] focus:bg-white outline-none transition-all"
                        />
                        <textarea
                          value={editedProfile.bio}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                          placeholder="Tell us about yourself..."
                          rows={3}
                          className="w-full text-slate-500 text-sm bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 focus:border-[var(--color-primary)] focus:bg-white outline-none transition-all resize-none"
                        />
                        <input
                          type="text"
                          value={editedProfile.avatarUrl}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, avatarUrl: e.target.value }))}
                          placeholder="Avatar URL (https://...)"
                          className="w-full text-sm text-slate-600 bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 focus:border-[var(--color-primary)] focus:bg-white outline-none transition-all"
                        />
                      </div>
                    ) : (
                      <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                          {profile.username || 'Welcome!'}
                        </h1>
                        <p className="text-slate-500 text-sm mt-1 line-clamp-3">
                          {profile.bio || 'No bio added yet.'}
                        </p>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    {isEditing ? (
                      <div className="flex gap-2">
                        <button
                          onClick={handleCancel}
                          disabled={saving}
                          className="flex-1 py-2.5 border-2 border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="flex-1 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:bg-slate-300 cursor-pointer"
                        >
                          {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleEdit}
                        className="w-full py-2.5 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit Profile
                      </button>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="border-t border-slate-100 p-6">
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                      <Coins className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Credits</p>
                      <p className="text-2xl font-bold text-slate-800">{currentData.preferences.totalCredits}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Tabs */}
              <div className="animate-item bg-white rounded-2xl p-1.5 shadow-lg shadow-slate-200/50 inline-flex">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-6 py-2.5 rounded-xl font-medium transition-all cursor-pointer ${
                    activeTab === 'profile' 
                      ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/30' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Profile
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`px-6 py-2.5 rounded-xl font-medium transition-all cursor-pointer ${
                    activeTab === 'preferences' 
                      ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/30' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Preferences
                  </span>
                </button>
              </div>

              {/* Content based on tab */}
              {activeTab === 'profile' ? (
                <div className="animate-item space-y-4">
                  {/* About Card */}
                  <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      About
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-2xl">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Username</p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedProfile.username}
                            onChange={(e) => setEditedProfile(prev => ({ ...prev, username: e.target.value }))}
                            placeholder="Your username"
                            className="w-full text-lg font-semibold text-slate-800 bg-white border-2 border-slate-200 rounded-xl px-3 py-2 focus:border-[var(--color-primary)] outline-none transition-all"
                          />
                        ) : (
                          <p className="text-lg font-semibold text-slate-800">{profile.username || 'Not set'}</p>
                        )}
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Bio</p>
                        {isEditing ? (
                          <textarea
                            value={editedProfile.bio}
                            onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                            placeholder="Tell us about yourself..."
                            rows={3}
                            className="w-full text-slate-700 bg-white border-2 border-slate-200 rounded-xl px-3 py-2 focus:border-[var(--color-primary)] outline-none transition-all resize-none"
                          />
                        ) : (
                          <p className="text-slate-700 leading-relaxed">{profile.bio || 'No bio added yet.'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-3xl p-5 shadow-xl shadow-slate-200/50">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <Trophy className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-400 uppercase">Experience</p>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedProfile.preferences.experience}
                              onChange={(e) => setEditedProfile(prev => ({
                                ...prev,
                                preferences: { ...prev.preferences, experience: e.target.value }
                              }))}
                              placeholder="e.g., 1-3 years"
                              className="w-full text-lg font-bold text-slate-800 bg-slate-50 border-2 border-slate-200 rounded-lg px-2 py-1 focus:border-[var(--color-primary)] outline-none transition-all mt-1"
                            />
                          ) : (
                            <p className="text-lg font-bold text-slate-800 truncate">{profile.preferences.experience || 'Not set'}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-3xl p-5 shadow-xl shadow-slate-200/50">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                          <Briefcase className="w-6 h-6 text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-400 uppercase">Skill</p>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedProfile.preferences.skill}
                              onChange={(e) => setEditedProfile(prev => ({
                                ...prev,
                                preferences: { ...prev.preferences, skill: e.target.value }
                              }))}
                              placeholder="e.g., Frontend"
                              className="w-full text-lg font-bold text-slate-800 bg-slate-50 border-2 border-slate-200 rounded-lg px-2 py-1 focus:border-[var(--color-primary)] outline-none transition-all mt-1"
                            />
                          ) : (
                            <p className="text-lg font-bold text-slate-800 truncate">{profile.preferences.skill || 'Not set'}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="animate-item space-y-4">
                  {/* Preferences Cards */}
                  <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50">
                    <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                      <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-violet-600" />
                      </div>
                      Your Preferences
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Skill */}
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
                          <Briefcase className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Primary Skill</p>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedProfile.preferences.skill}
                              onChange={(e) => setEditedProfile(prev => ({
                                ...prev,
                                preferences: { ...prev.preferences, skill: e.target.value }
                              }))}
                              placeholder="e.g., Frontend Development"
                              className="w-full text-lg font-bold text-slate-800 bg-white border-2 border-blue-200 rounded-xl px-3 py-2 focus:border-blue-500 outline-none transition-all mt-1"
                            />
                          ) : (
                            <p className="text-lg font-bold text-slate-800 truncate">{profile.preferences.skill || 'Not set'}</p>
                          )}
                        </div>
                      </div>

                      {/* AI Tone */}
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 flex-shrink-0">
                          <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">AI Tone</p>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedProfile.preferences.aiPreferenceTone}
                              onChange={(e) => setEditedProfile(prev => ({
                                ...prev,
                                preferences: { ...prev.preferences, aiPreferenceTone: e.target.value }
                              }))}
                              placeholder="e.g., Friendly, Professional"
                              className="w-full text-lg font-bold text-slate-800 bg-white border-2 border-purple-200 rounded-xl px-3 py-2 focus:border-purple-500 outline-none transition-all mt-1"
                            />
                          ) : (
                            <p className="text-lg font-bold text-slate-800 truncate">{profile.preferences.aiPreferenceTone || 'Not set'}</p>
                          )}
                        </div>
                      </div>

                      {/* Experience */}
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
                        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0">
                          <Trophy className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Experience Level</p>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedProfile.preferences.experience}
                              onChange={(e) => setEditedProfile(prev => ({
                                ...prev,
                                preferences: { ...prev.preferences, experience: e.target.value }
                              }))}
                              placeholder="e.g., 1-3 years"
                              className="w-full text-lg font-bold text-slate-800 bg-white border-2 border-emerald-200 rounded-xl px-3 py-2 focus:border-emerald-500 outline-none transition-all mt-1"
                            />
                          ) : (
                            <p className="text-lg font-bold text-slate-800 truncate">{profile.preferences.experience || 'Not set'}</p>
                          )}
                        </div>
                      </div>

                      {/* Credits */}
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30 flex-shrink-0">
                          <Coins className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Total Credits</p>
                          <p className="text-2xl font-bold text-slate-800">{currentData.preferences.totalCredits}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
