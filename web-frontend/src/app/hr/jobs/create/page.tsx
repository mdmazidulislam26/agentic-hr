'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Briefcase, Sliders, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateJobPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    jobDescription: '',
    requirements: '',
    deadline: '',
    minAtsScoreThreshold: 75, // ডিফল্ট ৭৫%
    hasAttitudeRound: true,
    slotDurationMinutes: 15,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/v1/jobs', {
        hrId: 'hr-admin-demo-id',
        jobData: {
          ...formData,
          minAtsScoreThreshold: Number(formData.minAtsScoreThreshold),
          slotDurationMinutes: Number(formData.slotDurationMinutes),
        },
      });
      alert('Job Requisition created successfully with custom ATS threshold!');
      router.push('/hr/dashboard');
    } catch (err) {
      alert('Failed to publish job requisition.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-6 py-10">
      <Link href="/hr/dashboard" className="text-xs text-indigo-400 flex items-center gap-1 hover:underline mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to HR Dashboard
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Post New Job Requisition</h1>
          <p className="text-slate-400 text-sm">Configure job details and set your desired custom ATS qualification threshold.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Job Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Machine Learning Engineer"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Department</label>
              <input
                type="text"
                required
                placeholder="e.g. AI & Data Science"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
          </div>

          {/* কাস্টম ATS থ্রেশহোল্ড সেট করার সেকশন */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <label className="block text-sm font-bold text-indigo-400">
                  Minimum ATS Qualification Threshold
                </label>
                <p className="text-xs text-slate-400">
                  Candidates scoring below this will be rejected in-memory and discarded from database.
                </p>
              </div>
              <span className="text-lg font-mono font-bold text-white bg-indigo-950/80 border border-indigo-800 px-3 py-1 rounded-lg">
                {formData.minAtsScoreThreshold}%
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="1"
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              value={formData.minAtsScoreThreshold}
              onChange={(e) => setFormData({ ...formData, minAtsScoreThreshold: Number(e.target.value) })}
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>50% (Lenient)</span>
              <span>75% (Default Recommended)</span>
              <span>95% (Extremely Strict)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Required Skills & Keywords</label>
            <input
              type="text"
              required
              placeholder="e.g. Python, PyTorch, Docker, LLMs, Kubernetes"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Job Description</label>
            <textarea
              rows={4}
              required
              placeholder="Describe role responsibilities and technical expectations..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              value={formData.jobDescription}
              onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Application Deadline</label>
              <input
                type="date"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">AI Interview Slot Duration</label>
              <select
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                value={formData.slotDurationMinutes}
                onChange={(e) => setFormData({ ...formData, slotDurationMinutes: Number(e.target.value) })}
              >
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes (Default)</option>
                <option value={20}>20 Minutes</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 text-sm shadow-lg shadow-indigo-600/30"
          >
            Publish Job Requisition
          </button>
        </form>
      </div>
    </div>
  );
}
