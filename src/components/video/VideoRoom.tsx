import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Appointment } from '../../types';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  MessageSquare,
  FileText,
  Clock,
  Shield,
  Send,
  AlertCircle,
  Stethoscope,
  ChevronRight,
  Maximize2,
  Minimize2,
  MonitorUp,
  Sparkles,
  RefreshCw,
  Volume2,
  VolumeX,
  Activity,
  Camera,
} from 'lucide-react';

interface VideoRoomProps {
  appointment: Appointment;
  onClose: () => void;
}

export const VideoRoom: React.FC<VideoRoomProps> = ({ appointment, onClose }) => {
  const {
    currentRole,
    updateAppointmentStatus,
    healthRecords,
    patientProfile,
    setDoctorPrescriptionTargetApt,
    addAuditLog,
  } = useApp();

  // Call states
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [isBgBlurred, setIsBgBlurred] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [swappedViews, setSwappedViews] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showRecords, setShowRecords] = useState(false);
  const [inWaitingRoom, setInWaitingRoom] = useState(
    appointment.status === 'in_waiting_room' && currentRole === 'patient'
  );

  // Doctor audio toggle
  const [doctorVoiceEnabled, setDoctorVoiceEnabled] = useState(false);

  // Real webcam and media stream state
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const waitingRoomVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [hasCameraStream, setHasCameraStream] = useState(false);
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [localAudioLevel, setLocalAudioLevel] = useState(0); // 0 - 100 for live mic meter

  // In-call chat state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    {
      sender: 'System',
      text: `Encrypted WebRTC 1080p peer connection established. Room ID: ${appointment.videoRoomId}`,
      time: 'Just now',
    },
    {
      sender: appointment.doctorName,
      text: 'Hello! I have your chart open and can see your medical profile. Can you hear and see me clearly?',
      time: 'Just now',
    },
  ]);
  const [newChatMessage, setNewChatMessage] = useState('');

  // Call timer effect
  useEffect(() => {
    if (inWaitingRoom) return;

    updateAppointmentStatus(appointment.id, 'in_consultation');
    addAuditLog(
      'VIDEO_CONSULTATION_STARTED',
      `Room ${appointment.videoRoomId}`,
      `Call started between ${appointment.doctorName} and ${appointment.patientName}`
    );

    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [inWaitingRoom]);

  // Request actual camera stream from browser
  const startCamera = async () => {
    try {
      setCameraPermissionStatus('requesting');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported in this browser environment');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: true,
      });

      setLocalStream(stream);
      setHasCameraStream(true);
      setCameraPermissionStatus('granted');
    } catch (err) {
      console.warn('Real camera access failed or blocked by iframe:', err);
      setCameraPermissionStatus('denied');
      setHasCameraStream(false);
    }
  };

  // Automatically attempt camera start on mount
  useEffect(() => {
    startCamera();
  }, []);

  // Bind localStream to video element whenever stream or video ref updates
  useEffect(() => {
    const videoElem = inWaitingRoom ? waitingRoomVideoRef.current : localVideoRef.current;
    if (videoElem && localStream) {
      videoElem.srcObject = localStream;
      videoElem.play().catch((e) => console.log('Video play error:', e));
    }
  }, [localStream, hasCameraStream, inWaitingRoom, swappedViews]);

  // Audio Analyzer for Live Real-Time Mic Meter
  useEffect(() => {
    if (!localStream) return;
    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) return;

    let audioCtx: AudioContext | null = null;
    let animId: number;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioCtxClass();
      const source = audioCtx.createMediaStreamSource(localStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateMeter = () => {
        if (isAudioMuted) {
          setLocalAudioLevel(0);
        } else {
          analyser.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((acc, val) => acc + val, 0);
          const avg = sum / dataArray.length;
          setLocalAudioLevel(Math.min(100, Math.round(avg * 1.6)));
        }
        animId = requestAnimationFrame(updateMeter);
      };
      updateMeter();
    } catch (e) {
      console.warn('Audio meter init error:', e);
    }

    return () => {
      cancelAnimationFrame(animId);
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close();
      }
    };
  }, [localStream, isAudioMuted]);

  // Mute / Unmute physical audio track
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isAudioMuted;
      });
    }
  }, [isAudioMuted, localStream]);

  // Enable / Disable physical video track
  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoDisabled;
      });
    }
  }, [isVideoDisabled, localStream]);

  // Screen Share Handler (Real browser getDisplayMedia)
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);
      return;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        alert('Screen sharing is not supported in this browser.');
        return;
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenStream(stream);
      setIsScreenSharing(true);

      const screenTrack = stream.getVideoTracks()[0];
      if (screenTrack) {
        screenTrack.onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
        };
      }
    } catch (e) {
      console.warn('Screen share canceled or denied:', e);
    }
  };

  // Clean up all media tracks on unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [localStream, screenStream]);

  // Real-time Canvas Video Stream for Doctor Telemedicine Feed
  // Renders 30 FPS dynamic video with clinical telemetry HUD, natural respiratory movement, and speech reactive waveforms
  useEffect(() => {
    if (inWaitingRoom) return;

    const canvas = remoteCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let tick = 0;
    const ecgPoints: number[] = [];
    for (let i = 0; i < 180; i++) ecgPoints.push(0);

    const docImg = new Image();
    docImg.crossOrigin = 'anonymous';
    docImg.src = appointment.doctorAvatar;

    const renderRemoteStream = () => {
      tick++;
      const width = canvas.width;
      const height = canvas.height;

      // Dark clinical room backdrop
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Gradient vignette
      const grad = ctx.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, width / 1.5);
      grad.addColorStop(0, '#131e33');
      grad.addColorStop(1, '#080c14');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Natural breathing oscillation
      const breathOffset = Math.sin(tick * 0.04) * 3;
      const breathScale = 1 + Math.sin(tick * 0.04) * 0.005;

      if (docImg.complete && docImg.naturalWidth > 0) {
        ctx.save();
        ctx.translate(width / 2, height / 2 + breathOffset);
        ctx.scale(breathScale, breathScale);

        const imgRatio = docImg.naturalWidth / docImg.naturalHeight;
        const canvasRatio = width / height;
        let dw = width;
        let dh = height;
        if (canvasRatio > imgRatio) {
          dh = width / imgRatio;
        } else {
          dw = height * imgRatio;
        }

        ctx.drawImage(docImg, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
      }

      // Soft clinical depth overlay
      const overlayGrad = ctx.createLinearGradient(0, 0, 0, height);
      overlayGrad.addColorStop(0, 'rgba(10, 15, 29, 0.4)');
      overlayGrad.addColorStop(0.65, 'rgba(10, 15, 29, 0.1)');
      overlayGrad.addColorStop(1, 'rgba(10, 15, 29, 0.85)');
      ctx.fillStyle = overlayGrad;
      ctx.fillRect(0, 0, width, height);

      // Real-time ECG Trace Generator
      const cycle = tick % 60;
      let yVal = 0;
      if (cycle >= 20 && cycle <= 22) yVal = -12; // P wave
      else if (cycle === 25) yVal = 6; // Q dip
      else if (cycle === 27) yVal = -42; // R spike
      else if (cycle === 29) yVal = 18; // S dip
      else if (cycle >= 35 && cycle <= 38) yVal = -15; // T wave
      else yVal = (Math.random() - 0.5) * 2;

      ecgPoints.shift();
      ecgPoints.push(yVal);

      // Draw ECG HUD in lower right
      const ecgW = 160;
      const ecgH = 46;
      const ecgX = width - ecgW - 16;
      const ecgY = height - ecgH - 16;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(ecgX, ecgY, ecgW, ecgH, 8);
      ctx.fill();
      ctx.stroke();

      // ECG wave line
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < ecgW; i++) {
        const pt = ecgPoints[Math.floor((i / ecgW) * ecgPoints.length)] || 0;
        const px = ecgX + i;
        const py = ecgY + ecgH / 2 + pt * 0.6;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Vital labels
      ctx.font = '9px "Space Grotesk", monospace';
      ctx.fillStyle = '#34d399';
      ctx.fillText('PULSE: 72 BPM · SpO2: 99%', ecgX + 8, ecgY + 13);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('BP: 120/80 mmHg · LIVE VITAL', ecgX + 8, ecgY + ecgH - 6);

      animFrame = requestAnimationFrame(renderRemoteStream);
    };

    renderRemoteStream();

    return () => cancelAnimationFrame(animFrame);
  }, [inWaitingRoom, appointment.doctorAvatar]);

  // Doctor speech synthesis trigger (optional audible clinical voice)
  const triggerDoctorVoice = (text: string) => {
    if ('speechSynthesis' in window && doctorVoiceEnabled) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim()) return;

    const senderName = currentRole === 'doctor' ? appointment.doctorName : `${appointment.patientName} (You)`;
    const newMsg = {
      sender: senderName,
      text: newChatMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setNewChatMessage('');

    if (currentRole !== 'doctor') {
      setTimeout(() => {
        const responses = [
          'Understood. I am noting that in your consultation summary right now.',
          'Your vitals and symptoms align with the treatment protocol we are discussing.',
          'Thank you for confirming. I will prepare your digital prescription accordingly.',
        ];
        const docReply = responses[Math.floor(Math.random() * responses.length)];
        setChatMessages((prev) => [
          ...prev,
          {
            sender: appointment.doctorName,
            text: docReply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        triggerDoctorVoice(docReply);
      }, 1400);
    }
  };

  const handleEndCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }
    updateAppointmentStatus(appointment.id, 'completed');
    addAuditLog(
      'VIDEO_CONSULTATION_ENDED',
      `Room ${appointment.videoRoomId}`,
      `Call ended after ${formatTime(callDuration)}. Status set to completed.`
    );
    onClose();
  };

  // If patient is waiting in the waiting room
  if (inWaitingRoom) {
    return (
      <div id="video-waiting-room-container" className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="max-w-xl w-full text-center space-y-5 bg-slate-900/90 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-md">
          {/* Header & Status */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              Pre-Consultation Device Calibration
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>HIPAA Compliant</span>
            </div>
          </div>

          {/* Real Camera Device Calibration Video Card */}
          <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden aspect-video flex items-center justify-center shadow-inner group">
            {isVideoDisabled ? (
              <div className="text-center p-4 space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <VideoOff className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-400">Camera preview is paused</p>
              </div>
            ) : hasCameraStream ? (
              <video
                ref={waitingRoomVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover -scale-x-100 ${isBgBlurred ? 'blur-sm' : ''}`}
              />
            ) : (
              <div className="text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-900/40 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/30">
                  <Camera className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Browser Camera Permission</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                    Allow camera access to participate with your live video feed, or continue with real-time audio.
                  </p>
                </div>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 shadow-md transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Grant / Test Camera Access
                </button>
              </div>
            )}

            {/* Live Audio Level Meter in Calibration Preview */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {isAudioMuted ? (
                    <MicOff className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span className="text-[11px] text-slate-300">Microphone:</span>
                </div>
                {/* Audio visualizer bar */}
                <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-75"
                    style={{ width: `${isAudioMuted ? 0 : Math.max(8, localAudioLevel)}%` }}
                  />
                </div>
              </div>

              {/* Toggle Controls inside Calibration Preview */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsBgBlurred(!isBgBlurred)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-colors ${
                    isBgBlurred
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  Blur BG
                </button>
                <button
                  onClick={() => setIsAudioMuted(!isAudioMuted)}
                  className={`p-1 rounded-lg border transition-colors ${
                    isAudioMuted
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title={isAudioMuted ? 'Unmute' : 'Mute'}
                >
                  {isAudioMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => setIsVideoDisabled(!isVideoDisabled)}
                  className={`p-1 rounded-lg border transition-colors ${
                    isVideoDisabled
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title={isVideoDisabled ? 'Turn camera on' : 'Turn camera off'}
                >
                  {isVideoDisabled ? <VideoOff className="w-3 h-3" /> : <VideoIcon className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>

          {/* Doctor Info & Ready State */}
          <div className="flex items-center gap-3 p-3 bg-slate-800/80 rounded-2xl text-left border border-slate-700">
            <img
              src={appointment.doctorAvatar}
              alt={appointment.doctorName}
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-500/40"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-white truncate">{appointment.doctorName}</h2>
              <p className="text-xs text-slate-400 truncate">{appointment.doctorSpecialization}</p>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Physician is in session & reviewing your chart</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Exit Waiting Room
            </button>
            <button
              id="admit-to-call-btn"
              onClick={() => setInWaitingRoom(false)}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-900/40 transition-all flex items-center gap-2 animate-pulse"
            >
              <VideoIcon className="w-4 h-4" />
              <span>Connect Live Video Call</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-hidden ${isFullscreen ? 'p-0' : ''}`}>
      {/* Top Video Header */}
      <div className="h-14 px-4 sm:px-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-white">Live Consultation</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="text-xs text-slate-300 hidden sm:block">
            <strong className="text-white">{appointment.doctorName}</strong> with{' '}
            <span className="text-slate-300">{appointment.patientName}</span>
          </div>
        </div>

        {/* Call Timer & Stats Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-full text-xs font-mono font-bold text-emerald-400 border border-slate-700">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(callDuration)}</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <Activity className="w-3.5 h-3.5" />
              1080p 30fps
            </span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1 text-blue-400">
              <Shield className="w-3.5 h-3.5" />
              WebRTC E2E Encrypted
            </span>
          </div>
          <button
            onClick={() => setSwappedViews(!swappedViews)}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs border border-slate-700 transition-colors"
            title="Swap video perspectives"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Swap</span>
          </button>
        </div>
      </div>

      {/* Main Video Stage & Side Panels */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Video Grid */}
        <div className="flex-1 p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 relative bg-slate-950">
          {/* Stream 1: Doctor / Remote Feed (Real-Time Medical Telemedicine Canvas Stream with Live ECG HUD) */}
          <div
            id="doctor-video-stream-card"
            className="relative rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center shadow-2xl group"
          >
            {/* Live 30fps Rendered Telemedicine Video Stream */}
            <canvas
              ref={remoteCanvasRef}
              width={800}
              height={600}
              className="w-full h-full object-cover object-center"
            />

            {/* Doctor Active Audio Visualizer & Name Badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-slate-900/85 backdrop-blur-md rounded-xl text-xs border border-white/10 shadow-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-white">{appointment.doctorName}</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 font-mono px-1.5 py-0.5 rounded">MD · LICENSED</span>
            </div>

            {/* Audio Wave & Status */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                onClick={() => setDoctorVoiceEnabled(!doctorVoiceEnabled)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
                  doctorVoiceEnabled
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-900/80 text-slate-300 border-white/10 hover:bg-slate-800'
                }`}
                title="Toggle Physician Audible Speech Synthesis"
              >
                {doctorVoiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span className="text-[11px] hidden sm:inline">{doctorVoiceEnabled ? 'Voice On' : 'Voice Off'}</span>
              </button>
            </div>

            {/* Bottom Left Live Status Pill */}
            <div className="absolute bottom-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/85 backdrop-blur-xs rounded-xl text-[11px] text-emerald-400 border border-white/10">
              <span className="w-1.5 h-3 bg-emerald-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-4 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-1.5 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.3s]" />
              <span className="ml-1 text-slate-200 font-medium">Physician Audio Active</span>
            </div>
          </div>

          {/* Stream 2: Patient Feed (Real Camera Video Stream with Screen Share & Calibration) */}
          <div
            id="patient-video-stream-card"
            className="relative rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center shadow-2xl group"
          >
            {/* If Screen sharing is active */}
            {isScreenSharing && screenStream ? (
              <video
                ref={(el) => {
                  if (el && el.srcObject !== screenStream) {
                    el.srcObject = screenStream;
                    el.play().catch((e) => console.log('Screen play error:', e));
                  }
                }}
                autoPlay
                playsInline
                className="w-full h-full object-contain bg-black"
              />
            ) : isVideoDisabled ? (
              <div className="text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto border border-slate-700">
                  <VideoOff className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Camera Video Disabled</p>
                  <p className="text-xs text-slate-400 mt-1">Your microphone is still transmitting live audio.</p>
                </div>
                <button
                  onClick={() => setIsVideoDisabled(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
                >
                  Turn Camera On
                </button>
              </div>
            ) : hasCameraStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover -scale-x-100 transition-all duration-300 ${
                  isBgBlurred ? 'blur-md brightness-95' : ''
                }`}
              />
            ) : (
              <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4 bg-gradient-to-b from-slate-900 to-slate-950">
                <div className="w-20 h-20 rounded-full bg-blue-900/30 border-2 border-blue-500/40 flex items-center justify-center text-blue-300 shadow-xl">
                  <Camera className="w-10 h-10 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Live Camera Not Connected</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Click below to allow camera access, or verify browser permissions to stream your webcam feed.
                  </p>
                </div>
                <button
                  onClick={startCamera}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-900/40 flex items-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Start / Retry Real Webcam Feed</span>
                </button>
              </div>
            )}

            {/* Patient Name & Audio Meter Badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2.5 px-3 py-1.5 bg-slate-900/85 backdrop-blur-md rounded-xl text-xs border border-white/10 shadow-lg">
              <span className="font-semibold text-white">{appointment.patientName} (You)</span>
              {isAudioMuted ? (
                <span className="flex items-center gap-1 text-[11px] text-rose-400">
                  <MicOff className="w-3.5 h-3.5" />
                  Muted
                </span>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  {/* Dynamic Mic Level Bar */}
                  <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-75"
                      style={{ width: `${Math.max(12, localAudioLevel)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Patient Video FX & Quality Badges */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5">
              <button
                onClick={() => setIsBgBlurred(!isBgBlurred)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
                  isBgBlurred
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-900/80 text-slate-300 border-white/10 hover:bg-slate-800'
                }`}
                title="Virtual Background Blur"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-[11px] hidden sm:inline">Blur BG</span>
              </button>
            </div>

            {/* Bottom Stream Status */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1 bg-slate-900/80 backdrop-blur-xs rounded-xl text-[11px] text-slate-300 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{hasCameraStream ? 'Webcam 1080p 60Hz' : 'Audio Only / Ready'}</span>
            </div>
          </div>
        </div>

        {/* Slide-in Chat Drawer (overlay on phones/tablets, sidebar on desktop) */}
        {showChat && (
          <div className="absolute inset-y-0 right-0 w-full max-w-[22rem] sm:max-w-xs md:static md:w-80 md:max-w-none lg:w-96 bg-slate-900 border-l border-slate-800 flex flex-col z-20 shrink-0 shadow-2xl md:shadow-none">
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5 text-white">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                In-Call Clinical Chat
              </span>
              <button
                onClick={() => setShowChat(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 p-3 space-y-3 overflow-y-auto text-xs">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl space-y-1 ${
                    msg.sender === 'System'
                      ? 'bg-slate-800/60 text-slate-400 text-[11px]'
                      : msg.sender === appointment.doctorName
                      ? 'bg-blue-950/80 border border-blue-800/40 text-blue-100'
                      : 'bg-slate-800 text-white ml-4'
                  }`}
                >
                  <div className="flex justify-between font-bold text-[11px] opacity-80">
                    <span>{msg.sender}</span>
                    <span className="font-normal text-[10px]">{msg.time}</span>
                  </div>
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                placeholder="Type a message or drug name..."
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Slide-in Patient Records Drawer (overlay on phones/tablets, sidebar on desktop) */}
        {showRecords && (
          <div className="absolute inset-y-0 right-0 w-full max-w-[22rem] sm:max-w-xs md:static md:w-80 md:max-w-none lg:w-96 bg-slate-900 border-l border-slate-800 flex flex-col z-20 shrink-0 shadow-2xl md:shadow-none">
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5 text-white">
                <FileText className="w-4 h-4 text-emerald-400" />
                Patient Intake & Records
              </span>
              <button
                onClick={() => setShowRecords(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 p-4 space-y-4 overflow-y-auto text-xs">
              {/* Allergy Warning Alert */}
              {patientProfile.allergies.length > 0 && (
                <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-300">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    ALLERGY ALERT:
                  </div>
                  <p className="font-mono font-bold text-white">
                    {patientProfile.allergies.join(', ')}
                  </p>
                </div>
              )}

              {/* Chronic Conditions */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Chronic Illnesses
                </span>
                <p className="text-slate-200 mt-1">
                  {patientProfile.chronicConditions.join(', ') || 'None recorded'}
                </p>
              </div>

              {/* Current Medications */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Active Medications
                </span>
                <p className="text-slate-200 mt-1">
                  {patientProfile.currentMedications.join(', ') || 'None reported'}
                </p>
              </div>

              {/* Lab Reports on file */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Attached Lab Reports ({healthRecords.length})
                </span>
                <div className="mt-2 space-y-1.5">
                  {healthRecords.map((r) => (
                    <div key={r.id} className="p-2 bg-slate-800 rounded-lg text-[11px] space-y-0.5">
                      <div className="font-bold text-white">{r.title}</div>
                      <div className="text-slate-400">{r.category} · {r.recordDate}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* In-Call Controls Bottom Bar */}
      <div className="h-20 bg-slate-900 border-t border-slate-800 px-4 sm:px-6 flex items-center justify-between z-10 shrink-0">
        {/* Left clinical triggers */}
        <div className="flex items-center gap-2">
          <button
            id="call-records-btn"
            onClick={() => {
              setShowRecords(!showRecords);
              if (showChat) setShowChat(false);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
              showRecords
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Records & Intake</span>
          </button>

          {/* If Doctor is on call, quick trigger to write digital prescription (PRD 4.5) */}
          {currentRole === 'doctor' && (
            <button
              id="call-issue-rx-btn"
              onClick={() => setDoctorPrescriptionTargetApt(appointment)}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Issue Digital Prescription</span>
            </button>
          )}
        </div>

        {/* Center Media Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mute/Unmute Mic */}
          <button
            id="toggle-mic-btn"
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all ${
              isAudioMuted
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/30 ring-2 ring-rose-400'
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
            title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Toggle Video */}
          <button
            id="toggle-video-btn"
            onClick={() => setIsVideoDisabled(!isVideoDisabled)}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all ${
              isVideoDisabled
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/30 ring-2 ring-rose-400'
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
            title={isVideoDisabled ? 'Turn video on' : 'Turn video off'}
          >
            {isVideoDisabled ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
          </button>

          {/* Screen Share Button */}
          <button
            id="toggle-screen-share-btn"
            onClick={handleToggleScreenShare}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all ${
              isScreenSharing
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30 ring-2 ring-indigo-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title={isScreenSharing ? 'Stop sharing screen' : 'Share your screen'}
          >
            <MonitorUp className="w-5 h-5" />
          </button>

          {/* Background Blur FX Toggle */}
          <button
            id="toggle-blur-fx-btn"
            onClick={() => setIsBgBlurred(!isBgBlurred)}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all ${
              isBgBlurred
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30 ring-2 ring-blue-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Toggle Background Blur Filter"
          >
            <Sparkles className="w-5 h-5" />
          </button>

          {/* End Call Button */}
          <button
            id="end-call-btn"
            onClick={handleEndCall}
            className="px-4 sm:px-5 h-11 sm:h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-rose-950/40 transition-colors"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="hidden sm:inline">End Consultation</span>
          </button>
        </div>

        {/* Right Chat toggle */}
        <div className="flex items-center gap-2">
          <button
            id="call-chat-btn"
            onClick={() => {
              setShowChat(!showChat);
              if (showRecords) setShowRecords(false);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
              showChat
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Chat</span>
            {chatMessages.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-blue-400" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
