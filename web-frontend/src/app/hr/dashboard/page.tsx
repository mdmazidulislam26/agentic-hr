'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { PlusCircle, Users } from 'lucide-react';

export default function HRDashboardPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await axios.get('/api/v1/jobs/hr/hr-admin-demo-id');
        setJobs(res.data);
      } catch (err) {
        console.error('Failed to load jobs', err);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  return (
    <div className="max-w-6xl mx-auto w-full px-6 py-10 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">HR Talent Acquisition Dashboard</h1>
          <p className="text-slate-400 text-sm">Real-time candidate applications and AI screening overview.</p>
        </div>
        <Link
          href="/hr/jobs/create"
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post New Job</span>
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-400">Loading jobs from database...</p>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between hover:border-indigo-500/40 transition">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white">{job.title}</h2>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>{job.department}</span>
                  <span>Total Applicants: <strong className="text-emerald-400 text-sm">{job._count?.applications || 0}</strong></span>
                  <span>Status: <strong className="text-amber-400">{job.status}</strong></span>
                </div>
              </div>

              <Link
                href={`/hr/candidates/${job.id}`}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition"
              >
                <Users className="w-3.5 h-3.5" />
                <span>View Candidates ({job._count?.applications || 0})</span>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
