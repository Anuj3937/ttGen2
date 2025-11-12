'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Users,
  UserCircle,
  Building2,
  Sparkles,
  Settings,
  Eye,
  Menu,
  X,
  Map, 
  Calendar // <-- Import New Icon
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Home', icon: Sparkles },
  { href: '/subjects', label: 'Subjects', icon: BookOpen },
  { href: '/divisions', label: 'Divisions', icon: Users },
  { href: '/faculty', label: 'Faculty', icon: UserCircle },
  { href: '/rooms', label: 'Rooms', icon: Building2 },
  { href: '/plot', label: 'Plot Load', icon: Map }, // <-- RENAMED
  { href: '/schedule', label: 'Schedule', icon: Calendar }, // <-- NEW
  { href: '/view', label: 'View Timetable', icon: Eye },
  { href: '/settings', label: 'Settings', icon: Settings },

];

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="glass-dark border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Sparkles className="w-8 h-8 text-primary-400" />
            <span className="text-xl font-bold text-gradient">
              SmartTable
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                      isActive
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'text-gray-300 hover:bg-white/10'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden py-4 space-y-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg ${
                      isActive
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </motion.div>
        )}
      </div>
    </nav>
  );
}