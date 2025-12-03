
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { DetectedSpeaker, ScriptLine, ScriptAnalysisResult, Voice } from "../types";
import { VOICES } from "../constants";

const getAI = () => {
    // NOTE: In a real app, ensure this env var is set.
    // For this demo, we assume the user will supply it or it's in env.
    const apiKey = process.env.API_KEY || ""; 
    return new GoogleGenAI({ apiKey });
}

export const analyzeScript = async (scriptText: string): Promise<ScriptAnalysisResult> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key found. Returning mock analysis for demo purposes.");
    return mockAnalysis(scriptText);
  }

  const ai = getAI();
  
  const systemInstruction = `
    You are an expert script analysis engine for audio production. 
    Analyze the provided script. 
    1. Identify all unique speakers. If no names are present, assign generic names like "Narrator" or "Speaker 1".
    2. Determine the best gender and tone for each speaker based on context.
    3. Break the script into individual lines/dialogue blocks associated with a speaker.
    4. Detect emotions for each line.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: scriptText,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            speakers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  suggestedGender: { type: Type.STRING, enum: ["Male", "Female", "Neutral"] },
                  suggestedTone: { type: Type.STRING },
                },
                required: ["id", "name", "suggestedGender", "suggestedTone"]
              }
            },
            lines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  speakerId: { type: Type.STRING },
                  text: { type: Type.STRING },
                  emotion: { type: Type.STRING },
                },
                required: ["id", "speakerId", "text"]
              }
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    
    // Post-process to assign default voices from our library
    const speakersWithVoices = (data.speakers || []).map((s: any) => ({
        ...s,
        assignedVoiceId: findBestVoiceMatch(s.suggestedGender, s.suggestedTone).id
    }));

    return {
        speakers: speakersWithVoices,
        lines: data.lines || []
    };

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return mockAnalysis(scriptText);
  }
};

const findBestVoiceMatch = (gender: string, tone: string): Voice => {
    // Simple heuristic matcher
    const genderMatch = VOICES.filter(v => v.gender === gender || v.gender === 'Neutral');
    const toneMatch = genderMatch.find(v => v.tags.some(t => tone.toLowerCase().includes(t.toLowerCase())));
    return toneMatch || genderMatch[0] || VOICES[0];
};

export const generateVoicePreview = async (text: string, voiceApiName: string, temperature?: number, topP?: number): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API Key missing");
    }
    
    const ai = getAI();

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: {
                parts: [{ text: text }]
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: voiceApiName
                        }
                    }
                },
                temperature: temperature,
                topP: topP,
            }
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio data returned");
        return base64Audio;
    } catch (e) {
        console.error("TTS Generation Error", e);
        throw e;
    }
}


// Fallback for when no API key is present (Development/Demo mode)
const mockAnalysis = (text: string): ScriptAnalysisResult => {
    return {
        speakers: [
            { id: 'spk_1', name: 'Narrator', suggestedGender: 'Male', suggestedTone: 'Deep', assignedVoiceId: 'v_narr_01' },
            { id: 'spk_2', name: 'Alice', suggestedGender: 'Female', suggestedTone: 'Friendly', assignedVoiceId: 'v_dial_02' }
        ],
        lines: [
            { id: 'l1', speakerId: 'spk_1', text: text.substring(0, Math.min(text.length, 50)) + "...", emotion: 'Neutral' },
             { id: 'l2', speakerId: 'spk_2', text: "This is a mock analysis result because no API Key was detected.", emotion: 'Happy' }
        ]
    };
};
