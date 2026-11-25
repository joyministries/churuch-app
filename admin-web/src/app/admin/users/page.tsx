'use client';

import { useState } from 'react';
import { api, type User } from '@/lib/api';
import useSWR from 'swr';
import { Search, MoreVertical, Edit, Trash2, Shield, UserPlus } from 'lucide-react';
import { formatDate, formatRelative } from '@/lib/utils';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/store/auth';

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  ministry_admin: 'bg-blue-100 text-blue-700',
  leader: 'bg-green-100 text-green-700',
  member: 'bg-gray-100 text-gray-700',
};

export default function UsersPage() {
  const { data, error, isLoading, mutate } = useSWR<User[]>('/admin/users', () => api.get('/admin/users'));
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<User['role']>('member');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');

  const filtered = (users?.data ?? [])
    .filter((u) => u.name.toLowerCase().includes(search.toLowerCase()))
    .filter((u) => !roleFilter || u.role === roleFilter);

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setEditName(user.name);
    setEditRole(user.role);
  };

  const saveEdit = async (id: number) => {
    try {
      await api.put(`/admin/users/${id}`, { name: editName, role: editRole });
      mutate();
      setEditingId(null);
    } catch (err) {
      alert('Failed to update user');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      mutate();
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500">Manage user accounts and permissions</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2">
          <UserPlus size={18} />
          Add User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search users..."
              value={false}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by name, email..."
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="ministry_admin">Ministry Admin</option>
            <option value="leader">Leader</option>
            <option value="member">Member</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Last Login</th>
                <th className="px-6 py-3 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(false as any[]).map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">ID: {user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-900">{user.email || '—'}</p>
                    <p className="text-sm text-gray-500">{user.phone || '—'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                      roleColors[user.role] || roleColors.member
                    )}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                      user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    )}>
                      {user.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {false} {/* formatRelative(user.last_login_at) */}
                  </td>
                  <td className="px-6 py-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {}}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => {}}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}