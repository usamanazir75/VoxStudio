
import React, { useState, useMemo } from 'react';
import { VOICES, EXTENDED_VOICES, PREMIUM_VOICES, CATEGORIES, LANGUAGES, getAllVoices } from '../constants';
import { VoiceCategory, Voice, User } from '../types';
import { Play, Check, Pause, DownloadCloud, Globe, Wand2, Search, Sliders, Music2, Crown, Fingerprint, Lock, X } from 'lucide-react';
import { generateVoicePreview } from '../services/geminiService';
import { decodeBase64Audio, audioBufferToBlob, stitchAudioBuffers, processAudioBuffer } from '../services/audioUtils';
import { userService } from '../services/userService';

interface VoiceLibraryProps {
  onSelectVoice: (voice: Voice) => void;
  selectedVoiceId?: string;
  selectionMode?: boolean;
}

const VoiceLibrary: React.FC<VoiceLibraryProps> = ({ onSelectVoice, selectedVoiceId, selectionMode = false }) => {
  const [activeCategory, setActiveCategory] = useState<VoiceCategory | 'All'>('All');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null);
  const [showExtended, setShowExtended] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [showDeepWarmOnly, setShowDeepWarmOnly] = useState(false);

  // Tuning Modal State
  const [tuningVoice, setTuningVoice] = useState<Voice | null>(null);
  const [pitch, setPitch] = useState(0); 
  const [speed, setSpeed] = useState(1);

  // Generator Modal State
  const [generatorVoice, setGeneratorVoice] = useState<Voice | null>(null);
  const [scriptText, setScriptText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [genPitch, setGenPitch] = useState(0);
  const [genSpeed, setGenSpeed] = useState(1);

  const currentUser = userService.getCurrentUser();

  const displayVoices = useMemo(() => {
    // Combine base voices, premium voices, and user's cloned voices
    let list = [...PREMIUM_VOICES, ...VOICES, ...(currentUser?.clonedVoices || [])];
    if (showExtended) list = [...list, ...EXTENDED_VOICES];
    
    if (activeCategory !== 'All') {
        list = list.filter(v => v.category === activeCategory);
    }
    if (searchQuery.trim()) {
        const lowerQ = searchQuery.toLowerCase();
        list = list.filter(v => 
            v.name.toLowerCase().includes(lowerQ) || 
            v.tags.some(t => t.toLowerCase().includes(lowerQ))
        );
    }
    if (selectedLanguage) {
        list = list.filter(v => v.language === selectedLanguage);
    }
    if (showDeepWarmOnly) {
        list = list.filter(v => v.tags.some(t => ['deep', 'warm'].includes(t.toLowerCase())));
    }
    return list;
  }, [activeCategory, showExtended, searchQuery, selectedLanguage, showDeepWarmOnly, currentUser]);

  const handlePreview = async (voice: Voice, overridePitch?: number, overrideSpeed?: number) => {
    if (playingVoiceId === voice.id && overridePitch === undefined) {
        setPlayingVoiceId(null);
        return;
    }
    try {
        setLoadingPreview(voice.id);
        const text = `This is a preview of the ${voice.name} voice.`;
        
        let base64 = "";
        if (process.env.API_KEY) {
             base64 = await generateVoicePreview(text, voice.apiVoiceName);
        } else {
            await new Promise(r => setTimeout(r, 1000));
            setLoadingPreview(null);
            return;
        }
        
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        let audioBuffer = await decodeBase64Audio(base64, audioContext);
        
        const p = overridePitch !== undefined ? overridePitch : 0;
        const s = overrideSpeed !== undefined ? overrideSpeed : 1;
        
        if (p !== 0 || s !== 1) {
            audioBuffer = await processAudioBuffer(audioBuffer, p, s);
        }

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
        
        setPlayingVoiceId(voice.id);
        source.onended = () => setPlayingVoiceId(null);
    } catch (err) {
        console.error("Preview failed", err);
    } finally {
        setLoadingPreview(null);
    }
  };

  const openGenerator = (voice: Voice) => {
    setGeneratorVoice(voice);
    setScriptText("");
    setGeneratedAudioUrl(null);
    setIsGenerating(false);
    setGenerationProgress(0);
    setGenPitch(0);
    setGenSpeed(1);
  };
  const closeGenerator = () => { setGeneratorVoice(null); setGeneratedAudioUrl(null); };
  const openTuning = (voice: Voice) => { setTuningVoice(voice); setPitch(0); setSpeed(1); };

  const handleGenerateFullAudio = async () => {
       if (!generatorVoice || !scriptText.trim()) return;
        
       const cost = scriptText.length;
       if (currentUser && currentUser.credits < cost) {
           alert(`Insufficient credits! Required: ${cost}, Available: ${currentUser.credits}`);
           return;
       }

        if (!process.env.API_KEY) {
            alert("API Key is required to generate audio.");
            return;
        }

        setIsGenerating(true);
        setGenerationProgress(0);
        setGeneratedAudioUrl(null);

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const buffers: AudioBuffer[] = [];
        
        const sentences = scriptText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [scriptText];
        
        try {
            for (let i = 0; i < sentences.length; i++) {
                const chunk = sentences[i].trim();
                if (!chunk) continue;

                const base64 = await generateVoicePreview(chunk, generatorVoice.apiVoiceName);
                let buffer = await decodeBase64Audio(base64, audioContext);
                buffer = await processAudioBuffer(buffer, genPitch, genSpeed);
                buffers.push(buffer);
                
                const pause = audioContext.createBuffer(1, Math.floor(24000 * 0.15), 24000);
                buffers.push(pause);

                setGenerationProgress(Math.round(((i + 1) / sentences.length) * 100));
            }

            const finalBuffer = stitchAudioBuffers(buffers, audioContext);
            const blob = audioBufferToBlob(finalBuffer);
            const url = URL.createObjectURL(blob);
            setGeneratedAudioUrl(url);

            // Deduct credits simulation
            if (currentUser) {
                userService.deductCredits(currentUser.id, cost);
                // Trigger global update via event or relying on App.tsx to poll/refresh
                window.dispatchEvent(new Event('creditsUpdated'));
            }

        } catch (e) {
            console.error("Generation failed", e);
            alert("Generation failed. Please try again.");
        } finally {
            setIsGenerating(false);
        }
  };


  return (
    <div className={`glass rounded-3xl p-6 md:p-8 flex flex-col h-full shadow-2xl relative border-t border-white/10 bg-slate-900/40 ${selectionMode ? 'border-none shadow-none bg-transparent' : ''}`}>
      
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-8">
        <div>
           <h2 className="text-2xl font-bold text-white mb-2">{selectionMode ? 'Select a Voice' : 'Explore Voices'}</h2>
           {!selectionMode && <p className="text-slate-400 text-sm max-w-lg">Discover the perfect voice for your project. Premium voices now available.</p>}
        </div>
        
        <button
            onClick={() => setShowExtended(!showExtended)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                showExtended 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-white/5 text-slate-300 hover:bg-white/10 border-white/5 hover:border-white/20'
            }`}
        >
            {showExtended ? <><Check className="w-4 h-4" /> Extended Active</> : <><DownloadCloud className="w-4 h-4" /> Load Free Voices</>}
        </button>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="bg-slate-950/50 p-1.5 rounded-2xl mb-8 flex flex-col md:flex-row gap-2 border border-white/5 shadow-inner">
        <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
                type="text" 
                placeholder="Search voices..." 
                className="w-full h-11 bg-transparent rounded-xl pl-11 pr-4 text-sm text-white focus:bg-white/5 focus:outline-none transition-all placeholder:text-slate-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
        <div className="h-8 w-[1px] bg-white/10 hidden md:block self-center"></div>
        <select 
            className="h-11 bg-transparent rounded-xl px-4 text-sm text-slate-300 focus:bg-white/5 focus:outline-none transition-all cursor-pointer border-none min-w-[150px]"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
        >
            <option value="">All Languages</option>
            {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.name}</option>
            ))}
        </select>
        <button 
            onClick={() => setShowDeepWarmOnly(!showDeepWarmOnly)}
            className={`h-11 px-6 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${showDeepWarmOnly ? 'bg-amber-500/10 text-amber-400 shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
            <Music2 className="w-4 h-4" />
            Deep & Warm
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 pb-2">
        <button onClick={() => setActiveCategory('All')} className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${activeCategory === 'All' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'}`}>All</button>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${activeCategory === cat ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'}`}>{cat}</button>
        ))}
      </div>

      {/* Voice Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 overflow-y-auto pr-2 pb-10 content-start min-h-0 custom-scrollbar">
        {displayVoices.map(voice => (
          <div 
            key={voice.id} 
            onClick={() => selectionMode && onSelectVoice(voice)}
            className={`group relative bg-slate-900/40 backdrop-blur-md border rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-indigo-500/30 flex flex-col cursor-pointer ${
                selectedVoiceId === voice.id ? 'border-indigo-500/60 bg-indigo-900/10 shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/30' : 'border-white/5 hover:bg-slate-800/60'
            }`}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3.5">
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shadow-lg transition-colors overflow-hidden ${selectedVoiceId === voice.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white'}`}>
                    {voice.isPremium ? <img src="https://img.freepik.com/premium-photo/gold-texture-background_1089669-122.jpg" className="w-full h-full object-cover opacity-80" /> : voice.name.charAt(0)}
                    {voice.isPremium && <div className="absolute inset-0 flex items-center justify-center"><Crown className="w-5 h-5 text-white drop-shadow-md" /></div>}
                 </div>
                 <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                        {voice.name}
                        {voice.id.startsWith('free_tier') && <Globe className="w-3 h-3 text-emerald-400" />}
                        {voice.isCloned && <Fingerprint className="w-3 h-3 text-indigo-400" />}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded">{voice.gender}</span>
                    </div>
                 </div>
              </div>
              {!selectionMode && (
                  <button onClick={(e) => {e.stopPropagation(); openTuning(voice)}} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-slate-500 hover:text-white hover:bg-indigo-500 transition-all"><Sliders className="w-4 h-4" /></button>
              )}
            </div>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-6">
              {voice.tags.slice(0, 3).map(tag => (
                <span key={tag} className={`text-[10px] px-2.5 py-1 border rounded-md font-medium ${voice.isPremium && tag === 'Premium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-black/20 border-white/5 text-slate-400'}`}>{tag}</span>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-auto pt-4 border-t border-white/5">
              <button
                onClick={(e) => { e.stopPropagation(); handlePreview(voice); }}
                disabled={loadingPreview === voice.id}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${playingVoiceId === voice.id ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'}`}
              >
                {loadingPreview === voice.id ? <span className="animate-spin h-3.5 w-3.5 border-2 border-slate-400 border-t-transparent rounded-full"></span> : playingVoiceId === voice.id ? <><Pause className="w-3.5 h-3.5" /> Stop</> : <><Play className="w-3.5 h-3.5" /> Preview</>}
              </button>
              
              {!selectionMode && (
                  <button onClick={(e) => { e.stopPropagation(); openGenerator(voice); }} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5">
                    <Wand2 className="w-3.5 h-3.5" /> Generate
                  </button>
              )}
              {selectionMode && (
                   <div className="flex-1 flex items-center justify-center gap-2 bg-white/5 text-slate-400 py-2.5 rounded-xl text-xs font-bold pointer-events-none group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      Select
                   </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Generator Modal (Simplified for brevity - logic already implemented) */}
      {!selectionMode && generatorVoice && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md rounded-3xl animate-in fade-in zoom-in-95 duration-200">
          <div className="glass bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-full overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-gradient-to-r from-indigo-900/20 to-transparent">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Wand2 className="w-5 h-5 text-indigo-400" /> Quick Generate</h3>
                <button onClick={closeGenerator} className="text-slate-400 hover:text-white bg-white/5 p-2 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 flex-1 flex flex-col min-h-0 overflow-y-auto">
                <textarea value={scriptText} onChange={(e) => setScriptText(e.target.value)} placeholder="Enter script (1 char = 1 credit)..." className="flex-1 w-full bg-black/30 border border-white/10 rounded-xl p-5 text-slate-200 resize-none focus:ring-2 focus:ring-indigo-500/50 outline-none mb-6 min-h-[180px]" />
                <div className="flex justify-between text-xs text-slate-400 mb-4 font-mono">
                    <span>Available Credits: {currentUser?.credits}</span>
                    <span>Cost: {scriptText.length}</span>
                </div>
                {generatedAudioUrl && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 mb-4">
                         <div className="flex items-center justify-between mb-4"><span className="text-sm font-bold text-emerald-400">Audio Ready</span><a href={generatedAudioUrl} download className="flex items-center gap-2 text-xs font-bold text-emerald-300 bg-emerald-500/20 px-4 py-2 rounded-lg"><DownloadCloud className="w-3.5 h-3.5" /> Download WAV</a></div>
                         <audio controls src={generatedAudioUrl} className="w-full h-10 opacity-90 rounded-lg" />
                    </div>
                )}
                <div className="flex justify-end gap-3 mt-auto pt-2 border-t border-white/5">
                    <button onClick={closeGenerator} className="px-6 py-3 text-sm font-semibold text-slate-400 hover:text-white">Cancel</button>
                    <button onClick={handleGenerateFullAudio} disabled={isGenerating || !scriptText.trim()} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-bold shadow-xl shadow-indigo-500/20 flex items-center gap-2">{isGenerating ? 'Processing...' : 'Generate'}</button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceLibrary;
