import { useEffect, useState } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const EMPTY = { title:'', description:'', price:'0', currency:'USD', level:'beginner', is_free:false, is_published:false, thumbnail_url:'', duration_hours:'' }

export default function ManageCourses() {
  const [courses, setCourses]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(null)   // null | 'create' | 'edit'
  const [form, setForm]         = useState(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [editId, setEditId]     = useState(null)

  const fetchCourses = () => {
    setLoading(true)
    api.get('/admin/courses').then(r => setCourses(r.data.data || [])).finally(() => setLoading(false))
  }
  useEffect(fetchCourses, [])

  const openCreate = () => { setForm(EMPTY); setEditId(null); setModal('create') }
  const openEdit   = (c)  => { setForm({ title:c.title, description:c.description||'', price:c.price, currency:c.currency||'USD', level:c.level, is_free:!!c.is_free, is_published:!!c.is_published, thumbnail_url:c.thumbnail_url||'', duration_hours:c.duration_hours||'' }); setEditId(c.id); setModal('edit') }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (modal === 'create') {
        await api.post('/admin/courses', form)
        toast.success('Course created!')
      } else {
        await api.put(`/admin/courses/${editId}`, form)
        toast.success('Course updated!')
      }
      setModal(null)
      fetchCourses()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const deleteCourse = async (id) => {
    if (!confirm('Delete this course? All enrollments will be removed.')) return
    try {
      await api.delete(`/admin/courses/${id}`)
      toast.success('Course deleted')
      setCourses(cs => cs.filter(c => c.id !== id))
    } catch {
      toast.error('Delete failed')
    }
  }

  const togglePublish = async (c) => {
    try {
      await api.put(`/admin/courses/${c.id}`, { is_published: c.is_published ? 0 : 1 })
      setCourses(cs => cs.map(x => x.id === c.id ? { ...x, is_published: !x.is_published } : x))
    } catch { toast.error('Update failed') }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Courses</h1>
          <p className="section-subtitle">{courses.length} total courses</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm">+ New Course</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead className="bg-dark-600">
              <tr>
                <th className="text-left">Title</th>
                <th className="text-left">Category</th>
                <th className="text-left">Level</th>
                <th className="text-left">Price</th>
                <th className="text-left">Students</th>
                <th className="text-left">Status</th>
                <th className="text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(4)].map((_,i)=><tr key={i}><td colSpan={7}><div className="h-8 bg-dark-600 animate-pulse rounded" /></td></tr>)
                : courses.map(c => (
                    <tr key={c.id}>
                      <td>
                        <p className="text-white font-medium text-sm">{c.title}</p>
                        <p className="text-gray-500 text-xs">{c.instructor}</p>
                      </td>
                      <td>{c.category || '—'}</td>
                      <td className="capitalize">{c.level}</td>
                      <td>{c.is_free ? <span className="text-green-400">Free</span> : `$${parseFloat(c.price).toFixed(2)}`}</td>
                      <td>{c.enrollment_count || 0}</td>
                      <td>
                        <button onClick={() => togglePublish(c)}
                          className={`badge text-xs cursor-pointer ${c.is_published ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
                          {c.is_published ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="flex gap-2">
                        <button onClick={() => openEdit(c)} className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                        <button onClick={() => deleteCourse(c.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">{modal === 'create' ? 'Create Course' : 'Edit Course'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div><label className="label">Title</label><input className="input" required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} /></div>
              <div><label className="label">Description</label><textarea className="input min-h-24 resize-none" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
              <div><label className="label">Thumbnail URL</label><input className="input" type="url" value={form.thumbnail_url} onChange={e=>setForm({...form,thumbnail_url:e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Level</label>
                  <select className="input" value={form.level} onChange={e=>setForm({...form,level:e.target.value})}>
                    {['beginner','intermediate','advanced','all'].map(l=><option key={l}>{l}</option>)}
                  </select>
                </div>
                <div><label className="label">Duration (hours)</label><input className="input" type="number" step="0.5" value={form.duration_hours} onChange={e=>setForm({...form,duration_hours:e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Price</label><input className="input" type="number" step="0.01" min="0" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} /></div>
                <div><label className="label">Currency</label><select className="input" value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})}>{['USD','EUR','GBP','NGN','GHS'].map(c=><option key={c}>{c}</option>)}</select></div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_free} onChange={e=>setForm({...form,is_free:e.target.checked})} className="accent-primary-500 w-4 h-4" />
                  <span className="text-gray-300 text-sm">Free course</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_published} onChange={e=>setForm({...form,is_published:e.target.checked})} className="accent-primary-500 w-4 h-4" />
                  <span className="text-gray-300 text-sm">Published</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save Course'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
