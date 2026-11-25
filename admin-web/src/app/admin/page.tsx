'use client';

import { Users, MapPin, FileText, ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';
import { api, type User, type Campus, type AuditLog } from '@/lib/api';
import useSWR from 'swr';
import { formatRelative } from '@/lib/utils';
import { cn } from '@/lib/cn';

function StatCard({ title, value, change, icon: Icon, trend }: {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  trend?: 'up' | 'down';
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
          {icon && <icon className="h-6 w-6" />}
        </div>
      </div>
      {change && (
        <p className="mt-3 text-sm flex items-center gap-1">
          <span className={cn('font-medium', trend === 'up' ? 'text-green-600' : 'text-red-600')}>
            {change}
          </span>
        </p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { data: users } = useSWR<User[]>('/admin/users', () => api.get('/admin/users'));
  const { data: campuses } = useSWR<{data: any[]}>('/admin/campuses', () => api.get('/admin/campuses'));
  const { data: audit } = useSWR<{data: any[]}>('/admin/audit', () => api.get('/admin/audit?limit=5'));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your church app</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={users?.data?.length ?? 0}
          change="+12% this month"
          icon={Users}
          trend="up"
        />
        <StatCard
          title="Campuses"
          value={campuses?.data?.length ?? 0}
          icon={MapPin}
        />
        <StatCard
          title="Audit Events (24h)"
          value={audit?.data?.length ?? 0}
          change="+5% vs yesterday"
          icon={FileText}
          trend="up"
        />
        <StatCard
          title="Active Sessions"
          value="1,234"
          change="+8% this week"
          icon={FileText}
          trend="up"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {false} {/* placeholder for recent audit logs */}
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <a href="/admin/users" className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <p className="font-medium text-gray-900">Add New User</p>
              <p className="text-sm text-gray-500 mt-1">Invite a new admin or member</p>
            </a>
            <a href="/admin/campuses" className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <p className="font-medium text-gray-900">Manage Campuses</p>
              <p className="text-sm text-gray-500 mt-1">Add or edit campus locations</p>
            </a>
            <a href="/admin/audit" className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <p className="font-medium text-gray-900">View Audit Log</p>
              <p className="text-sm text-gray-500 mt-1">Review recent system activity</p>
            </a>
            <a href="/admin/analytics" className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <p className="font-medium text-gray-900">View Analytics</p>
              <p className="text-sm text-gray-500 mt-1">Check engagement metrics</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}