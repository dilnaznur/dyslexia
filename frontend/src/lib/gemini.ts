/**
 * Google Gemini API client for vision and chat analysis
 */
import {
  GeminiWritingResult,
  ChatbotAnalysis,
  GeminiRequest,
  GeminiResponse,
} from '@/types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Analyze handwriting sample using Gemini Vision API
 */
export async function analyzeHandwriting(
  imageBase64: string
): Promise<GeminiWritingResult> {
  try {
    const prompt = `Analyze this child's handwriting sample for dyslexia indicators. Return ONLY valid JSON with no additional text:

{
  "mirror_writing_detected": boolean,
  "mirror_letters": [string],
  "letter_spacing_irregular": boolean,
  "spacing_score": float (0-10),
  "tremor_detected": boolean,
  "tremor_severity": "None" | "Mild" | "Moderate" | "Severe",
  "orthographic_errors": [string],
  "overall_risk": "Low" | "Moderate" | "High",
  "confidence": float (0-1)
}

Focus on: reversed letters (b/d, p/q), inconsistent spacing, shaky strokes, letter formation quality.`;

    const response = await fetch(
      `${GEMINI_API_BASE}/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: 'image/png',
                    data: imageBase64.split(',')[1], // Remove data:image/png;base64, prefix
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    const textResponse = data.candidates[0]?.content?.parts[0]?.text || '{}';

    // Parse JSON response (handle markdown code blocks)
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from Gemini');
    }

    const result: GeminiWritingResult = JSON.parse(jsonMatch[0]);
    return result;
  } catch (error) {
    console.error('Gemini Vision API error:', error);

    // Return default safe response on error
    return {
      mirror_writing_detected: false,
      mirror_letters: [],
      letter_spacing_irregular: false,
      spacing_score: 5.0,
      tremor_detected: false,
      tremor_severity: 'None',
      orthographic_errors: [],
      overall_risk: 'Low',
      confidence: 0.5,
    };
  }
}

/**
 * Send message to chatbot and get response
 */
export async function sendChatMessage(
  conversationHistory: { role: 'user' | 'model'; content: string }[]
): Promise<string> {
  try {
    const messages = conversationHistory.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    const response = await fetch(
      `${GEMINI_API_BASE}/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: messages,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 512,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || 'I apologize, I could not process that.';
  } catch (error) {
    console.error('Gemini Chat API error:', error);
    return 'I encountered an error. Please try again.';
  }
}

/**
 * Analyze chatbot conversation and generate assessment
 */
export async function analyzeChatbotConversation(
  conversationHistory: { role: 'user' | 'model'; content: string }[]
): Promise<ChatbotAnalysis> {
  try {
    const conversationText = conversationHistory
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n');

    const analysisPrompt = `Based on this conversation with a child (age 5-10), analyze their cognitive performance. Return ONLY valid JSON:

CONVERSATION:
${conversationText}

RETURN FORMAT:
{
  "memory_score": float (0-10),
  "attention_score": float (0-10),
  "comprehension_score": float (0-10),
  "behavioral_notes": string,
  "risk_indicators": [string],
  "overall_cognitive_risk": "Low" | "Moderate" | "High"
}

Evaluate: memory recall accuracy, ability to follow instructions, comprehension of questions/stories, attention span indicators.`;

    const response = await fetch(
      `${GEMINI_API_BASE}/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: analysisPrompt }] }],
          generationConfig: {
            temperature: 0.2,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    const textResponse = data.candidates[0]?.content?.parts[0]?.text || '{}';

    // Parse JSON response
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from Gemini');
    }

    const result: ChatbotAnalysis = JSON.parse(jsonMatch[0]);
    return result;
  } catch (error) {
    console.error('Gemini Analysis API error:', error);

    // Return default safe response
    return {
      memory_score: 5.0,
      attention_score: 5.0,
      comprehension_score: 5.0,
      behavioral_notes: 'Unable to complete analysis',
      risk_indicators: [],
      overall_cognitive_risk: 'Low',
    };
  }
}

/**
 * Get initial chatbot greeting
 */
export function getChatbotSystemPrompt(): string {
  return `You are a friendly AI assistant helping assess a child (age 5-10) for learning difficulties.

RULES:
- Use simple, encouraging language suitable for young children
- Ask ONE question at a time
- Keep responses SHORT (1-2 sentences)
- Be patient and supportive
- Use encouraging words like "Great job!", "You're doing wonderfully!"
- Evaluate responses for: memory recall, attention to instructions, comprehension

CONVERSATION FLOW:
1. Start with a friendly greeting and simple memory test
2. Then test attention with a simple game/task
3. Finally test comprehension with a short story
4. Keep total conversation to 5-7 exchanges

Begin with: "Hi there! I'm here to play some fun games with you today. Are you ready? 🌟"`;
}
