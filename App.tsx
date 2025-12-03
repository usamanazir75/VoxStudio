
import React, { useState, useEffect } from 'react';
import VoiceLibrary from './components/VoiceLibrary';
import MultiSpeechAnalyzer from './components/MultiSpeechAnalyzer';
import AuthScreen from './components/AuthScreen';
import TextToSpeech from './components/TextToSpeech';
import AdminDashboard from './components/AdminDashboard';
import LiveRecord from './components/LiveRecord';
import VoiceCloning from './components/VoiceCloning';
import Settings from './components/Settings';
import { Mic, LayoutGrid, Radio, Settings as SettingsIcon, FileAudio, LogOut, Zap, Bell, Shield, Fingerprint, PlusCircle, Check } from 'lucide-react';
import { Voice, User } from './types';
import { userService } from './services/userService';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'tts' | 'library' | 'multi' | 'admin' | 'live' | 'clone' | 'settings'>('tts');
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [requestAmount, setRequestAmount] = useState(10000);

  const refreshUser = () => {
      const u = userService.getCurrentUser();
      if (u) setUser(u);
  };

  useEffect(() => {
    const u = userService.getCurrentUser();
    if (u) {
      setUser(u);
      setIsAuthenticated(true);
    }

    const handleCreditUpdate = () => refreshUser();
    window.addEventListener('creditsUpdated', handleCreditUpdate);
    return () => window.removeEventListener('creditsUpdated', handleCreditUpdate);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    userService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const handleCreditRequest = () => {
      if(user) {
          userService.requestCredits(user.id, user.name, requestAmount);
          setShowCreditModal(false);
          alert("Request sent to admin!");
      }
  }

  if (!isAuthenticated || !user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden relative selection:bg-indigo-500/30">
      
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-[150px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[150px]"></div>
      </div>

      {/* Sidebar */}
      <aside className="relative z-20 w-64 bg-slate-900/60 backdrop-blur-xl border-r border-white/5 flex flex-col flex-shrink-0 transition-all duration-300">
        <div className="p-5 flex items-center gap-3 border-b border-white/5 h-16">
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <Mic className="text-white w-4 h-4" />
            </div>
            <div>
                 <h1 className="font-bold text-sm text-white">VoxStudio</h1>
                 <div className="flex items-center gap-1 text-[10px] text-slate-400">
                     <span>Pro Edition</span>
                 </div>
            </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 py-6 overflow-y-auto">
          {user.role === 'admin' && (
              <SidebarItem icon={<Shield size={18} />} label="Admin Dashboard" isActive={activeTab === 'admin'} onClick={() => setActiveTab('admin')} badge="Admin" />
          )}

          <div className="pt-2 pb-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Create</div>
          <SidebarItem icon={<Zap size={18} />} label="Text to Speech" isActive={activeTab === 'tts'} onClick={() => setActiveTab('tts')} />
          <SidebarItem icon={<FileAudio size={18} />} label="Multi-Speech" isActive={activeTab === 'multi'} onClick={() => setActiveTab('multi')} />
          <SidebarItem icon={<Radio size={18} />} label="Live Record" isActive={activeTab === 'live'} onClick={() => setActiveTab('live')} />
          <SidebarItem icon={<Fingerprint size={18} />} label="Voice Cloning" isActive={activeTab === 'clone'} onClick={() => setActiveTab('clone')} badge="New" />

          <div className="pt-4 pb-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Assets</div>
          <SidebarItem icon={<LayoutGrid size={18} />} label="Voice Library" isActive={activeTab === 'library'} onClick={() => setActiveTab('library')} />
          <SidebarItem icon={<SettingsIcon size={18} />} label="Settings" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>
        
        {/* User Footer with Credits */}
        <div className="p-4 border-t border-white/5 bg-black/20">
            <div className="bg-slate-800/50 p-3 rounded-xl mb-3 border border-white/5">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Credits</span>
                    <button onClick={() => setShowCreditModal(true)} className="text-[10px] text-indigo-400 hover:text-white flex items-center gap-1"><PlusCircle className="w-3 h-3" /> Get More</button>
                </div>
                <div className="text-lg font-mono font-bold text-white mb-1">{user.credits.toLocaleString()}</div>
                <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full w-[40%]"></div>
                </div>
            </div>

            <button onClick={handleLogout} className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                    {user.avatar ? <img src={user.avatar} alt="av" className="w-full h-full" /> : user.name.charAt(0)}
                </div>
                <div className="text-left flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">{user.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
                </div>
                <LogOut className="w-4 h-4" />
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10 bg-gradient-to-b from-slate-900/50 to-transparent">
        <header className="h-16 border-b border-white/5 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30 shrink-0">
             <h2 className="font-bold text-lg text-white capitalize">{activeTab.replace('-', ' ')}</h2>
             <div className="flex items-center gap-4">
                 <button className="relative p-2 text-slate-400 hover:text-white">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                 </button>
             </div>
        </header>

        <div className="flex-1 p-6 overflow-hidden">
            <div className="h-full w-full mx-auto animate-in fade-in duration-300">
              {activeTab === 'tts' && <TextToSpeech onOpenCredits={() => setShowCreditModal(true)} />}
              {activeTab === 'library' && <VoiceLibrary onSelectVoice={setSelectedVoice} selectedVoiceId={selectedVoice?.id} />}
              {activeTab === 'multi' && <MultiSpeechAnalyzer />}
              {activeTab === 'admin' && user.role === 'admin' && <AdminDashboard />}
              {activeTab === 'live' && <LiveRecord />}
              {activeTab === 'clone' && <VoiceCloning user={user} onUpdateUser={setUser} />}
              {activeTab === 'settings' && <Settings user={user} onUpdate={setUser} />}
            </div>
        </div>
      </main>

      {/* Get Credits Modal */}
      {showCreditModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
              <div className="glass bg-slate-900 p-8 rounded-2xl max-w-sm w-full border border-white/10 shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-4">Request Credits</h3>
                  <p className="text-slate-400 text-sm mb-6">Need more generation time? Send a request to the admin.</p>
                  
                  <div className="space-y-3 mb-6">
                      {[10000, 50000, 100000].map(amt => (
                          <button 
                            key={amt} 
                            onClick={() => setRequestAmount(amt)}
                            className={`w-full p-3 rounded-xl border flex justify-between items-center transition-all ${requestAmount === amt ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-white/5 text-slate-400 hover:border-white/20'}`}
                          >
                              <span className="font-bold">{amt.toLocaleString()} Credits</span>
                              {requestAmount === amt && <Check size={16} />}
                          </button>
                      ))}
                  </div>

                  <div className="flex gap-3">
                      <button onClick={() => setShowCreditModal(false)} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700">Cancel</button>
                      <button onClick={handleCreditRequest} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500">Send Request</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}

const SidebarItem: React.FC<{ icon: React.ReactNode; label: string; isActive?: boolean; onClick: () => void; badge?: string }> = ({ icon, label, isActive, onClick, badge }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all group relative ${
            isActive ? 'bg-white/10 text-white font-medium' : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
    >
        <div className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'} transition-colors`}>{icon}</div>
        <span className="text-sm truncate flex-1 text-left">{label}</span>
        {badge && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-indigo-950 ${isActive ? 'bg-white' : 'bg-indigo-400'}`}>{badge}</span>}
    </button>
);

export default App;
