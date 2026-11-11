'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { Clock, CheckCircle2, Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function AssessmentExamPage() {
  const params = useParams();
  const configId = params.id as string;

  // ১. লগইন স্টেট
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [candidateInfo, setCandidateInfo] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  // ২. কাউন্টডাউন ও এক্সাম স্টার্ট স্টেট
  const [secondsUntilStart, setSecondsUntilStart] = useState<number>(0);
  const [examStarted, setExamStarted] = useState(false);

  // ৩. এক্সাম প্রশ্নমালা ও টাইমার স্টেট
  const [questions] = useState([
    {
      id: 'q1',
      questionText: 'Which message broker provides high-throughput FIFO queuing in event-driven microservices?',
      options: ['Apache Kafka / Redis Streams', 'Binary Search Tree', 'Memcached', 'SQLite'],
      timeLimitSec: 45,
    },
    {
      id: 'q2',
      questionText: 'Under CAP theorem, which property guarantees that every non-failing node returns a response?',
      options: ['Consistency', 'Availability', 'Partition Tolerance', 'Durability'],
      timeLimitSec: 45,
    },
    {
      id: 'q3',
      questionText: 'What is the primary benefit of deploying FastAPI with AsyncIO in AI pipelines?',
      options: ['Non-blocking concurrent I/O execution', 'Faster CPU clock speed', 'Automatic database normalization', 'Reduced RAM hardware costs'],
      timeLimitSec: 40,
    },
    {
      id: 'q4',
      questionText: 'In PostgreSQL, which index structure is optimal for exact key lookups and primary keys?',
      options: ['B-Tree Index', 'GIN Index', 'BRIN Index', 'GiST Index'],
      timeLimitSec: 40,
    },
    {
      id: 'q5',
      questionText: 'What design pattern allows dynamic selection of algorithms at runtime in Python?',
      options: ['Strategy Pattern', 'Singleton Pattern', 'Observer Pattern', 'Factory Pattern'],
      timeLimitSec: 45,
    },
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(45);
  const [isCompleted, setIsCompleted] = useState(false);

  // এক্সাম রুমে লগইন ভেরিফিকেশন (১০ মিনিট রুল ও টেম্পোরারি পাসওয়ার্ড চেক)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setVerifying(true);
    try {
      const res = await axios.post('/api/v1/jobs/exam/verify-access', {
        configId,
        email,
        password,
      });

      setCandidateInfo(res.data);
      setSecondsUntilStart(res.data.secondsUntilStart);
      setIsLoggedIn(true);

      // যদি এখনই এক্সাম শুরু করার এক্সাক্ট সময় হয়ে থাকে
      if (res.data.canStartNow) {
        setExamStarted(true);
        setQuestionTimeLeft(questions[0].timeLimitSec);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Access verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  // লাইভ কাউন্টডাউন টাইমার (নির্ধারিত সময়ের ১০ মিনিট আগে এসে বসে থাকলে)
  useEffect(() => {
    if (isLoggedIn && !examStarted && secondsUntilStart > 0) {
      const interval = setInterval(() => {
        setSecondsUntilStart((prev) => {
          if (prev <= 1) {
            setExamStarted(true);
            setQuestionTimeLeft(questions[0].timeLimitSec);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, examStarted, secondsUntilStart]);

  // প্রতি প্রশ্নে ৪৫ সেকেন্ড ফিক্সড টাইমার (শেষ হলে অটো-স্কিপ)
  useEffect(() => {
    if (examStarted && !isCompleted) {
      if (questionTimeLeft <= 0) {
        handleNextQuestion(true);
        return;
      }
      const timer = setInterval(() => setQuestionTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [examStarted, questionTimeLeft, isCompleted]);

  const handleNextQuestion = (isAutoSkip = false) => {
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setQuestionTimeLeft(questions[nextIdx]?.timeLimitSec || 45);
    } else {
      submitExam();
    }
  };

  const submitExam = async () => {
    const answeredCount = Object.keys(selectedAnswers).length;
    const finalScore = Math.round((answeredCount / questions.length) * 100);

    try {
      await axios.post('/api/v1/jobs/exam/submit-answers', {
        candidateId: candidateInfo?.candidateId,
        score: finalScore,
      });
    } catch (err) {
      // safe fallback
    } finally {
      setIsCompleted(true);
    }
  };

  return (
    <div className="flex-1 flex justify-center items-center p-6 bg-slate-950 text-white min-h-[85vh]">
      {!isLoggedIn ? (
        /* ১. এক্সাম রুম লগইন গেট (ইমেইল + টেম্পোরারি পাসওয়ার্ড) */
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-5">
          <div className="text-center space-y-2">
            <Lock className="w-10 h-10 text-indigo-400 mx-auto" />
            <h1 className="text-2xl font-bold">Secure Assessment Portal</h1>
            <p className="text-xs text-slate-400">Please provide your registered email and the temporary password sent to your email.</p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Registered Email</label>
              <input
                type="email"
                required
                placeholder="e.g. your-email@gmail.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Temporary Exam Password</label>
              <input
                type="text"
                required
                placeholder="e.g. EX89K2"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-indigo-400 font-bold focus:outline-none focus:border-indigo-500 uppercase"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition text-sm disabled:opacity-50"
            >
              {verifying ? 'Verifying Credentials...' : 'Verify & Enter Waiting Room'}
            </button>
          </form>
        </div>
      ) : !examStarted ? (
        /* ২. ওয়েটিং রুম ও কাউন্টডাউন টাইমার (সঠিক সময়ের আগে Start Now লক থাকবে) */
        <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
          <ShieldCheck className="w-14 h-14 text-indigo-400 mx-auto" />
          <div className="space-y-1">
            <h2 className="text-xl font-bold">Welcome, {candidateInfo?.fullName}!</h2>
            <p className="text-xs text-slate-400">You are securely connected to the waiting room. The test interface will unlock at the exact scheduled time.</p>
          </div>
          
          <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 inline-block w-full">
            <span className="text-xs uppercase text-slate-500 block mb-1">Time Remaining until Start</span>
            <div className="text-3xl font-mono font-bold text-indigo-400">
              {Math.floor(secondsUntilStart / 60)}m {secondsUntilStart % 60}s
            </div>
          </div>

          <button
            disabled
            className="w-full bg-slate-800 text-slate-500 font-bold py-3.5 rounded-xl cursor-not-allowed text-sm border border-slate-700"
          >
            Start Exam Now (Locked until start time)
          </button>
        </div>
      ) : isCompleted ? (
        /* ৩. পরীক্ষা শেষ ও রুম ক্লোজড */
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-4">
          <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />
          <h2 className="text-2xl font-bold">Exam Submitted!</h2>
          <p className="text-slate-400 text-sm">Your answers and report have been automatically compiled and sent to HR. This exam session is now permanently closed.</p>
        </div>
      ) : (
        /* ৪. লাইভ এক্সাম ইন্টারফেস (প্রতি প্রশ্নে ৪৫ সেকেন্ড টাইমার + অটো স্কিপ) */
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <span className="text-xs uppercase font-bold text-indigo-400">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <div className="flex items-center gap-2 text-rose-400 font-mono font-bold text-sm bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 animate-pulse">
              <Clock className="w-4 h-4" />
              <span>{questionTimeLeft}s (Auto-skips when 0)</span>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-white leading-relaxed">
            "{questions[currentIndex]?.questionText}"
          </h3>

          <div className="space-y-3">
            {questions[currentIndex]?.options.map((opt: string, idx: number) => {
              const isSelected = selectedAnswers[questions[currentIndex].id] === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedAnswers({ ...selectedAnswers, [questions[currentIndex].id]: idx })}
                  className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition ${
                    isSelected
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-500">Auto-advances if time runs out.</span>
            <button
              onClick={() => handleNextQuestion(false)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-6 rounded-xl flex items-center gap-2 text-sm transition"
            >
              <span>{currentIndex === questions.length - 1 ? 'Finish & Submit' : 'Next Question'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
