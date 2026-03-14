/**
 * Gemini Vision API Integration
 * Handles handwriting analysis through FastAPI proxy
 * (Chatbot assessment is now rule-based — see AIChatbot.tsx)
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
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
 * Test connection to Gemini API (vision only)
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