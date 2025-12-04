import { v1 as textToSpeech } from "@google-cloud/text-to-speech";
import { speech_v1 } from "@google-cloud/speech";
import * as fs from "fs";
import * as path from "path";

const ttsClient = new textToSpeech.TextToSpeechClient();
const sttClient = new speech_v1.SpeechClient();

/**
 * Represents options for Text-to-Speech generation
 */
export interface TTSOptions {
  text: string;
  languageCode: string; // e.g., 'en-US'
  voiceName?: string; // e.g., 'en-US-Neural2-C'
  pitch?: number; // Range: -20.0 to 20.0
  speakingRate?: number; // Range: 0.25 to 4.0
}

/**
 * Represents options for Speech-to-Text transcription
 */
export interface STTOptions {
  audioContent: Buffer | string; // Base64-encoded audio or file path
  languageCode: string;
  sampleRateHertz?: number;
  encoding?: string; // e.g., 'LINEAR16', 'MULAW'
}

/**
 * Convert text to speech using Google Cloud Text-to-Speech API
 * @param options - TTSOptions with text, language, voice configuration
 * @returns Promise<{audioContent: string, duration: number}> - Base64 audio and duration in milliseconds
 */
export async function generateSpeech(
  options: TTSOptions
): Promise<{ audioContent: string; duration: number }> {
  try {
    const request = {
      input: { text: options.text },
      voice: {
        languageCode: options.languageCode,
        name: options.voiceName || `${options.languageCode}-Neural2-A`,
      },
      audioConfig: {
        audioEncoding: "MP3",
        pitch: options.pitch || 0,
        speakingRate: options.speakingRate || 1.0,
      },
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    const audioContent = response.audioContent as Buffer;

    // Estimate duration (rough calculation: ~200ms per second of audio)
    const estimatedDuration = (audioContent.length / 16000) * 1000;

    return {
      audioContent: audioContent.toString("base64"),
      duration: Math.round(estimatedDuration),
    };
  } catch (error) {
    console.error("TTS error:", error);
    throw new Error("Failed to generate speech");
  }
}

/**
 * Convert speech to text using Google Cloud Speech-to-Text API
 * @param options - STTOptions with audio and language configuration
 * @returns Promise<{transcript: string, confidence: number}> - Transcribed text and confidence score
 */
export async function transcribeAudio(
  options: STTOptions
): Promise<{ transcript: string; confidence: number }> {
  try {
    let audioContent: Buffer;

    // If audioContent is a string, treat as base64-encoded data or file path
    if (typeof options.audioContent === "string") {
      if (fs.existsSync(options.audioContent)) {
        // It's a file path
        audioContent = fs.readFileSync(options.audioContent);
      } else {
        // It's base64-encoded data
        audioContent = Buffer.from(options.audioContent, "base64");
      }
    } else {
      audioContent = options.audioContent;
    }

    const request = {
      config: {
        encoding: options.encoding || "LINEAR16",
        sampleRateHertz: options.sampleRateHertz || 16000,
        languageCode: options.languageCode,
      },
      audio: {
        content: audioContent,
      },
    };

    const [response] = await sttClient.recognize(request);
    const transcription = response.results
      ?.map((result: any) => result.alternatives?.[0]?.transcript || "")
      .join("\n");

    const confidence =
      response.results?.[0]?.alternatives?.[0]?.confidence || 0;

    return {
      transcript: transcription || "",
      confidence: Number((confidence * 100).toFixed(2)),
    };
  } catch (error) {
    console.error("STT error:", error);
    throw new Error("Failed to transcribe audio");
  }
}

/**
 * Batch process multiple TTS requests (cost-optimized)
 * @param requests - Array of TTSOptions
 * @returns Promise<Array<{audioContent: string, duration: number}>>
 */
export async function batchGenerateSpeech(
  requests: TTSOptions[]
): Promise<Array<{ audioContent: string; duration: number }>> {
  console.log(`Processing ${requests.length} TTS requests in batch...`);

  return Promise.all(requests.map((req) => generateSpeech(req)));
}

/**
 * Get available voice options for a language
 * @param languageCode - e.g., 'en-US'
 * @returns Promise<Array<{name: string, naturalSample?: string}>>
 */
export async function getAvailableVoices(languageCode: string): Promise<any> {
  try {
    const [voices] = await ttsClient.listVoices({ languageCode });
    return voices.voices?.map((voice: any) => ({
      name: voice.name,
      naturalSample: voice.ssmlGender,
    }));
  } catch (error) {
    console.error("Error fetching voice list:", error);
    return [];
  }
}
