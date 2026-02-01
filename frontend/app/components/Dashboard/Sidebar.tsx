"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { sidebarItems } from '@/app/constants'
import { gsap, useGSAP } from '@/lib/gsap';
import { profileMenuItems } from '@/app/constants';
import api from '@/lib/api';

interface SidebarProps {
  selected: string;
  onSelect: (component: string) => void;
}

// Map URL slugs to sidebar item labels
const slugToLabelMap: Record<string, string> = {
  'pannel': 'Dashboard',
  'workspace': 'Workspace',
  'ai-tools': 'AI Tools',
  'history': 'History',
  'chatbot': 'ChatBot',
  'resume-builder': 'Resume Builder',
  'roadmap': 'Roadmap',
  'cover-letter': 'Cover Letter',
  'credits': 'Credits'
};

// Map sidebar labels to URL slugs
const labelToSlugMap: Record<string, string> = {
  'Dashboard': 'dashboard',
  'Workspace': 'workspace',
  'AI Tools': 'ai-tools',
  'History': 'history',
  'ChatBot': 'chatbot',
  'Resume Builder': 'resume-builder',
  'Roadmap': 'roadmap',
  'Cover Letter': 'cover-letter',
  'Credits': 'credits'
};

const Sidebar = ({ selected, onSelect }: SidebarProps) => {
  type UserProfile = {
    username: string;
    email: string;
    role?: string;
  };

  const decodeMaybeBase64Email = (value: string) => {
    if (!value) return '';

    // Try base64 decode; if it looks invalid or lacks '@', fall back to the original value
    try {
      const decoded = typeof atob === 'function' ? atob(value) : Buffer.from(value, 'base64').toString('utf-8');
      if (decoded.includes('@')) {
        return decoded;
      }
    } catch {
      /* ignore decode errors */
    }

    return value;
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [currentHoverY, setCurrentHoverY] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({ username: 'User', email: '' });
  const sidebarRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<HTMLDivElement[]>([]);
  const backBtnRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const profileEmailRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const isAnimating = useRef(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const mouseMoveTimeout = useRef<NodeJS.Timeout | null>(null);
  const positionsCache = useRef<number[]>([]);
  const animationTimeline = useRef<gsap.core.Timeline | null>(null);
  const profileMenuTimeline = useRef<gsap.core.Timeline | null>(null);
  const lastMouseY = useRef<number>(0);
  const sidebarAnimation = useRef<gsap.core.Tween | null>(null);
  const labelAnimationTimeout = useRef<NodeJS.Timeout | null>(null);

  // Convert selected slug to label for sidebar highlighting
  const selectedLabel = slugToLabelMap[selected] || 'Dashboard';
  const selectedIndex = sidebarItems.findIndex(item => item.label === selectedLabel);
  const profileMenuList = profileMenuItems.map(item =>
    item.label === 'Logout'
      ? { ...item, href: '/auth/logout' }
      : item
  );

  // Fetch the authenticated user's profile once
  useEffect(() => {
    let active = true;
    const fetchUser = async () => {
      try {
        const response = await api.get('/api/user/me');
        const data = response.data || {};
        const user = data.user || data;
        if (!active) return;
        setUserProfile({
          username: (user.username || user.role || 'User').trim(),
          email: decodeMaybeBase64Email((user.email || '').trim()),
          role: user.role
        });
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    void fetchUser();
    return () => {
      active = false;
    };
  }, []);

  // Calculate item positions
  const calculateItemPositions = () => {
    if (!containerRef.current || itemRefs.current.length === 0) {
      return positionsCache.current.length > 0 ? positionsCache.current : [];
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const positions = itemRefs.current.map((el, index) => {
      if (!el) {
        const itemHeight = 48;
        const gap = 16;
        return index * (itemHeight + gap);
      }
      const rect = el.getBoundingClientRect();
      return rect.top - containerRect.top;
    });

    positionsCache.current = positions;
    return positions;
  };

  // Calculate smooth position based on cursor Y
  const calculateSmoothPosition = (mouseY: number): number => {
    if (!containerRef.current) return 0;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const relativeY = mouseY - containerRect.top;
    
    // Get all item positions
    const positions = calculateItemPositions();
    if (positions.length === 0) return relativeY;
    
    // Find which item the cursor is closest to
    let closestIndex = 0;
    let closestDistance = Infinity;
    
    positions.forEach((pos, index) => {
      const distance = Math.abs(relativeY - (pos + 24)); // 24 = half of item height
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    
    // Get the target position (center of the item)
    return positions[closestIndex];
  };

  // Initialize backbutton - hide first, then animate to position
  const initializeBackbutton = () => {
    if (!backBtnRef.current || isInitialized) return;

    // Start hidden
    gsap.set(backBtnRef.current, {
      opacity: 0,
      scale: 0.8
    });

    // Calculate target position based on URL
    const positions = calculateItemPositions();
    const targetIndex = selectedIndex >= 0 ? selectedIndex : 0;
    const targetPosition = positions[targetIndex] !== undefined 
      ? positions[targetIndex] 
      : targetIndex * 64;

    // Set position without showing
    gsap.set(backBtnRef.current, {
      top: targetPosition
    });

    // Animate in after a short delay
    setTimeout(() => {
      if (backBtnRef.current) {
        gsap.to(backBtnRef.current, {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: "back.out(1.2)",
          onComplete: () => {
            setIsInitialized(true);
          }
        });
      }
    }, 175);
  };

  // GSAP animation for profile menu
  useEffect(() => {
    if (!profileMenuRef.current) return;

    if (profileMenuTimeline.current) {
      profileMenuTimeline.current.kill();
    }

    if (profileMenuOpen) {
      gsap.set(profileMenuRef.current, {
        display: 'block',
        opacity: 0,
        y: 10,
        scale: 0.95
      });

      profileMenuTimeline.current = gsap.timeline()
        .to(profileMenuRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.2,
          ease: "power2.out"
        });

    } else if (profileMenuRef.current.style.display !== 'none') {
      profileMenuTimeline.current = gsap.timeline({
        onComplete: () => {
          if (profileMenuRef.current) {
            gsap.set(profileMenuRef.current, { display: 'none' });
          }
        }
      })
        .to(profileMenuRef.current, {
          opacity: 0,
          y: 10,
          scale: 0.95,
          duration: 0.15,
          ease: "power2.in"
        });
    }

    return () => {
      if (profileMenuTimeline.current) {
        profileMenuTimeline.current.kill();
      }
    };
  }, [profileMenuOpen]);

  // Initialize on mount and when sidebar opens
  useEffect(() => {
    // Reset initialization when sidebar opens
    if (sidebarOpen) {
      setIsInitialized(false);
    }

    const timer = setTimeout(() => {
      initializeBackbutton();
    }, 100);

    return () => clearTimeout(timer);
  }, [sidebarOpen, selectedIndex]);

  // Handle label animation when sidebar opens/closes
  useEffect(() => {
    if (labelAnimationTimeout.current) {
      clearTimeout(labelAnimationTimeout.current);
    }

    if (sidebarOpen) {
      // Hide labels immediately when opening starts
      setShowLabels(false);
      
      // Show labels after sidebar animation is mostly complete
      labelAnimationTimeout.current = setTimeout(() => {
        setShowLabels(true);
      }, 200); // Show labels 200ms after opening starts
    } else {
      // Hide labels immediately when closing starts
      setShowLabels(false);
    }

    return () => {
      if (labelAnimationTimeout.current) {
        clearTimeout(labelAnimationTimeout.current);
      }
    };
  }, [sidebarOpen]);

  // Handle mouse movement over the entire sidebar container
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!sidebarOpen || !containerRef.current || !backBtnRef.current || !isInitialized) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      
      // Check if mouse is inside the sidebar container
      if (
        e.clientX >= containerRect.left &&
        e.clientX <= containerRect.right &&
        e.clientY >= containerRect.top &&
        e.clientY <= containerRect.bottom
      ) {
        if (!isHovering) {
          setIsHovering(true);
        }
        
        // Update current mouse Y position
        setCurrentHoverY(e.clientY);
        lastMouseY.current = e.clientY;
        
        // Throttle the animation
        if (mouseMoveTimeout.current) {
          clearTimeout(mouseMoveTimeout.current);
        }
        
        mouseMoveTimeout.current = setTimeout(() => {
          const smoothPosition = calculateSmoothPosition(e.clientY);
          
          gsap.to(backBtnRef.current, {
            top: smoothPosition,
            duration: 0.1, // Very fast for smooth following
            ease: "power1.out",
            overwrite: true
          });
        }, 10); // 60fps
      }
    };
    
    const handleMouseLeave = (e: MouseEvent) => {
      if (!sidebarOpen || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      
      // Check if mouse left the sidebar container
      if (
        e.clientX < containerRect.left ||
        e.clientX > containerRect.right ||
        e.clientY < containerRect.top ||
        e.clientY > containerRect.bottom
      ) {
        if (isHovering) {
          setIsHovering(false);
          
          // Return to selected item
          setTimeout(() => {
            if (!backBtnRef.current || isHovering) return;
            
            const positions = calculateItemPositions();
            const targetIndex = selectedIndex >= 0 ? selectedIndex : 0;
            const targetPosition = positions[targetIndex] !== undefined 
              ? positions[targetIndex] 
              : targetIndex * 64;
            
            gsap.to(backBtnRef.current, {
              top: targetPosition,
              duration: 0.25,
              ease: "power2.out",
              overwrite: true
            });
          }, 100);
        }
      }
    };

    if (sidebarOpen) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseleave', handleMouseLeave);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      
      if (mouseMoveTimeout.current) {
        clearTimeout(mouseMoveTimeout.current);
      }
    };
  }, [sidebarOpen, isHovering, selectedIndex, isInitialized]);

  // Handle individual item hover for fallback
  const handleItemMouseEnter = (index: number) => {
    if (!sidebarOpen || !backBtnRef.current || !isInitialized) return;
    
    setIsHovering(true);
    
    const positions = calculateItemPositions();
    const targetPosition = positions[index] !== undefined 
      ? positions[index] 
      : index * 64;
    
    gsap.to(backBtnRef.current, {
      top: targetPosition,
      duration: 0.15,
      ease: "power2.out",
      overwrite: true
    });
  };

  const handleItemMouseLeave = () => {
    if (!sidebarOpen || !backBtnRef.current) return;
    
    // Only return if mouse is truly leaving (not just moving between items)
    setTimeout(() => {
      if (isHovering) return;
      
      const positions = calculateItemPositions();
      const targetIndex = selectedIndex >= 0 ? selectedIndex : 0;
      const targetPosition = positions[targetIndex] !== undefined 
        ? positions[targetIndex] 
        : targetIndex * 64;
      
      gsap.to(backBtnRef.current, {
        top: targetPosition,
        duration: 0.25,
        ease: "power2.out",
        overwrite: true
      });
    }, 50);
  };

  // Handle item click - backbutton stays on clicked item
  const handleItemClick = (itemLabel: string, index: number) => {
    // Move backbutton to clicked item immediately
    if (backBtnRef.current && sidebarOpen) {
      const positions = calculateItemPositions();
      const targetPosition = positions[index] !== undefined 
        ? positions[index] 
        : index * 64;

      // Animate to clicked position
      gsap.to(backBtnRef.current, {
        top: targetPosition,
        duration: 0.2,
        ease: "power2.out",
        overwrite: true
      });

      // Set hovering to false so it stays here
      setIsHovering(false);
      
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
        hoverTimeout.current = null;
      }
    }

    // Then trigger navigation
    const slug = labelToSlugMap[itemLabel] || 'dashboard';
    onSelect(itemLabel);
  };

  // Update backbutton when URL changes (not from hover)
  useEffect(() => {
    if (!backBtnRef.current || isHovering || !isInitialized) return;

    // Clear any pending hover timeout
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }

    const positions = calculateItemPositions();
    const targetIndex = selectedIndex >= 0 ? selectedIndex : 0;
    const targetPosition = positions[targetIndex] !== undefined 
      ? positions[targetIndex] 
      : targetIndex * 64;

    gsap.to(backBtnRef.current, {
      top: targetPosition,
      duration: 0.3,
      ease: "power2.out",
      overwrite: true
    });
  }, [selectedIndex, isHovering, isInitialized]);

  // Handle sidebar toggle click
  const handleSidebarToggle = () => {
    // Kill any ongoing sidebar animation
    if (sidebarAnimation.current) {
      sidebarAnimation.current.kill();
      sidebarAnimation.current = null;
    }

    // Set initial width based on current state
    if (sidebarRef.current) {
      const currentWidth = sidebarRef.current.offsetWidth;
      const targetWidth = sidebarOpen ? 80 : 250;
      
      // Immediately set the target width without transition
      gsap.set(sidebarRef.current, {
        width: targetWidth
      });
    }

    // Toggle the state
    setSidebarOpen(!sidebarOpen);
  };

  // Handle sidebar animation with GSAP - REMOVED CSS TRANSITION CONFLICT
  useGSAP(() => {
    if (!sidebarRef.current) return;

    isAnimating.current = true;
    positionsCache.current = [];
    setIsInitialized(false);

    // Kill any existing animation
    if (sidebarAnimation.current) {
      sidebarAnimation.current.kill();
    }

    // Create smooth animation
    sidebarAnimation.current = gsap.to(sidebarRef.current, {
      width: sidebarOpen ? 250 : 80,
      duration: 0.3,
      ease: "power2.inOut",
      onComplete: () => {
        isAnimating.current = false;
        
        // Reset hover state when sidebar closes
        if (!sidebarOpen && isHovering) {
          setIsHovering(false);
        }

        // Initialize backbutton after sidebar animation
        setTimeout(initializeBackbutton, 100);
        
        // Clear animation ref
        sidebarAnimation.current = null;
      }
    });
  }, [sidebarOpen]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('.sidebarProfile')
      ) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close profile menu when sidebar closes
  useEffect(() => {
    if (!sidebarOpen) {
      setProfileMenuOpen(false);
    }
  }, [sidebarOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
      }
      if (mouseMoveTimeout.current) {
        clearTimeout(mouseMoveTimeout.current);
      }
      if (labelAnimationTimeout.current) {
        clearTimeout(labelAnimationTimeout.current);
      }
      if (backBtnRef.current) {
        gsap.killTweensOf(backBtnRef.current);
      }
      if (sidebarAnimation.current) {
        sidebarAnimation.current.kill();
      }
    };
  }, []);

  const truncateEmail = (email: string, maxLength: number = 20) => {
    if (email.length <= maxLength) return email;
    return email.substring(0, maxLength - 3) + '...';
  };

  const formatDisplayName = (name: string) => {
    if (!name) return 'User';
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const handleProfileClick = () => {
    setProfileMenuOpen(!profileMenuOpen);
  };

  return (
    <div
      ref={sidebarRef}
      className={`flex justify-between items-center flex-col sidebar h-screen ${sidebarOpen ? 'sidebarOpen' : 'sidebarClose'}`}
      style={{
        width: sidebarOpen ? '250px' : '80px'
      }}
    >
      <div className='w-full'>
        <div className="footHeader sidebarLogo cursor-pointer" onClick={handleSidebarToggle}>
          <img
            src={sidebarOpen ? '/images/UpSkillLogo.png' : '/images/UpSkillLogoIcon.png'}
            alt="UpSkill"
            className="transition-all duration-300"
          />
        </div>
        <div 
          className="footBody flex flex-col relative gap-4" 
          ref={containerRef}
          onMouseLeave={() => setIsHovering(false)}
        >
          {sidebarItems.map((item, idx) => (
            <div
              className={`cursor-pointer hover:bg-[var(--color-secondary)] transition-all 200ms rounded-xl z-10 flex justify-start items-center gap-4 py-3 px-4 relative group ${
                selectedLabel === item.label ? 'text-blue-600' : ''
              }`}
              key={idx}
              title={item.label}
              ref={(el) => {
                if (el) {
                  itemRefs.current[idx] = el;
                }
              }}
              style={{ height: '48px' , userSelect: 'none'}}
              onClick={() => handleItemClick(item.label, idx)}
              onMouseEnter={() => handleItemMouseEnter(idx)}
              onMouseLeave={handleItemMouseLeave}
            >
              <div
                className={`sidebarIcon center min-w-[25px] transition-all duration-300 z-20 ${
                  selectedLabel === item.label ? 'text-blue-600' : ''
                }`}
                style={{ width: '25px', height: '25px' }}
              >
                <item.icon
                  size={23}
                  className="transition-all duration-300"
                />
              </div>
              <div className={`sidebarLabel transition-all ${
                sidebarOpen && showLabels 
                  ? 'opacity-100 w-auto ml-2 duration-300 flex' 
                  : 'opacity-0 w-0 duration-200 hidden'
                } z-20`}>
                <span className="whitespace-nowrap">{item.label}</span>
              </div>
            </div>
          ))}
          {/* Backbutton - hidden initially */}
          <div
            ref={backBtnRef}
            className='footBackBtn absolute z-0 left-0 right-0 bg-blue-50 rounded-lg transition-all duration-300 ease-out'
            style={{
              height: '48px',
              willChange: 'top, opacity, transform',
              transform: 'translateZ(0)',
              pointerEvents: 'none',
              opacity: 0,
              transformOrigin: 'center center'
            }}
          ></div>
        </div>
      </div>

      <div className='footEnd w-full mt-auto relative'>
        {/* Profile Menu Dropdown */}
        <div
          ref={profileMenuRef}
          className="profileMenu"
          style={{
            minWidth: sidebarOpen ? '200px' : '160px',
            display: 'none',
            position: 'absolute',
            marginBottom: '8px',
            zIndex: 50,
            overflow: 'hidden'
          }}
        >
          <div className="flex gap-2 border-b-2 pb-[8px] profileMenuHeader">
            <div className="flex-shrink-0 relative bg-gray-200 rounded-2xl flex justify-center items-center p-1">
              <img
                src='/images/UpSkillLogoIcon.png'
                alt='User Avatar'
                className='w-8 h-8 rounded-full object-cover min-w-8'
              />
            </div>
            <div className="flex flex-col min-w-0 overflow-hidden transition-all duration-300">
              <div className='font-medium text-sm text-gray-900 whitespace-nowrap truncate flex items-center gap-2'>
                {formatDisplayName(userProfile.username || 'User')}
              </div>
              <div
                ref={profileEmailRef}
                className='text-xs text-gray-500 mt-0.5'
                title={userProfile.email || 'Email not available'}
              >
                <span className="whitespace-nowrap truncate block lowercase">
                  {truncateEmail(userProfile.email || 'Email not available', 20)}
                </span>
              </div>
            </div>
          </div>
          {profileMenuList.map((item, index) => (
            <a
              key={index}
              href={item.href || '#'}
              className={`profileMenuItem
                px-4 py-3 cursor-pointer hover:bg-gray-100
                transition-colors duration-150 border-b border-gray-100 last:border-b-0
                flex items-center gap-3
              `}
              onClick={(e) => {
                if (!item.href) {
                  e.preventDefault();
                }
                setTimeout(() => setProfileMenuOpen(false), 150);
              }}
            >
              {item.icon && (
                <div className="text-gray-500">
                  {item.icon && <item.icon size={16} />}
                </div>
              )}
              <span className="text-sm text-gray-700 whitespace-nowrap">
                {item.label}
              </span>
            </a>
          ))}
        </div>

        <div
          className={`sidebarProfile cursor-pointer flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors duration-200 ${
            sidebarOpen ? 'justify-start px-4' : 'justify-center px-2'
          } ${profileMenuOpen ? 'bg-gray-100' : ''}`}
          onClick={handleProfileClick}
        >
          <div className="flex-shrink-0 relative">
            <img
              src='/images/UpSkillLogoIcon.png'
              alt='User Avatar'
              className='w-8 h-8 rounded-full object-cover min-w-8'
            />
            {profileMenuOpen && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
            )}
          </div>

          {sidebarOpen && (
            <div className="flex flex-col min-w-0 overflow-hidden transition-all duration-300">
              <div className='font-medium text-sm text-gray-900 whitespace-nowrap truncate flex items-center gap-2'>
                {formatDisplayName(userProfile.username || 'User')}
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <div
                ref={profileEmailRef}
                className='text-xs text-gray-500 mt-0.5'
                title={userProfile.email || 'Email not available'}
              >
                <span className="whitespace-nowrap truncate block lowercase">
                  {truncateEmail(userProfile.email || 'Email not available', sidebarOpen ? 20 : 10)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Sidebar