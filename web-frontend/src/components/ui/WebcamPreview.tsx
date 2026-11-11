'use client';

import React, { forwardRef } from 'react';

interface WebcamPreviewProps {
  isRecording?: boolean;
}

const WebcamPreview = forwardRef<HTMLVideoElement, WebcamPreviewProps>(({ isRecording }, ref) => {
  return (
    <div className="relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden aspect-video flex items-center justify-center shadow-xl">
      <video ref={ref} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
      {isRecording && (
        <div className="absolute top-4 left-4 bg-rose-600/90 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-2 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-white" />
          <span>RECORDING & ANALYZING</span>
        </div>
      )}
    </div>
  );
});

WebcamPreview.displayName = 'WebcamPreview';
export default WebcamPreview;
