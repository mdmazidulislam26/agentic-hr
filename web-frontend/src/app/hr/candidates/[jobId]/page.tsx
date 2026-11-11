'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { UserCheck, Trash2, ArrowLeft, FileText, X, Mail, Calendar, CheckCircle2, Award, Send, Sparkles, Check, AlertTriangle, Hash, Percent, CheckCircle, XCircle, Clock, Video, MessageSquare, Briefcase, MapPin, Link2, Eye, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function CandidateLeaderboardPage() {
  const params = useParams();
  const jobId = params.jobId as string;

  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [topCountInput, setTopCountInput] = useState('');
  const [topPercentInput, setTopPercentInput] = useState('');

  // মোডাল ও ট্যাব স্টেট
  const [viewingCv, setViewingCv] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'PDF' | 'ANALYSIS'>('PDF');

  // মডালসমূহ
  const [examModal, setExamModal] = useState(false);
  const [exactDateTime, setExactDateTime] = useState('');
  const [examDuration, setExamDuration] = useState(30);
  const [sendingInvite, setSendingInvite] = useState(false);

  const [passMarkModal, setPassMarkModal] = useState(false);
  const [passMarkValue, setPassMarkValue] = useState(60);
  const [settingPassMark, setSettingPassMark] = useState(false);

  const [interviewModal, setInterviewModal] = useState(false);
  const [dateX, setDateX] = useState('');
  const [dateY, setDateY] = useState('');
  const [dispatchingSlots, setDispatchingSlots] = useState(false);

  const [f2fModal, setF2fModal] = useState(false);
  const [f2fType, setF2fType] = useState('IN_PERSON');
  const [f2fDateTime, setF2fDateTime] = useState('');
  const [f2fVenueOrLink, setF2fVenueOrLink] = useState('Corporate HQ, Level 7, Silicon Tower, Dhaka');
  const [f2fContact, setF2fContact] = useState('Talent Acquisition Lead');
  const [f2fNotes, setF2fNotes] = useState('Please bring a physical copy of your updated resume.');
  const [sendingF2f, setSendingF2f] = useState(false);

  const fetchCandidates = async () => {
    try {
      const res = await axios.get(`/api/v1/jobs/${jobId}/leaderboard`);
      setCandidates(res.data);
    } catch (err) {
      console.error('Failed to load leaderboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [jobId]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === candidates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(candidates.map((c) => c.id));
    }
  };

  const handleSelectTopCount = () => {
    const n = parseInt(topCountInput, 10);
    if (isNaN(n) || n <= 0) return alert('Please enter a valid count (e.g. 5)');
    const top = candidates.slice(0, n).map((c) => c.id);
    setSelectedIds(top);
  };

  const handleSelectTopPercent = () => {
    const pct = parseFloat(topPercentInput);
    if (isNaN(pct) || pct <= 0 || pct > 100) return alert('Please enter a valid percentage between 1 and 100');
    const targetCount = Math.ceil((pct / 100) * candidates.length);
    const top = candidates.slice(0, targetCount).map((c) => c.id);
    setSelectedIds(top);
  };

  const handleSendExamInvite = async () => {
    if (!exactDateTime) return alert('Please specify exact exam date and time.');
    setSendingInvite(true);
    try {
      await axios.post(`/api/v1/jobs/${jobId}/invite-exam`, {
        selectedCandidateIds: selectedIds,
        examStartTime: new Date(exactDateTime).toISOString(),
        examDateText: new Date(exactDateTime).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" }),
        examDurationMinutes: Number(examDuration),
      });

      alert(`Official exam invitations dispatched to ${selectedIds.length} candidate(s)!`);
      setExamModal(false);
      fetchCandidates();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to dispatch exam invitations.');
    } finally {
      setSendingInvite(false);
    }
  };

  const handleSetPassMarkAndPurge = async () => {
    setSettingPassMark(true);
    try {
      const res = await axios.post(`/api/v1/jobs/${jobId}/set-passmark-and-purge`, {
        passMarks: Number(passMarkValue),
      });
      alert(res.data.message);
      setPassMarkModal(false);
      fetchCandidates();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to apply pass mark.');
    } finally {
      setSettingPassMark(false);
    }
  };

  const handleDispatchInterviewInvites = async () => {
    if (!dateX || !dateY) return alert('Please select both Start Date (X) and End Date (Y).');
    setDispatchingSlots(true);
    try {
      const res = await axios.post(`/api/v1/jobs/${jobId}/dispatch-interview-invites`, {
        interviewStartDate: new Date(dateX).toISOString(),
        interviewEndDate: new Date(dateY).toISOString(),
        slotDurationMinutes: 15,
      });
      alert(res.data.message);
      setInterviewModal(false);
      fetchCandidates();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to dispatch interview slot emails.');
    } finally {
      setDispatchingSlots(false);
    }
  };

  const handleSendF2FInvite = async () => {
    if (!f2fDateTime) return alert('Please select F2F interview date & time.');
    setSendingF2f(true);
    try {
      await axios.post(`/api/v1/jobs/${jobId}/select-f2f`, {
        selectedCandidateIds: selectedIds,
        interviewType: f2fType,
        scheduledDateTime: new Date(f2fDateTime).toISOString(),
        venueOrLink: f2fVenueOrLink,
        contactPerson: f2fContact,
        notes: f2fNotes,
      });

      alert(`Official F2F Interview letters dispatched to ${selectedIds.length} candidate(s)!`);
      setF2fModal(false);
      setSelectedIds([]);
      fetchCandidates();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to dispatch F2F invitations.');
    } finally {
      setSendingF2f(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center border-b border-slate-800 pb-6 gap-4">
        <div className="space-y-1">
          <Link href="/hr/dashboard" className="text-xs text-indigo-400 flex items-center gap-1 hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white">Recruitment & Assessment Console</h1>
          <p className="text-slate-400 text-sm">Review full candidate PDF resumes, ATS match metrics, and interview transcripts.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              if (selectedIds.length === 0) return alert('Select candidates from list first.');
              setExamModal(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-md"
          >
            <Mail className="w-4 h-4" />
            <span>Schedule Exam ({selectedIds.length})</span>
          </button>

          <button
            onClick={() => setPassMarkModal(true)}
            className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-md"
          >
            <Award className="w-4 h-4" />
            <span>Set Pass Mark & Purge</span>
          </button>

          <button
            onClick={() => setInterviewModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-md"
          >
            <Send className="w-4 h-4" />
            <span>AI Interview (X-Y)</span>
          </button>

          <button
            onClick={() => {
              if (selectedIds.length === 0) return alert('Select candidates from list first.');
              setF2fModal(true);
            }}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-lg font-bold"
          >
            <Briefcase className="w-4 h-4 text-purple-200" />
            <span>Invite to Final F2F ({selectedIds.length})</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-slate-200 hover:text-white select-none">
            <input
              type="checkbox"
              checked={candidates.length > 0 && selectedIds.length === candidates.length}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700 cursor-pointer accent-indigo-600"
            />
            <span>Select All Candidates ({candidates.length})</span>
          </label>
          {selectedIds.length > 0 && (
            <span className="text-xs bg-indigo-950/80 text-indigo-400 border border-indigo-800 px-2.5 py-1 rounded-full font-bold">
              {selectedIds.length} Selected
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1.5 pl-3">
            <Hash className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium">Top Count:</span>
            <input
              type="number"
              min="1"
              max={candidates.length || 100}
              placeholder="e.g. 5"
              value={topCountInput}
              onChange={(e) => setTopCountInput(e.target.value)}
              className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-center focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              onClick={handleSelectTopCount}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1 rounded-lg transition"
            >
              Select Top
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1.5 pl-3">
            <Percent className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium">Top Percent:</span>
            <input
              type="number"
              min="1"
              max="100"
              placeholder="e.g. 25"
              value={topPercentInput}
              onChange={(e) => setTopPercentInput(e.target.value)}
              className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-center focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              onClick={handleSelectTopPercent}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1 rounded-lg transition"
            >
              Select Top %
            </button>
          </div>

          {selectedIds.length > 0 && (
            <button
              onClick={() => setSelectedIds([])}
              className="text-slate-400 hover:text-rose-400 text-xs font-semibold underline transition ml-1"
            >
              Clear Selection
            </button>
          )}
        </div>
      </div>

      {/* Candidate Table */}
      {loading ? (
        <p className="text-slate-400">Loading candidates...</p>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase">
                <th className="p-4 text-center w-12">
                  <input
                    type="checkbox"
                    checked={candidates.length > 0 && selectedIds.length === candidates.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 cursor-pointer accent-indigo-600"
                  />
                </th>
                <th className="p-4">Candidate</th>
                <th className="p-4 text-center">ATS Score</th>
                <th className="p-4 text-center">Exam Score</th>
                <th className="p-4 text-center">AI Interview</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {candidates.map((c) => {
                const isSelected = selectedIds.includes(c.id);
                const exam = c.examResult;
                const interview = c.interviewEvaluation;
                const isF2F = c.status === 'SELECTED_FOR_F2F';

                return (
                  <tr key={c.id} className={`hover:bg-slate-800/40 transition ${isF2F ? 'bg-purple-950/15' : isSelected ? 'bg-indigo-950/20' : ''}`}>
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(c.id)}
                        className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 cursor-pointer accent-indigo-600"
                      />
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-white">{c.fullName}</div>
                      <div className="text-xs text-slate-400">{c.email}</div>
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-emerald-400">{c.atsScore}%</td>
                    
                    <td className="p-4 text-center">
                      {exam ? (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold border inline-flex items-center gap-1 ${
                          exam.isPassed
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border-rose-800'
                        }`}>
                          {exam.isPassed ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{exam.obtainedScore}% ({exam.correctAnswers}/{exam.totalQuestions})</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      {interview ? (
                        <span className={`text-xs px-3 py-1 rounded-full font-bold border inline-flex items-center gap-1.5 ${
                          interview.overallScore >= 75
                            ? 'bg-indigo-950 text-indigo-300 border-indigo-700'
                            : 'bg-amber-950 text-amber-300 border-amber-800'
                        }`}>
                          <Video className="w-3 h-3" />
                          <span>{interview.overallScore}%</span>
                          <span className="text-[10px] uppercase font-mono">({interview.aiRecommendation || 'EVALUATED'})</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>

                    <td className="p-4">
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-bold border flex items-center gap-1 w-max ${
                        c.status === 'SELECTED_FOR_F2F'
                          ? 'bg-gradient-to-r from-purple-950 to-indigo-950 text-purple-200 border-purple-500'
                          : c.status === 'INTERVIEW_COMPLETED'
                          ? 'bg-indigo-950 text-indigo-300 border-indigo-800'
                          : c.status === 'EXAM_PASSED'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {c.status === 'SELECTED_FOR_F2F' && <Sparkles className="w-3 h-3 text-purple-400" />}
                        <span>{c.status}</span>
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() => {
                          setViewingCv(c);
                          setActiveTab('PDF');
                        }}
                        className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 mx-auto transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        <span>View CV & Report</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 📄 FULL REPORT & NON-OVERFLOWING PDF MODAL */}
      {viewingCv && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-5xl w-full h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header (Fixed height) */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-3 flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <span>{viewingCv.fullName}</span>
                  <span className="text-sm bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-0.5 rounded-full font-mono font-bold">
                    {viewingCv.atsScore}% ATS Match
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Email: <strong className="text-slate-200">{viewingCv.email}</strong> • Phone: <strong className="text-slate-200">{viewingCv.phoneNumber}</strong>
                </p>
              </div>

              <button onClick={() => setViewingCv(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dual Tabs (Fixed height) */}
            <div className="flex border-b border-slate-800 gap-2 flex-shrink-0 pt-1">
              <button
                onClick={() => setActiveTab('PDF')}
                className={`pb-2 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
                  activeTab === 'PDF'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Original PDF Resume</span>
              </button>

              <button
                onClick={() => setActiveTab('ANALYSIS')}
                className={`pb-2 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
                  activeTab === 'ANALYSIS'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Evaluation & Interview Scorecard</span>
              </button>
            </div>

            {/* Tab 1: Perfect Fit Responsive PDF Viewer */}
            {activeTab === 'PDF' && (
              <div className="flex-1 min-h-0 flex flex-col space-y-2 pt-1 overflow-hidden">
                <div className="flex justify-between items-center bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs flex-shrink-0">
                  <span className="text-slate-400">Original uploaded resume:</span>
                  <a
                    href={`/api/v1/ats/resume/${viewingCv.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 underline"
                  >
                    <span>Open in New Tab / Download</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* 🎯 flex-1 + min-h-0 ensures iframe fills EXACT modal space without spilling */}
                <div className="flex-1 min-h-0 w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
                  <iframe
                    src={`/api/v1/ats/resume/${viewingCv.id}`}
                    className="w-full h-full border-0"
                    title="Candidate Resume PDF"
                  />
                </div>
              </div>
            )}

            {/* Tab 2: AI Analysis & Scorecards */}
            {activeTab === 'ANALYSIS' && (
              <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 pt-1">
                {viewingCv.interviewEvaluation ? (
                  <div className="bg-gradient-to-r from-indigo-950/70 via-slate-900 to-purple-950/70 border border-indigo-500/40 rounded-2xl p-5 shadow-xl space-y-4">
                    <div className="flex flex-wrap justify-between items-center border-b border-indigo-900/50 pb-3 gap-2">
                      <span className="text-xs uppercase font-extrabold text-indigo-300 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span>Autonomous AI Executive Interview Scorecard</span>
                      </span>
                      <span className="text-xs font-mono font-bold bg-indigo-950 border border-indigo-700 text-indigo-300 px-3 py-1 rounded-full">
                        {viewingCv.interviewEvaluation.aiRecommendation || 'EVALUATED'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
                        <span className="text-[11px] text-slate-400 uppercase block mb-1">Overall Score</span>
                        <span className="text-2xl font-bold font-mono text-emerald-400">{viewingCv.interviewEvaluation.overallScore}%</span>
                      </div>
                      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
                        <span className="text-[11px] text-slate-400 uppercase block mb-1">Technical (50%)</span>
                        <span className="text-xl font-bold font-mono text-indigo-400">{viewingCv.interviewEvaluation.technicalScore}%</span>
                      </div>
                      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
                        <span className="text-[11px] text-slate-400 uppercase block mb-1">Communication (30%)</span>
                        <span className="text-xl font-bold font-mono text-indigo-400">{viewingCv.interviewEvaluation.communicationScore}%</span>
                      </div>
                      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
                        <span className="text-[11px] text-slate-400 uppercase block mb-1">Behavioral (20%)</span>
                        <span className="text-xl font-bold font-mono text-indigo-400">{viewingCv.interviewEvaluation.behavioralScore}%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-emerald-950/30 border border-emerald-900/50 p-3.5 rounded-xl space-y-1">
                        <span className="font-bold uppercase text-emerald-400 flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Strengths</span>
                        <p className="text-slate-300 leading-relaxed">{viewingCv.interviewEvaluation.strengthsSummary}</p>
                      </div>
                      <div className="bg-rose-950/30 border border-rose-900/50 p-3.5 rounded-xl space-y-1">
                        <span className="font-bold uppercase text-rose-400 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Weaknesses</span>
                        <p className="text-slate-300 leading-relaxed">{viewingCv.interviewEvaluation.weaknessesSummary}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400">
                    AI Interview not yet completed by this candidate.
                  </div>
                )}

                {viewingCv.atsMatchSummary && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                    <span className="text-xs font-bold uppercase text-indigo-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>ATS Semantic Match Summary</span>
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {viewingCv.atsMatchSummary}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-slate-950/70 border border-emerald-900/40 rounded-xl p-3.5 space-y-2">
                    <span className="text-xs font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>Matched Skills ({viewingCv.matchedSkills?.length || 0})</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {viewingCv.matchedSkills?.map((skill: string, idx: number) => (
                        <span key={idx} className="bg-emerald-950 text-emerald-300 border border-emerald-800/80 text-xs px-2.5 py-1 rounded-lg">
                          ✓ {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-rose-900/40 rounded-xl p-3.5 space-y-2">
                    <span className="text-xs font-bold uppercase text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Missing Skills ({viewingCv.missingSkills?.length || 0})</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {viewingCv.missingSkills?.map((skill: string, idx: number) => (
                        <span key={idx} className="bg-rose-950 text-rose-300 border border-rose-800/80 text-xs px-2.5 py-1 rounded-lg">
                          ✗ {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer (Always inside the modal at the bottom) */}
            <div className="flex justify-end pt-3 border-t border-slate-800 flex-shrink-0">
              <button 
                onClick={() => setViewingCv(null)} 
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-white transition"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 📅 মোডালসমূহ (Exam, PassMark, AI Interview, F2F) */}
      {examModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur flex justify-center items-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <span>Schedule Exam with Temp Password</span>
            </h2>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Exact Date & Time</label>
              <input
                type="datetime-local"
                required
                value={exactDateTime}
                onChange={(e) => setExactDateTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button onClick={() => setExamModal(false)} className="px-4 py-2 bg-slate-800 text-xs font-semibold rounded-xl text-slate-300">Cancel</button>
              <button onClick={handleSendExamInvite} disabled={sendingInvite} className="px-5 py-2 bg-indigo-600 text-xs font-semibold rounded-xl text-white">
                {sendingInvite ? 'Sending...' : 'Dispatch Invitations'}
              </button>
            </div>
          </div>
        </div>
      )}

      {passMarkModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur flex justify-center items-center p-4 z-50">
          <div className="bg-slate-900 border border-amber-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Set Exam Pass Mark & Purge</span>
            </h2>
            <div>
              <label className="text-xs font-semibold uppercase text-slate-400">Pass Mark: {passMarkValue}%</label>
              <input
                type="range"
                min="40"
                max="90"
                step="5"
                value={passMarkValue}
                onChange={(e) => setPassMarkValue(Number(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg cursor-pointer accent-amber-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button onClick={() => setPassMarkModal(false)} className="px-4 py-2 bg-slate-800 text-xs font-semibold rounded-xl text-slate-300">Cancel</button>
              <button onClick={handleSetPassMarkAndPurge} disabled={settingPassMark} className="px-5 py-2 bg-amber-600 text-xs font-semibold rounded-xl text-white">
                {settingPassMark ? 'Processing...' : 'Apply & Purge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {interviewModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur flex justify-center items-center p-4 z-50">
          <div className="bg-slate-900 border border-emerald-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-400" />
              <span>AI Interview Invites</span>
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 mb-1 block">Start Date (X)</label>
                <input type="date" value={dateX} onChange={(e) => setDateX(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white" />
              </div>
              <div>
                <label className="text-slate-400 mb-1 block">End Date (Y)</label>
                <input type="date" value={dateY} onChange={(e) => setDateY(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button onClick={() => setInterviewModal(false)} className="px-4 py-2 bg-slate-800 text-xs font-semibold rounded-xl text-slate-300">Cancel</button>
              <button onClick={handleDispatchInterviewInvites} disabled={dispatchingSlots} className="px-5 py-2 bg-emerald-600 text-xs font-semibold rounded-xl text-white">
                {dispatchingSlots ? 'Dispatching...' : 'Dispatch Invites'}
              </button>
            </div>
          </div>
        </div>
      )}

      {f2fModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="bg-slate-900 border border-purple-500/50 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2.5 bg-purple-950 border border-purple-800 rounded-xl text-purple-400">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Schedule Final Face-to-Face Interview</h2>
                <p className="text-xs text-slate-400">Dispatch official appointment letters to {selectedIds.length} candidate(s).</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold uppercase text-slate-400 mb-1">Interview Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setF2fType('IN_PERSON');
                      setF2fVenueOrLink('Corporate HQ, Level 7, Silicon Tower, Dhaka');
                    }}
                    className={`p-2.5 rounded-xl border text-center font-bold transition flex items-center justify-center gap-1.5 ${
                      f2fType === 'IN_PERSON' ? 'bg-purple-950 text-purple-300 border-purple-600' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>In-Person (Office)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setF2fType('VIRTUAL');
                      setF2fVenueOrLink('https://meet.google.com/xyz-recruitment-board');
                    }}
                    className={`p-2.5 rounded-xl border text-center font-bold transition flex items-center justify-center gap-1.5 ${
                      f2fType === 'VIRTUAL' ? 'bg-purple-950 text-purple-300 border-purple-600' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Virtual (Meet/Zoom)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-400 mb-1">Interview Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={f2fDateTime}
                  onChange={(e) => setF2fDateTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-400 mb-1">
                  {f2fType === 'IN_PERSON' ? 'Office Location / Venue' : 'Video Conference Link (Google Meet / Zoom)'}
                </label>
                <input
                  type="text"
                  required
                  value={f2fVenueOrLink}
                  onChange={(e) => setF2fVenueOrLink(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-400 mb-1">Contact Person / HR Director</label>
                <input
                  type="text"
                  value={f2fContact}
                  onChange={(e) => setF2fContact(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-slate-400 mb-1">Instructions for Candidate</label>
                <textarea
                  rows={2}
                  value={f2fNotes}
                  onChange={(e) => setF2fNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button onClick={() => setF2fModal(false)} className="px-4 py-2 bg-slate-800 text-xs font-semibold rounded-xl text-slate-300">
                Cancel
              </button>
              <button
                onClick={handleSendF2FInvite}
                disabled={sendingF2f}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold rounded-xl text-white transition disabled:opacity-50"
              >
                {sendingF2f ? 'Dispatching Letters...' : 'Dispatch F2F Appointment Letter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
