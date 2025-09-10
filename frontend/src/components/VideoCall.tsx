import React, { useContext, useEffect, useRef, useState } from 'react';
import { CallContext } from '@/contexts/CallContext';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';

interface VideoCallProps {
  recipientName: string;
  recipientAvatar?: string;
}

const VideoCall: React.FC<VideoCallProps> = ({ recipientName, recipientAvatar }) => {
  const callCtx = useContext(CallContext);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (callCtx?.localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = callCtx.localStream;
    }
  }, [callCtx?.localStream]);

  useEffect(() => {
    if (callCtx?.remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = callCtx.remoteStream;
    }
  }, [callCtx?.remoteStream]);

  const toggleVideo = () => {
    if (callCtx?.localStream) {
      const videoTracks = callCtx.localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = isVideoMuted;
      });
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const toggleAudio = () => {
    if (callCtx?.localStream) {
      const audioTracks = callCtx.localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isAudioMuted;
      });
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const handleAccept = async () => {
    try {
      setError(null);
      await callCtx?.acceptCall();
    } catch (err) {
      setError('Failed to accept call. Please check your camera and microphone permissions.');
      console.error('Failed to accept call:', err);
    }
  };

  const handleReject = () => {
    callCtx?.rejectCall();
  };

  const handleHangup = () => {
    callCtx?.hangup();
  };

  if (!callCtx?.inCall && !callCtx?.ringing && !callCtx?.incoming) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          {recipientAvatar && (
            <img src={recipientAvatar} alt={recipientName} className="w-10 h-10 rounded-full object-cover" />
          )}
          <div>
            <h2 className="text-lg font-semibold">{recipientName}</h2>
            <p className="text-sm text-gray-300">
              {callCtx.incoming && callCtx.ringing ? 'Incoming call...' :
               callCtx.ringing ? 'Calling...' :
               callCtx.inCall ? 'Connected' : ''}
            </p>
          </div>
        </div>
        <div className="text-xs">
          {callCtx.callType === 'video' ? 'Video Call' : 'Audio Call'}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-500 text-white p-3 text-center">
          {error}
        </div>
      )}

      {/* Video area */}
      <div className="flex-1 relative">
        {callCtx.callType === 'video' ? (
          <>
            {/* Remote video (main) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Local video (small overlay) */}
            <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          </>
        ) : (
          /* Audio call display */
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-900 to-purple-900">
            <div className="text-center text-white">
              {recipientAvatar && (
                <img src={recipientAvatar} alt={recipientName} className="w-32 h-32 rounded-full object-cover mx-auto mb-4" />
              )}
              <h2 className="text-2xl font-semibold mb-2">{recipientName}</h2>
              <p className="text-gray-300">
                {callCtx.incoming && callCtx.ringing ? 'Incoming call...' :
                 callCtx.ringing ? 'Calling...' :
                 callCtx.inCall ? 'Connected' : ''}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-black/40 backdrop-blur-sm p-6">
        <div className="flex items-center justify-center gap-4">
          {/* Incoming call controls */}
          {callCtx.incoming && callCtx.ringing && (
            <>
              <button
                onClick={handleReject}
                className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
              <button
                onClick={handleAccept}
                className="w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <Phone className="w-6 h-6" />
              </button>
            </>
          )}

          {/* In-call controls */}
          {(callCtx.inCall || (callCtx.ringing && !callCtx.incoming)) && (
            <>
              {callCtx.callType === 'video' && (
                <button
                  onClick={toggleVideo}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors ${
                    isVideoMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                >
                  {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}
              
              <button
                onClick={toggleAudio}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors ${
                  isAudioMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={handleHangup}
                className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCall;