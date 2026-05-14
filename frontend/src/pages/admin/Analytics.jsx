import { useEffect, useState } from 'react'
import api from '../../services/api'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#c026d3','#7c3aed','#2563eb','#0891b2','#059669']

export default function Analytics() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/analytics').then(r => setData(r.data.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-dark-600 border-t-primary-500 rounded-full animate-spin" /></div>

  const providerData = data?.revenue_by_provider?.map(p => ({ name: p.provider, value: parseFloat(p.revenue) })) || []

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Analytics</h1>
        <p className="section-subtitle">Detailed platform metrics</p>
      </div>

      {/* Revenue trend */}
      <div className="card p-6">
        <h2 className="text-white font-semibold mb-4">Revenue Trend (12 months)</h2>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data?.revenue_by_month || []}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#c026d3" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#c026d3" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fill:'#6b7280', fontSize:11 }} />
            <YAxis tick={{ fill:'#6b7280', fontSize:11 }} />
            <Tooltip contentStyle={{ background:'#1a1a24', border:'1px solid #2e2e4a', color:'#fff' }} formatter={v=>[`$${parseFloat(v).toFixed(2)}`,'Revenue']} />
            <Area type="monotone" dataKey="revenue" stroke="#c026d3" strokeWidth={2} fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* New students */}
        <div className="card p-6">
          <h2 className="text-white font-semibold mb-4">New Students (30 days)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.new_students_30d || []}>
              <XAxis dataKey="date" tick={{ fill:'#6b7280', fontSize:10 }} />
              <YAxis tick={{ fill:'#6b7280', fontSize:11 }} />
              <Tooltip contentStyle={{ background:'#1a1a24', border:'1px solid #2e2e4a', color:'#fff' }} />
              <Bar dataKey="count" fill="#7c3aed" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by provider pie */}
        <div className="card p-6">
          <h2 className="text-white font-semibold mb-4">Revenue by Payment Provider</h2>
          {providerData.length > 0
            ? <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie data={providerData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                      {providerData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background:'#1a1a24', border:'1px solid #2e2e4a', color:'#fff' }} formatter={v=>[`$${parseFloat(v).toFixed(2)}`]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {providerData.map((p,i) => (
                    <div key={p.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-300 text-sm capitalize">{p.name}</span>
                      <span className="ml-auto text-white text-sm font-semibold">${p.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            : <div className="text-center py-8 text-gray-500">No payment data yet</div>
          }
        </div>
      </div>

      {/* Top courses table */}
      <div className="card p-6">
        <h2 className="text-white font-semibold mb-4">Top Courses by Enrollment</h2>
        <div className="space-y-3">
          {data?.top_courses?.length
            ? data.top_courses.map((c,i) => (
                <div key={c.slug} className="flex items-center gap-4">
                  <span className="text-gray-400 w-6 text-sm font-mono">#{i+1}</span>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{c.title}</p>
                    <div className="progress-bar mt-1.5">
                      <div className="progress-bar-fill"
                        style={{ width: data.overview.total_enrollments ? `${(c.enrollments/data.overview.total_enrollments*100)}%` : '0%' }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">{c.enrollments}</p>
                    <p className="text-gray-400 text-xs">${parseFloat(c.price).toFixed(2)}</p>
                  </div>
                </div>
              ))
            : <p className="text-gray-500 text-sm">No enrollment data yet</p>
          }
        </div>
      </div>
    </div>
  )
}
