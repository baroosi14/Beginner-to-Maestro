import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from '../components/common/Navbar'
import CourseCard from '../components/common/CourseCard'
import api from '../services/api'

const INSTRUMENTS = [
  { name: 'Piano',        icon: '🎹', slug: 'piano' },
  { name: 'Guitar',       icon: '🎸', slug: 'guitar' },
  { name: 'Violin',       icon: '🎻', slug: 'violin' },
  { name: 'Drums',        icon: '🥁', slug: 'drums' },
  { name: 'Vocals',       icon: '🎤', slug: 'vocals' },
  { name: 'Music Theory', icon: '🎼', slug: 'music-theory' },
  { name: 'Production',   icon: '🎧', slug: 'production' },
]

const STATS = [
  { value: '10,000+', label: 'Students enrolled' },
  { value: '150+',    label: 'Video lessons' },
  { value: '20+',     label: 'Expert instructors' },
  { value: '4.9★',    label: 'Average rating' },
]

export default function Home() {
  const [featured, setFeatured] = useState([])

  useEffect(() => {
    api.get('/courses?per_page=6').then(r => setFeatured(r.data.data || []))
  }, [])

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />

      {/* Hero */}
      <section className="relative hero-gradient py-24 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute text-2xl opacity-10 animate-pulse"
              style={{ left: `${Math.random()*100}%`, top: `${Math.random()*100}%`, animationDelay: `${Math.random()*3}s` }}>
              {['🎵','🎶','♪','♫'][i%4]}
            </div>
          ))}
        </div>
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary-900/40 border border-primary-700/50 rounded-full px-4 py-1.5 text-sm text-primary-300 mb-6">
            🎓 Now enrolling for 2025 cohort
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
            From <span className="gradient-text">Beginner</span><br />to <span className="gradient-text">Maestro</span>
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Master any instrument with structured lessons, live coaching, and a world-class curriculum designed for all skill levels.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary text-base px-8 py-3.5">Start Learning Free →</Link>
            <Link to="/courses"  className="btn-outline text-base px-8 py-3.5">Browse Courses</Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-dark-800 border-y border-dark-600 py-12 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-extrabold gradient-text mb-1">{s.value}</div>
              <div className="text-gray-400 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <h2 className="section-title text-center">Explore by Instrument</h2>
        <p className="section-subtitle text-center">Pick your passion and start your musical journey</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {INSTRUMENTS.map(inst => (
            <Link key={inst.slug} to={`/courses?category=${inst.slug}`}
              className="card hover:border-primary-700 transition-all p-4 text-center hover:-translate-y-1">
              <div className="text-3xl mb-2">{inst.icon}</div>
              <div className="text-white text-xs font-medium">{inst.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured courses */}
      <section className="pb-20 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="section-title">Featured Courses</h2>
            <p className="text-gray-400">Hand-picked by our expert team</p>
          </div>
          <Link to="/courses" className="btn-outline text-sm">View All →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map(c => <CourseCard key={c.id} course={c} />)}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-dark-800 border-y border-dark-600">
        <div className="max-w-5xl mx-auto">
          <h2 className="section-title text-center">How It Works</h2>
          <p className="section-subtitle text-center">Three simple steps to musical mastery</p>
          <div className="grid md:grid-cols-3 gap-8 mt-8">
            {[
              { step: '01', title: 'Create your account',   desc: 'Sign up in seconds. Get a unique Student ID and access your personalized dashboard.',    icon: '👤' },
              { step: '02', title: 'Enroll in a course',    desc: 'Browse our library and pick courses that match your skill level and musical interests.', icon: '📚' },
              { step: '03', title: 'Learn & practice',      desc: 'Watch HD video lessons, attend live classes, and track your progress in real time.',     icon: '🎯' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-900/40 border border-primary-700/50 flex items-center justify-center text-2xl">
                  {s.icon}
                </div>
                <div className="text-primary-400 text-sm font-bold mb-1">Step {s.step}</div>
                <h3 className="text-white font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 text-center hero-gradient">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-extrabold text-white mb-4">Ready to unlock your musical potential?</h2>
          <p className="text-gray-300 mb-8">Join thousands of students already on their musical journey.</p>
          <Link to="/register" className="btn-primary text-lg px-10 py-4">Get Started – It's Free</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark-800 border-t border-dark-600 py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-primary-400 font-bold text-lg gradient-text">Beginner to Maestro</div>
          <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Beginner to Maestro. All rights reserved.</p>
          <div className="flex gap-4 text-gray-500 text-sm">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
