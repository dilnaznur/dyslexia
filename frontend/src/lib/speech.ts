// Child-friendly speech synthesis helpers
// Uses voice preferences + waits for voices to load before speaking.

type VoicePreferenceMap = Record<string, string[]>;

const voicePreferences: VoicePreferenceMap = {
  en: ['Samantha', 'Karen', 'Google UK English Female', 'Microsoft Zira'],
  ru: ['Milena', 'Google русский', 'Microsoft Irina'],
  kk: ['Google қазақ', 'Microsoft Kazakh'],
  kz: ['Google қазақ', 'Microsoft Kazakh'],
};

function baseLang(lang: string): string {
  const base = (lang || 'en').split('-')[0].toLowerCase();
  // i18n in this repo uses `kz`, but WebSpeech often uses `kk-KZ`
  if (base === 'kk') return 'kk';
  if (base === 'kz') return 'kk';
  return base;
}

// STEP 1: Get best child-friendly voice
export function getBestVoiceForLanguage(lang: string): SpeechSynthesisVoice | null {
  if (!('speechSynthesis' in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const langCode = baseLang(lang);
  const preferred = voicePreferences[langCode] || [];

  // Try to find preferred voice
  for (const name of preferred) {
    const voice = voices.find((v) => v.name.includes(name));
    if (voice) return voice;
  }

  // Fallback: Find any female voice for this language
  const femaleVoice = voices.find(
    (v) =>
      v.lang.toLowerCase().startsWith(langCode) &&
      (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman'))
  );
  if (femaleVoice) return femaleVoice;

  // Last resort: Any voice for this language
  return voices.find((v) => v.lang.toLowerCase().startsWith(langCode)) || voices[0] || null;
}

// STEP 3: Load voices before using (CRITICAL!)
export function ensureVoicesLoaded(timeoutMs = 2000): Promise<SpeechSynthesisVoice[]> {
  if (!('speechSynthesis' in window)) return Promise.resolve([]);

  const synth = window.speechSynthesis;
  const existing = synth.getVoices();
  if (existing && existing.length > 0) return Promise.resolve(existing);

  return new Promise((resolve) => {
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      resolve(synth.getVoices());
    };

    const timer = window.setTimeout(finish, timeoutMs);

    synth.onvoiceschanged = () => {
      window.clearTimeout(timer);
      // Voices loaded, can now speak
      // eslint-disable-next-line no-console
      console.log('Voices loaded:', synth.getVoices().length);
      finish();
    };

    // Trigger load attempt (some browsers only populate after a call)
    synth.getVoices();
  });
}

// STEP 2: Configure utterance for children
export async function speakForChildren(
  text: string,
  language: string
): Promise<SpeechSynthesisUtterance | null> {
  if (!('speechSynthesis' in window)) return null;

  await ensureVoicesLoaded();

  const utterance = new SpeechSynthesisUtterance(text);

  // Set language
  utterance.lang = language; // 'en-US', 'ru-RU', 'kk-KZ'

  // CRITICAL: Select best voice (not default)
  const bestVoice = getBestVoiceForLanguage(language);
  if (bestVoice) utterance.voice = bestVoice;

  // CRITICAL: Child-friendly settings
  utterance.pitch = 1.2; // Higher pitch (1.0 = normal, 1.2 = friendly)
  utterance.rate = 0.85; // Slightly slower for clarity (1.0 = normal)
  utterance.volume = 1.0; // Full volume

  // Speak
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);

  // eslint-disable-next-line no-console
  if (bestVoice) console.log(`Speaking with voice: ${bestVoice.name}`);

  return utterance;
}
