import React, { useEffect, useRef } from 'react';
import { CallContext } from '@/contexts/CallContext';

export default function CallModal() {
  const ctx = React.useContext(CallContext);
  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!ctx) return;
    if (localRef.current && ctx.localStream) {
      localRef.current.srcObject = ctx.localStream;
      localRef.current.muted = true;
      localRef.current.play().catch(() => {});
    }
    if (remoteRef.current && ctx.remoteStream) {
      remoteRef.current.srcObject = ctx.remoteStream;
      remoteRef.current.play().catch(() => {});
    }
  }, [ctx?.localStream, ctx?.remoteStream, ctx]);

  if (!ctx) return null;
  const show = ctx.ringing || ctx.inCall || ctx.incoming;
  if (!show) return null;

  const isVideo = ctx.callType === 'video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{ctx.incoming ? 'Incoming call' : ctx.ringing ? 'Calling…' : 'In call'}</h2>
          <div className="flex gap-2">
            {ctx.incoming && <button onClick={ctx.acceptCall} className="px-3 py-2 rounded-lg bg-green-500 text-white">Accept</button>}
            {ctx.incoming && <button onClick={ctx.rejectCall} className="px-3 py-2 rounded-lg bg-gray-200">Decline</button>}
            {!ctx.incoming && <button onClick={ctx.hangup} className="px-3 py-2 rounded-lg bg-red-500 text-white">Hang up</button>}
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="bg-gray-100 rounded-xl aspect-video flex items-center justify-center overflow-hidden">
            {isVideo ? <video ref={remoteRef} playsInline autoPlay className="w-full h-full object-cover" /> : <p>Remote audio…</p>}
          </div>
          <div className="bg-gray-100 rounded-xl aspect-video flex items-center justify-center overflow-hidden">
            {isVideo ? <video ref={localRef} muted playsInline autoPlay className="w-full h-full object-cover" /> : <p>Your microphone…</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

