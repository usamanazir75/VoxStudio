import React, { useState, useRef } from 'react';
import { Mic, UploadCloud, CheckCircle, Fingerprint, Play, AlertTriangle, FileAudio, Shield, Info, BarChart3, Lock, Check } from 'lucide-react';
import { userService } from '../services/userService';
import { User, VoiceQualityReport } from '../types';

interface VoiceCloningProps {
    user: User;
    onUpdateUser: (u: User) => void;
}

const VoiceCloning: React.FC<VoiceCloningProps> = ({ user, onUpdateUser }) => {
    const [step, setStep] = useState(0); // 0 = Consent, 1 = Name/Gender, 2 = Upload, 3 = Process, 4 = Result
    const [voiceName, setVoiceName] = useState('');
    const [gender, setGender] = useState<'Male'|'Female'>('Male');
    const [isRecording, setIsRecording] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [processStep, setProcessStep] = useState<string>('');
    const [progress, setProgress] = useState(0);
    const [consentGiven, setConsentGiven] = useState(false);
    const [qualityReport, setQualityReport] = useState<VoiceQualityReport | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- STEP 0: CONSENT ---
    const handleConsent = () => {
        if(consentGiven) setStep(1);
    };

    // --- STEP 1: METADATA ---
    const startCloning = () => {
        if(!voiceName.trim()) return;
        setStep(2);
    };

    // --- STEP 2: INGESTION ---
    const handleRecord = () => {
        setIsRecording(true);
        // Simulate recording duration requirement
        setTimeout(() => {
            setIsRecording(false);
            setStep(3);
        }, 4000);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            let p = 0;
            const interval = setInterval(() => {
                p += 10;
                setUploadProgress(p);
                if (p >= 100) {
                    clearInterval(interval);
                    setIsUploading(false);
                    setStep(3);
                }
            }, 200);
        }
    };

    // --- STEP 3: ADVANCED PIPELINE SIMULATION ---
    React.useEffect(() => {
        if (step === 3) {
            const pipeline = [
                { msg: "Analyzing spectral features & pitch contours...", time: 1000 },
                { msg: "Aligning phonemes (Force Alignment)...", time: 2500 },
                { msg: "Training VITS Acoustic Model...", time: 4500 },
                { msg: "Fine-tuning HiFi-GAN Vocoder...", time: 6500 },
                { msg: "Generating Quality Report...", time: 8000 }
            ];

            let currentStepIdx = 0;
            
            const updatePipeline = () => {
                if (currentStepIdx < pipeline.length) {
                    setProcessStep(pipeline[currentStepIdx].msg);
                    currentStepIdx++;
                }
            };

            const interval = setInterval(updatePipeline, 1500);

            // Total Progress Bar
            let p = 0;
            const progInterval = setInterval(() => {
                p += 1; 
                setProgress(Math.min(p, 100));
                if (p >= 100) {
                    clearInterval(progInterval);
                    clearInterval(interval);
                    finalizeClone();
                }
            }, 80);

            return () => {
                clearInterval(interval);
                clearInterval(progInterval);
            };
        }
    }, [step]);

    const finalizeClone = () => {
        const report: VoiceQualityReport = {
            mosScore: 4.2 + (Math.random() * 0.5), // Simulating high fidelity
            similarity: 92 + (Math.random() * 6),
            stability: 88 + (Math.random() * 10),
            dateCreated: Date.now(),
            consentVerified: true
        };
        setQualityReport(report);
        
        // Use updated userService to store quality report
        userService.addClonedVoice(user.id, voiceName, gender, report);
        const updated = userService.getCurrentUser();
        if(updated) onUpdateUser(updated);
        
        setStep(4);
    };

    return (
        <div className="glass rounded-3xl p-8 max-w-3xl mx-auto h-full flex flex-col items-center justify-center border border-white/10 shadow-2xl relative bg-slate-900/40 overflow-hidden">
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-700 ease-out"
                    style={{ width: `${(step / 4) * 100}%` }}
                ></div>
            </div>

            {/* Header Icon */}
            <div className="mb-6 p-4 bg-indigo-500/10 rounded-full border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.15)] animate-in fade-in zoom-in duration-500">
                <Fingerprint className="w-10 h-10 text-indigo-400" />
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Pro Voice Cloning</h2>
            <p className="text-slate-400 mb-8 text-center max-w-md">Create a high-fidelity 1:1 digital twin using our VITS + HiFi-GAN pipeline.</p>

            {/* --- STEP 0: CONSENT --- */}
            {step === 0 && (
                <div className="w-full max-w-md bg-slate-800/50 p-6 rounded-2xl border border-white/10 animate-in slide-in-from-bottom-4 fade-in">
                    <div className="flex items-start gap-3 mb-4">
                        <Shield className="w-6 h-6 text-amber-400 shrink-0 mt-1" />
                        <div>
                            <h3 className="text-white font-bold text-lg">Legal & Consent Required</h3>
                            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                                To prevent misuse, you must certify that you have the rights to clone this voice. 
                                Cloning voices of public figures or without permission is strictly prohibited and monitored.
                            </p>
                        </div>
                    </div>
                    
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 mb-6 text-xs text-slate-300 font-mono">
                        <p className="mb-2">I hereby certify that:</p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>I am the speaker, OR I have explicit written permission from the speaker.</li>
                            <li>I will not use this clone for deepfakes, fraud, or harassment.</li>
                            <li>I understand this action is logged (IP: 192.168.x.x).</li>
                        </ul>
                    </div>

                    <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors mb-6 border border-transparent hover:border-white/10">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${consentGiven ? 'bg-indigo-500 border-indigo-500' : 'border-slate-500'}`}>
                            {consentGiven && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <input type="checkbox" className="hidden" checked={consentGiven} onChange={e => setConsentGiven(e.target.checked)} />
                        <span className="text-sm font-bold text-white">I agree to the Terms of Service and Ethics Policy.</span>
                    </label>

                    <button 
                        onClick={handleConsent} 
                        disabled={!consentGiven}
                        className="w-full bg-white text-slate-900 font-bold py-3 rounded-xl hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                    >
                        Confirm & Continue
                    </button>
                </div>
            )}

            {/* --- STEP 1: METADATA --- */}
            {step === 1 && (
                <div className="w-full space-y-4 max-w-sm animate-in slide-in-from-right-8 fade-in">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Voice Name</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-white focus:border-indigo-500 outline-none transition-all"
                            placeholder="e.g. My Narrator Voice"
                            value={voiceName}
                            onChange={e => setVoiceName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Gender Base (for initial alignment)</label>
                        <div className="flex gap-2">
                            <button onClick={() => setGender('Male')} className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${gender === 'Male' ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-900/20' : 'bg-slate-900/50 text-slate-400 border-white/5 hover:bg-slate-800'}`}>Male</button>
                            <button onClick={() => setGender('Female')} className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${gender === 'Female' ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-900/20' : 'bg-slate-900/50 text-slate-400 border-white/5 hover:bg-slate-800'}`}>Female</button>
                        </div>
                    </div>
                    <button onClick={startCloning} disabled={!voiceName} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl mt-4 shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all">Next: Upload Samples</button>
                </div>
            )}

            {/* --- STEP 2: INGESTION --- */}
            {step === 2 && (
                <div className="text-center animate-in slide-in-from-right-8 fade-in w-full max-w-md">
                    <div className="flex items-center justify-between mb-4 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-amber-200 text-xs font-medium">
                        <div className="flex items-center gap-2"><Info className="w-4 h-4" /> Recommended:</div>
                        <span>1-3 minutes of high-quality audio (WAV/MP3)</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col items-center gap-3 group">
                            <button 
                                onClick={handleRecord}
                                disabled={isRecording || isUploading}
                                className={`w-24 h-24 rounded-2xl border-2 flex items-center justify-center transition-all shadow-lg ${isRecording ? 'bg-red-500/10 border-red-500 animate-pulse' : 'bg-slate-800 border-white/5 hover:border-indigo-500 hover:bg-slate-750'}`}
                            >
                                <Mic className={`w-8 h-8 ${isRecording ? 'text-red-500' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                            </button>
                            <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">Record Mic</span>
                        </div>

                        <div className="flex flex-col items-center gap-3 group">
                             <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isRecording || isUploading}
                                className="w-24 h-24 rounded-2xl border-2 border-dashed border-white/10 bg-slate-800 hover:border-indigo-500 hover:bg-slate-750 flex items-center justify-center transition-all shadow-lg relative overflow-hidden"
                            >
                                {isUploading ? (
                                    <>
                                        <div className="absolute inset-0 bg-indigo-500/10" style={{ height: `${uploadProgress}%`, bottom: 0, top: 'auto' }}></div>
                                        <span className="text-indigo-400 font-bold text-sm z-10">{uploadProgress}%</span>
                                    </>
                                ) : (
                                    <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-indigo-400" />
                                )}
                            </button>
                            <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">Upload File</span>
                            <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" onChange={handleFileUpload} />
                        </div>
                    </div>
                    <p className="mt-8 text-xs text-slate-600">Max file size: 50MB. Noise reduction is applied automatically.</p>
                </div>
            )}

            {/* --- STEP 3: PROCESSING --- */}
            {step === 3 && (
                 <div className="w-full max-w-sm text-center animate-in zoom-in-95 fade-in">
                     <div className="relative w-24 h-24 mx-auto mb-8">
                         <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                         <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                         <div className="absolute inset-0 flex items-center justify-center font-bold text-xl text-white">{progress}%</div>
                     </div>
                     
                     <h3 className="text-white font-bold text-xl mb-2">Training Voice Model</h3>
                     <p className="text-indigo-400 text-sm font-medium mb-8 animate-pulse">{processStep}</p>
                     
                     <div className="bg-black/20 rounded-xl p-4 text-left border border-white/5 space-y-2">
                         <div className="flex items-center gap-3 text-xs text-slate-400">
                             <div className={`w-2 h-2 rounded-full ${progress > 10 ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
                             Preprocessing & Segmentation
                         </div>
                         <div className="flex items-center gap-3 text-xs text-slate-400">
                             <div className={`w-2 h-2 rounded-full ${progress > 40 ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
                             Acoustic Feature Extraction
                         </div>
                         <div className="flex items-center gap-3 text-xs text-slate-400">
                             <div className={`w-2 h-2 rounded-full ${progress > 70 ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
                             Generative Adversarial Network (GAN)
                         </div>
                     </div>
                 </div>
            )}

            {/* --- STEP 4: QUALITY REPORT & RESULT --- */}
            {step === 4 && qualityReport && (
                <div className="text-center animate-in zoom-in duration-300 w-full max-w-lg">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 mb-6">
                        <div className="flex items-center justify-center gap-2 mb-2">
                             <CheckCircle className="w-6 h-6 text-emerald-400" />
                             <h3 className="text-xl font-bold text-white">Voice Ready</h3>
                        </div>
                        <p className="text-emerald-200/70 text-sm">Model training complete. Added to your library.</p>
                    </div>

                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5 mb-8">
                        <h4 className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" /> Quality Report
                        </h4>
                        
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                <div className="text-2xl font-bold text-white">{qualityReport.mosScore.toFixed(1)}</div>
                                <div className="text-[10px] text-slate-500 uppercase font-bold">MOS Score</div>
                            </div>
                            <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                <div className="text-2xl font-bold text-white">{qualityReport.similarity.toFixed(0)}%</div>
                                <div className="text-[10px] text-slate-500 uppercase font-bold">Similarity</div>
                            </div>
                            <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                <div className="text-2xl font-bold text-white">{qualityReport.stability.toFixed(0)}%</div>
                                <div className="text-[10px] text-slate-500 uppercase font-bold">Stability</div>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between border border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center"><Play className="w-4 h-4 text-white ml-0.5" /></div>
                                <div className="text-left">
                                    <div className="text-xs font-bold text-white">Preview Clone</div>
                                    <div className="text-[10px] text-slate-400">0:08 • Generated Sample</div>
                                </div>
                            </div>
                            <div className="text-[10px] font-mono text-slate-500">PRO-VITS-MODEL</div>
                        </div>
                    </div>

                    <button onClick={() => { setStep(0); setConsentGiven(false); setVoiceName(''); }} className="bg-white text-slate-900 px-8 py-3 rounded-xl font-bold hover:bg-slate-100 shadow-xl transition-all">Clone Another Voice</button>
                </div>
            )}
        </div>
    );
}

export default VoiceCloning;