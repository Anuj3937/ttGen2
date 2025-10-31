'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  UserCircle,
  Building2,
  Sparkles,
  Calendar,
  Clock,
  TrendingUp,
} from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'AI-powered algorithm optimizes timetable generation with constraint satisfaction',
  },
  {
    icon: Users,
    title: 'Multi-View Timetables',
    description: 'Generate division-wise, faculty-wise, and room-wise timetables simultaneously',
  },
  {
    icon: Clock,
    title: 'Time Optimization',
    description: 'Automatic workload balancing and efficient time slot allocation',
  },
  {
    icon: TrendingUp,
    title: 'Resource Analytics',
    description: 'Track vacant slots, faculty workload, and pending allocations',
  },
];

const steps = [
  {
    number: '01',
    title: 'Add Subjects',
    description: 'Input subject details with theory and practical hours',
    href: '/subjects',
    icon: BookOpen,
  },
  {
    number: '02',
    title: 'Configure Divisions',
    description: 'Set up divisions and batches for each department',
    href: '/divisions',
    icon: Users,
  },
  {
    number: '03',
    title: 'Manage Faculty',
    description: 'Add faculty members with their workload capacities',
    href: '/faculty',
    icon: UserCircle,
  },
  {
    number: '04',
    title: 'Add Rooms',
    description: 'Configure classrooms and labs availability',
    href: '/rooms',
    icon: Building2,
  },
  {
    number: '05',
    title: 'Generate',
    description: 'Create optimized timetables with one click',
    href: '/generate',
    icon: Sparkles,
  },
];

export default function HomePage() {
  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="text-center space-y-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-6xl md:text-7xl font-bold mb-6">
            <span className="text-gradient">Smart Timetable</span>
            <br />
            <span className="text-white">Generator</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Transform your college scheduling with AI-powered timetable generation.
            Handle complex constraints, multiple divisions, electives, and minors effortlessly.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/subjects">
              <motion.button
                className="btn-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started
              </motion.button>
            </Link>
            <Link href="/view">
              <motion.button
                className="btn-secondary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                View Demo
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12">
        <motion.h2
          className="text-4xl font-bold text-center mb-12 text-white"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Powerful Features
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                className="card hover:border-primary-500/50"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-12">
        <motion.h2
          className="text-4xl font-bold text-center mb-12 text-white"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          How It Works
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Link key={index} href={step.href}>
                <motion.div
                  className="card hover:border-primary-500/50 cursor-pointer group h-full"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                >
                  <div className="text-5xl font-bold text-primary-500/20 mb-4 group-hover:text-primary-500/40 transition-colors">
                    {step.number}
                  </div>
                  <Icon className="w-10 h-10 text-primary-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-white">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-400">{step.description}</p>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-center">
        <motion.div
          className="card max-w-4xl mx-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold mb-6 text-white">
            Ready to Transform Your Scheduling?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Start generating optimized timetables in minutes
          </p>
          <Link href="/subjects">
            <motion.button
              className="btn-primary text-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Now
            </motion.button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
