import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  MessageCircle, 
  Video, 
  Mic, 
  CornerDownRight, 
  Search, 
  Clock, 
  CheckCheck, 
  MoreVertical, 
  Paperclip, 
  Smile, 
  Send, 
  Trash2, 
  Edit2, 
  UserPlus, 
  Lock, 
  Eye, 
  Camera, 
  FileText, 
  Image, 
  Headphones, 
  MapPin, 
  User, 
  ChevronLeft, 
  Sparkles, 
  X, 
  Ban, 
  Minus,
  RotateCw,
  Volume2,
  ListPlus,
  PlaySquare,
  Bookmark,
  Building,
  Info,
  Calendar,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  push, 
  set, 
  update, 
  onValue, 
  remove, 
  increment 
} from 'firebase/database';

// 1. Firebase Config from WhatsApp Code
const waConfig = {
  apiKey: "AIzaSyCYH0ZSeLjH_T3HJ9hVQ84afB5KyAEZi2Y",
  authDomain: "my-sc-tools.firebaseapp.com",
  databaseURL: "https://my-sc-tools-default-rtdb.firebaseio.com",
  projectId: "my-sc-tools",
  storageBucket: "my-sc-tools.appspot.com",
  messagingSenderId: "285986090017",
  appId: "1:285986090017:web:9d872b9bb5c472bcb74760"
};

// Dry initialize WhatsApp database to prevent duplication collisions
const waApp = getApps().find(app => app.name === 'whatsapp') || initializeApp(waConfig, 'whatsapp');
const rtdb = getDatabase(waApp);

const API_BASE = "https://my-telegram-bot-wzzv.onrender.com";

const inMemoryStorage: Record<string, string | null> = {};
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('localStorage reading is disabled in this iframe sandbox:', e);
      return inMemoryStorage[key] || null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('localStorage writing is disabled in this iframe sandbox:', e);
      inMemoryStorage[key] = value;
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('localStorage removing is disabled in this iframe sandbox:', e);
      delete inMemoryStorage[key];
    }
  }
};

export default function HelpCenter() {
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    return safeLocalStorage.getItem('wa_isAdmin') === 'true';
  });

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPass, setLoginPass] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginPhone === '01780102623' && loginPass === '80102623') {
      safeLocalStorage.setItem('wa_isAdmin', 'true');
      setIsAdminMode(true);
      setShowLoginModal(false);
      setLoginPhone('');
      setLoginPass('');
    } else {
      alert('ভুল মোবাইল নম্বর বা পাসওয়ার্ড! অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
  };

  const handleAdminLogout = () => {
    if (window.confirm("আপনি কি নিশ্চিতভাবে এডমিন মোড থেকে লগআউট করতে চান?")) {
      safeLocalStorage.removeItem('wa_isAdmin');
      setIsAdminMode(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-[#efeae2] h-full min-h-0 flex-1 md:min-h-[85vh] md:rounded-[2.5rem] overflow-hidden md:shadow-2xl flex flex-col relative md:border md:border-slate-200">
      
      {/* Embedded Live WhatsApp Interface spanning 100% page width and height */}
      <div className="w-full flex-1 min-h-0 flex flex-col relative">
        {isAdminMode ? (
          <WhatsAppAdminView rtdb={rtdb} onAdminLogout={handleAdminLogout} />
        ) : (
          <WhatsAppClientView rtdb={rtdb} onAdminLoginClick={() => setShowLoginModal(true)} />
        )}
      </div>

      {/* Switch Account Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl relative border border-slate-100 font-sans"
            >
              <button 
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={20} />
              </button>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gov-green/10 rounded-full flex items-center justify-center mx-auto mb-4 text-[#006a4e]">
                  <Lock size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-800">প্রশাসক প্রকোষ্ঠে প্রবেশ</h3>
                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">Secure Portal Credentials Keyed</p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1">মোবাইল নম্বর (Phone Nubmer)</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="Enter Phone Number" 
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-gov-green focus:bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1">সিকিউরিটি পাসওয়ার্ড (Password)</label>
                  <input 
                    type="password" 
                    required 
                    placeholder="Enter Security Code" 
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-gov-green focus:bg-white text-sm"
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-[#00a884] font-bold text-white py-3 rounded-xl hover:bg-[#008f70] transition-colors shadow-lg shadow-[#00a884]/20 mt-2 cursor-pointer text-sm"
                >
                  প্রবেশ করুন (Verify)
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// ============================================================================
// HELPERS DEFINED
// ============================================================================
function getFormattedTime() {
  const d = new Date();
  let h = d.getHours();
  let m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const mStr = m < 10 ? '0' + m : m;
  return h + ':' + mStr + ' ' + ampm;
}

function formatDateForHistory(ts: number) {
  const d = new Date(ts);
  return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}, ${getFormattedTime()}`;
}

async function uploadFileToServer(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/api/chat-upload`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Upload failed');
  return await res.json();
}

// Shared Ringtone Controller using internal AudioContext Web-synthesizer (prevents external loads errors)
let ringInterval: any = null;
let audioCtx: AudioContext | null = null;
function startRingtone() {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  function triggerBeep() {
    if (!audioCtx) return;
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc1.frequency.value = 440; 
    osc2.frequency.value = 480; 
    
    osc1.connect(gain); 
    osc2.connect(gain); 
    gain.connect(audioCtx.destination);
    
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    osc1.start(); 
    osc2.start(); 
    
    osc1.stop(audioCtx.currentTime + 1.2); 
    osc2.stop(audioCtx.currentTime + 1.2);
  }
  
  triggerBeep();
  ringInterval = setInterval(triggerBeep, 3500);
}

function stopRingtone() {
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
}

// Media renderer card representation
const MediaMessage = ({ text, fileUrl, fileType }: { text: string; fileUrl?: string; fileType?: string }) => {
  if (!fileUrl) return <p className="text-sm font-medium leading-normal break-all whitespace-pre-wrap">{text}</p>;
  
  if (fileType?.startsWith('image/')) {
    return (
      <div className="space-y-1 max-w-[240px]">
        <img 
          src={fileUrl} 
          alt="Media Photo" 
          onClick={() => window.open(fileUrl)} 
          className="rounded-lg max-h-48 w-full object-cover shadow-sm hover:scale-105 transition-transform cursor-pointer"
        />
        {text !== 'Photo' && <p className="text-xs text-slate-700 font-bold whitespace-pre-wrap mt-1">{text}</p>}
      </div>
    );
  }
  if (fileType?.startsWith('video/')) {
    return (
      <div className="space-y-1 max-w-[240px]">
        <video src={fileUrl} controls className="rounded-lg max-h-48 w-full shadow-sm"></video>
        {text !== 'Video' && <p className="text-xs text-slate-700 font-bold whitespace-pre-wrap mt-1">{text}</p>}
      </div>
    );
  }
  if (fileType?.startsWith('audio/')) {
    return (
      <div className="space-y-1 max-w-[240px] p-1 bg-black/5 rounded-xl">
        <audio src={fileUrl} controls className="w-full max-w-[200px] h-9"></audio>
      </div>
    );
  }
  return (
    <div className="p-2.5 bg-sky-50 border border-sky-100 rounded-xl flex items-center gap-3">
      <FileText className="text-sky-600 shrink-0" size={24} />
      <div className="min-w-0">
        <a href={fileUrl} target="_blank" rel="noreferrer" className="text-xs text-sky-800 font-extrabold block hover:underline truncate">ফাইল ডাউনলোড করুন</a>
        {text !== 'Document' && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{text}</p>}
      </div>
    </div>
  );
};


// ============================================================================
// CLIENT VIEW WORKSPACE
// ============================================================================
function WhatsAppClientView({ rtdb, onAdminLoginClick }: { rtdb: any; onAdminLoginClick: () => void }) {
  const [uid, setUid] = useState('');
  const [name, setName] = useState('User');
  const [avatar, setAvatar] = useState('https://cdn-icons-png.flaticon.com/512/847/847969.png');
  
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  // WebRTC
  const [callActive, setCallActive] = useState(false);
  const [incomingCallState, setIncomingCallState] = useState(false);
  const [connectingState, setConnectingState] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [fakeVideoUrl, setFakeVideoUrl] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Connection streams references
  const streamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    let localUid = safeLocalStorage.getItem('wa_client_uid');
    let localAvatar = safeLocalStorage.getItem('wa_client_avatar');
    let localName = safeLocalStorage.getItem('wa_client_name');
    if (!localUid) {
      localUid = Math.floor(10000 + Math.random() * 90000).toString();
      localAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${localUid}`;
      localName = `User-${localUid}`;
      safeLocalStorage.setItem('wa_client_uid', localUid);
      safeLocalStorage.setItem('wa_client_avatar', localAvatar);
      safeLocalStorage.setItem('wa_client_name', localName);
    }
    setUid(localUid);
    setName(localName);
    setAvatar(localAvatar);

    // Save userInfo reference in RTDB
    set(ref(rtdb, 'chats/' + localUid + '/userInfo'), {
      uid: localUid,
      nickname: localName,
      avatar: localAvatar,
      lastTime: '',
      unreadCountAdmin: 0,
      isBlocked: false
    });

    // Sub to message feeds
    const msgRef = ref(rtdb, `chats/${localUid}/messages`);
    const unsubscribeMessages = onValue(msgRef, (snap) => {
      if (snap.exists()) {
        const dataArr: any[] = [];
        snap.forEach((child) => {
          dataArr.push({ id: child.key, ...child.val() });
        });
        setMessages(dataArr.sort((a,b) => a.timestamp - b.timestamp));
      } else {
        setMessages([]);
      }
    });

    // Sub to blocking credentials
    const blockRef = ref(rtdb, `chats/${localUid}/userInfo/isBlocked`);
    const unsubscribeBlocking = onValue(blockRef, (snap) => {
      setIsBlocked(snap.val() === true);
    });

    // Sub to interactive call session signals
    const callSignalRef = ref(rtdb, `calls/${localUid}`);
    const unsubscribeCallSignals = onValue(callSignalRef, async (snap) => {
      const callData = snap.val();
      if (callData) {
        if (callData.status === 'busy' && callData.caller === 'client') {
          alert('ব্যস্ত আছে! লাইনে এই মূহূর্তে অন্য একজন গ্রাহক যুক্ত রয়েছেন।');
          doLocalEndCallCleanups();
        }
        else if (callData.status === 'ringing' && callData.caller === 'admin') {
          // Received call popup ringing state
          setCallType(callData.type || 'audio');
          setCallActive(true);
          setIncomingCallState(true);
          startRingtone();
        }
        else if (callData.status === 'answered') {
          stopRingtone();
          setIncomingCallState(false);
          setConnectingState(false);
          if (callData.caller === 'client' && !pcRef.current) {
            startClientWebRTCConnection(true, localUid);
          }
          if (callData.videoUrl) {
            setFakeVideoUrl(callData.videoUrl);
          }
        }
        else if (callData.status === 'ended') {
          doLocalEndCallCleanups();
        }
      } else {
        doLocalEndCallCleanups();
      }
    });

    return () => {
      unsubscribeMessages();
      unsubscribeBlocking();
      unsubscribeCallSignals();
    };
  }, [rtdb]);

  // Handle automatic chat scrolling bottom updates
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice note timers
  useEffect(() => {
    let interval: any;
    if (voiceRecording) {
      interval = setInterval(() => {
        setVoiceSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setVoiceSeconds(0);
    }
    return () => clearInterval(interval);
  }, [voiceRecording]);

  const handleSendMessage = async () => {
    if (chatInput.trim() === '' || isBlocked) return;
    const time = getFormattedTime();
    const chatMsgRef = push(ref(rtdb, `chats/${uid}/messages`));
    await set(chatMsgRef, {
      text: chatInput.trim(),
      sender: 'client',
      time: time,
      timestamp: Date.now(),
      isEdited: false,
      isDeleted: false
    });

    // Track dynamic changes
    await update(ref(rtdb, `chats/${uid}/userInfo`), {
      lastTime: time,
      unreadCountAdmin: increment(1)
    });

    setChatInput('');
  };

  const handleVoiceRecordTrigger = async () => {
    if (isBlocked) return;
    if (voiceRecording) {
      // Send active loop recorder stop trigger to finalize voice note
      mediaRecorder?.stop();
    } else {
      // Initialize active streaming loop note
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = async () => {
          stream.getTracks().forEach(tr => tr.stop());
          if (chunks.length > 0) {
            const audioBlob = new Blob(chunks, { type: 'audio/webm' });
            const file = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
            
            const time = getFormattedTime();
            const tempRef = push(ref(rtdb, `chats/${uid}/messages`));
            await set(tempRef, {
              text: "🎤 Sending Voice...",
              sender: 'client',
              time: time,
              timestamp: Date.now()
            });

            try {
              const resJson = await uploadFileToServer(file);
              await update(tempRef, {
                text: "Voice Message",
                fileUrl: resJson.url,
                fileType: resJson.type
              });
              await update(ref(rtdb, `chats/${uid}/userInfo`), {
                lastTime: time,
                unreadCountAdmin: increment(1)
              });
            } catch {
              await update(tempRef, { text: "❌ Voice Note Upload Failed" });
            }
          }
          setVoiceRecording(false);
        };

        setMediaRecorder(recorder);
        setAudioChunks(chunks);
        recorder.start();
        setVoiceRecording(true);
      } catch (err) {
        alert("Microphone permission denied / not available!");
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isBlocked) return;

    setShowAttachMenu(false);
    const time = getFormattedTime();
    const tempRef = push(ref(rtdb, `chats/${uid}/messages`));
    await set(tempRef, {
      text: "⏳ Uploading asset...",
      sender: 'client',
      time: time,
      timestamp: Date.now()
    });

    try {
      const resJson = await uploadFileToServer(file);
      let fileSummary = "Document";
      if (file.type.startsWith('image/')) fileSummary = "Photo";
      else if (file.type.startsWith('video/')) fileSummary = "Video";
      else if (file.type.startsWith('audio/')) fileSummary = "Audio";

      await update(tempRef, {
        text: fileSummary,
        fileUrl: resJson.url,
        fileType: resJson.type
      });

      await update(ref(rtdb, `chats/${uid}/userInfo`), {
        lastTime: time,
        unreadCountAdmin: increment(1)
      });
    } catch {
      await update(tempRef, { text: "❌ File Upload Failed" });
    }
    e.target.value = '';
  };

  // Initiate call 
  const initiateClientCall = async (type: 'audio' | 'video') => {
    if (isBlocked) return;
    setCallType(type);
    setCallActive(true);
    setConnectingState(true);
    setIncomingCallState(false);
    
    // Set active values inside RTDB
    await set(ref(rtdb, 'calls/' + uid), {
      caller: 'client',
      type: type,
      status: 'ringing',
      timestamp: Date.now()
    });

    startRingtone();
  };

  const answerIncomingAdminCall = async () => {
    stopRingtone();
    setIncomingCallState(false);
    setConnectingState(true);
    await update(ref(rtdb, 'calls/' + uid), { status: 'answered' });
    startClientWebRTCConnection(false, uid);
  };

  const triggerCallTermination = async () => {
    await update(ref(rtdb, 'calls/' + uid), { status: 'ended' });
    doLocalEndCallCleanups();
  };

  const doLocalEndCallCleanups = () => {
    // Teardown WebRTC tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(tr => tr.stop());
      streamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    stopRingtone();
    setCallActive(false);
    setConnectingState(false);
    setIncomingCallState(false);
    setFakeVideoUrl('');
    setIsMuted(false);
    setIsVideoOff(false);
    setFacingMode('user');
  };

  async function startClientWebRTCConnection(isOffer: boolean, targetUid: string) {
    try {
      const mode = facingMode;
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video' ? { facingMode: mode } : false,
        audio: true
      });
      streamRef.current = localStream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      const servers = { iceServers: [{ urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }] };
      const pc = new RTCPeerConnection(servers);
      pcRef.current = pc;

      // Add streams
      localStream.getTracks().forEach(tr => pc.addTrack(tr, localStream));

      pc.ontrack = (evt) => {
        if (remoteVideoRef.current && evt.streams[0]) {
          remoteVideoRef.current.srcObject = evt.streams[0];
        }
      };

      pc.onicecandidate = (evt) => {
        if (evt.candidate) {
          push(ref(rtdb, `calls/${targetUid}/iceCandidates/client`), evt.candidate.toJSON());
        }
      };

      if (isOffer) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await update(ref(rtdb, `calls/${targetUid}`), {
          offer: { type: offer.type, sdp: offer.sdp }
        });
      } else {
        // Answer channel
        onValue(ref(rtdb, `calls/${targetUid}/offer`), async (snapshot) => {
          const offer = snapshot.val();
          if (offer && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await update(ref(rtdb, `calls/${targetUid}`), {
              answer: { type: answer.type, sdp: answer.sdp }
            });
          }
        });
      }

      if (isOffer) {
        onValue(ref(rtdb, `calls/${targetUid}/answer`), async (snapshot) => {
          const answer = snapshot.val();
          if (answer && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          }
        });
      }

      // Add ICE candidates
      onValue(ref(rtdb, `calls/${targetUid}/iceCandidates/admin`), (snapshot) => {
        snapshot.forEach((child) => {
          if (pc.remoteDescription) {
            pc.addIceCandidate(new RTCIceCandidate(child.val())).catch((e)=>console.log(e));
          }
        });
      });

    } catch (err) {
      console.log('WebRTC Initialization Error: ', err);
      alert('যোগাযোগ ডিভাইস (Camera/Mic) অ্যাক্সেস করতে ব্যর্থ হয়েছে।');
      triggerCallTermination();
    }
  }

  const handleSpeakerState = () => {
    setIsMuted(prev => {
      if (streamRef.current) {
        const tr = streamRef.current.getAudioTracks()[0];
        if (tr) tr.enabled = prev; // toggle audio track enabled status
      }
      return !prev;
    });
  };

  const handleVideoOnOffState = () => {
    setIsVideoOff(prev => {
      if (streamRef.current) {
        const tr = streamRef.current.getVideoTracks()[0];
        if (tr) tr.enabled = prev; // toggle video track
      }
      return !prev;
    });
  };

  const handleCameraFlipState = async () => {
    if (!streamRef.current) return;
    const oldVideoTrack = streamRef.current.getVideoTracks()[0];
    if (oldVideoTrack) oldVideoTrack.stop();

    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: nextMode } }
      });
      const newTrack = newStream.getVideoTracks()[0];
      streamRef.current.removeTrack(oldVideoTrack);
      streamRef.current.addTrack(newTrack);

      if (pcRef.current) {
        const sender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(newTrack);
        }
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = streamRef.current;
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Emojis array
  const EMOJIS = ["😀","😃","😄","😁","😆","😅","😂","🤣","🥲","🥹","☺️","😊","😇","🙂","🙃","😉","😍","🥰","😘","😜","🤪","🤩","🥳"];

  return (
    <div className="w-full h-full min-h-0 flex-1 md:min-h-[75vh] bg-white overflow-hidden flex flex-col relative select-none font-sans">
      
      {/* 2.1 Backing Hidden fields for standard triggering of files */}
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

      {/* 2.2 Client View Header */}
      <header className="h-16 px-4 shrink-0 bg-white shadow-sm flex items-center justify-between border-b border-slate-100 z-25">
        <div 
          onClick={() => setShowContactInfo(true)} 
          className="flex items-center gap-3 cursor-pointer overflow-hidden max-w-[70%]"
        >
          <img 
            src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" 
            alt="MD Sariful Islam Bio" 
            className="w-10 h-10 rounded-full border-2 border-[#00a884] object-cover shrink-0" 
          />
          <div className="min-w-0">
            <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 truncate">
              MD Sariful Islam
              <span className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-ping"></span>
            </h4>
            <p className="text-[10px] text-[#00a884] font-bold uppercase tracking-wider">অফিসিয়াল চ্যাট সাপোর্ট</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-600">
          <button onClick={() => initiateClientCall('video')} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
            <Video size={18} />
          </button>
          <button onClick={() => initiateClientCall('audio')} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
            <Phone size={16} />
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowMenuDropdown(p => !p)} 
              className="p-2 hover:bg-slate-50 rounded-full transition-colors"
            >
              <MoreVertical size={18} />
            </button>
            {showMenuDropdown && (
              <div className="absolute top-10 right-0 py-1 bg-white border border-slate-100 shadow-xl rounded-xl z-50 text-xs w-[160px] font-bold">
                <button 
                  onClick={() => { setShowContactInfo(true); setShowMenuDropdown(false); }} 
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-700"
                >
                  📄 তথ্য দেখুন (Profile)
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm('আপনি কি পূর্ববর্তী সমস্ত চ্যাট ডিলিট করতে চান?')) {
                      remove(ref(rtdb, `chats/${uid}/messages`));
                    }
                    setShowMenuDropdown(false);
                  }} 
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-rose-600"
                >
                  🗑️ মেসেজ ডিলিট করুন
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2.3 Conversation Screen body */}
      <main 
        className="flex-1 bg-[#efeae2] p-4 overflow-y-auto space-y-4 flex flex-col relative"
        style={{
          backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`,
          backgroundSize: 'cover'
        }}
      >
        <div className="text-center">
          <span className="bg-white/80 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] text-slate-500 font-black uppercase tracking-wider shadow-sm">আজ (Today)</span>
        </div>

        <div className="max-w-[90%] mx-auto bg-[#ffeecd] border border-amber-200/50 p-2.5 rounded-2xl flex gap-2 items-center justify-center text-center text-[11px] text-[#54656f] leading-snug font-bold">
          <Lock size={12} className="shrink-0 text-amber-600" />
          <span>বার্তা ও কলগুলি এন্ড-টু-এন্ড এনক্রিপ্টেড। এই চ্যাটের বাইরে কেউ এগুলো পড়তে পারবে না।</span>
        </div>

        {/* AI Assistant Welcome Message Bubble */}
        <div className="self-start max-w-[85%] bg-white border border-emerald-100 rounded-2xl rounded-tl-none shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-4 relative flex flex-col gap-3 font-sans animate-fade-in">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-emerald-50 pb-2.5 bg-emerald-50/25 -mx-4 -mt-4 px-4 py-3 rounded-t-2xl">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
              <Sparkles size={16} />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 bg-[#e8f5e9] text-[#2e7d32] text-[9px] font-black uppercase px-2 py-0.5 rounded-full leading-none mb-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                অনলাইন সাপোর্ট গেটওয়ে
              </span>
              <h4 className="text-xs font-black text-slate-800 tracking-tight">হেল্প সেন্টার ডেস্ক</h4>
              <p className="text-[10px] text-emerald-600 font-extrabold mt-0.5">Help wing: +966 50 123 4567</p>
            </div>
          </div>

          {/* Description Body */}
          <p className="text-xs text-slate-700 leading-relaxed font-semibold">
            বিএমইটি স্মার্ট কার্ড, পাসপোর্ট সংগ্রহ এবং সরকারি রেজিষ্ট্রেশন নিয়ে যেকোনো অনুসন্ধান, সমস্যা বা সাহায্য পেতে আমাদের অনলাইন প্রতিনিধিদের সাথে সরাসরি মেসেজ বা ইন্টারনেট কল করে লাইভ চ্যাট করুন।
          </p>

          {/* Business Details Grid */}
          <div className="space-y-2 text-slate-600 text-xs font-semibold py-2.5 border-t border-b border-slate-100 bg-slate-50/55 -mx-4 px-4">
            <div className="flex items-start gap-2.5">
              <Clock size={14} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-850 text-[11px] block text-slate-800">সেবা প্রদানের সময়</strong>
                <span className="text-[11px] text-slate-500 font-medium">প্রতিদিন ২৪ ঘণ্টা সার্ভিস (ছুটির দিন ব্যতিত)</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Lock size={14} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-850 text-[11px] block text-slate-800">সম্পূর্ণ নিরাপদ গেটওয়ে</strong>
                <span className="text-[11px] text-slate-500 font-medium">আপনার মেসেজ ও কল এন্ড-টু-এন্ড এনক্রিপ্ট সহ সুরক্ষিত।</span>
              </div>
            </div>
          </div>

          {/* Administrator Quick Action Button */}
          <div className="pt-1.5">
            <button
              onClick={onAdminLoginClick}
              className="w-full bg-[#00a884] hover:bg-[#008f70] text-white text-[11px] font-black py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-[#00a884]/15"
            >
              <Lock size={12} />
              <span>প্রশাসক পোর্টাল প্রবেশ (Admin Login)</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[9px] text-[#006a4e] font-extrabold mt-1">
            <span>MD Sariful Islam • AI Support</span>
            <span className="text-slate-400 font-bold">১২:০০ AM</span>
          </div>
        </div>

        {messages.map((m) => (
          <div 
            key={m.id} 
            className={`flex flex-col max-w-[80%] ${m.sender === 'client' ? 'self-end bg-[#d9fdd3]' : 'self-start bg-white'} px-3 py-2 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.06)] relative`}
          >
            <MediaMessage text={m.text} fileUrl={m.fileUrl} fileType={m.fileType} />
            <span className="text-[9px] text-slate-400 font-extrabold self-end mt-1 block tracking-tighter shrink-0">{m.time}</span>
          </div>
        ))}
        
        <div ref={chatBottomRef} />
      </main>

      {/* 2.4 Control Input Area bar wrapper */}
      <footer className="bg-slate-100 p-2.5 border-t border-slate-200 shrink-0 z-20">
        
        {/* Attachment Popup Grid list */}
        {showAttachMenu && (
          <div className="absolute bottom-[72px] left-4 right-4 bg-white/95 backdrop-blur-md border border-slate-100 p-5 rounded-2xl shadow-2xl grid grid-cols-3 gap-6 animate-fade-in z-30">
            <button 
              onClick={() => { fileInputRef.current?.click(); }} 
              className="flex flex-col items-center gap-2"
            >
              <div className="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                <FileText size={20} />
              </div>
              <span className="text-[10px] text-slate-600 font-bold">নথিপত্র (Doc)</span>
            </button>
            <button 
              onClick={() => { fileInputRef.current?.click(); }} 
              className="flex flex-col items-center gap-2"
            >
              <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
                <Camera size={20} />
              </div>
              <span className="text-[10px] text-slate-600 font-bold">ক্যামেরা</span>
            </button>
            <button 
              onClick={() => { fileInputRef.current?.click(); }} 
              className="flex flex-col items-center gap-2"
            >
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                <Image size={20} />
              </div>
              <span className="text-[10px] text-slate-600 font-bold">গ্যালারি</span>
            </button>
          </div>
        )}

        {isBlocked ? (
          <div className="bg-slate-200 p-3 rounded-2xl text-center text-slate-500 text-xs font-black uppercase tracking-wider">
            🚫 এডমিন আপনাকে সাময়িকভাবে ব্লক করেছেন
          </div>
        ) : (
          <div className="flex items-end gap-2.5">
            {voiceRecording ? (
              <div className="flex-1 bg-white rounded-2xl px-4 py-2 flex items-center justify-between border border-slate-250 animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-rose-600 rounded-full animate-ping shrink-0" />
                  <span className="text-xs font-bold text-slate-600 tracking-wider">রেকর্ডিং চলছে:</span>
                </div>
                <div className="text-sm font-bold font-mono tracking-widest text-slate-800">
                  {Math.floor(voiceSeconds / 60)}:{(voiceSeconds % 60) < 10 ? '0' : ''}{voiceSeconds % 60}
                </div>
                <button 
                  onClick={() => { mediaRecorder?.stop(); }} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg text-rose-50 border border-emerald-500 shrink-0"
                >
                  প্রেরণ করুন
                </button>
              </div>
            ) : (
              <div className="flex-1 bg-white rounded-2xl px-3 py-1.5 flex items-end gap-2 border border-slate-250 min-h-[44px]">
                <button 
                  onClick={() => setShowEmojiPanel(p => !p)} 
                  className={`p-1 hover:text-[#00a884] rounded-full transition-colors ${showEmojiPanel ? 'text-[#00a884]' : 'text-slate-400'}`}
                >
                  <Smile size={20} />
                </button>
                <input 
                  type="text" 
                  ref={textInputRef}
                  placeholder="মেসেজ লিখুন..." 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                  className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 placeholder-slate-400 min-w-0"
                />
                <button 
                  onClick={() => setShowAttachMenu(p => !p)} 
                  className={`p-1 hover:text-[#00a884] rounded-full transition-colors ${showAttachMenu ? 'text-[#00a884]' : 'text-slate-400'}`}
                >
                  <Paperclip size={20} />
                </button>
              </div>
            )}

            {!voiceRecording && chatInput.trim() !== '' ? (
              <button 
                onClick={handleSendMessage} 
                className="w-11 h-11 bg-[#00a884] hover:bg-[#009675] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#00a884]/20 transition-all shrink-0 active:scale-95 cursor-pointer"
              >
                <Send size={18} className="translate-x-0.5" />
              </button>
            ) : (
              <button 
                onClick={handleVoiceRecordTrigger} 
                className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all shrink-0 active:scale-95 cursor-pointer ${voiceRecording ? 'bg-rose-600 hover:bg-rose-700 text-white animate-bounce' : 'bg-[#00a884] hover:bg-[#009675] text-white shadow-[#00a884]/20'}`}
              >
                <Mic size={18} />
              </button>
            )}
          </div>
        )}

        {/* Emojis selector list */}
        {showEmojiPanel && (
          <div className="mt-3 bg-white max-h-40 overflow-y-auto p-3 rounded-2xl grid grid-cols-6 gap-3 shadow-inner border border-slate-200">
            {EMOJIS.map((e, idx) => (
              <span 
                key={idx} 
                onClick={() => { setChatInput(p => p + e); textInputRef.current?.focus(); }}
                className="text-2xl cursor-pointer hover:bg-slate-50 p-1 rounded-lg text-center transition-transform hover:scale-110 active:scale-95"
              >
                {e}
              </span>
            ))}
          </div>
        )}
      </footer>

      {/* 2.5 Contact Profile Info Sheet */}
      {showContactInfo && (
        <div className="absolute inset-0 bg-slate-50 z-50 overflow-y-auto flex flex-col font-sans">
          <header className="h-14 px-4 bg-white border-b border-slate-200 flex items-center gap-4 shrink-0">
            <button onClick={() => setShowContactInfo(false)} className="p-1 hover:bg-slate-50 rounded-full text-slate-600">
              <ChevronLeft size={24} />
            </button>
            <h4 className="font-extrabold text-[#006a4e]">অফিসিয়াল প্রোফাইল তথ্য</h4>
          </header>

          <main className="p-6 space-y-6 flex-1">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
              <img 
                src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" 
                alt="Sariful Islam Support" 
                className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-inner mb-4" 
              />
              <h3 className="text-lg font-black text-slate-850">MD Sariful Islam</h3>
              <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">+966 50 123 4567</p>

              <div className="flex gap-4 w-full mt-6 justify-center">
                <button onClick={() => { initiateClientCall('audio'); setShowContactInfo(false); }} className="px-5 py-2.5 bg-slate-50 rounded-2xl hover:bg-slate-100 border border-slate-200/60 font-bold text-xs flex flex-col items-center gap-1.5 flex-1 max-w-[120px] shadow-sm">
                  <Phone size={16} className="text-[#006a4e]" />
                  <span>কল করুন</span>
                </button>
                <button onClick={() => { initiateClientCall('video'); setShowContactInfo(false); }} className="px-5 py-2.5 bg-slate-50 rounded-2xl hover:bg-slate-100 border border-slate-200/60 font-bold text-xs flex flex-col items-center gap-1.5 flex-1 max-w-[120px] shadow-sm">
                  <Video size={16} className="text-[#006a4e]" />
                  <span>ভিডিও কল</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden text-xs">
              <div className="p-4 border-b border-slate-100 flex items-center gap-4">
                <Building className="text-slate-400" size={18} />
                <div>
                  <h5 className="font-black text-slate-700">প্রবাসী কল সেন্টার</h5>
                  <p className="text-slate-400 font-bold mt-0.5 uppercase tracking-wide">Ministry Official Wing</p>
                </div>
              </div>
              <div className="p-4 border-b border-slate-100 flex items-center gap-4">
                <Info className="text-slate-400" size={18} />
                <div>
                  <h5 className="font-black text-slate-700">সেবাসমূহ</h5>
                  <p className="text-slate-400 font-bold mt-0.5">ডিজিটাল স্মার্ট কার্ড যাচাই, পাসপোর্ট সংক্রান্ত সাহায্য এবং রেজিষ্ট্রেশন পরামর্শ।</p>
                </div>
              </div>
              <div className="p-4 flex items-center gap-4 bg-emerald-50/50">
                <Calendar className="text-[#006a4e]" size={18} />
                <div>
                  <h5 className="font-black text-[#006a4e]">অফিস সময়</h5>
                  <p className="text-slate-500 font-bold mt-0.5">রবিবার ও বৃহস্পতিবার সকাল ৮:০০ থেকে বিকাল ৪:০০ টা (অন্যান্য দিন লাইভ এসিস্ট্যান্ট এভেইলেবল)</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* 2.6 Active WebRTC Call overlay panels */}
      <AnimatePresence>
        {callActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#121b22]/95 backdrop-blur-xl z-[150] flex flex-col justify-between p-8 text-white text-center"
          >
            {/* Top items */}
            <div className="flex justify-between items-center z-10 w-full shrink-0">
              <button onClick={triggerCallTermination} className="p-2 hover:bg-white/10 rounded-full">
                <ChevronLeft size={24} />
              </button>
              {callType === 'video' && (
                <div className="flex gap-4">
                  <button onClick={handleCameraFlipState} className="p-2.5 bg-white/15 hover:bg-white/20 rounded-full">
                    <RotateCw size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* Middle Profile info/Video */}
            <div className="flex-1 flex flex-col justify-center items-center relative z-10 min-h-0 py-4">
              
              {callType === 'video' ? (
                <div className="w-full h-full rounded-2xl overflow-hidden relative bg-black/60 shadow-inner">
                  {connectingState ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-3 border-[#00a884] border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">সংযোগ করা হচ্ছে...</p>
                    </div>
                  ) : (
                    <>
                      {/* Fake loop inject player feed */}
                      {fakeVideoUrl ? (
                        <video src={fakeVideoUrl} autoPlay loop playsInline className="w-full h-full object-cover"></video>
                      ) : (
                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      )}

                      {/* Local camera capture thumbnail preview */}
                      {!isVideoOff && (
                        <video 
                          ref={localVideoRef} 
                          autoPlay 
                          playsInline 
                          muted 
                          className="absolute bottom-4 right-4 w-28 h-36 bg-black rounded-xl border border-white/20 object-cover shadow-2xl"
                        />
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <img 
                    src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" 
                    alt="Sariful Islam Support" 
                    className="w-28 h-28 rounded-full border-4 border-white/10 shadow-2xl object-cover" 
                  />
                  <div>
                    <h3 className="text-xl font-bold font-sans">MD Sariful Islam</h3>
                    <p className="text-xs text-[#00a884] font-bold mt-1 uppercase tracking-widest">{connectingState ? 'কল ঢুকছে...' : 'কল ট্র্যাফিক সুরক্ষিত...'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Incoming Accept trigger overlay banner */}
            {incomingCallState && (
              <div className="bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-white/10 space-y-4 mb-2 z-20">
                <p className="text-xs font-bold text-slate-300">ইনকামিং {callType === 'video' ? 'ভিডিও' : 'অডিও'} কল...</p>
                <div className="flex gap-6 justify-center">
                  <button 
                    onClick={triggerCallTermination} 
                    className="w-12 h-12 bg-rose-600 rounded-full flex items-center justify-center shadow-lg active:scale-95 text-white cursor-pointer"
                  >
                    <Phone className="rotate-[135deg]" size={18} />
                  </button>
                  <button 
                    onClick={answerIncomingAdminCall} 
                    className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg active:scale-95 text-white cursor-pointer animate-bounce"
                  >
                    <Phone size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Controls Wrap box */}
            {!incomingCallState && (
              <div className="bg-[#232d36] rounded-[2rem] p-4 flex justify-around items-center w-full max-w-sm mx-auto shadow-2xl z-20 shrink-0 select-none">
                <button 
                  onClick={handleSpeakerState} 
                  className={`p-3 rounded-full transition-colors ${isMuted ? 'bg-white text-slate-900 shadow-md' : 'hover:bg-white/10 text-white'}`}
                >
                  <Mic size={20} />
                </button>
                {callType === 'video' && (
                  <button 
                    onClick={handleVideoOnOffState} 
                    className={`p-3 rounded-full transition-colors ${isVideoOff ? 'bg-white text-slate-900 shadow-md' : 'hover:bg-white/10 text-white'}`}
                  >
                    <Video size={20} />
                  </button>
                )}
                <button 
                  onClick={triggerCallTermination} 
                  className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer"
                >
                  <Phone className="rotate-[135deg]" size={20} />
                </button>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}


// ============================================================================
// ADMIN VIEW WORKSPACE
// ============================================================================
function WhatsAppAdminView({ rtdb, onAdminLogout }: { rtdb: any; onAdminLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'chats' | 'calls'>('chats');
  const [activeChatUid, setActiveChatUid] = useState<string | null>(null);
  const [clientRecords, setClientRecords] = useState<any[]>([]);

  const [chatSearch, setChatSearch] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [adminInput, setAdminInput] = useState('');
  
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  // WebRTC
  const [callActive, setCallActive] = useState(false);
  const [incomingCallState, setIncomingCallState] = useState(false);
  const [connectingState, setConnectingState] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [fakeVideoUrl, setFakeVideoUrl] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Logs / Calls List history
  const [callHistories, setCallHistories] = useState<any[]>([]);

  // Global Notification trigger (Inbound Ringing alerts)
  const [globalCallAlert, setGlobalCallAlert] = useState<any>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    // Watch all client records paths
    const clientRef = ref(rtdb, 'chats');
    const unsubscribeClients = onValue(clientRef, (snapshot) => {
      if (snapshot.exists()) {
        const parsed: any[] = [];
        snapshot.forEach((child) => {
          const val = child.val();
          const uInfo = val.userInfo || {};
          const msgMap = val.messages || {};
          const msgArr = Object.values(msgMap).sort((a: any, b: any) => a.timestamp - b.timestamp);
          const msgKeys = Object.keys(msgMap).sort((a: any, b: any) => msgMap[a].timestamp - msgMap[b].timestamp);
          
          parsed.push({
            uid: child.key,
            nickname: uInfo.nickname || `User-${child.key}`,
            avatar: uInfo.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${child.key}`,
            messages: msgArr,
            msgKeys: msgKeys,
            unread: uInfo.unreadCountAdmin || 0,
            lastTime: uInfo.lastTime || '',
            isBlocked: uInfo.isBlocked || false
          });
        });
        setClientRecords(parsed);
      } else {
        setClientRecords([]);
      }
    });

    // Sub to calls registry database
    const callRegistryRef = ref(rtdb, 'calls');
    const unsubscribeCallSignalsGlobal = onValue(callRegistryRef, async (snap) => {
      const dbCalls = snap.val();
      if (!dbCalls) {
        // Clear active sessions
        if (callActive) {
          doLocalEndCallCleanups();
        }
        setGlobalCallAlert(null);
        stopRingtone();
        return;
      }

      let inboundCallObj: any = null;
      for (const targetUid in dbCalls) {
        const callingData = dbCalls[targetUid];
        if (callingData.status === 'ringing' && callingData.caller === 'client' && !callActive) {
          inboundCallObj = {
            uid: targetUid,
            ...callingData
          };
        }
      }

      if (inboundCallObj) {
        setGlobalCallAlert(inboundCallObj);
        startRingtone();
      } else {
        setGlobalCallAlert(null);
        stopRingtone();
      }

      // Check active calls syncing
      if (activeChatUid && dbCalls[activeChatUid]) {
        const specificActiveCall = dbCalls[activeChatUid];
        if (specificActiveCall.status === 'answered') {
          stopRingtone();
          setIncomingCallState(false);
          setConnectingState(false);
          if (specificActiveCall.caller === 'admin' && !pcRef.current) {
            startAdminWebRTCConnection(true, activeChatUid);
          }
          if (specificActiveCall.videoUrl) {
            setFakeVideoUrl(specificActiveCall.videoUrl);
          }
        }
        else if (specificActiveCall.status === 'ended') {
          doLocalEndCallCleanups();
        }
      }
    });

    // Sub to call history logs
    const historyLogsRef = ref(rtdb, 'adminCallHistory');
    const unsubscribeHistories = onValue(historyLogsRef, (snap) => {
      if (snap.exists()) {
        const arr: any[] = [];
        snap.forEach((child) => {
          arr.push({ id: child.key, ...child.val() });
        });
        setCallHistories(arr.sort((a,b) => b.timestamp - a.timestamp));
      } else {
        setCallHistories([]);
      }
    });

    return () => {
      unsubscribeClients();
      unsubscribeCallSignalsGlobal();
      unsubscribeHistories();
    };
  }, [activeChatUid, callActive, rtdb]);

  // Handle message updates inside active chatting directory
  useEffect(() => {
    if (activeChatUid) {
      const activeRecord = clientRecords.find(c => c.uid === activeChatUid);
      if (activeRecord) {
        setMessages(activeRecord.messages);
      }
    } else {
      setMessages([]);
    }
  }, [activeChatUid, clientRecords]);

  // Handle message bottom scrolling
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice note timer effect logs
  useEffect(() => {
    let interval: any;
    if (voiceRecording) {
      interval = setInterval(() => {
        setVoiceSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setVoiceSeconds(0);
    }
    return () => clearInterval(interval);
  }, [voiceRecording]);

  const handleOpenSpecificInbox = async (targetUid: string) => {
    setActiveChatUid(targetUid);
    // Clear unread counts for admin reading loop
    await update(ref(rtdb, `chats/${targetUid}/userInfo`), { unreadCountAdmin: 0 });
  };

  const handleSendAdminReply = async () => {
    if (!activeChatUid || adminInput.trim() === '') return;
    const time = getFormattedTime();
    const chatMsgRef = push(ref(rtdb, `chats/${activeChatUid}/messages`));
    await set(chatMsgRef, {
      text: adminInput.trim(),
      sender: 'admin',
      time: time,
      timestamp: Date.now(),
      isEdited: false,
      isDeleted: false
    });

    await update(ref(rtdb, `chats/${activeChatUid}/userInfo`), {
      lastTime: time
    });

    setAdminInput('');
  };

  const handleAdminVoiceTrigger = async () => {
    if (!activeChatUid) return;
    if (voiceRecording) {
      mediaRecorder?.stop();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = async () => {
          stream.getTracks().forEach(tr => tr.stop());
          if (chunks.length > 0) {
            const audioBlob = new Blob(chunks, { type: 'audio/webm' });
            const file = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
            
            const time = getFormattedTime();
            const tempRef = push(ref(rtdb, `chats/${activeChatUid}/messages`));
            await set(tempRef, {
              text: "🎤 Sending Voice...",
              sender: 'admin',
              time: time,
              timestamp: Date.now()
            });

            try {
              const resJson = await uploadFileToServer(file);
              await update(tempRef, {
                text: "Voice Message",
                fileUrl: resJson.url,
                fileType: resJson.type
              });
              await update(ref(rtdb, `chats/${activeChatUid}/userInfo`), {
                lastTime: time
              });
            } catch {
              await update(tempRef, { text: "❌ Voice Note Upload Failed" });
            }
          }
          setVoiceRecording(false);
        };

        setMediaRecorder(recorder);
        setAudioChunks(chunks);
        recorder.start();
        setVoiceRecording(true);
      } catch {
        alert("Microphone permission denied / not available!");
      }
    }
  };

  const handleAdminFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChatUid) return;

    setShowAttachMenu(false);
    const time = getFormattedTime();
    const tempRef = push(ref(rtdb, `chats/${activeChatUid}/messages`));
    await set(tempRef, {
      text: "⏳ Uploading asset...",
      sender: 'admin',
      time: time,
      timestamp: Date.now()
    });

    try {
      const resJson = await uploadFileToServer(file);
      let fileSummary = "Document";
      if (file.type.startsWith('image/')) fileSummary = "Photo";
      else if (file.type.startsWith('video/')) fileSummary = "Video";
      else if (file.type.startsWith('audio/')) fileSummary = "Audio";

      await update(tempRef, {
        text: fileSummary,
        fileUrl: resJson.url,
        fileType: resJson.type
      });

      await update(ref(rtdb, `chats/${activeChatUid}/userInfo`), {
        lastTime: time
      });
    } catch {
      await update(tempRef, { text: "❌ File Upload Failed" });
    }
    e.target.value = '';
  };

  const initiateAdminCall = async (type: 'audio' | 'video') => {
    if (!activeChatUid) return;
    setCallType(type);
    setCallActive(true);
    setConnectingState(true);
    setIncomingCallState(false);

    await set(ref(rtdb, 'calls/' + activeChatUid), {
      caller: 'admin',
      type: type,
      status: 'ringing',
      timestamp: Date.now()
    });

    startRingtone();
    push(ref(rtdb, 'adminCallHistory'), {
      uid: activeChatUid,
      status: 'answered',
      direction: 'outgoing',
      type: type,
      timestamp: Date.now()
    });
  };

  const acceptGlobalCall = async () => {
    if (!globalCallAlert) return;
    const targetUid = globalCallAlert.uid;
    setActiveChatUid(targetUid);
    setCallType(globalCallAlert.type || 'audio');
    setCallActive(true);
    setIncomingCallState(false);
    setConnectingState(true);
    setGlobalCallAlert(null);
    stopRingtone();

    await update(ref(rtdb, 'calls/' + targetUid), { status: 'answered' });
    startAdminWebRTCConnection(false, targetUid);
    push(ref(rtdb, 'adminCallHistory'), {
      uid: targetUid,
      status: 'answered',
      direction: 'incoming',
      type: 'call',
      timestamp: Date.now()
    });
  };

  const rejectGlobalCall = async () => {
    if (!globalCallAlert) return;
    const targetUid = globalCallAlert.uid;
    await update(ref(rtdb, 'calls/' + targetUid), { status: 'ended' });
    setGlobalCallAlert(null);
    stopRingtone();

    push(ref(rtdb, 'adminCallHistory'), {
      uid: targetUid,
      status: 'missed',
      direction: 'incoming',
      type: 'call',
      timestamp: Date.now()
    });
  };

  const triggerCallTermination = async () => {
    const targetUid = activeChatUid;
    if (targetUid) {
      await update(ref(rtdb, 'calls/' + targetUid), { status: 'ended' });
    }
    doLocalEndCallCleanups();
  };

  const doLocalEndCallCleanups = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(tr => tr.stop());
      streamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    stopRingtone();
    setCallActive(false);
    setConnectingState(false);
    setIncomingCallState(false);
    setFakeVideoUrl('');
    setIsMuted(false);
    setIsVideoOff(false);
    setFacingMode('user');
  };

  async function startAdminWebRTCConnection(isOffer: boolean, targetUid: string) {
    try {
      const mode = facingMode;
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video' ? { facingMode: mode } : false,
        audio: true
      });
      streamRef.current = localStream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      const servers = { iceServers: [{ urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }] };
      const pc = new RTCPeerConnection(servers);
      pcRef.current = pc;

      localStream.getTracks().forEach(tr => pc.addTrack(tr, localStream));

      pc.ontrack = (evt) => {
        if (remoteVideoRef.current && evt.streams[0]) {
          remoteVideoRef.current.srcObject = evt.streams[0];
        }
      };

      pc.onicecandidate = (evt) => {
        if (evt.candidate) {
          push(ref(rtdb, `calls/${targetUid}/iceCandidates/admin`), evt.candidate.toJSON());
        }
      };

      if (isOffer) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await update(ref(rtdb, `calls/${targetUid}`), {
          offer: { type: offer.type, sdp: offer.sdp }
        });
      } else {
        onValue(ref(rtdb, `calls/${targetUid}/offer`), async (snapshot) => {
          const offer = snapshot.val();
          if (offer && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await update(ref(rtdb, `calls/${targetUid}`), {
              answer: { type: answer.type, sdp: answer.sdp }
            });
          }
        });
      }

      if (isOffer) {
        onValue(ref(rtdb, `calls/${targetUid}/answer`), async (snapshot) => {
          const answer = snapshot.val();
          if (answer && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          }
        });
      }

      onValue(ref(rtdb, `calls/${targetUid}/iceCandidates/client`), (snapshot) => {
        snapshot.forEach((child) => {
          if (pc.remoteDescription) {
            pc.addIceCandidate(new RTCIceCandidate(child.val())).catch((e)=>console.log(e));
          }
        });
      });

    } catch (err) {
      console.log('WebRTC Init error:', err);
      alert('ডিভাইস ক্যামেরা/অডিও ব্লক করা আছে! অনুগ্রহ করে ব্রাউজার পারমিশন চেক করুন।');
      triggerCallTermination();
    }
  }

  const handleSpeakerState = () => {
    setIsMuted(prev => {
      if (streamRef.current) {
        const tr = streamRef.current.getAudioTracks()[0];
        if (tr) tr.enabled = prev;
      }
      return !prev;
    });
  };

  const handleVideoOnOffState = () => {
    setIsVideoOff(prev => {
      if (streamRef.current) {
        const tr = streamRef.current.getVideoTracks()[0];
        if (tr) tr.enabled = prev;
      }
      return !prev;
    });
  };

  const handleCameraFlipState = async () => {
    if (!streamRef.current) return;
    const oldVideoTrack = streamRef.current.getVideoTracks()[0];
    if (oldVideoTrack) oldVideoTrack.stop();

    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: nextMode } }
      });
      const newTrack = newStream.getVideoTracks()[0];
      streamRef.current.removeTrack(oldVideoTrack);
      streamRef.current.addTrack(newTrack);

      if (pcRef.current) {
        const sender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(newTrack);
        }
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = streamRef.current;
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleInjectFakeFeed = () => {
    if (!activeChatUid || !callActive) {
      alert("উক্ত কলারের সাথে আগে কল কানেক্ট করুন!");
      return;
    }
    const mp4Url = prompt("সরাসরি ইনজেক্ট করার জন্য একটি সম্পূর্ণ MP4 ভিডিও লিংক প্রবেশ করান (Or send via Telegram Bot with /inject):");
    if (mp4Url && mp4Url.trim() !== "") {
      update(ref(rtdb, 'calls/' + activeChatUid), { videoUrl: mp4Url.trim() });
      alert("ভিডিও ফিড সফলভাবে ইনজেক্ট করা হয়েছে!");
    }
  };

  const handleToggleBlockClient = async () => {
    if (!activeChatUid) return;
    const current = clientRecords.find(c => c.uid === activeChatUid);
    if (!current) return;
    const nextStatus = !current.isBlocked;
    
    await update(ref(rtdb, `chats/${activeChatUid}/userInfo`), { isBlocked: nextStatus });
    setShowMenuDropdown(false);
    alert(nextStatus ? 'গ্রাহক ব্লক হয়েছে।' : 'গ্রাহক আনব্লক হয়েছে।');
  };

  const handleDeleteClientPermanently = async () => {
    if (!activeChatUid) return;
    if (window.confirm("আপনি কি নিশ্চিতভাবে এই গ্রাহকের সমস্ত ডাটা পার্মানেন্টলি মুছে ফেলতে চান?")) {
      await remove(ref(rtdb, `chats/${activeChatUid}`));
      setActiveChatUid(null);
      setShowMenuDropdown(false);
    }
  };

  const filteredClients = clientRecords.filter(c => {
    return c.nickname.toLowerCase().includes(chatSearch.toLowerCase()) || 
           c.uid.toLowerCase().includes(chatSearch.toLowerCase());
  });

  const activeRecord = clientRecords.find(c => c.uid === activeChatUid);

  return (
    <div className="w-full h-full min-h-0 flex-1 md:min-h-[75vh] bg-white overflow-hidden flex relative divide-x divide-slate-150 select-none font-sans">
      
      {/* Dynamic Floating Global Incoming Call Notification banner */}
      {globalCallAlert && (
        <div className="absolute top-4 left-4 right-4 bg-[#232d36] text-white p-4 rounded-2xl flex items-center justify-between shadow-2xl z-[180] border border-white/10 animate-slide-down">
          <div className="flex items-center gap-3">
            <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="" className="w-10 h-10 rounded-full object-cover shrink-0 border border-[#00a884]" />
            <div className="min-w-0 text-left">
              <h5 className="font-extrabold text-white text-xs truncate">{(clientRecords.find(c => c.uid === globalCallAlert.uid))?.nickname || 'গ্রাহক কল'}</h5>
              <p className="text-[10px] text-slate-300 font-medium">ইনকামিং {globalCallAlert.type === 'video' ? 'ভিডিও' : 'অডিও'} কল...</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={rejectGlobalCall} className="w-9 h-9 bg-rose-600 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-rose-700 transition-colors">
              <Phone className="rotate-[135deg]" size={14} />
            </button>
            <button onClick={acceptGlobalCall} className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-emerald-600 transition-colors animate-pulse">
              <Phone size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Inputs back-refs */}
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleAdminFileUpload} />

      {/* Sidebar: Nav listing directory panel */}
      <div className={`w-full md:w-80 flex flex-col shrink-0 ${activeChatUid ? 'hidden md:flex' : 'flex'}`}>
        {/* Dynamic header tabs */}
        <header className="h-16 px-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-extrabold text-[#006a4e] tracking-tight">
              এডমিন প্যানেল
            </h1>
            <button 
              onClick={onAdminLogout}
              className="p-1 px-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-black uppercase tracking-wider"
              title="লগআউট"
            >
              <LogOut size={12} />
              <span>বাহির</span>
            </button>
          </div>
          <div className="flex bg-slate-100 rounded-xl p-1 shrink-0 text-xs font-bold">
            <button 
              onClick={() => setActiveTab('chats')} 
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'chats' ? 'bg-[#00a884] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              মেসেজ
            </button>
            <button 
              onClick={() => setActiveTab('calls')} 
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'calls' ? 'bg-[#00a884] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              কল সেবা
            </button>
          </div>
        </header>

        {activeTab === 'chats' ? (
          <>
            {/* Search list directory */}
            <div className="p-3 bg-white border-b border-slate-50 shrink-0">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200/50 rounded-xl text-xs text-slate-500">
                <Search size={14} className="shrink-0" />
                <input 
                  type="text" 
                  placeholder="গ্রাহকের নাম বা আইডি খুঁজুন..." 
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  className="bg-transparent border-none outline-none flex-1 placeholder-slate-400 min-w-0"
                />
              </div>
            </div>

            {/* List entries */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50 pt-2 divide-y divide-slate-100/30">
              {filteredClients.length > 0 ? (
                filteredClients.map((c) => {
                  const lastMsg = c.messages.length > 0 ? c.messages[c.messages.length-1] : null;
                  return (
                    <div 
                      key={c.uid}
                      onClick={() => handleOpenSpecificInbox(c.uid)}
                      className={`px-4 py-3 flex gap-3 cursor-pointer transition-colors relative hover:bg-slate-50 active:bg-slate-100/50 ${activeChatUid === c.uid ? 'bg-emerald-50/40 border-l-4 border-[#00a884]' : 'bg-white'}`}
                    >
                      <img src={c.avatar} alt="" className="w-10 h-10 rounded-full border border-slate-100 shrink-0 object-cover" />
                      <div className="min-w-0 flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-center mb-0.5">
                          <h4 className="text-xs font-extrabold text-slate-800 truncate pr-2 flex items-center gap-1.5">
                            {c.nickname}
                            {c.isBlocked && <span className="text-[8px] bg-rose-50 text-rose-500 font-extrabold px-1 py-0.5 rounded border border-rose-100 shrink-0 uppercase">ব্লকড</span>}
                          </h4>
                          <span className="text-[9px] text-slate-400 font-bold shrink-0">{c.lastTime}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-[11px] text-slate-400 truncate pr-4">{lastMsg ? lastMsg.text : 'চ্যাট ফাইল ফাঁকা রয়েছে...'}</p>
                          {c.unread > 0 && (
                            <span className="bg-[#00a884] text-white font-black text-[9px] h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shrink-0 shadow-sm shadow-[#00a884]/20 leading-none">
                              {c.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-xs text-slate-400 font-bold">
                  কোন সংযোগকারী গ্রাহক পাওয়া যায়নি।
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white">
            {callHistories.length > 0 ? (
              callHistories.map((h, idx) => {
                const tr = clientRecords.find(c => c.uid === h.uid);
                const uName = tr ? tr.nickname : `User-${h.uid}`;
                const uAvatar = tr ? tr.avatar : "https://cdn-icons-png.flaticon.com/512/847/847969.png";
                
                return (
                  <div key={idx} className="p-4 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer text-xs">
                    <img src={uAvatar} alt="" className="w-9 h-9 rounded-full object-cover bg-slate-100 border shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h5 className={`font-extrabold truncate ${h.status === 'missed' ? 'text-rose-600' : 'text-slate-850'}`}>{uName}</h5>
                        <span className="text-[9px] text-slate-400 font-bold font-mono tracking-tighter shrink-0">{formatDateForHistory(h.timestamp)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                        {h.status === 'missed' ? (
                          <span className="text-rose-500">মিসড কল (Missed)</span>
                        ) : h.direction === 'incoming' ? (
                          <span className="text-emerald-600">রিসিভড কল (Inbound)</span>
                        ) : (
                          <span className="text-slate-500">আউটগোয়িং (Outbound)</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-xs text-slate-400 font-bold">
                কল রেকর্ডে কোন কল পাওয়া যায়নি।
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interface workspace segment: Active chatting details */}
      <div className={`flex-1 flex-col bg-[#efeae2] relative ${activeChatUid ? 'flex' : 'hidden md:flex'}`}>
        {activeRecord ? (
          <>
            {/* Header channel */}
            <header className="h-16 px-4 bg-white flex items-center justify-between border-b border-slate-150 shadow-sm shrink-0 z-20">
              <div className="flex items-center gap-3 overflow-hidden min-w-0">
                <button onClick={() => setActiveChatUid(null)} className="md:hidden p-1.5 hover:bg-slate-50 rounded-full text-slate-600 mr-1 shrink-0">
                  <ChevronLeft size={20} />
                </button>
                <img src={activeRecord.avatar} alt="" className="w-10 h-10 rounded-full border border-slate-100 object-cover shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-sm font-extrabold text-slate-800 truncate">{activeRecord.nickname}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{activeRecord.isBlocked ? 'ব্লকড' : 'সরাসরি যুক্ত...'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-slate-600 shrink-0">
                <button onClick={() => initiateAdminCall('video')} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                  <Video size={18} />
                </button>
                <button onClick={() => initiateAdminCall('audio')} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                  <Phone size={16} />
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setShowMenuDropdown(p => !p)} 
                    className="p-2 hover:bg-slate-50 rounded-full transition-colors"
                  >
                    <MoreVertical size={18} />
                  </button>
                  {showMenuDropdown && (
                    <div className="absolute top-10 right-0 py-1 bg-white border border-slate-100 shadow-xl rounded-xl z-50 text-xs w-[180px] font-bold">
                      <button 
                        onClick={handleToggleBlockClient} 
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                      >
                        <Ban size={14} /> {activeRecord.isBlocked ? 'আনব্লক করুন' : 'ব্লক করুন (Block)'}
                      </button>
                      <button 
                        onClick={handleDeleteClientPermanently} 
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-rose-600 flex items-center gap-2 border-t border-slate-50"
                      >
                        <Trash2 size={14} /> 🗑️ কাস্টমার মুছে ফেলুন
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Support Messaging feeds container */}
            <main 
              className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col relative"
              style={{
                backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`,
                backgroundSize: 'cover'
              }}
            >
              {messages.map((m, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col max-w-[80%] ${m.sender === 'admin' ? 'self-end bg-[#d9fdd3]' : 'self-start bg-white'} px-3 py-2 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.06)] relative`}
                >
                  <MediaMessage text={m.text} fileUrl={m.fileUrl} fileType={m.fileType} />
                  <span className="text-[9px] text-slate-400 font-extrabold self-end mt-1 block tracking-tighter shrink-0">{m.time}</span>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </main>

            {/* Admin support entry row inputs */}
            <footer className="bg-slate-100 p-2.5 border-t border-slate-200 shrink-0 z-20">
              {showAttachMenu && (
                <div className="absolute bottom-[72px] left-4 right-4 bg-white/95 backdrop-blur-md border border-slate-100 p-5 rounded-2xl shadow-2xl grid grid-cols-2 gap-6 animate-fade-in z-30">
                  <button 
                    onClick={() => { fileInputRef.current?.click(); }} 
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                      <FileText size={20} />
                    </div>
                    <span className="text-[10px] text-slate-600 font-bold">নথিপত্র (Doc)</span>
                  </button>
                  <button 
                    onClick={() => { fileInputRef.current?.click(); }} 
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                      <Image size={20} />
                    </div>
                    <span className="text-[10px] text-slate-600 font-bold">মিডিয়া ছবি/ভিডিও</span>
                  </button>
                </div>
              )}

              <div className="flex items-end gap-2.5">
                {voiceRecording ? (
                  <div className="flex-1 bg-white rounded-2xl px-4 py-2 flex items-center justify-between border border-slate-250 animate-pulse">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-rose-600 rounded-full animate-ping shrink-0" />
                      <span className="text-xs font-bold text-slate-600 tracking-wider">রেকর্ডিং চলছে:</span>
                    </div>
                    <div className="text-sm font-bold font-mono tracking-widest text-slate-800">
                      {Math.floor(voiceSeconds / 60)}:{(voiceSeconds % 60) < 10 ? '0' : ''}{voiceSeconds % 60}
                    </div>
                    <button 
                      onClick={() => { mediaRecorder?.stop(); }} 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg text-rose-50 border border-emerald-500 shrink-0"
                    >
                      প্রেরণ করুন
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 bg-white rounded-2xl px-3 py-1.5 flex items-end gap-2 border border-slate-250 min-h-[44px]">
                    <input 
                      type="text" 
                      placeholder="গ্রাহকের প্রত্যুত্তর টাইপ করুন..." 
                      value={adminInput}
                      onChange={(e) => setAdminInput(e.target.value)}
                      onKeyPress={(e) => { if (e.key === 'Enter') handleSendAdminReply(); }}
                      className="flex-1 bg-transparent border-none outline-none text-sm text-slate-850 placeholder-slate-400 min-w-0"
                    />
                    <button 
                      onClick={() => setShowAttachMenu(p => !p)} 
                      className={`p-1 hover:text-[#00a884] rounded-full transition-colors ${showAttachMenu ? 'text-[#00a884]' : 'text-slate-400'}`}
                    >
                      <Paperclip size={20} />
                    </button>
                  </div>
                )}

                {!voiceRecording && adminInput.trim() !== '' ? (
                  <button 
                    onClick={handleSendAdminReply} 
                    className="w-11 h-11 bg-[#00a884] hover:bg-[#009675] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#00a884]/20 transition-all shrink-0 active:scale-95 cursor-pointer"
                  >
                    <Send size={18} className="translate-x-0.5" />
                  </button>
                ) : (
                  <button 
                    onClick={handleAdminVoiceTrigger} 
                    className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all shrink-0 active:scale-95 cursor-pointer ${voiceRecording ? 'bg-rose-600 hover:bg-rose-700 text-white animate-bounce' : 'bg-[#00a884] hover:bg-[#009675] text-white shadow-[#00a884]/20'}`}
                  >
                    <Mic size={18} />
                  </button>
                )}
              </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 font-black text-xs leading-relaxed space-y-2 select-none">
            <MessageCircle size={48} className="text-slate-300 animate-pulse" />
            <p>চ্যাট শুরু করতে তালিকা থেকে কোনো গ্রাহক সিলেক্ট করুন।</p>
          </div>
        )}
      </div>

      {/* WebRTC calling dialer overlay wrapper boxes */}
      <AnimatePresence>
        {callActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#121b22]/95 backdrop-blur-xl z-[150] flex flex-col justify-between p-8 text-white text-center"
          >
            {/* Top triggers */}
            <div className="flex justify-between items-center z-10 w-full shrink-0">
              <button onClick={triggerCallTermination} className="p-2 hover:bg-white/10 rounded-full">
                <ChevronLeft size={24} />
              </button>
              {callType === 'video' && (
                <div className="flex gap-4">
                  <button 
                    onClick={handleInjectFakeFeed} 
                    className="px-4 py-2 bg-purple-600/60 hover:bg-purple-600 rounded-full text-xs font-bold border border-purple-400/20 shadow-lg flex items-center gap-1.5 transition-all text-purple-50 active:scale-95 cursor-pointer"
                  >
                    <PlaySquare size={14} /> Fake Video Inject
                  </button>
                  <button onClick={handleCameraFlipState} className="p-2.5 bg-white/15 hover:bg-white/20 rounded-full">
                    <RotateCw size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* Video displays overlay middle channels */}
            <div className="flex-1 flex flex-col justify-center items-center relative z-10 min-h-0 py-4">
              {callType === 'video' ? (
                <div className="w-full h-full rounded-2xl overflow-hidden relative bg-black/60 shadow-inner">
                  {connectingState ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-3 border-[#00a884] border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">সংযোগ করা হচ্ছে...</p>
                    </div>
                  ) : (
                    <>
                      {/* Video remote feed */}
                      {fakeVideoUrl ? (
                        <div className="w-full h-full relative">
                          <video src={fakeVideoUrl} autoPlay loop playsInline className="w-full h-full object-cover"></video>
                          {/* Fake speaker controls */}
                          <button 
                            onClick={() => {
                              const aud = document.querySelector('video') as HTMLVideoElement;
                              if (aud) {
                                aud.muted = !aud.muted;
                                alert(aud.muted ? 'Fake Video Sound Muted!' : 'Fake Video Sound Playing!');
                              }
                            }} 
                            className="absolute top-4 left-4 bg-purple-700/80 px-3 py-1 text-[10px] font-bold rounded-full border border-purple-400 cursor-pointer"
                          >
                            Volume Toggle
                          </button>
                        </div>
                      ) : (
                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      )}

                      {/* Local camera capture thumbnail preview */}
                      {!isVideoOff && (
                        <video 
                          ref={localVideoRef} 
                          autoPlay 
                          playsInline 
                          muted 
                          className="absolute bottom-4 right-4 w-28 h-36 bg-black rounded-xl border border-white/20 object-cover shadow-2xl animate-fade-in"
                        />
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <img 
                    src={activeRecord?.avatar || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                    alt="" 
                    className="w-28 h-28 rounded-full border-4 border-white/10 shadow-2xl object-cover bg-slate-100" 
                  />
                  <div>
                    <h3 className="text-xl font-bold font-sans">{activeRecord?.nickname || 'গ্রাহক'}</h3>
                    <p className="text-xs text-[#00a884] font-bold mt-1 uppercase tracking-widest">{connectingState ? 'কল কানেক্ট হচ্ছে...' : 'কল সংযোগ নিশ্চিত...'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Controls panel buttons */}
            <div className="bg-[#232d36] rounded-[2rem] p-4 flex justify-around items-center w-full max-w-sm mx-auto shadow-2xl z-20 shrink-0 select-none">
              <button 
                onClick={handleSpeakerState} 
                className={`p-3 rounded-full transition-colors ${isMuted ? 'bg-white text-slate-900 shadow-md' : 'hover:bg-white/10 text-white'}`}
              >
                <Mic size={20} />
              </button>
              {callType === 'video' && (
                <button 
                  onClick={handleVideoOnOffState} 
                  className={`p-3 rounded-full transition-colors ${isVideoOff ? 'bg-white text-slate-900 shadow-md' : 'hover:bg-white/10 text-white'}`}
                >
                  <Video size={20} />
                </button>
              )}
              <button 
                onClick={triggerCallTermination} 
                className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer"
              >
                <Phone className="rotate-[135deg]" size={20} />
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
