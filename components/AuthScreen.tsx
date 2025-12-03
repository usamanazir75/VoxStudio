
import React, { useState } from 'react';
import { Mic, Lock, Sparkles, AlertCircle, Mail, User, ArrowRight, Eye, EyeOff, X } from 'lucide-react';
import { User as UserType } from '../types';
import { userService } from '../services/userService';

interface AuthScreenProps {
  onLogin: (user: UserType) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  // Google Simulation State
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

  const executeGoogleLogin = (emailToUse: string) => {
    if (!emailToUse || !emailToUse.includes('@')) return;
    
    setLoading(true);
    setShowGoogleModal(false);
    setError('');

    setTimeout(() => {
        const emailPrefix = emailToUse.split('@')[0];
        const displayName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
        
        const user = userService.loginWithGoogle(
            emailToUse.trim(), 
            displayName,
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${emailToUse}`
        );
        onLogin(user);
        setLoading(false);
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      if (!email || !password) {
          setError('Please fill in all fields');
          return;
      }
      if (authMode === 'signup' && !name) {
          setError('Name is required for signup');
          return;
      }

      setLoading(true);
      
      setTimeout(() => {
          if (authMode === 'login') {
              const res = userService.loginWithEmail(email, password);
              if (res.success && res.user) {
                  onLogin(res.user);
              } else {
                  setError(res.error || 'Login failed');
              }
          } else {
              const res = userService.registerWithEmail(name, email, password);
              if (res.success && res.user) {
                  onLogin(res.user);
              } else {
                  setError(res.error || 'Signup failed');
              }
          }
          setLoading(false);
      }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-black relative overflow-hidden">
      
      {/* Background FX */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-1000"></div>
        <div className="absolute bottom-[-10%] right-[20%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] mix-blend-screen"></div>
      </div>

      <div className="glass p-8 md:p-10 rounded-3xl w-full max-w-[420px] relative z-10 shadow-2xl shadow-indigo-500/10 border border-white/10 flex flex-col items-center">
        
        <div className="mb-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/30">
            <Mic className="text-white w-8 h-8 drop-shadow-md" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">VoxStudio<span className="text-indigo-400">Pro</span></h1>
          <p className="text-slate-400 text-sm font-medium mt-1">Professional Voice Synthesis</p>
        </div>

        {/* Auth Tabs */}
        <div className="grid grid-cols-2 w-full bg-slate-900/50 p-1 rounded-xl mb-6 border border-white/5">
            <button 
                type="button"
                onClick={() => { setAuthMode('login'); setError(''); }}
                className={`text-sm font-bold py-2.5 rounded-lg transition-all ${authMode === 'login' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
                Login
            </button>
            <button 
                type="button"
                onClick={() => { setAuthMode('signup'); setError(''); }}
                className={`text-sm font-bold py-2.5 rounded-lg transition-all ${authMode === 'signup' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
                Sign Up
            </button>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex gap-2 items-center text-red-200 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
            )}

            {authMode === 'signup' && (
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                            placeholder="John Doe"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>
                </div>
            )}

            <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                        type="email" 
                        className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                        placeholder="name@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                        type={showPassword ? "text" : "password"}
                        className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-sm text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <button 
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>{authMode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight className="w-4 h-4" /></>}
            </button>
        </form>

        <div className="relative py-6 w-full">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0b0f1d] px-2 text-slate-500">Or continue with</span></div>
        </div>

        <button 
            type="button"
            onClick={() => setShowGoogleModal(true)}
            disabled={loading}
            className="w-full bg-white text-slate-900 hover:bg-slate-100 py-3 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-3 transition-all"
        >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
            <span>Google</span>
        </button>

        {authMode === 'signup' && (
             <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mt-6 flex gap-3 items-center w-full">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <p className="text-xs text-emerald-100">
                    Sign up now to get <span className="font-bold text-white">10,000 Credits</span> free!
                </p>
            </div>
        )}
      </div>

      {/* Simulated Google Popup Modal */}
      {showGoogleModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white text-slate-900 rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
                        <span className="font-medium text-lg">Sign in with Google</span>
                      </div>
                      <button onClick={() => setShowGoogleModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                  </div>
                  
                  <div className="p-2">
                      <div className="px-6 py-4">
                          <p className="text-slate-600 text-sm mb-4">Choose an account to continue to <span className="font-semibold text-slate-900">VoxStudio Pro</span></p>
                          
                          <div className="space-y-1">
                              {/* Account 1: Admin */}
                              <button onClick={() => executeGoogleLogin('voxstudioadmin@gmail.com')} className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-200 text-left">
                                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">V</div>
                                  <div>
                                      <div className="text-sm font-semibold text-slate-900">Vox Admin</div>
                                      <div className="text-xs text-slate-500">voxstudioadmin@gmail.com</div>
                                  </div>
                              </button>

                              {/* Account 2: Demo User */}
                              <button onClick={() => executeGoogleLogin('demo.user@gmail.com')} className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-200 text-left">
                                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">D</div>
                                  <div>
                                      <div className="text-sm font-semibold text-slate-900">Demo User</div>
                                      <div className="text-xs text-slate-500">demo.user@gmail.com</div>
                                  </div>
                              </button>
                          </div>
                      </div>

                      <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/50">
                           <p className="text-xs font-bold text-slate-500 uppercase mb-2">Use another account</p>
                           <div className="flex gap-2">
                               <input 
                                    type="email" 
                                    placeholder="Enter email address" 
                                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-all"
                                    value={customGoogleEmail}
                                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && executeGoogleLogin(customGoogleEmail)}
                               />
                               <button 
                                    onClick={() => executeGoogleLogin(customGoogleEmail)}
                                    disabled={!customGoogleEmail.includes('@')}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                               >
                                   Next
                               </button>
                           </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AuthScreen;
