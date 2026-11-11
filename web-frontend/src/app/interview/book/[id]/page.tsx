'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { Calendar, Clock, CheckCircle2, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';

export default function BookSlotPage() {
  const params = useParams();
  const candidateId = params.id as string;
  const router = useRouter();

  const [selectedDateTime, setSelectedDateTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bookedSlot, setBookedSlot] = useState<any | null>(null);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDateTime) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await axios.post('/api/v1/jobs/interview/book-custom-slot', {
        candidateId,
        selectedDateTime: new Date(selectedDateTime).toISOString(),
      });
      setBookedSlot(res.data.slot);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to reserve interview slot.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex justify-center items-center p-6 bg-slate-950 text-white min-h-[85vh]">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        {bookedSlot ? (
          <div className="text-center space-y-5 py-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">Interview Scheduled!</h2>
              <p className="text-slate-400 text-sm">
                Your AI Interview is confirmed for:
              </p>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl mt-3 inline-block w-full">
                <span className="text-indigo-400 font-mono font-bold text-base">
                  {new Date(bookedSlot.startTime).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
                </span>
              </div>
            </div>

            <div className="bg-indigo-950/40 border border-indigo-800/60 p-4 rounded-xl text-left text-xs text-indigo-300 space-y-2">
              <p className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Interview Session Protocols:</span>
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-300">
                <li>Waiting room & hardware test opens <strong>10 minutes prior</strong> to your time.</li>
                <li>Camera and microphone will be tested before entry.</li>
                <li><strong>Late Arrival:</strong> The room will automatically expire after the window closes.</li>
              </ul>
            </div>

            <button
              onClick={() => router.push(`/interview/room/${candidateId}`)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-xl text-sm transition flex items-center justify-center gap-2"
            >
              <span>Go to Interview Waiting Room</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleBooking} className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-950/70 border border-indigo-800 rounded-xl">
                <Calendar className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Select Your Interview Time</h1>
                <p className="text-xs text-slate-400">Choose a convenient date and exact time to interview with our AI Agent.</p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase text-slate-400">
                Pick Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={selectedDateTime}
                onChange={(e) => setSelectedDateTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
              <p className="text-[11px] text-slate-500">
                You will be able to test your camera & microphone 10 minutes prior to this time.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedDateTime}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl transition text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? 'Confirming Reservation...' : 'Confirm My AI Interview Time'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
