'use client';

import Link from 'next/link';
import { ShieldCheck, UserCheck, Briefcase } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-40 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-indigo-400">
          <ShieldCheck className="w-6 h-6 text-indigo-500" />
          <span>Agentic HR Platform</span>
        </Link>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link href="/" className="text-slate-300 hover:text-white flex items-center gap-1.5 transition">
            <Briefcase className="w-4 h-4" />
            <span>Careers Board</span>
          </Link>
          <Link
            href="/hr/dashboard"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 transition"
          >
            <UserCheck className="w-4 h-4" />
            <span>Recruiter Portal</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
