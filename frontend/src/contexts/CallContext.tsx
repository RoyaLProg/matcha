import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { WebSocketContext } from './WebSocketContext';

type CallType = 'audio' | 'video';

interface CallState {
  inCall: boolean;
  ringing: boolean;
  incoming: boolean;
  callType: CallType | null;
  chatId: number | null;
  fromUserId?: number;
  toUserId?: number;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  error?: string | null;
}

interface StartCallArgs {
  type: CallType;
  chatId: number;
  toUserId: number;
}

interface CallContextValue extends CallState {
  startCall: (args: StartCallArgs) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  hangup: () => void;
}

export const CallContext = createContext<CallContextValue | undefined>(undefined);

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export default function CallProvider({ children }: { children: React.ReactNode }) {
  const socket = useContext(WebSocketContext);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [state, setState] = useState<CallState>({ inCall: false, ringing: false, incoming: false, callType: null, chatId: null, localStream: null, remoteStream: null, error: null });

  const cleanup = useCallback(() => {
    try { pcRef.current?.close(); } catch {}
    pcRef.current = null;
    if (state.localStream) {
      state.localStream.getTracks().forEach(t => t.stop());
    }
    setState(s => ({ ...s, inCall: false, ringing: false, incoming: false, callType: null, chatId: null, localStream: null, remoteStream: null, error: null }));
  }, [state.localStream]);

  useEffect(() => {
    if (!socket) return;
    const onOffer = async (payload: any) => {
      setState(s => ({ ...s, incoming: true, ringing: true, callType: (payload.type as CallType) ?? 'video', chatId: payload.chatId, fromUserId: payload.fromUserId }));
      (window as any).__incomingOffer = payload;
    };
    const onAnswer = async (payload: any) => {
      if (!pcRef.current) return;
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
      setState(s => ({ ...s, ringing: false, inCall: true }));
    };
    const onIce = async (payload: any) => {
      if (!pcRef.current) return;
      try { await pcRef.current.addIceCandidate(payload.candidate); } catch {}
    };
    const onHangup = () => { cleanup(); };

    socket.on('webrtc-offer', onOffer);
    socket.on('webrtc-answer', onAnswer);
    socket.on('webrtc-ice-candidate', onIce);
    socket.on('webrtc-hangup', onHangup);
    return () => {
      socket.off('webrtc-offer', onOffer);
      socket.off('webrtc-answer', onAnswer);
      socket.off('webrtc-ice-candidate', onIce);
      socket.off('webrtc-hangup', onHangup);
    };
  }, [socket, cleanup]);

  const createPeer = useCallback((type: CallType) => {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pc.onicecandidate = (ev) => {
      if (ev.candidate && socket && state.chatId) {
        socket.emit('webrtc-ice-candidate', { chatId: state.chatId, candidate: ev.candidate });
      }
    };
    pc.ontrack = (ev) => {
      const [stream] = ev.streams;
      setState(s => ({ ...s, remoteStream: stream }));
    };
    pcRef.current = pc;
    return pc;
  }, [socket, state.chatId]);

  const startCall = useCallback(async ({ type, chatId, toUserId }: StartCallArgs) => {
    if (!socket) {
      throw new Error('Socket not connected');
    }
    
    try {
      setState(s => ({ ...s, error: null }));
      const pc = createPeer(type);
      const constraints: MediaStreamConstraints = type === 'video' ? { video: true, audio: true } : { video: false, audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      setState(s => ({ ...s, callType: type, chatId, toUserId, localStream: stream, ringing: true }));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc-offer', { chatId, offer, type });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start call';
      setState(s => ({ ...s, error: errorMessage }));
      throw err;
    }
  }, [socket, createPeer]);

  const acceptCall = useCallback(async () => {
    if (!socket) {
      throw new Error('Socket not connected');
    }
    
    const incoming = (window as any).__incomingOffer;
    if (!incoming) {
      throw new Error('No incoming call to accept');
    }
    
    try {
      setState(s => ({ ...s, error: null }));
      const pc = createPeer((incoming.type as CallType) ?? 'video');
      const constraints: MediaStreamConstraints = incoming.type === 'video' ? { video: true, audio: true } : { video: false, audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      setState(s => ({ ...s, localStream: stream, chatId: incoming.chatId, callType: (incoming.type as CallType) ?? 'video', incoming: false, ringing: false }));

      await pc.setRemoteDescription(new RTCSessionDescription(incoming.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc-answer', { chatId: incoming.chatId, answer });
      (window as any).__incomingOffer = undefined;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept call';
      setState(s => ({ ...s, error: errorMessage }));
      throw err;
    }
  }, [socket, createPeer]);

  const rejectCall = useCallback(() => {
    (window as any).__incomingOffer = undefined;
    setState(s => ({ ...s, incoming: false, ringing: false, callType: null, chatId: null, error: null }));
  }, []);

  const hangup = useCallback(() => {
    if (socket && state.chatId) socket.emit('webrtc-hangup', { chatId: state.chatId });
    cleanup();
  }, [socket, state.chatId, cleanup]);

  const value = useMemo<CallContextValue>(() => ({ ...state, startCall, acceptCall, rejectCall, hangup }), [state, startCall, acceptCall, rejectCall, hangup]);

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
}

