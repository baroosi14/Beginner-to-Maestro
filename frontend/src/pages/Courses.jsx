import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import CourseCard from '../components/common/CourseCard'
import api from '../services/api'

const LEVELS  = ['all','beginner','intermediate','advanced']
const CATS    = [
  { slug:'',             name:'All Instruments' },
  { slug:'piano',        name:'Piano' },
  { slug:'guitar',       name:'Guitar' },
  { slug:'violin',       name:'Violin' },
  { slug:'drums',        name:'Drums' },
  { slug:'vocals',       name:'Vocals' },
  { slug:'music-theory', name:'Music Theory' },
  { slug:'production',   name:'Production' },
]

export default function Courses() {
  const [params, setParams] = useSearchParams()
  const [courses, setCourses]     = useState([])
  const [meta, setMeta]           = useState({})
  const [loading, setLoading]     = useState(true)
  const [query, setQuery]         = useState(params.get('q') || '')
  const [category, setCategory]   = useState(params.get('category') || '')
  const [level, setLevel]         = useState(params.get('level') || '')
  const [page, setPage]           = useState(1)

  const fetchCourses = useCallback(() => {
    setLoading(true)
    const p = new URLSearchParams({ page, per_page: 12 })
    if (query)    p.set('q', query)
    if (category) p.set('category', category)
    if (level && level !== 'all') p.set('level', level)
    api.get('/courses?' + p.toString())
      .then(r => { setCourses(r.data.data); setMeta(r.data.meta) })
      .finally(() => setLoading(false))
  }, [query, category, level, page])

  useEffect(() => { fetchCourses() }, [fetchCourses])

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-white mb-2">All Courses</h1>
        <p className="text-gray-400 mb-8">
          {meta.total ? `${meta.total} courses available` : 'Explore our music library'}
        </p>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <input className="input" placeholder="Search courses..." value={query}
              onChange={e => { setQuery(e.target.value); setPage(1) }} />
          </div>
          <select className="input md:w-48" value={category} onChange={e => { setCategory(e.target.value); setPage(1) }}>
            {CATS.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
          <select className="input md:w-40" value={level} onChange={e => { setLevel(e.target.value); setPage(1) }}>
            {LEVELS.map(l => <option key={l} value={l}>{l === 'all' ? 'All Levels' : l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
          </select>
        </div>

        {/* Grid */}
        {loading
          ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_,i) => (
                <div key={i} className="card animate-pulse">
                  <div className="aspect-video bg-dark-600" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-dark-600 rounded w-3/4" />
                    <div className="h-3 bg-dark-600 rounded w-1/2" />
                    <div className="h-3 bg-dark-600 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          : courses.length === 0
            ? <div className="text-center py-20 text-gray-400">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-white font-medium text-lg">No courses found</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
              </div>
            : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {courses.map(c => <CourseCard key={c.id} course={c} />)}
              </div>
        }

        {/* Pagination */}
        {meta.total_pages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="btn-secondary text-sm px-4 py-2 disabled:opacity-40">← Prev</button>
            <span className="flex items-center px-4 text-gray-400 text-sm">Page {page} of {meta.total_pages}</span>
            <button disabled={page === meta.total_pages} onClick={() => setPage(p => p+1)} className="btn-secondary text-sm px-4 py-2 disabled:opacity-40">Next →</button>
          </div>
        )}
      </div>
    </div>
  )
}
