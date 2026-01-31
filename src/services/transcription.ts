import type { TranscriptionMode } from '@/types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface TranscriptionOptions {
    apiKey: string;
    model?: string;
}

interface RefinementOptions {
    apiKey: string;
    model?: string;
}

interface ProcessOptions extends TranscriptionOptions, RefinementOptions { }

/**
 * Transcribe audio using Groq Whisper API
 * 
 * This is Stage 1 of both Raw and Modified mode flows:
 * Audio File → Whisper API → Raw Transcript
 * 
 * NOTE: Whisper API only accepts audio files, NOT text prompts.
 * For Modified mode, the refinement happens AFTER this step using Kimi-K2.
 */
export async function transcribeAudio(
    audioBlob: Blob,
    options: TranscriptionOptions
): Promise<string> {
    const { apiKey, model = 'whisper-large-v3-turbo' } = options;

    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    formData.append('model', model);

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Transcription failed: ${error}`);
    }

    const data = await response.json();
    return data.text as string;
}

/**
 * Refine transcript using Groq chat completion (Kimi-K2)
 * 
 * This is Stage 2 of the Modified mode flow:
 * Raw Transcript → Kimi-K2 API → Refined Transcript
 */
export async function refineTranscript(
    transcript: string,
    options: RefinementOptions
): Promise<string> {
    const { apiKey, model = 'moonshotai/kimi-k2-instruct-0905' } = options;

    const systemPrompt = `You are a helpful assistant that refines voice transcripts for clarity and grammar.
Your task is to:
1. Fix grammar and punctuation
2. Improve sentence structure
3. Remove filler words (um, uh, like, you know)
4. Maintain the original meaning and intent
5. Keep the same overall length

Return ONLY the refined text, no explanations.`;

    const response = await fetch(GROQ_CHAT_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Refine this transcript:\n\n${transcript}` },
            ],
            max_tokens: 2000,
            temperature: 0.3,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Refinement failed: ${error}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || transcript;
}

/**
 * Process audio through transcription and optional refinement
 * 
 * Flow:
 * 1. Audio File → Whisper API → Raw Transcript
 * 2. If Modified mode: Raw Transcript → Kimi-K2 API → Refined Transcript
 */
export async function processAudio(
    audioBlob: Blob,
    mode: TranscriptionMode,
    options: ProcessOptions
): Promise<{ raw: string; refined?: string }> {
    // Stage 1: Always transcribe with Whisper first
    const raw = await transcribeAudio(audioBlob, options);

    // Stage 2: If modified mode, send raw transcript to Kimi-K2 for refinement
    if (mode === 'modified') {
        const refinementOptions = {
            ...options,
            model: 'moonshotai/kimi-k2-instruct-0905'
        };
        const refined = await refineTranscript(raw, refinementOptions);
        return { raw, refined };
    }

    return { raw };
}
