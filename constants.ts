
import { Voice, VoiceCategory } from './types';

// BCP-47 Language Codes
export const LANGUAGES = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-ES', name: 'Spanish (Spain)' },
    { code: 'es-MX', name: 'Spanish (Mexico)' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'hi-IN', name: 'Hindi' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
];

export const PREMIUM_VOICES: Voice[] = [
    {
        id: 'prem_hyper_01',
        name: 'Morgan (Hyper-Real)',
        category: VoiceCategory.NARRATION,
        gender: 'Male',
        tags: ['Premium', 'Hyper-Realistic', 'Cinematic', 'God-like'],
        apiVoiceName: 'Fenrir',
        language: 'en-US',
        isPremium: true
    },
    {
        id: 'prem_hyper_02',
        name: 'Scarlett (Hyper-Real)',
        category: VoiceCategory.STORYTELLING,
        gender: 'Female',
        tags: ['Premium', 'Hyper-Realistic', 'Seductive', 'Audiobook'],
        apiVoiceName: 'Kore',
        language: 'en-US',
        isPremium: true
    },
    {
        id: 'prem_hyper_03',
        name: 'David Atten (Hyper-Real)',
        category: VoiceCategory.DOCUMENTARY,
        gender: 'Male',
        tags: ['Premium', 'Hyper-Realistic', 'British', 'Nature'],
        apiVoiceName: 'Fenrir',
        language: 'en-GB',
        isPremium: true
    }
];

export const VOICES: Voice[] = [
  {
    id: 'v_narr_01',
    name: 'Marcus (Deep)',
    category: VoiceCategory.NARRATION,
    gender: 'Male',
    tags: ['Authoritative', 'Deep', 'Professional'],
    apiVoiceName: 'Fenrir',
    language: 'en-US'
  },
  {
    id: 'v_narr_02',
    name: 'Sarah (Clear)',
    category: VoiceCategory.NARRATION,
    gender: 'Female',
    tags: ['Clear', 'Professional', 'News'],
    apiVoiceName: 'Kore',
    language: 'en-US'
  },
  {
    id: 'v_story_01',
    name: 'Old Tom',
    category: VoiceCategory.STORYTELLING,
    gender: 'Male',
    tags: ['Raspy', 'Warm', 'Grandfatherly'],
    apiVoiceName: 'Charon',
    language: 'en-US'
  },
  {
    id: 'v_story_02',
    name: 'Emma',
    category: VoiceCategory.STORYTELLING,
    gender: 'Female',
    tags: ['Soft', 'Engaging', 'Fiction'],
    apiVoiceName: 'Zephyr',
    language: 'en-GB'
  },
  {
    id: 'v_motiv_01',
    name: 'Coach Carter',
    category: VoiceCategory.MOTIVATIONAL,
    gender: 'Male',
    tags: ['Energetic', 'Loud', 'Inspiring'],
    apiVoiceName: 'Puck',
    language: 'en-US'
  },
  {
    id: 'v_dial_01',
    name: 'Casual Jake',
    category: VoiceCategory.DIALOGUE,
    gender: 'Male',
    tags: ['Relaxed', 'Conversational'],
    apiVoiceName: 'Puck',
    language: 'en-US'
  },
  {
    id: 'v_dial_02',
    name: 'Friendly Anna',
    category: VoiceCategory.DIALOGUE,
    gender: 'Female',
    tags: ['Friendly', 'Upbeat'],
    apiVoiceName: 'Zephyr',
    language: 'en-US'
  },
  {
    id: 'v_kids_01',
    name: 'Buzzy',
    category: VoiceCategory.KIDS,
    gender: 'Neutral',
    tags: ['High-pitched', 'Excited', 'Cartoon'],
    apiVoiceName: 'Puck',
    language: 'en-US'
  },
  {
    id: 'v_doc_01',
    name: 'Attenborough-ish',
    category: VoiceCategory.DOCUMENTARY,
    gender: 'Male',
    tags: ['Slow', 'Observational', 'British-style'],
    apiVoiceName: 'Fenrir',
    language: 'en-GB'
  },
  {
    id: 'v_game_01',
    name: 'Commander Shepard',
    category: VoiceCategory.GAMING,
    gender: 'Female',
    tags: ['Stern', 'Military', 'Sci-Fi'],
    apiVoiceName: 'Kore',
    language: 'en-US'
  },
  {
    id: 'v_med_01',
    name: 'Zen Master',
    category: VoiceCategory.MEDITATION,
    gender: 'Male',
    tags: ['Whisper', 'Calm', 'Slow'],
    apiVoiceName: 'Charon',
    language: 'ja-JP'
  },
];

export const CATEGORIES = Object.values(VoiceCategory);

// --- EXTENDED VOICE LIBRARY GENERATION ---
const BASE_MODELS = [
    { name: 'Fenrir', gender: 'Male', baseTags: ['Deep', 'Steady'] },
    { name: 'Charon', gender: 'Male', baseTags: ['Raspy', 'Mature'] },
    { name: 'Puck', gender: 'Male', baseTags: ['Energetic', 'Young'] },
    { name: 'Kore', gender: 'Female', baseTags: ['Clear', 'Professional'] },
    { name: 'Zephyr', gender: 'Female', baseTags: ['Soft', 'Bright'] },
];

const ADJECTIVES = ['Calm', 'Brisk', 'Melodic', 'Husky', 'Bright', 'Gravelly', 'Smooth', 'Intense', 'Cheerful', 'Serious'];
const ROLES = ['Narrator', 'Guide', 'Protagonist', 'Antagonist', 'Teacher', 'Friend', 'Reporter', 'Soldier', 'Wizard', 'Child'];

const generateExtendedVoices = (): Voice[] => {
    const extended: Voice[] = [];
    let count = 0;

    CATEGORIES.filter(c => c !== VoiceCategory.CLONED).forEach(cat => {
        BASE_MODELS.forEach(model => {
            for (let i = 0; i < 2; i++) {
                const adj = ADJECTIVES[(count + i) % ADJECTIVES.length];
                const role = ROLES[(count + i) % ROLES.length];
                const id = `free_tier_${cat.toLowerCase().substring(0,3)}_${model.name.toLowerCase()}_${i}_${count}`;
                const lang = i % 3 === 0 ? 'en-GB' : 'en-US';

                extended.push({
                    id,
                    name: `${adj} ${model.name} (${role})`,
                    category: cat as VoiceCategory,
                    gender: model.gender as 'Male' | 'Female',
                    tags: ['Free-Tier', adj, model.baseTags[0], cat],
                    apiVoiceName: model.name,
                    language: lang
                });
                count++;
            }
        });
    });
    return extended;
};

// --- DEEP & WARM EXPANSION PACK ---
const generateDeepWarmVoices = (): Voice[] => {
    const deepWarm: Voice[] = [];
    const warmAdjectives = ['Velvet', 'Midnight', 'Cozy', 'Resonant', 'Bass', 'Gentle', 'Rumbling', 'Soothing'];
    const models = [BASE_MODELS[0], BASE_MODELS[1]]; 

    for(let i=1; i<=20; i++) {
        const model = models[i % models.length];
        const adj = warmAdjectives[i % warmAdjectives.length];
        
        deepWarm.push({
            id: `free_deep_warm_${i.toString().padStart(2, '0')}`,
            name: `${adj} Voice ${i}`,
            category: VoiceCategory.NARRATION,
            gender: model.gender as 'Male' | 'Female',
            tags: ['Free-Tier', 'Deep', 'Warm', adj, 'Narration'],
            apiVoiceName: model.name,
            language: 'en-US'
        });
    }
    return deepWarm;
}

export const EXTENDED_VOICES = [...PREMIUM_VOICES, ...generateExtendedVoices(), ...generateDeepWarmVoices()];

export const getAllVoices = (includeExtended: boolean, clonedVoices: Voice[] = []) => {
    return includeExtended ? [...VOICES, ...clonedVoices, ...EXTENDED_VOICES] : [...VOICES, ...clonedVoices];
};
