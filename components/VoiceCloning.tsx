
import React, { useState, useRef } from 'react';
import { Mic, UploadCloud, CheckCircle, Fingerprint, Play, AlertTriangle, FileAudio } from 'lucide-react';
import { userService } from '../services/userService';
import { User } from '../types';

interface VoiceCloningProps {
    user: User;
    onUpdateUser: (u: User) => void;
}

const VoiceCloning: React.FC<VoiceCloningProps> = ({ user, onUpdateUser }) => {
    const [step, setStep] = useState(1);
    const [voiceName, setVoiceName] = useState('');
    const [gender, setGender] = useState<'Male'|'Female'>('Male');
    const [isRecording, setIsRecording] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const startCloning = () => {
        if(!voiceName.trim()) return;
        setStep(2);
    };

    const handleRecord = () => {
        setIsRecording(true);
        // Simulate recording process
        setTimeout(() => {
            setIsRecording(false);
            setStep(3);
        }, 3000);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            // Simulate upload processing
            setTimeout(() => {
                setIsUploading(false);
                setStep(3);
            }, 2000);
        }
    };

    const processClone = () => {
        // Simulate processing
        let p = 0;
        const interval = setInterval(() => {
            p += 10;
            setProgress(p);
            if(p >= 100) {
                clearInterval(interval);
                userService.addClonedVoice(user.id, voiceName, gender);
                const updated = userService.getCurrentUser();
                if(updated) onUpdateUser(updated);
                setStep(4);
            }
        }, 300);
    };

    return (
        <div className="glass rounded-3xl p-8 max-w-2xl mx-auto h-full flex flex-col items-center justify-center border border-white/10 shadow-2xl relative bg-slate-900/40">
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${step * 25}%` }}
                ></div>
            </div>

            <div className="mb-8 p-4 bg-indigo-500/10 rounded-full border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
                <Fingerprint className="w-12 h-12 text-indigo-400" />
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-2">Instant Voice Cloning</h2>
            <p className="text-slate-400 mb-8 text-center max-w-md">Create a digital twin of your voice in seconds using our advanced neural engine.</p>

            {step === 1 && (
                <div className="w-full space-y-4 max-w-sm animate-in fade-in">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Voice Name</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-white focus:border-indigo-500 outline-none"
                            placeholder="e.g. My Personal Voice"
                            value={voiceName}
                            onChange={e => setVoiceName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Gender Base</label>
                        <div className="flex gap-2">
                            <button onClick={() => setGender('Male')} className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${gender === 'Male' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900/50 text-slate-400 border-white/5'}`}>Male</button>
                            <button onClick={() => setGender('Female')} className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${gender === 'Female' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900/50 text-slate-400 border-white/5'}`}>Female</button>
                        </div>
                    </div>
                    <button onClick={startCloning} disabled={!voiceName} className="w-full bg-white text-slate-900 font-bold py-3 rounded-xl mt-4 hover:bg-slate-100 disabled:opacity-50">Next Step</button>
                </div>
            )}

            {step === 2 && (
                <div className="text-center animate-in fade-in w-full max-w-md">
                    <p className="text-white text-lg font-medium mb-6">Provide a voice sample:</p>
                    <div className="bg-slate-800/50 p-6 rounded-xl border border-white/10 mb-8 text-slate-200 italic font-serif text-lg">
                        "The quick brown fox jumps over the lazy dog, capturing the essence of a digital voice."
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col items-center gap-3">
                            <button 
                                onClick={handleRecord}
                                disabled={isRecording || isUploading}
                                className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 border-red-900 animate-pulse' : 'bg-slate-800 border-slate-700 hover:border-red-500 hover:bg-slate-700'}`}
                            >
                                <Mic className={`w-8 h-8 ${isRecording ? 'text-white' : 'text-slate-400'}`} />
                            </button>
                            <span className="text-xs font-bold text-slate-500">Record Mic</span>
                        </div>

                        <div className="flex flex-col items-center gap-3">
                             <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isRecording || isUploading}
                                className="w-20 h-20 rounded-full border-4 border-slate-700 bg-slate-800 hover:border-indigo-500 hover:bg-slate-700 flex items-center justify-center transition-all"
                            >
                                {isUploading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UploadCloud className="w-8 h-8 text-slate-400" />}
                            </button>
                            <span className="text-xs font-bold text-slate-500">Upload File</span>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="audio/*" 
                                onChange={handleFileUpload}
                            />
                        </div>
                    </div>
                    
                    <p className="mt-8 text-xs text-slate-500">Supported formats: MP3, WAV, M4A (Max 10MB)</p>
                </div>
            )}

            {step === 3 && (
                 <div className="w-full max-w-sm text-center animate-in fade-in">
                     <h3 className="text-white font-bold mb-6">Processing Voice Model</h3>
                     <div className="w-full bg-slate-800 rounded-full h-4 mb-4 overflow-hidden">
                         <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300" style={{width: `${progress}%`}}></div>
                     </div>
                     <p className="text-slate-400 text-sm mb-6">{progress < 100 ? "Analyzing frequency patterns..." : "Finalizing model..."}</p>
                     {progress === 0 && (
                         <button onClick={processClone} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-500 w-full flex items-center justify-center gap-2">
                             <Fingerprint className="w-5 h-5" /> Start Processing
                         </button>
                     )}
                 </div>
            )}

            {step === 4 && (
                <div className="text-center animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                        <CheckCircle className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Voice Cloned Successfully!</h3>
                    <p className="text-slate-400 mb-8">"{voiceName}" has been added to your personal library.</p>
                    <button onClick={() => setStep(1)} className="bg-white text-slate-900 px-8 py-3 rounded-xl font-bold hover:bg-slate-100">Clone Another</button>
                </div>
            )}
        </div>
    );
}

export default VoiceCloning;
