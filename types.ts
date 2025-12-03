
export interface Voice {
  id: string;
  name: string;
  category: VoiceCategory;
  gender: 'Male' | 'Female' | 'Neutral';
  tags: string[];
  apiVoiceName: string; // Mapping to actual Gemini voice names (Puck, Kore, etc.)
  previewUrl?: string; // Optional hardcoded preview, otherwise generated
  language?: string; // BCP-47 tag (e.g., 'en-US')
  isPremium?: boolean;
  isCloned?: boolean;
  qualityReport?: VoiceQualityReport; // NEW: For cloned voices
}

export interface VoiceQualityReport {
    mosScore: number; // 1.0 - 5.0
    similarity: number; // 0.0 - 100.0%
    stability: number; // 0.0 - 100.0%
    dateCreated: number;
    consentVerified: boolean;
}

export enum VoiceCategory {
  NARRATION = 'Narration',
  STORYTELLING = 'Storytelling',
  MOTIVATIONAL = 'Motivational',
  DIALOGUE = 'Dialogue',
  KIDS = 'Kids',
  DOCUMENTARY = 'Documentary',
  GAMING = 'Gaming',
  MEDITATION = 'Meditation',
  CLONED = 'Cloned Voices'
}

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // For mock DB authentication only
  avatar?: string;
  role: UserRole;
  credits: number;
  clonedVoices: Voice[];
}

export interface CreditRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  date: number;
}

export interface ScriptAnalysisResult {
  speakers: DetectedSpeaker[];
  lines: ScriptLine[];
}

export interface DetectedSpeaker {
  id: string;
  name: string;
  suggestedGender: 'Male' | 'Female' | 'Neutral';
  suggestedTone: string;
  assignedVoiceId: string; // The ID of the Voice selected from our library
  pitch?: number; // +/- 6 semitones
  speed?: number; // 0.5x to 1.5x
}

export interface ScriptLine {
  id: string;
  speakerId: string;
  text: string;
  emotion?: string;
}

export interface GeneratedAudioTrack {
  speakerId: string;
  audioBuffer: AudioBuffer;
  blob: Blob;
  url: string;
}

export interface GenerationResult {
  lines: { lineId: string; audioUrl: string; duration: number }[];
  combinedAudioUrl: string;
}

export interface TTSSettings {
    voiceId: string;
    modelId: string;
    speed: number;       // 0.5 - 1.5
    stability: number;   // 0.0 - 1.0 (Maps to Temperature)
    similarity: number;  // 0.0 - 1.0 (Maps to TopP)
    style: number;       // 0.0 - 1.0 (Exaggeration)
    speakerBoost: boolean;
    pitch: number;
}

export interface HistoryItem {
    id: string;
    text: string;
    voiceName: string;
    date: number;
    duration: number; // seconds
}