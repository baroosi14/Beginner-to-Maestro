import { useEffect, useState } from 'react'
import api from '../../services/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const STAT_CARDS = [
  { key: 'total_students',    label: 'Total Students',    icon: '👩‍🎓', color: 'from-blue-600 to-blue-800' },
  { key: 'active_students',   label: 'Active Students',   icon: '✅',   color: 'from-green-600 to-green-800' },
  { key: 'total_revenue',     label: 'Total Revenue',     icon: '💰',   color: 'from-yellow-600 to-yellow-800', prefix: '$' },
  { key: 'total_enrollments', label: 'Total Enrollments', icon: '📚',   color: 'from-purple-600 to-purple-800' },
  { key: 'total_courses',     label: 'Published Courses', icon: '🎓',   color: 'from-pink-600 to-pink-800' },
  { key: 'upcoming_classes',  label: 'Upcoming Classes',  icon: '📡',   color: 'from-indigo-600 to-indigo-800' },
]

export default function AdminDashboard() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/analytics').then(r => setData(r.data.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-dark-600 border-t-primary-500 rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Overview</h1>
        <p className="section-subtitle">Platform performance at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {STAT_CARDS.map(s => (
          <div key={s.key} className={`bg-gradient-to-br ${s.color} rounded-xl p-4 text-white`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-extrabold">
              {s.prefix || ''}{typeof data?.overview?.[s.key] === 'number'
                ? s.prefix === '$'
                  ? parseFloat(data.overview[s.key]).toLocaleString('en', {minimumFractionDigits:2, maximumFractionDigits:2})
                  : data.overview[s.key].toLocaleString()
                : '–'}
            </div>
            <div className="text-xs opacity-80 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue */}
        <div className="card p-6">
          <h2 className="text-white font-semibold mb-4">Monthly Revenue</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.revenue_by_month || []}>
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #2e2e4a', color: '#fff' }} />
              <Bar dataKey="revenue" fill="#c026d3" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Enrollments */}
        <div className="card p-6">
          <h2 className="text-white font-semibold mb-4">Monthly Enrollments</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data?.enrollments_by_month || []}>
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #2e2e4a', color: '#fff' }} />
              <Line type="monotone" dataKey="count" stroke="#e879f9" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top courses + Revenue by provider */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-white font-semibold mb-4">Top Courses</h2>
          <div className="space-y-3">
            {data?.top_courses?.map((c, i) => (
              <div key={c.slug} className="flex items-center gap-3">
                <span className="text-gray-400 w-5 text-sm">{i+1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{c.title}</p>
                  <div className="progress-bar mt-1">
                    <div className="progress-bar-fill"
                      style={{ width: `${data.overview.total_enrollments ? (c.enrollments / data.overview.total_enrollments * 100) : 0}%` }} />
                  </div>
                </div>
                <span className="text-gray-400 text-sm flex-shrink-0">{c.enrollments}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-white font-semibold mb-4">Revenue by Provider</h2>
          <div className="space-y-3">
            {data?.revenue_by_provider?.map(p => (
              <div key={p.provider} className="flex items-center justify-between">
                <span className="text-gray-300 capitalize">{p.provider}</span>
                <div className="flex items-center gap-4">
                  <span className="text-gray-400 text-sm">{p.count} txns</span>
                  <span className="text-white font-semibold">${parseFloat(p.revenue).toFixed(2)}</span>
                </div>
              </div>
            ))}
            {!data?.revenue_by_provider?.length && <p className="text-gray-500 text-sm">No transactions yet</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
