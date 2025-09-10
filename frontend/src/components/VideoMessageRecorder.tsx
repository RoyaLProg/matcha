import React, { useEffect, useRef, useState, useContext } from 'react';
import { ChatContext } from '@/contexts/ChatContext';

interface VideoMessageRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  recipientAvatar?: string;
  chatId?: number;
  onSendFile?: (file: File) => Promise<void> | void;
}

const VideoMessageRecorder: React.FC<VideoMessageRecorderProps> = ({ isOpen, onClose, recipientName, recipientAvatar, chatId, onSendFile }) => {
  const chatsCtx = useContext(ChatContext);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }
  }, [isOpen]);

  function cleanup() {
    try { mediaRecorderRef.current?.stop(); } catch {}
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
    setStream(null);
    setIsRecording(false);
  }

  function handleClose() {
    resetPreview();
    cleanup();
    onClose();
  }

  async function startRecording() {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(ms);
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = ms;
        await liveVideoRef.current.play().catch(() => {});
      }
      chunksRef.current = [];
      const mr = new MediaRecorder(ms, { mimeType: 'video/webm' });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const file = new File([blob], 'videoMessage.webm', { type: 'video/webm' });
        setPreviewFile(file);
        setPreviewUrl(URL.createObjectURL(blob));
        setIsRecording(false);
        ms.getTracks().forEach(t => t.stop());
        setStream(null);
      };
      mr.start();
      setIsRecording(true);
    } catch (e) {
      console.error('Failed to start recording:', e);
    }
  }

  function stopRecording() {
    try { mediaRecorderRef.current?.stop(); } catch (e) {
      console.error('stop error:', e);
    }
  }

  function resetPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewFile(null);
  }

  async function sendVideo() {
    if (!previewFile) return;
    setIsSending(true);
    try {
      if (chatId && chatsCtx?.sendMediaMessage) {
        await chatsCtx.sendMediaMessage(chatId, previewFile, 'video');
      } else if (onSendFile) {
        await onSendFile(previewFile);
      } else {
        console.warn('No chatId or onSendFile handler provided for VideoChat.');
      }
      resetPreview();
      onClose();
    } catch (e) {
      console.error('Failed to send video:', e);
    } finally {
      setIsSending(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {recipientAvatar && (
              <img src={recipientAvatar} alt={recipientName} className="w-10 h-10 rounded-full object-cover" />
            )}
            <h2 className="text-lg font-semibold">Record video message for {recipientName}</h2>
          </div>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-800">✕</button>
        </div>

        <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 overflow-hidden">
          {previewUrl ? (
            <video src={previewUrl} controls className="w-full h-full object-cover" />
          ) : (
            <video ref={liveVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          {!previewUrl && !isRecording && (
            <button onClick={startRecording} className="px-4 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700">Start Recording</button>
          )}
          {isRecording && (
            <button onClick={stopRecording} className="px-4 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700">Stop Recording</button>
          )}
          {previewUrl && !isRecording && (
            <>
              <button onClick={resetPreview} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700">Discard</button>
              <button disabled={isSending} onClick={sendVideo} className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-sky-500 text-white hover:from-blue-600 hover:to-sky-600 disabled:opacity-50">
                {isSending ? 'Sending…' : 'Send'}
              </button>
            </>
          )}
          <button onClick={handleClose} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700">Close</button>
        </div>
      </div>
    </div>
  );
};

export default VideoMessageRecorder;
