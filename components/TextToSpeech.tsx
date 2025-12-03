
import React, { useState, useEffect } from 'react';
import { Voice, TTSSettings, HistoryItem } from '../types';
import { VOICES, PREMIUM_VOICES } from '../constants';
import { Play, Download, Settings, RefreshCw, MessageSquare, Mic, BookOpen, Smile, RotateCcw, ChevronRight, X, Volume2, Wand2, DollarSign } from 'lucide-react';
import { generateVoicePreview } from '../services/geminiService';
import { decodeBase64Audio, processAudioBuffer, audioBufferToBlob } from '../services/audioUtils';
import VoiceLibrary from './VoiceLibrary';
import { userService } from '../services/userService';

interface TextToSpeechProps {
    onOpenCredits: () => void;
}

const TextToSpeech: React.FC<TextToSpeechProps> = ({ onOpenCredits }) => {
    // Core State
    const [text, setText] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [lastAudioUrl, setLastAudioUrl] = useState<string | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    
    // Selection Modal State
    const [showVoicePicker, setShowVoicePicker] = useState(false);

    // Settings State
    const [activeVoice, setActiveVoice] = useState<Voice>(PREMIUM_VOICES[0] || VOICES[0]);
    const [settings, setSettings] = useState<TTSSettings>({
        voiceId: activeVoice.id,
        modelId: 'gemini-2.5-flash-tts',
        speed: 1.0,
        stability: 0.5,
        similarity: 0.8,
        style: 0.0,
        speakerBoost: true
    });

    const [activeSideTab, setActiveSideTab] = useState<'settings' | 'history'>('settings');
    const currentUser = userService.getCurrentUser();

    // Quick Start Prompts
    const quickStarts = [
        { icon: <BookOpen className="w-3.5 h-3.5" />, label: "Narrate a story", text: "Once upon a time, in a land far away, the ancient forest whispered secrets..." },
        { icon: <Smile className="w-3.5 h-3.5" />, label: "Tell a silly joke", text: "Why did the scarecrow win an award? Because he was outstanding in his field!" },
        { icon: <Mic className="w-3.5 h-3.5" />, label: "Record an advertisement", text: "Experience the future of sound today. Crystal clear audio, delivered instantly." },
        { icon: <MessageSquare className="w-3.5 h-3.5" />, label: "Direct a dramatic scene", text: "[Breathless] I never thought it would end like this. The walls are closing in!" }
    ];

    const handleGenerate = async () => {
        if (!text.trim() || !process.env.API_KEY) return;
        
        const cost = text.length;
        if (currentUser && currentUser.credits < cost) {
            onOpenCredits();
            return;
        }

        setIsGenerating(true);
        setLastAudioUrl(null);

        try {
            const temperature = Math.max(0.1, (1 - settings.stability) * 1.8);
            const topP = 0.95 - (settings.similarity * 0.15);

            const base64 = await generateVoicePreview(text, activeVoice.apiVoiceName, temperature, topP);
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            let buffer = await decodeBase64Audio(base64, audioContext);

            const boost = settings.speakerBoost ? 1.5 : 1.0;
            buffer = await processAudioBuffer(buffer, 0, settings.speed, boost);

            const blob = audioBufferToBlob(buffer);
            const url = URL.createObjectURL(blob);
            setLastAudioUrl(url);

            const newItem: HistoryItem = {
                id: Date.now().toString(),
                text: text.substring(0, 60) + (text.length > 60 ? '...' : ''),
                voiceName: activeVoice.name,
                date: Date.now(),
                duration: buffer.duration
            };
            setHistory(prev => [newItem, ...prev]);

            // Deduct credits
            if (currentUser) {
                userService.deductCredits(currentUser.id, cost);
                window.dispatchEvent(new Event('creditsUpdated'));
            }

        } catch (e) {
            console.error(e);
            alert("Generation failed");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleVoiceSelect = (voice: Voice) => {
        setActiveVoice(voice);
        setSettings(prev => ({ ...prev, voiceId: voice.id }));
        setShowVoicePicker(false);
    };

    return (
        <div className="flex h-full w-full bg-slate-900/40 rounded-3xl overflow-hidden border border-white/10 shadow-2xl backdrop-blur-sm relative">
            {/* Center Panel - Input */}
            <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-transparent to-slate-900/20">
                
                {/* Fixed Header */}
                <div className="p-8 pb-4 shrink-0">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white">Text to Speech</h2>
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-white/5 px-3 py-1 rounded-full">
                            <span>Cost: {text.length} Credits</span>
                        </div>
                    </div>
                </div>
                
                {/* Scrollable Text Area Container */}
                <div className="flex-1 relative group px-8 overflow-hidden flex flex-col">
                    <textarea
                        className="w-full h-full bg-transparent border-none resize-none text-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-0 leading-relaxed font-light pb-20 overflow-y-auto custom-scrollbar"
                        placeholder="Start typing here or paste any text you want to turn into lifelike speech..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                    {lastAudioUrl && (
                            <div className="absolute bottom-4 left-8 right-8 bg-slate-900/90 border border-white/10 rounded-xl p-3 flex items-center gap-4 animate-in slide-in-from-bottom-2 fade-in z-20">
                                <audio controls src={lastAudioUrl} className="flex-1 h-8 opacity-90" autoPlay />
                                <a href={lastAudioUrl} download={`vox-pro-${Date.now()}.wav`} className="p-2 text-slate-400 hover:text-emerald-400 transition-colors">
                                    <Download className="w-5 h-5" />
                                </a>
                            </div>
                    )}
                </div>

                {/* Fixed Footer: Quick Starts & Generate Button */}
                <div className="p-8 pt-4 shrink-0 border-t border-white/5 bg-slate-950/20 z-10">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">Quick Start:</span>
                            {quickStarts.map((qs, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => setText(qs.text)}
                                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-full px-3 py-1.5 text-[10px] font-medium text-slate-300 hover:text-white transition-all whitespace-nowrap"
                                >
                                    {qs.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !text.trim()}
                                className="w-full sm:w-auto bg-white text-slate-950 hover:bg-indigo-50 px-8 py-3.5 rounded-full font-bold shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                Generate Speech
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Settings (Fixed Width) */}
            <div className="w-[340px] border-l border-white/10 bg-slate-950/30 flex flex-col shrink-0">
                <div className="flex border-b border-white/5 shrink-0">
                    <button 
                        onClick={() => setActiveSideTab('settings')}
                        className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeSideTab === 'settings' ? 'text-white border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Settings
                    </button>
                    <button 
                        onClick={() => setActiveSideTab('history')}
                        className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeSideTab === 'history' ? 'text-white border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        History
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {activeSideTab === 'settings' ? (
                        <>
                             {/* Voice Card */}
                             <div className="space-y-2">
                                 <label className="text-xs text-slate-400 font-bold uppercase">Voice</label>
                                 <button 
                                    onClick={() => setShowVoicePicker(true)}
                                    className="w-full bg-slate-800/50 hover:bg-slate-800 border border-white/5 hover:border-white/20 rounded-xl p-3 flex items-center justify-between transition-all group"
                                 >
                                     <div className="flex items-center gap-3">
                                         <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white shadow-lg overflow-hidden shrink-0">
                                             {activeVoice.isPremium ? <img src="https://img.freepik.com/premium-photo/gold-texture-background_1089669-122.jpg" className="object-cover opacity-80 w-full h-full" /> : activeVoice.name.charAt(0)}
                                         </div>
                                         <div className="text-left min-w-0">
                                             <div className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate">{activeVoice.name}</div>
                                             <div className="text-[10px] text-slate-500 truncate">{activeVoice.category}</div>
                                         </div>
                                     </div>
                                     <ChevronRight className="w-4 h-4 text-slate-500" />
                                 </button>
                             </div>

                             {/* Sliders */}
                             <div className="space-y-6 pt-2">
                                 <div className="space-y-2">
                                     <div className="flex justify-between text-xs font-medium text-slate-400">
                                         <span>Speed</span>
                                         <span className="text-white">{settings.speed}x</span>
                                     </div>
                                     <input 
                                        type="range" min="0.5" max="1.5" step="0.1"
                                        value={settings.speed}
                                        onChange={(e) => setSettings({...settings, speed: parseFloat(e.target.value)})}
                                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-white hover:accent-indigo-400"
                                     />
                                 </div>
                                  <div className="space-y-2">
                                     <div className="flex justify-between text-xs font-medium text-slate-400">
                                         <span>Stability</span>
                                         <span className="text-white">{Math.round(settings.stability * 100)}%</span>
                                     </div>
                                     <input 
                                        type="range" min="0" max="1" step="0.05"
                                        value={settings.stability}
                                        onChange={(e) => setSettings({...settings, stability: parseFloat(e.target.value)})}
                                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-white hover:accent-indigo-400"
                                     />
                                 </div>
                             </div>

                             <div className="pt-4 border-t border-white/5 space-y-4">
                                 <div className="flex items-center justify-between">
                                     <span className="text-xs font-bold text-slate-400 uppercase">Speaker Boost</span>
                                     <button 
                                        onClick={() => setSettings({...settings, speakerBoost: !settings.speakerBoost})}
                                        className={`w-10 h-5 rounded-full relative transition-colors ${settings.speakerBoost ? 'bg-indigo-600' : 'bg-slate-700'}`}
                                     >
                                         <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.speakerBoost ? 'left-6' : 'left-1'}`}></div>
                                     </button>
                                 </div>
                             </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            {history.length === 0 ? <p className="text-xs text-slate-500 text-center py-10">No history.</p> : history.map(item => (
                                <div key={item.id} className="bg-slate-800/30 p-3 rounded-xl border border-white/5">
                                    <div className="flex justify-between mb-2"><span className="text-xs font-bold text-indigo-400">{item.voiceName}</span></div>
                                    <p className="text-xs text-slate-300 line-clamp-2 mb-2">"{item.text}"</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal remains unchanged */}
            {showVoicePicker && (
                <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in duration-200">
                    <div className="w-full h-full max-w-6xl relative">
                        <button onClick={() => setShowVoicePicker(false)} className="absolute -top-4 -right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full z-50"><X className="w-5 h-5" /></button>
                        <VoiceLibrary onSelectVoice={handleVoiceSelect} selectedVoiceId={activeVoice.id} selectionMode={true} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default TextToSpeech;
