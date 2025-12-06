import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sidebarItems } from '@/app/constants'
import { gsap, useGSAP } from '@/app/lib/gsap';
import { profileMenuItems } from '@/app/constants';

interface SidebarProps {
  selected: string;
  onSelect: (component: string) => void;
}

const Sidebar = ({ selected, onSelect }: SidebarProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<HTMLDivElement[]>([]);
  const backBtnRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const profileEmailRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const isAnimating = useRef(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const positionsCache = useRef<number[]>([]);
  const animationTimeline = useRef<gsap.core.Timeline | null>(null);
  const profileMenuTimeline = useRef<gsap.core.Timeline | null>(null);

  const selectedIndex = sidebarItems.findIndex(item => item.label === selected);

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
      return rect.top - containerRect.top + window.scrollY;
    });

    positionsCache.current = positions;
    return positions;
  };

  // GSAP animation for profile menu
  useEffect(() => {
    if (!profileMenuRef.current) return;

    // Kill any existing profile menu animations
    if (profileMenuTimeline.current) {
      profileMenuTimeline.current.kill();
    }

    if (profileMenuOpen) {
      // Show the menu first
      gsap.set(profileMenuRef.current, {
        display: 'block',
        opacity: 0,
        y: 10,
        scale: 0.95,
        transformOrigin: 'bottom center'
      });

      // Create animation timeline
      profileMenuTimeline.current = gsap.timeline({
        defaults: { ease: "power2.out" }
      });

      // Animate the entire menu
      profileMenuTimeline.current
        .to(profileMenuRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.2
        });

      // Animate the profile header section
      gsap.fromTo('.profileMenuHeader',
        { opacity: 0, y: -5 },
        { opacity: 1, y: 0, duration: 0.15, delay: 0.05 }
      );

      // Animate menu items with stagger
      gsap.fromTo('.profileMenuItem',
        { opacity: 0, x: -8 },
        {
          opacity: 1,
          x: 0,
          duration: 0.15,
          stagger: 0.03,
          delay: 0.1
        }
      );

    } else {
      // Animate menu disappearance
      if (profileMenuRef.current.style.display !== 'none') {
        profileMenuTimeline.current = gsap.timeline({
          onComplete: () => {
            if (profileMenuRef.current) {
              gsap.set(profileMenuRef.current, { display: 'none' });
            }
          }
        });

        // Animate menu items out first
        gsap.to('.profileMenuItem',
          {
            opacity: 0,
            x: -8,
            duration: 0.1,
            stagger: 0.01
          }
        );

        // Then animate the header
        const tlprofile = gsap.timeline();
        tlprofile.to(".profileMenuHeader", { opacity: 0, y: -5, duration: 0.1 }, "-=0.05");

        // Finally animate the entire menu
        profileMenuTimeline.current
          .to(profileMenuRef.current,
            {
              opacity: 0,
              y: 10,
              scale: 0.95,
              duration: 0.15
            }
          );
      }
    }

    return () => {
      if (profileMenuTimeline.current) {
        profileMenuTimeline.current.kill();
      }
    };
  }, [profileMenuOpen]);

  // Update positions on sidebar open/close
  useEffect(() => {
    const updatePositions = () => {
      positionsCache.current = [];
      calculateItemPositions();

      if (backBtnRef.current && selectedIndex >= 0) {
        const positions = calculateItemPositions();
        if (positions[selectedIndex] !== undefined) {
          gsap.to(backBtnRef.current, {
            top: positions[selectedIndex],
            duration: 0.3,
            ease: "power2.out"
          });
        }
      }
    };

    requestAnimationFrame(updatePositions);
  }, [sidebarOpen, selectedIndex]);

  // Initialize back button position
  useEffect(() => {
    const initBackButton = () => {
      if (!backBtnRef.current) return;

      gsap.killTweensOf(backBtnRef.current);

      const positions = calculateItemPositions();
      const targetPosition = selectedIndex >= 0 && positions[selectedIndex] !== undefined
        ? positions[selectedIndex]
        : positions[0] || 0;

      gsap.set(backBtnRef.current, {
        top: targetPosition,
        opacity: 1
      });
    };

    const timeoutId = setTimeout(initBackButton, 50);
    return () => clearTimeout(timeoutId);
  }, []);

  // Handle hover animations
  useEffect(() => {
    const handleMouseEnter = (index: number) => () => {
      if (!backBtnRef.current || isAnimating.current) return;

      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
        hoverTimeout.current = null;
      }

      gsap.killTweensOf(backBtnRef.current);

      const positions = calculateItemPositions();
      const targetPosition = positions[index] !== undefined ? positions[index] : index * 64;

      gsap.to(backBtnRef.current, {
        top: targetPosition,
        duration: 0.25,
        ease: "power2.out",
        overwrite: true
      });
    };

    const handleMouseLeave = () => {
      if (!backBtnRef.current) return;

      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
      }

      hoverTimeout.current = setTimeout(() => {
        if (!backBtnRef.current || isAnimating.current) return;

        gsap.killTweensOf(backBtnRef.current);

        const positions = calculateItemPositions();
        const targetPosition = selectedIndex >= 0 && positions[selectedIndex] !== undefined
          ? positions[selectedIndex]
          : positions[0] || 0;

        gsap.to(backBtnRef.current, {
          top: targetPosition,
          duration: 0.25,
          ease: "power2.out",
          overwrite: true
        });
      }, 150);
    };

    const cleanupFunctions: Array<() => void> = [];

    itemRefs.current.forEach((el, index) => {
      if (el) {
        const enterHandler = handleMouseEnter(index);
        const leaveHandler = handleMouseLeave;

        el.addEventListener("mouseenter", enterHandler);
        el.addEventListener("mouseleave", leaveHandler);

        cleanupFunctions.push(() => {
          el.removeEventListener("mouseenter", enterHandler);
          el.removeEventListener("mouseleave", leaveHandler);
        });
      }
    });

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());

      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
      }

      if (backBtnRef.current) {
        gsap.killTweensOf(backBtnRef.current);
      }
    };
  }, [sidebarOpen, selectedIndex]);

  // Handle selected item changes
  useEffect(() => {
    if (!backBtnRef.current || isAnimating.current) return;

    gsap.killTweensOf(backBtnRef.current);

    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }

    const positions = calculateItemPositions();
    const targetPosition = selectedIndex >= 0 && positions[selectedIndex] !== undefined
      ? positions[selectedIndex]
      : positions[0] || 0;

    gsap.to(backBtnRef.current, {
      top: targetPosition,
      duration: 0.3,
      ease: "power2.out",
      overwrite: true
    });
  }, [selectedIndex]);

  // Handle sidebar open/close animation
  useGSAP(() => {
    if (sidebarRef.current) {
      isAnimating.current = true;

      positionsCache.current = [];

      const tl = gsap.timeline({
        onStart: () => {
          if (backBtnRef.current) {
            gsap.killTweensOf(backBtnRef.current);
          }
        },
        onComplete: () => {
          isAnimating.current = false;

          if (backBtnRef.current && selectedIndex >= 0) {
            const positions = calculateItemPositions();
            if (positions[selectedIndex] !== undefined) {
              gsap.to(backBtnRef.current, {
                top: positions[selectedIndex],
                duration: 0.25,
                ease: "power2.out",
                delay: 0.1
              });
            }
          }
        }
      });

      tl.to(sidebarRef.current, {
        width: sidebarOpen ? 250 : 80,
        duration: 0.3,
        ease: "power2.inOut"
      });
    }
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

  const truncateEmail = (email: string, maxLength: number = 20) => {
    if (email.length <= maxLength) return email;

    const [localPart, domain] = email.split('@');
    if (!domain) return email;

    if (localPart.length > maxLength - 10) {
      return `${localPart.substring(0, maxLength - 10)}...@${domain}`;
    }

    return email;
  };

  const handleItemClick = (itemLabel: string) => {
    onSelect(itemLabel);
  };

  const handleProfileClick = () => {
    setProfileMenuOpen(!profileMenuOpen);
  };

  return (
    <div
      ref={sidebarRef}
      className={`flex justify-between items-center flex-col sidebar ${sidebarOpen ? 'sidebarOpen' : 'sidebarClose'}`}
      style={{
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        width: sidebarOpen ? '250px' : '80px'
      }}
    >
      <div className='w-full'>
        <div className="footHeader sidebarLogo cursor-pointer" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <img
            src={sidebarOpen ? '/images/UpSkillLogo.png' : '/images/UpSkillLogoIcon.png'}
            alt="UpSkill"
            className="transition-all duration-300"
          />
        </div>
        <div className="footBody flex flex-col relative gap-4" ref={containerRef}>
          {sidebarItems.map((item, idx) => (
            <div
              className={`cursor-pointer z-10 flex justify-start items-center gap-4 py-3 px-4 relative group`}
              key={idx}
              title={item.label}
              ref={(el) => {
                if (el) {
                  itemRefs.current[idx] = el;
                }
              }}
              style={{ height: '48px' }}
              onClick={() => handleItemClick(item.label)}
              onMouseEnter={() => {
                if (hoverTimeout.current) {
                  clearTimeout(hoverTimeout.current);
                  hoverTimeout.current = null;
                }
              }}
            >
              <div
                className={`sidebarIcon center min-w-[25px] transition-all duration-300 z-20`}
                style={{ width: '25px', height: '25px' }}
              >
                <item.icon
                  size={23}
                  className="transition-all duration-300"
                />
              </div>
              <div className={`sidebarLabel transition-all duration-100 ${sidebarOpen ? 'opacity-100 w-auto ml-2' : 'opacity-0 w-0'} z-20`}>
                <span className="whitespace-nowrap">{item.label}</span>
              </div>
            </div>
          ))}
          <div
            ref={backBtnRef}
            className='footBackBtn absolute z-0 left-0 right-0 bg-blue-50 rounded-lg transition-all duration-300 ease-out'
            style={{
              height: '48px',
              willChange: 'top',
              transform: 'translateZ(0)'
            }}
          ></div>
        </div>
      </div>

      <div className='footEnd w-full mt-auto relative'>
        {/* Profile Menu Dropdown - Using your existing design with GSAP animation */}
        <div
          ref={profileMenuRef}
          className="profileMenu"
          style={{
            minWidth: sidebarOpen ? '200px' : '160px',
            display: profileMenuOpen ? 'block' : 'none'
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
              <div className='font-medium text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap truncate flex items-center gap-2'>
                Siddhesh Mhaskar
              </div>

              <div
                ref={profileEmailRef}
                className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'
                title="Siddheshmhaskar05@gmail.com"
              >
                <span className="whitespace-nowrap truncate block lowercase">
                  {truncateEmail("Siddheshmhaskar05@gmail.com", 20)}
                </span>
              </div>
            </div>
          </div>
          {profileMenuItems.map((item, index) => (
            <a
              key={index}
              href={item.href || '#'}
              className={`profileMenuItem
                px-4 py-3 cursor-pointer hover:bg-gray-200
                transition-colors duration-150 border-b border-gray-100 last:border-b-0
                flex items-center gap-3
              `}
              onClick={(e) => {
                if (!item.href) {
                  e.preventDefault();
                }
                // Close menu after clicking
                setTimeout(() => setProfileMenuOpen(false), 150);
              }}
            >
              {item.icon && (
                <div className="text-gray-500 dark:text-gray-400">
                  {item.icon && <item.icon size={16} />}
                </div>
              )}
              <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                {item.label}
              </span>
            </a>
          ))}
        </div>

        <div
          className={`sidebarProfile cursor-pointer flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200 ${sidebarOpen ? 'justify-start px-4' : 'justify-center px-2'
            } ${profileMenuOpen ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
          onClick={handleProfileClick}
        >
          <div className="flex-shrink-0 relative">
            <img
              src='/images/UpSkillLogoIcon.png'
              alt='User Avatar'
              className='w-8 h-8 rounded-full object-cover min-w-8'
            />
            {profileMenuOpen && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800"></div>
            )}
          </div>

          {sidebarOpen && (
            <div className="flex flex-col min-w-0 overflow-hidden transition-all duration-300">
              <div className='font-medium text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap truncate flex items-center gap-2'>
                Siddhesh Mhaskar
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
                className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'
                title="Siddheshmhaskar05@gmail.com"
              >
                <span className="whitespace-nowrap truncate block lowercase">
                  {truncateEmail("Siddheshmhaskar05@gmail.com", sidebarOpen ? 20 : 10)}
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