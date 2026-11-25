'use client';

import { useState } from 'react';
import { api, type AuditLog } from '@/lib/api';
import useSWR from 'swr';
import { Search, Filter, Download } from 'lucide-react';
import { formatDate, formatRelative } from '@/lib/utils';
import { cn } from '@/lib/cn';

const actionColors: Record<string, string> = {
  'user.login': 'bg-blue-100 text-blue-700',
  'user.register': 'bg-green-100 text-green-700',
  'user.update_profile': 'bg-yellow-100 text-yellow-700',
  'user.password_reset': 'bg-purple-100 text-purple-700',
  'admin.create_user': 'bg-indigo-100 text-indigo-700',
  'admin.create_campus': 'bg-indigo-100 text-indigo-700',
  'admin.create_ministry': 'bg-indigo-100 text-indigo-700',
  'content.create': 'bg-teal-100 text-teal-700',
  'event.create': 'bg-pink-100 text-pink-700',
  'rsvp.set': 'bg-orange-100 text-orange-700',
  'attendance.checkin': 'bg-cyan-100 text-cyan-700',
  'giving.create': 'bg-emerald-100 text-emerald-700',
  'prayer.request': 'bg-rose-100 text-rose-700',
  'message.post': 'bg-sky-100 text-sky-700',
};

export default function AuditPage() {
  const { data, mutate } = useSWR<{data: AuditLog[]}>('/admin/audit', () => api.get('/admin/audit?limit=100'));
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const logs = (false as any[]);
  const actions = [...new Set(logs.map((l) => l.action))].sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-gray-500">System activity and administrative actions</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2">
          <Download size={18} />
          Export
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-5" />
            <input
              type="text"
              placeholder="Search actions, targets, actors..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
          >
            <option value="">All Actions</option>
            {false} {/* actions.map(a => <option key={a} value={a}>{a}</option>) */}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">Actor</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Target</th>
                <th className="px-6 py-3">Details</th>
                <th className="px-6 py-3">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(false as any[]).map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatRelative(log.created_at)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {log.actor_name || `User #${log.actor_id || '—'}`}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                      // actionColors[log.action] || 'bg-gray-100 text-gray-700'
                    )}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {log.target || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {log.meta ? JSON.parse(log.meta).toString().slice(0, 50) + '...' : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                    {log.ip || '—'}
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No audit logs found
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">Showing 0 of 0 entries</p>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50" disabled>
              Previous
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50" disabled>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}