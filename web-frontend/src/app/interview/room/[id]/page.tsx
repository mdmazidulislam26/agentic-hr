'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { Clock, ArrowRight, CheckCircle, Video, Mic, Volume2, ShieldCheck, HeartHandshake } from 'lucide-react';
import WebcamPreview from '@/components/ui/WebcamPreview';

export default function InterviewRoomPage() {
  const params = useParams();
  const candidateId = params.id as string;
  const router = useRouter();

  const [loadingAccess, setLoadingAccess] = useState(true);
  const [accessData, setAccessData] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState<any | null>(null);
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isConcluded, setIsConcluded] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Connecting to Autonomous AI Interviewer...');

  const speakText = (textToSpeak: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopAllMediaTracks = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((s) => {
        mediaStreamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
        setupWebSocket();
      })
      .catch(() => {
        setStatusMessage('Camera or Microphone permission denied.');
      })
      .finally(() => setLoadingAccess(false));

    return () => {
      stopAllMediaTracks();
      if (socketRef.current) socketRef.current.close();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [candidateId]);

  const setupWebSocket = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/v1/interviews/session/${candidateId}`;
    
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setStatusMessage('Connected. Preparing tailored questions...');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'NEW_QUESTION') {
        setCurrentQuestion(data);
        setQuestionTimeLeft(data.time_limit_sec);
        setIsProcessing(false);
        speakText(data.question_text);
        startAudioRecording();
      } else if (data.type === 'PROCESSING_EVALUATION') {
        setIsProcessing(true);
        setStatusMessage(data.message || 'Evaluating responses with AI Committee...');
      } else if (data.type === 'COMPLETED') {
        setIsConcluded(true);
        setCurrentQuestion(null);
        stopAllMediaTracks(); // ক্যামেরা ও মাইক বন্ধ করা
        speakText('Thank you! Your interview has been successfully concluded and submitted to HR.');
        setStatusMessage(data.message || 'Interview successfully concluded!');
      }
    };
  };

  const startAudioRecording = () => {
    if (!mediaStreamRef.current) return;
    audioChunksRef.current = [];
    const recorder = new MediaRecorder(mediaStreamRef.current, { mimeType: 'audio/webm' });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };
    recorder.start();
  };

  const handleNextQuestion = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    setIsProcessing(true);
    mediaRecorderRef.current.stop();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      socketRef.current?.send(audioBlob);
    };
  };

  useEffect(() => {
    if (questionTimeLeft <= 0) {
      if (currentQuestion && !isProcessing && !isConcluded) {
        handleNextQuestion();
      }
      return;
    }
    const timer = setInterval(() => setQuestionTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [questionTimeLeft, currentQuestion, isProcessing, isConcluded]);

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-6 flex flex-col justify-between min-h-[85vh]">
      {isConcluded ? (
        /* 🎉 ইন্টারভিউ শেষ: থ্যাঙ্ক ইউ ও কনক্লুশন স্ক্রিন */
        <div className="my-auto max-w-xl mx-auto w-full bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle className="w-10 h-10" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-white">Thank You!</h2>
            <p className="text-sm text-slate-300">
              Your AI interview session is officially concluded. Your live voice responses have been transcribed and evaluated.
            </p>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-left text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>Next Steps:</span>
            </div>
            <p>Your performance scorecard, communication rating, and answers have been securely submitted to the HR Recruiter Console.</p>
          </div>

          <button
            onClick={() => router.push('/')}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 px-6 rounded-xl transition text-sm shadow-lg shadow-indigo-600/30"
          >
            Return to Career Home
          </button>
        </div>
      ) : (
        /* লাইভ ইন্টারভিউ গ্রিড */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
          <div className="lg:col-span-2 flex flex-col justify-center">
            <WebcamPreview ref={videoRef} isRecording={!isConcluded && !!currentQuestion} />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
            {currentQuestion ? (
              <>
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-indigo-400 uppercase bg-indigo-950/60 border border-indigo-800 px-2.5 py-1 rounded-full">
                      Question {currentQuestion.question_index} of {currentQuestion.total_questions}
                    </span>
                    <div className="flex items-center gap-1.5 text-rose-400 font-mono font-bold text-sm bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>{questionTimeLeft}s</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-indigo-400 mb-2">
                    <Volume2 className="w-4 h-4 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider">AI Interviewer Speaking:</span>
                  </div>

                  <h3 className="text-base font-semibold text-white leading-relaxed mb-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
                    "{currentQuestion.question_text}"
                  </h3>
                  <p className="text-xs text-slate-400">
                    Speak your answer clearly into your microphone. Your answer is being recorded and evaluated.
                  </p>
                </div>

                <button
                  onClick={handleNextQuestion}
                  disabled={isProcessing}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <span>{isProcessing ? 'Evaluating Voice...' : currentQuestion.question_index === currentQuestion.total_questions ? 'Submit Final Answer & Finish' : 'Submit Answer & Next Question'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="my-auto text-center space-y-3">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-slate-300 text-sm font-medium">{statusMessage}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
