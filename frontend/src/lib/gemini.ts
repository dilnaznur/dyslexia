/**
 * Gemini Vision API Integration
 * Handles handwriting analysis and chatbot through FastAPI proxy
 */
import {
  ChatbotAnalysis,
} from '@/types';

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://127.0.0.1:8000';
export interface GeminiVisionResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

/**
 * Compress base64 image to reduce size and processing time
 * @param base64 - Original base64 image
 * @param maxWidth - Maximum width (default 512px)
 * @param quality - JPEG quality 0-1 (default 0.7)
 * @returns Compressed base64 image
 */
async function compressBase64Image(
  base64: string,
  maxWidth = 512,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64;

    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');

      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };
  });
}

/**
 * Analyze handwriting using Gemini Vision API
 * @param imageBase64 - Base64 encoded image data (with data:image/png;base64, prefix)
 * @returns Gemini's analysis as string
 */
export async function analyzeHandwriting(imageBase64: string): Promise<string> {
  console.log('Starting handwriting analysis...');
  console.log('Original image length:', imageBase64.length);

  const prompt = `Analyze this handwriting sample for signs of dyslexia. Look for:
1. Letter reversals (b/d, p/q)
2. Inconsistent letter sizes
3. Spacing issues
4. Letter formation difficulties
5. Baseline inconsistencies

Provide a brief analysis (2-3 sentences) noting any observed patterns.`;

  try {
    // Compress image before sending
    const compressedImage = await compressBase64Image(imageBase64, 512, 0.7);
    console.log('Compressed image length:', compressedImage.length);

    if (!compressedImage) {
      throw new Error('Image compression failed');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    const response = await fetch(`${API_BASE_URL}/api/gemini`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'vision',
        prompt: prompt,
        imageBase64: compressedImage, // Use compressed image
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    let data: GeminiVisionResponse;
    try {
      data = await response.json();
      console.log('Gemini response received:', data);
    } catch (jsonError) {
      const responseText = await response.text();
      console.error('Invalid JSON response:', responseText);
      throw new Error(`Invalid JSON response from Gemini: ${responseText.substring(0, 200)}`);
    }

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }

    const analysisText = data.candidates[0].content.parts[0].text;
    console.log('Analysis text:', analysisText);

    return analysisText;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('Request timed out after 60 seconds');
        throw new Error('Analysis timed out. Please try again.');
      }
      console.error('Gemini Vision API error:', error.message);
      throw error;
    }
    throw new Error('Unknown error occurred during analysis');
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
      content: msg.content,
    }));

    const response = await fetch(`${API_BASE_URL}/api/gemini`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'chat',
        messages: messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: GeminiVisionResponse = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || 'I apologize, I could not process that.';
  } catch (error) {
    console.error('Gemini Chat API error:', error);
    return 'I encountered an error. Please try again.';
  }
}

/**
 * Analyze chatbot conversation for cognitive assessment
 */
export async function analyzeChatbotConversation(
  conversationHistory: { role: 'user' | 'model'; content: string }[]
): Promise<ChatbotAnalysis> {
  try {
    const conversationText = conversationHistory
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n');

    const analysisPrompt = `Based on this conversation with a child (age 5-10), analyze their cognitive performance. Return ONLY valid JSON with NO markdown, NO code blocks, NO extra text:

CONVERSATION:
${conversationText}

IMPORTANT: Keep responses SHORT. Return EXACTLY this format:
{
  "memory_score": 7.5,
  "attention_score": 8.0,
  "comprehension_score": 7.0,
  "behavioral_notes": "Brief summary",
  "risk_indicators": [],
  "overall_cognitive_risk": "Low"
}`;

    const response = await fetch(`${API_BASE_URL}/api/gemini`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'analysis',
        prompt: analysisPrompt,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: GeminiVisionResponse = await response.json();
    const textResponse = data.candidates[0]?.content?.parts[0]?.text || '{}';
    
    console.log('Raw Gemini response:', textResponse);
    console.log('Response length:', textResponse.length);

    // Remove markdown code blocks and newlines
    let cleanedText = textResponse
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .replace(/\n/g, ' ')
      .trim();

    // Handle incomplete JSON by completing it
    if (cleanedText.includes('{') && !cleanedText.includes('}')) {
      console.warn('Incomplete JSON detected, attempting to complete...');
      const openBraces = (cleanedText.match(/\{/g) || []).length;
      const closeBraces = (cleanedText.match(/\}/g) || []).length;
      const missingBraces = openBraces - closeBraces;
      
      for (let i = 0; i < missingBraces; i++) {
        cleanedText += '}';
      }
    }

    // Extract JSON from text
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', textResponse);
      throw new Error('Invalid JSON response from Gemini');
    }

    const result: ChatbotAnalysis = JSON.parse(jsonMatch[0]);
    return result;
  } catch (error) {
    console.error('Gemini Analysis API error:', error);

    // Return default analysis
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
 * Get system prompt for chatbot interaction
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

/**
 * Test connection to Gemini API
 */
export async function testGeminiConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/gemini`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'analysis',
        prompt: 'Hello',
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}