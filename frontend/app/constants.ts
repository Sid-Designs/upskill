import { IconType } from "react-icons";
import { FiUser, FiLogIn, FiUserPlus } from "react-icons/fi";
import { IoSettingsOutline } from "react-icons/io5";
import { FaArrowUp } from "react-icons/fa";
import { BsLaptopFill } from "react-icons/bs";
import { FaTools, FaHistory } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import { MdSpaceDashboard } from "react-icons/md";
import { Brain, Target, Users, Zap, Shield, CheckCircle, LucideIcon } from "lucide-react";

// Types
type NavbarItem = {
  label: string;
  href: string;
  icon: IconType;
  subItems?: NavbarItem[];
};

type FooterLink = {
  name: string;
  href: string;
};

type SocialLink = {
  href: string;
  "aria-label": string;
};

type SidebarItem = {
  label: string;
  cmpName: string;
  icon: IconType;
};

type ProfileMenuItem = {
  label: string;
  href: string;
  icon: IconType;
};

type AIFeature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type StatItem = {
  number: string;
  label: string;
};

type AITool = {
  icon: string;
  tool: string;
  description: string;
  btnText: string;
  cmpName: string;
}

// Account items (for sub-items with icons)
const guestAccountItems: NavbarItem[] = [
  { label: "Sign Up", href: "/auth/signup", icon: FiUserPlus },
  { label: "Login", href: "/auth/login", icon: FiLogIn },
];

const accountItems: NavbarItem[] = [
  { label: "Profile", href: "/profile", icon: FiUser },
  { label: "Settings", href: "/settings", icon: IoSettingsOutline },
];

// Navbar items
const navbarItems: NavbarItem[] = [
  { label: 'Home', href: '/', icon: FiUser },
  { label: 'Services', href: '/#services', icon: FiUser },
  { label: 'About', href: '/#about', icon: FiUser },
  { label: 'Dashboard', href: '/dashboard/pannel', icon: FiUser },
  { 
    label: 'Account', 
    href: '#', // Using '#' for dropdown parent items
    subItems: accountItems,
    icon: FaArrowUp
  },
];

// Footer
const footerTagline = "Your AI career partner. Plan your path, optimize your resume, build your portfolio, and create compelling cover letters.";

const websiteLinks: FooterLink[] = [
  { name: "Blog", href: "#" },
  { name: "Authors", href: "#" },
  { name: "Categories", href: "#" },
];

const legalLinks: FooterLink[] = [
  { name: "Privacy Policy", href: "#" },
  { name: "Terms of Service", href: "#" },
  { name: "Cookie Policy", href: "#" },
];

const socialLinks: SocialLink[] = [
  {
    href: "https://github.com/Sid-Designs/upskill",
    "aria-label": "Github",
  },
  {
    href: "#",
    "aria-label": "Twitter",
  },
  {
    href: "#",
    "aria-label": "Facebook",
  },
];

  // Profile menu items
  const profileMenuItems: ProfileMenuItem[] = [
    {
      label: 'Home',
      href: '/',
      icon: FiUser
    },
    {
      label: 'My Profile',
      href: '/profile',
      icon: FiUser
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: FiUser
    },
    {
      label: 'Help & Support',
      href: '/help',
      icon: FiUser
    },
    {
      label: 'Logout',
      href: '/',
      icon: FaArrowUp
    }
  ];


// Dashboard Items
const sidebarItems: SidebarItem[] = [
  {
    label: "Dashboard", 
    cmpName: "pannel", 
    icon: MdSpaceDashboard
  },
  {
    label: "Workspace", 
    cmpName: "workspace", 
    icon: BsLaptopFill
  },
  {
    label: "AI Tools", 
    cmpName: "ai-tools", 
    icon: FaTools
  },
  {
    label: "History", 
    cmpName: "history", 
    icon: FaHistory
  },
];

// AI Tools
const aiTools: AITool[] = [
  {
    icon: "https://tse3.mm.bing.net/th/id/OIP.nP7KBnKqHQr845XfZ9cJ7wHaHa?cb=ucfimg2&pid=ImgDet&ucfimg=1&w=184&h=184&c=7&dpr=1.3&o=7&rm=3",
    tool: "AI Career Advisor",
    description: "Engage with an intelligent career advisor to receive tailored guidance and instant insights for your professional journey.",
    btnText: "Start Chat",
    cmpName: "chatBot"
  },
  {
    icon: "/images/UpSkillLogoIcon.png",
    tool: "AI Cover Letter",
    description: "Craft customized cover letters that highlight your strengths and align with specific job roles using advanced AI technology.",
    btnText: "Generate Letter",
    cmpName: "coverLetter"
  },
  {
    icon: "/images/UpSkillLogoIcon.png",
    tool: "Career Pathway Generator",
    description: "Develop a structured career roadmap designed around your strengths, aspirations, and long-term professional goals.",
    btnText: "Generate Pathway",
    cmpName: "roadmap"
  },
  {
    icon: "/images/UpSkillLogoIcon.png",
    tool: "AI Cover Letter Assistant",
    description: "Produce persuasive, personalized cover letters that effectively showcase your qualifications and align with target roles.",
    btnText: "Create Letter",
    cmpName: "coverLetter"
  }
]

// HomeAbout Data
const aiFeatures: AIFeature[] = [
  {
    icon: Brain,
    title: "AI-Powered Skill Assessment",
    description: "Our intelligent system analyzes your current skills and identifies growth opportunities using machine learning algorithms.",
  },
  {
    icon: Target,
    title: "Personalized Learning Paths",
    description: "Get customized learning recommendations based on your career goals, learning style, and market demand.",
  },
  {
    icon: Users,
    title: "Smart Career Matching",
    description: "AI-driven job matching that connects you with ideal opportunities based on your skills and aspirations.",
  },
  {
    icon: Zap,
    title: "Adaptive Learning",
    description: "Content that adapts to your progress, ensuring optimal challenge and knowledge retention.",
  },
  {
    icon: Shield,
    title: "Progress Analytics",
    description: "Real-time insights into your learning journey with predictive success metrics.",
  },
];

const stats: StatItem[] = [
  { number: "50K+", label: "Active Learners" },
  { number: "95%", label: "Success Rate" },
  { number: "200+", label: "Career Paths" },
  { number: "24/7", label: "AI Support" },
];

const benefits: string[] = [
  "Personalized learning journeys tailored to your goals",
  "Real-time market insights and skill recommendations",
  "Hands-on projects and industry-relevant content",
  "Continuous skill assessment and progress tracking",
  "Career coaching and mentorship opportunities",
];

// Export
export {
  navbarItems,
  accountItems,
  guestAccountItems,
  sidebarItems,
  footerTagline,
  websiteLinks,
  legalLinks,
  socialLinks,
  aiFeatures,
  aiTools,
  stats,
  benefits,
  profileMenuItems
};

export type { NavbarItem, SidebarItem, FooterLink, SocialLink, AIFeature, AITool, StatItem, ProfileMenuItem };