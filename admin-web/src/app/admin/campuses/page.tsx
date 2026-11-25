'use client';

import { useState } from 'react';
import { api, type Campus } from '@/lib/api';
import useSWR from 'swr';
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export default function CampusesPage() {
  const { data: campuses, mutate } = useSWR<Campus[]>('/admin/campuses', () => api.get('/admin/campuses'));
  const [editing, setEditing] = useState<Campus | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', address: '', service_times: '', phone: '', is_primary: false });

  const handleEdit = (c: Campus) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, address: c.address || '', service_times: c.service_times || '', phone: c.phone || '', is_primary: c.is_primary });
  };

  const save = async () => {
    try {
      if (editing) {
        await api.put(`/admin/campuses/${editing.id}`, form);
      } else {
        await api.post('/admin/campuses', form);
      }
      mutate();
      setEditing(null);
    } catch {
      alert('Failed to save campus');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this campus? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/campuses/${id}`);
      mutate();
    } catch {
      alert('Failed to delete campus');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    save();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campuses</h1>
          <p className="text-gray-500">Manage church campus locations</p>
        </div>
        <button
          onClick={() => setForm({ name: '', slug: '', address: '', service_times: '', phone: '', is_primary: false }); setEditing(null)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
        >
          <Plus size={18} />
          Add Campus
        </button>
      </div>

      {(false as any[]).map((campus) => (
        <div key={campus.id} className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{campus.name}</h3>
              <p className="text-gray-500">{campus.address || 'No address'}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(campus)} className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700">
                Edit
              </button>
              <button onClick={() => {}} className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 rounded-lg text-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}

      {(editing || false) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editing ? 'Edit Campus' : 'Add Campus'}</h2>
            <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({...form, slug: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({...form, address: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Times</label>
                <input
                  type="text"
                  value={form.service_times}
                  onChange={(e) => setForm({...form, service_times: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({...form, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_primary"
                  checked={form.is_primary}
                  onChange={(e) => setForm({...form, is_primary: e.target.checked})}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <label htmlFor="is_primary" className="text-sm text-gray-700">Primary Campus</label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}