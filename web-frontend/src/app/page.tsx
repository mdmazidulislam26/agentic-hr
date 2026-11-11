'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Briefcase, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      try {
        const res = await axios.get('/api/v1/jobs');
        setJobs(res.data);
      } catch (err) {
        console.error('Failed to load active jobs', err);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, []);

  return (
    <div className="max-w-6xl mx-auto w-full px-6 py-12 space-y-8">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          Next-Generation <span className="text-indigo-400">Autonomous Hiring</span>
        </h1>
        <p className="text-slate-400 text-sm">
          Submit your CV for instant sub-second ATS semantic screening, undergo dynamic psychometric assessments, and interview with our AI agent.
        </p>
      </div>

      {loading ? (
        <p className="text-center text-slate-400">Loading available openings from database...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <div key={job.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-500/50 transition">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-xs uppercase font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-900 px-3 py-1 rounded-full">
                    {job.department}
                  </span>
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{job.status}</span>
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">{job.title}</h2>
                <div className="text-xs text-slate-400 flex items-center gap-4">
                  <span>ATS Threshold: <strong className="text-slate-200">{job.minAtsScoreThreshold}%</strong></span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Closes: {new Date(job.deadline).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-800">
                <Link
                  href={`/jobs/${job.id}/apply`}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition"
                >
                  <span>Apply & Evaluate CV</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
          {jobs.length === 0 && (
            <div className="col-span-2 text-center py-12 text-slate-500">
              No active job openings available at this moment.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
