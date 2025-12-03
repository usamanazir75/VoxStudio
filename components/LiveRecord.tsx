
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Download, Trash2, Activity } from 'lucide-react';

const LiveRecord: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number>(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const rafIdRef = useRef<number>(0);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            
            // Visualizer Setup
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioCtx;
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;
            const source = audioCtx.createMediaStreamSource(stream);
            sourceRef.current = source;
            source.connect(analyser);
            
            const bufferLength = analyser.frequencyBinCount;
            dataArrayRef.current = new Uint8Array(bufferLength);
            
            chunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                stopVisualizer();
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setDuration(0);
            
            // Timer
            timerRef.current = window.setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);

            drawVisualizer();

        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const drawVisualizer = () => {
        if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const analyser = analyserRef.current;
        const dataArray = dataArrayRef.current;

        const draw = () => {
            rafIdRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            ctx.fillStyle = 'rgb(15, 23, 42)'; // slate-900 match
            ctx.fillRect(0, 0, width, height);

            const barWidth = (width / dataArray.length) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < dataArray.length; i++) {
                barHeight = dataArray[i] / 2;
                
                // Gradient
                const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
                gradient.addColorStop(0, '#6366f1'); // Indigo
                gradient.addColorStop(1, '#a855f7'); // Purple

                ctx.fillStyle = gradient;
                ctx.fillRect(x, height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };
        draw();
    };

    const stopVisualizer = () => {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="glass rounded-3xl p-8 flex flex-col h-full items-center justify-center relative border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                <Mic className="w-6 h-6 text-red-500" /> Live Studio Recording
            </h2>

            <div className="relative mb-8 w-full max-w-lg">
                <canvas 
                    ref={canvasRef} 
                    width={500} 
                    height={150} 
                    className="w-full bg-slate-900 rounded-xl border border-white/10 shadow-inner"
                />
                {isRecording && (
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                        <span className="text-red-400 font-mono font-bold text-sm">REC {formatTime(duration)}</span>
                    </div>
                )}
            </div>

            <div className="flex gap-6 items-center">
                {!isRecording ? (
                    <button 
                        onClick={startRecording}
                        className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-500 border-4 border-slate-900 shadow-xl flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 group"
                    >
                        <Mic className="w-8 h-8 text-white group-hover:animate-pulse" />
                    </button>
                ) : (
                    <button 
                        onClick={stopRecording}
                        className="w-20 h-20 rounded-full bg-slate-800 hover:bg-slate-700 border-4 border-slate-900 shadow-xl flex items-center justify-center transition-all transform hover:scale-105 active:scale-95"
                    >
                        <Square className="w-8 h-8 text-white fill-current" />
                    </button>
                )}
            </div>
            
            <p className="mt-6 text-slate-400 text-sm font-medium">
                {isRecording ? "Recording in progress..." : "Tap microphone to start recording"}
            </p>

            {audioUrl && (
                <div className="mt-8 bg-slate-800/50 p-4 rounded-xl border border-white/5 flex items-center gap-4 w-full max-w-md animate-in fade-in slide-in-from-bottom-2">
                    <audio controls src={audioUrl} className="flex-1 h-10" />
                    <a href={audioUrl} download={`rec-${Date.now()}.webm`} className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors">
                        <Download className="w-5 h-5" />
                    </a>
                    <button onClick={() => { setAudioUrl(null); setAudioBlob(null); }} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default LiveRecord;
