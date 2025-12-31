"use client"

import React, { useEffect, useState } from 'react'
import '@/public/styles/Profile.css'
import api from '@/lib/api'
import Image from 'next/image'
import { FiEdit2, FiSave } from 'react-icons/fi'

const preferenceLabels: Record<string, string> = {
  skill: 'Primary Skill',
  aiPreferenceTone: 'AI Preference Tone',
  experience: 'Experience Level',
  totalCredits: 'Total Credits'
}

const defaultProfile = {
  username: 'Tell us about yourself',
  bio: 'Add a short bio so others can get to know you.',
  preferences: {
    skill: 'Frontend Development',
    aiPreferenceTone: 'Friendly',
    experience: '1-3 years',
    totalCredits: '0'
  }
}

const ensureString = (value: unknown, fallback: string) => {
  const str = value === undefined || value === null ? '' : String(value).trim()
  return str.length ? str : fallback
}

const asEditable = (value: string, fallback: string) => {
  const trimmed = value.trim()
  return trimmed === fallback ? '' : trimmed
}

const emptyErrors = {
  username: '',
  bio: '',
  skill: '',
  aiPreferenceTone: '',
  experience: ''
}

const Page = () => {
  const [profile, setProfile] = useState({
    username: defaultProfile.username,
    bio: defaultProfile.bio,
    preferences: { ...defaultProfile.preferences },
    isEditing: false
  })
  const [errors, setErrors] = useState(emptyErrors)

  const handleEditToggle = () => {
    setProfile(prev => {
      if (prev.isEditing) {
        setErrors(emptyErrors)
        return { ...prev, isEditing: false }
      }

      return {
        ...prev,
        isEditing: true,
        username: asEditable(prev.username, defaultProfile.username),
        bio: asEditable(prev.bio, defaultProfile.bio),
        preferences: {
          ...prev.preferences,
          skill: asEditable(prev.preferences.skill, defaultProfile.preferences.skill),
          aiPreferenceTone: asEditable(prev.preferences.aiPreferenceTone, defaultProfile.preferences.aiPreferenceTone),
          experience: asEditable(prev.preferences.experience, defaultProfile.preferences.experience),
          totalCredits: prev.preferences.totalCredits
        }
      }
    })
  }

  const handleSave = async () => {
    const nextErrors = {
      username: profile.username.trim() ? '' : 'Username is required',
      bio: profile.bio.trim() ? '' : 'Bio is required',
      skill: profile.preferences.skill.trim() ? '' : 'Skill is required',
      aiPreferenceTone: profile.preferences.aiPreferenceTone.trim() ? '' : 'AI preference tone is required',
      experience: profile.preferences.experience.trim() ? '' : 'Experience is required'
    }

    const hasErrors = Object.values(nextErrors).some(Boolean)
    setErrors(nextErrors)
    if (hasErrors) return

    try {
      console.log('Saving profile:', profile)
      await api.put('/api/profile/update', {
        username: profile.username,
        bio: profile.bio,
        preferences: profile.preferences
      })
      setErrors(emptyErrors)
      handleEditToggle()
    } catch (error) {
      console.error('Error saving profile:', error)
    }
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const response = await api.get('/api/profile/get')
        const data = await response.data
        const prefs = data.preferences ?? {}
        if (!active) return
        setProfile({
          username: ensureString(data.username, defaultProfile.username),
          bio: ensureString(data.bio, defaultProfile.bio),
          preferences: {
            skill: ensureString(prefs.skill, defaultProfile.preferences.skill),
            aiPreferenceTone: ensureString(prefs.aiPreferenceTone, defaultProfile.preferences.aiPreferenceTone),
            experience: ensureString(prefs.experience, defaultProfile.preferences.experience),
            totalCredits: ensureString(prefs.totalCredits, defaultProfile.preferences.totalCredits)
          },
          isEditing: false
        })
      } catch (error) {
        console.error('Error fetching profile data:', error)
      }
    }

    void load()
    return () => { active = false }
  }, [])

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <div className='profileCard bg-white rounded-2xl shadow-lg max-w-2xl w-full overflow-hidden'>
        {/* Header with edit button */}
        <div className='p-6 border-b border-gray-100 flex justify-between items-center'>
          <h1 className='text-2xl font-semibold text-gray-800'>Profile</h1>
          <button
            onClick={profile.isEditing ? handleSave : handleEditToggle}
            style={profile.isEditing ? { backgroundColor: 'var(--color-primary)' } : undefined}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${profile.isEditing ? 'text-white hover:opacity-90 border border-transparent shadow-sm' : 'hover:bg-gray-50 border border-gray-200 text-gray-800'}`}
          >
            {profile.isEditing ? (
              <>
                <FiSave size={18} />
                <span>Save Changes</span>
              </>
            ) : (
              <>
                <FiEdit2 size={18} />
                <span>Edit Profile</span>
              </>
            )}
          </button>
        </div>

        {/* Profile Content */}
        <div className='p-6'>
          {/* Profile Info Section */}
          <div className='flex flex-col md:flex-row gap-6 mb-8'>
            <div className='shrink-0'>
              <div className='w-24 h-24 rounded-full overflow-hidden border shadow-lg p-3'>
                <Image
                  src='/images/UpSkillLogoIcon.png'
                  alt='Profile Picture'
                  width={96}
                  height={96}
                  className='w-full h-full object-cover'
                />
              </div>
            </div>

            <div className='flex-1'>
              {profile.isEditing ? (
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Username
                    </label>
                    <input
                      type='text'
                        value={profile.username}
                      onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                      placeholder={defaultProfile.username}
                      required
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${errors.username ? 'border-red-500 focus:ring-red-500 placeholder:text-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
                    />
                    {errors.username && <p className='text-sm text-red-600 mt-1'>{errors.username}</p>}
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Bio
                    </label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder={defaultProfile.bio}
                      required
                      rows={3}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition resize-none ${errors.bio ? 'border-red-500 focus:ring-red-500 placeholder:text-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
                    />
                    {errors.bio && <p className='text-sm text-red-600 mt-1'>{errors.bio}</p>}
                  </div>
                </div>
              ) : (
                <div className='space-y-2 mt-[10px]'>
                    <h2 className='text-2xl font-bold text-gray-900'>{profile.username}</h2>
                  <p className='text-gray-600 leading-relaxed'>{profile.bio}</p>
                </div>
              )}
            </div>
          </div>

          {/* Preferences Section */}
          <div className='border-t pt-6'>
            <h3 className='text-xl font-semibold text-gray-800 mb-4'>Preferences</h3>
            <div className='bg-gray-50 rounded-xl p-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {Object.entries(profile.preferences).map(([key, value]) => {
                  const displayValue = value ?? ''
                  return (
                    <div key={key} className='bg-white p-4 rounded-lg border border-gray-200'>
                      <div className='flex flex-col space-y-2'>
                        <span className='text-sm font-medium text-gray-500 tracking-wider uppercase'>
                          {preferenceLabels[key] || key}
                        </span>
                        {profile.isEditing ? (
                          key === 'totalCredits' ? (
                             <span className='text-2xl font-bold text-blue-700'>
                               {displayValue}
                             </span>
                          ) : (
                            <div className='flex items-start gap-0 mt-2 flex-col'>
                              {typeof value === 'boolean' ? (
                                <button
                                  onClick={() => setProfile(prev => ({
                                    ...prev,
                                    preferences: {
                                      ...prev.preferences,
                                      [key]: !value
                                    }
                                  }))}
                                  className={`w-12 h-6 rounded-full transition-colors ${value ? 'bg-blue-500' : 'bg-gray-300'}`}
                                >
                                  <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${value ? 'translate-x-7' : 'translate-x-1'}`} />
                                </button>
                              ) : (
                                <>
                                  <input
                                    type='text'
                                    value={displayValue}
                                    onChange={(e) => setProfile(prev => ({
                                      ...prev,
                                      preferences: {
                                        ...prev.preferences,
                                        [key]: e.target.value
                                      }
                                    }))}
                                    placeholder={defaultProfile.preferences[key as keyof typeof defaultProfile.preferences] ?? ''}
                                    required={key !== 'totalCredits'}
                                    className={`flex-1 px-3 py-1.5 text-sm border rounded focus:ring-2 focus:border-transparent outline-none ${errors[key as keyof typeof errors] && key !== 'totalCredits' ? 'border-red-500 focus:ring-red-500 placeholder:text-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
                                  />
                                  {errors[key as keyof typeof errors] && key !== 'totalCredits' && (
                                    <p className='text-sm text-red-600 mt-1'>{errors[key as keyof typeof errors]}</p>
                                  )}
                                </>
                              )}
                            </div>
                          )
                        ) : (
                           <span className={`${key === 'totalCredits' ? 'text-2xl font-bold text-blue-700' : 'text-lg font-medium'} ${typeof value === 'boolean' ? (value ? 'text-green-600' : 'text-gray-600') : 'text-gray-900'}`}>
                             {typeof value === 'boolean' ? (value ? 'Enabled' : 'Disabled') : displayValue}
                           </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Page