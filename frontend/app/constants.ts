import { IconType } from "react-icons";
import { FiUser } from "react-icons/fi";
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

// Account items (for sub-items with icons)
const accountItems: NavbarItem[] = [
  { label: "Profile", href: "/profile", icon: FiUser },
  { label: "Settings", href: "/settings", icon: IoSettingsOutline },
];

// Navbar items
const navbarItems: NavbarItem[] = [
  { label: 'Home', href: '/', icon: FiUser },
  { label: 'Services', href: '/#services', icon: FiUser },
  { label: 'About', href: '/#about', icon: FiUser },
  { label: 'Dashboard', href: '/dashboard', icon: FiUser },
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
    href: "#",
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
    cmpName: "Dashboard", 
    icon: MdSpaceDashboard
  },
  {
    label: "Workspace", 
    cmpName: "Workspace", 
    icon: BsLaptopFill
  },
  {
    label: "AI Tools", 
    cmpName: "Tools", 
    icon: FaTools
  },
  {
    label: "History", 
    cmpName: "History", 
    icon: FaHistory
  },
];

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
  sidebarItems,
  footerTagline,
  websiteLinks,
  legalLinks,
  socialLinks,
  aiFeatures,
  stats,
  benefits,
  profileMenuItems
};

export type { NavbarItem, SidebarItem, FooterLink, SocialLink, AIFeature, StatItem, ProfileMenuItem };