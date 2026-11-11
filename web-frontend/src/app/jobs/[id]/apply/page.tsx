'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { CheckCircle2, XCircle, UploadCloud, AlertCircle, Loader2 } from 'lucide-react';

export default function ApplyPage() {
  const params = useParams();
  const jobId = params.id as string;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) {
      setError('Please upload your ATS-friendly resume (PDF only).');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('job_id', jobId);
    formData.append('full_name', fullName);
    formData.append('email', email);
    formData.append('phone_number', phone);
    formData.append('resume', resumeFile);

    try {
      const response = await api.post('/ats/evaluate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Application processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex justify-center items-center p-6">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-indigo-400 mb-2">Job Application & ATS Screening</h1>
        <p className="text-slate-400 text-sm mb-6">Upload your resume to undergo instant AI match evaluation.</p>

        {error && (
          <div className="mb-6 p-4 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {result && (
          <div className={`mb-6 p-6 rounded-xl border ${result.saved_to_db ? 'bg-emerald-950/40 border-emerald-600' : 'bg-rose-950/40 border-rose-600'}`}>
            <div className="flex items-center gap-3 mb-3">
              {result.saved_to_db ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              ) : (
                <XCircle className="w-8 h-8 text-rose-400" />
              )}
              <div>
                <h3 className="text-lg font-semibold">{result.status}</h3>
                <p className="text-sm text-slate-300">ATS Match Score: <strong className="text-white text-base">{result.ats_score}%</strong></p>
              </div>
            </div>
            <p className="text-sm text-slate-300 mt-2">{result.message}</p>
          </div>
        )}

        {!result && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Phone Number</label>
              <input
                type="tel"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Resume File (PDF Only)</label>
              <div className="mt-1 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-6 text-center cursor-pointer transition relative">
                <input
                  type="file"
                  accept=".pdf"
                  required
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => setResumeFile(e.target.files ? e.target.files[0] : null)}
                />
                <UploadCloud className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-400">
                  {resumeFile ? (
                    <span className="text-indigo-400 font-semibold">{resumeFile.name}</span>
                  ) : (
                    'Click to upload or drag & drop your PDF resume'
                  )}
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl transition flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Evaluating with Groq Llama-3.3...</span>
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
