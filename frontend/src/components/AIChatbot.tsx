/**
 * Rule-Based Cognitive Assessment Chatbot
 * Replaces Gemini Chat API with deterministic 5-exchange assessment
 * Designed for children aged 5-10 with dyslexia-friendly UI
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Volume2, VolumeX, Star } from 'lucide-react';
import { ChatMessage, ChatbotAnalysis } from '@/types';
import confetti from 'canvas-confetti';
import InstructionModal from './InstructionModal';
import { useTranslation } from 'react-i18next';
import { SPEECH_LANG } from '@/i18n';

// ============================================================================
// Types & Constants
// ============================================================================

interface AIChatbotProps {
  onComplete: (analysis: ChatbotAnalysis) => void;
  onSkip?: () => void;
}

interface MCOption {
  emoji: string;
  label: string;
  value: string;
}

interface Exchange {
  id: number;
  label: string;
  question: string;
  score: (answer: string) => number;
  maxScore: number;
  encouragement: string;
  /** If present, render as multiple-choice instead of text input */
  options?: MCOption[];
}

const PASTEL_COLORS = [
  'from-pink-200 to-purple-200',
  'from-blue-200 to-cyan-200',
  'from-green-200 to-teal-200',
  'from-yellow-200 to-orange-200',
  'from-indigo-200 to-pink-200',
];

// ============================================================================
// Audio Helper (language-aware)
// ============================================================================

function speakText(text: string, lang: string): SpeechSynthesisUtterance | null {
  if (!('speechSynthesis' in window)) return null;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
  return utterance;
}

// ============================================================================
// Build exchanges from translations
// ============================================================================

function buildExchanges(t: (key: string, opts?: Record<string, unknown>) => string): Exchange[] {
  const memoryWords: string[] = t('chatbot.memoryWords', { returnObjects: true }) as unknown as string[];
  const correctRhyme = t('chatbot.correctRhyme');
  const correctColor = t('chatbot.correctColor');
  const storyAnswers: string[] = t('chatbot.correctStoryAnswers', { returnObjects: true }) as unknown as string[];
  const q2Opts = t('chatbot.options.q2', { returnObjects: true }) as unknown as MCOption[];
  const q3Opts = t('chatbot.options.q3', { returnObjects: true }) as unknown as MCOption[];

  return [
    {
      id: 1,
      label: t('chatbot.labels.memoryPrime'),
      question: t('chatbot.questions.q1'),
      score: (answer: string) => {
        const lower = answer.toLowerCase();
        let pts = 0;
        for (const w of memoryWords) { if (lower.includes(w.toLowerCase())) pts += 1; }
        return pts;
      },
      maxScore: 3,
      encouragement: t('chatbot.encouragements.e1'),
    },
    {
      id: 2,
      label: t('chatbot.labels.phonological'),
      question: t('chatbot.questions.q2'),
      options: q2Opts,
      score: (answer: string) => (answer.toLowerCase().includes(correctRhyme.toLowerCase()) ? 2 : 0),
      maxScore: 2,
      encouragement: t('chatbot.encouragements.e2'),
    },
    {
      id: 3,
      label: t('chatbot.labels.attention'),
      question: t('chatbot.questions.q3'),
      options: q3Opts,
      score: (answer: string) => (answer.toLowerCase().includes(correctColor.toLowerCase()) ? 1 : 0),
      maxScore: 1,
      encouragement: t('chatbot.encouragements.e3'),
    },
    {
      id: 4,
      label: t('chatbot.labels.storyComprehension'),
      question: t('chatbot.questions.q4'),
      score: (answer: string) => {
        const lower = answer.toLowerCase();
        return storyAnswers.some((a) => lower.includes(a.toLowerCase())) ? 2 : 0;
      },
      maxScore: 2,
      encouragement: t('chatbot.encouragements.e4'),
    },
    {
      id: 5,
      label: t('chatbot.labels.delayedRecall'),
      question: t('chatbot.questions.q5'),
      score: (answer: string) => {
        const lower = answer.toLowerCase();
        let pts = 0;
        for (const w of memoryWords) { if (lower.includes(w.toLowerCase())) pts += 1; }
        return pts;
      },
      maxScore: 3,
      encouragement: t('chatbot.encouragements.e5'),
    },
  ];
}

// ============================================================================
// Sub-components
// ============================================================================

function ProgressBar({ current, total, label }: { current: number; total: number; label: string }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-semibold text-indigo-700">
          {label}
        </span>
        <span className="text-sm text-indigo-500">{pct}%</span>
      </div>
      <div className="w-full h-4 bg-indigo-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>
      <div className="flex justify-between mt-1">
        {Array.from({ length: total }).map((_, i) => (
          <motion.div
            key={i}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              i < current
                ? 'bg-indigo-500 text-white'
                : i === current
                ? 'bg-pink-400 text-white ring-2 ring-pink-300'
                : 'bg-gray-200 text-gray-400'
            }`}
            animate={i === current ? { scale: [1, 1.15, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            {i < current ? '✓' : i + 1}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ScoreGauge({ label, score, description, detail }: {
  label: string;
  score: number;
  description: string;
  detail: string;
}) {
  const pct = (score / 10) * 100;
  const color =
    score >= 7 ? 'from-green-400 to-emerald-500' :
    score >= 5 ? 'from-yellow-400 to-amber-500' :
                 'from-red-400 to-rose-500';
  const textColor =
    score >= 7 ? 'text-green-700' :
    score >= 5 ? 'text-amber-700' :
                 'text-red-700';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100"
    >
      <h4 className="text-lg font-bold text-gray-800 mb-1">{label}</h4>
      <p className="text-sm text-gray-500 mb-3">{description}</p>
      <div className="w-full h-5 bg-gray-100 rounded-full overflow-hidden mb-2">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, delay: 0.3 }}
        />
      </div>
      <div className="flex justify-between items-center">
        <span className={`text-2xl font-extrabold ${textColor}`}>
          {score.toFixed(1)}
        </span>
        <span className="text-xs text-gray-400">/ 10</span>
      </div>
      <p className="text-xs text-gray-500 mt-2">{detail}</p>
    </motion.div>
  );
}

function StarBurst() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-yellow-400"
          initial={{
            x: '50%',
            y: '50%',
            scale: 0,
            opacity: 1,
          }}
          animate={{
            x: `${50 + 40 * Math.cos((i * Math.PI * 2) / 8)}%`,
            y: `${50 + 40 * Math.sin((i * Math.PI * 2) / 8)}%`,
            scale: [0, 1.2, 0],
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 0.8, delay: i * 0.05 }}
        >
          <Star className="w-5 h-5 fill-yellow-400" />
        </motion.div>
      ))}
    </motion.div>
  );
}

// ============================================================================
// Scoring Calculation
// ============================================================================

function calculateScores(scores: number[]): ChatbotAnalysis {
  const [e1, e2, e3, e4, e5] = scores;

  const memory_score = ((e1 / 3) * 0.4 + (e5 / 3) * 0.6) * 10;
  const attention_score = (e3 / 1) * 10;
  const comprehension_score = ((e2 / 2) * 0.5 + (e4 / 2) * 0.5) * 10;

  const avg = (memory_score + attention_score + comprehension_score) / 3;

  let overall_cognitive_risk: 'Low' | 'Moderate' | 'High';
  if (memory_score < 5 || attention_score < 5 || comprehension_score < 5) {
    overall_cognitive_risk = 'High';
  } else if (avg < 7) {
    overall_cognitive_risk = 'Moderate';
  } else {
    overall_cognitive_risk = 'Low';
  }

  return {
    memory_score: parseFloat(memory_score.toFixed(1)),
    attention_score: parseFloat(attention_score.toFixed(1)),
    comprehension_score: parseFloat(comprehension_score.toFixed(1)),
    behavioral_notes: `Assessment completed. Memory=${memory_score.toFixed(1)}, Attention=${attention_score.toFixed(1)}, Comprehension=${comprehension_score.toFixed(1)}.`,
    risk_indicators:
      overall_cognitive_risk !== 'Low'
        ? [
            ...(memory_score < 5 ? ['Below-average memory recall'] : []),
            ...(attention_score < 5 ? ['Attention challenges observed'] : []),
            ...(comprehension_score < 5 ? ['Comprehension difficulties noted'] : []),
          ]
        : [],
    overall_cognitive_risk,
  };
}

// ============================================================================
// Main Component
// ============================================================================

export default function AIChatbot({ onComplete, onSkip }: AIChatbotProps) {
  const { t, i18n } = useTranslation();
  const EXCHANGES = buildExchanges(t);
  const speechLang = SPEECH_LANG[i18n.language] || 'en-US';

  const [phase, setPhase] = useState<'intro' | 'chatting' | 'results' | 'complete'>('intro');
  const [currentExchange, setCurrentExchange] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [exchangeScores, setExchangeScores] = useState<number[]>([]);
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [analysis, setAnalysis] = useState<ChatbotAnalysis | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mcSelected, setMcSelected] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speak question when it appears
  const speakQuestion = useCallback(
    (text: string) => {
      if (!audioEnabled) return;
      const utt = speakText(text, speechLang);
      if (utt) {
        setIsSpeaking(true);
        utt.onend = () => setIsSpeaking(false);
        utt.onerror = () => setIsSpeaking(false);
      }
    },
    [audioEnabled, speechLang]
  );

  // Start chatting – send first question
  useEffect(() => {
    if (phase === 'chatting' && messages.length === 0) {
      const q = EXCHANGES[0].question;
      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: q,
        timestamp: Date.now(),
      };
      setMessages([msg]);
      setTimeout(() => speakQuestion(q), 400);
    }
  }, [phase]);

  // Focus input after question
  useEffect(() => {
    if (phase === 'chatting') {
      inputRef.current?.focus();
    }
  }, [messages, phase]);

  // Save progress to sessionStorage
  useEffect(() => {
    if (exchangeScores.length > 0) {
      sessionStorage.setItem(
        'mindstep_chatbot_progress',
        JSON.stringify({ scores: exchangeScores, exchange: currentExchange })
      );
    }
  }, [exchangeScores, currentExchange]);

  // Restore progress on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('mindstep_chatbot_progress');
      if (saved) {
        const { scores, exchange } = JSON.parse(saved);
        if (Array.isArray(scores) && scores.length > 0 && scores.length < 5) {
          setExchangeScores(scores);
          setCurrentExchange(exchange);
          const rebuilt: ChatMessage[] = [];
          for (let i = 0; i < scores.length; i++) {
            rebuilt.push({
              id: crypto.randomUUID(),
              role: 'assistant',
              content: EXCHANGES[i].question,
              timestamp: Date.now(),
            });
            rebuilt.push({
              id: crypto.randomUUID(),
              role: 'user',
              content: '(previous answer)',
              timestamp: Date.now(),
            });
          }
          if (exchange < 5) {
            rebuilt.push({
              id: crypto.randomUUID(),
              role: 'assistant',
              content: EXCHANGES[exchange].question,
              timestamp: Date.now(),
            });
          }
          setMessages(rebuilt);
          setPhase('chatting');
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleMCSelect = (option: MCOption) => {
    if (showEncouragement || mcSelected) return;
    setMcSelected(option.value);
    processAnswer(option.label);
  };

  const processAnswer = (userAnswer: string) => {
    const exchange = EXCHANGES[currentExchange];

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userAnswer,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const score = exchange.score(userAnswer);
    const newScores = [...exchangeScores, score];
    setExchangeScores(newScores);

    setShowEncouragement(true);
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 }, colors: ['#fbbf24', '#a78bfa', '#34d399'] });

    setTimeout(() => {
      setShowEncouragement(false);
      setMcSelected(null);

      const nextIdx = currentExchange + 1;

      if (nextIdx >= EXCHANGES.length) {
        const result = calculateScores(newScores);
        setAnalysis(result);
        setCurrentExchange(nextIdx);
        setPhase('results');
        sessionStorage.removeItem('mindstep_chatbot_progress');
        confetti({ particleCount: 120, spread: 100, origin: { y: 0.5 } });
      } else {
        setCurrentExchange(nextIdx);
        const nextQ = EXCHANGES[nextIdx].question;
        const botMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: nextQ,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, botMsg]);
        setTimeout(() => speakQuestion(nextQ), 300);
      }
    }, 1200);
  };

  const handleSubmit = () => {
    if (!inputValue.trim() || phase !== 'chatting') return;
    const userAnswer = inputValue.trim();
    setInputValue('');
    processAnswer(userAnswer);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFinish = () => {
    if (analysis) {
      setPhase('complete');
      onComplete(analysis);
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-pink-50 to-yellow-50 p-4 md:p-8 pt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {/* ============ INTRO ============ */}
        <InstructionModal
          open={phase === 'intro'}
          icon={
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-6xl"
            >
              🤖
            </motion.div>
          }
          title={t('chatbot.modalTitle')}
          description={t('chatbot.modalDesc')}
          instructions={t('chatbot.modalInstructions')}
          actionLabel={t('chatbot.startBtn')}
          onAction={() => setPhase('chatting')}
          onClose={() => onSkip?.()}
          onSkip={onSkip}
          actionGradient="bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600"
        />

        {/* ============ CHATTING ============ */}
        {phase === 'chatting' && (
          <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-xl border border-white/50 flex flex-col h-[640px] relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-3xl"
                >
                  🤖
                </motion.div>
                <div>
                  <h3 className="text-xl font-extrabold text-indigo-700">
                    {t('chatbot.buddyName')}
                  </h3>
                  <p className="text-xs text-indigo-400 font-medium">
                    {EXCHANGES[Math.min(currentExchange, 4)].label}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className="p-2 rounded-full hover:bg-indigo-100 transition-colors"
                title={audioEnabled ? t('chatbot.muteAudio') : t('chatbot.enableAudio')}
              >
                {audioEnabled ? (
                  <Volume2 className="w-5 h-5 text-indigo-500" />
                ) : (
                  <VolumeX className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>

            {/* Progress */}
            <ProgressBar current={currentExchange} total={EXCHANGES.length} label={t('chatbot.questionOf', { current: Math.min(currentExchange + 1, EXCHANGES.length), total: EXCHANGES.length })} />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-1">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-base leading-relaxed relative ${
                        msg.role === 'user'
                          ? `bg-gradient-to-r ${PASTEL_COLORS[currentExchange % PASTEL_COLORS.length]} text-gray-800 shadow`
                          : 'bg-white text-gray-800 border border-indigo-100 shadow-sm'
                      }`}
                    >
                      <p>{msg.content}</p>
                      {/* Speaker button on assistant messages */}
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => speakText(msg.content, speechLang)}
                          className="absolute -right-3 -top-3 bg-white rounded-full p-1 shadow border border-indigo-100 hover:bg-indigo-50 transition-colors"
                          title={t('chatbot.listenMsg')}
                        >
                          <Volume2 className="w-4 h-4 text-indigo-400" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Encouragement overlay */}
              <AnimatePresence>
                {showEncouragement && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="flex justify-center relative"
                  >
                    <div className="bg-gradient-to-r from-yellow-200 to-pink-200 rounded-2xl px-6 py-3 shadow-lg">
                      <p className="text-lg font-bold text-indigo-700">
                        {EXCHANGES[currentExchange]?.encouragement || 'Great job! 🌟'}
                      </p>
                    </div>
                    <StarBurst />
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Input — multiple choice or text */}
            {EXCHANGES[currentExchange]?.options ? (
              <div className="grid grid-cols-3 gap-3">
                {EXCHANGES[currentExchange].options!.map((opt) => {
                  const isSelected = mcSelected === opt.value;
                  const isDisabled = showEncouragement || (mcSelected !== null && !isSelected);
                  return (
                    <motion.button
                      key={opt.value}
                      whileHover={!isDisabled ? { scale: 1.06, y: -2 } : {}}
                      whileTap={!isDisabled ? { scale: 0.95 } : {}}
                      onClick={() => handleMCSelect(opt)}
                      disabled={isDisabled}
                      className={`flex flex-col items-center justify-center min-h-[120px] rounded-2xl border-3 text-lg font-bold transition-all shadow-md ${
                        isSelected
                          ? 'bg-indigo-100 border-indigo-500 ring-4 ring-indigo-300 scale-105'
                          : isDisabled
                          ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                          : 'bg-white border-indigo-200 hover:border-indigo-400 hover:shadow-lg cursor-pointer'
                      }`}
                    >
                      <span className="text-4xl mb-2">{opt.emoji}</span>
                      <span className={`text-base ${
                        isSelected ? 'text-indigo-700' : 'text-gray-700'
                      }`}>{opt.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={t('chatbot.typePlaceholder')}
                  disabled={showEncouragement}
                  className="flex-1 px-5 py-3 rounded-full border-2 border-indigo-200 focus:border-indigo-400 focus:outline-none text-base disabled:bg-gray-100 bg-white/80 text-lg"
                />
                <button
                  onClick={handleSubmit}
                  disabled={!inputValue.trim() || showEncouragement}
                  className="bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-300 text-white p-3 rounded-full transition-transform hover:scale-105 shadow-md"
                >
                  <Send className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============ RESULTS ============ */}
        {phase === 'results' && analysis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Celebration header */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-white/70 backdrop-blur-md rounded-3xl p-8 text-center shadow-xl border border-white/50"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="text-6xl mb-3"
              >
                🎉
              </motion.div>
              <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent mb-2">
                {t('chatbot.results.amazingWork')}
              </h2>
              <p className="text-lg text-gray-600">
                {t('chatbot.results.completedAll')}
              </p>
            </motion.div>

            {/* Score cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <ScoreGauge
                label={t('chatbot.results.memorySkills')}
                score={analysis.memory_score}
                description={t('chatbot.results.memoryDesc')}
                detail={t('chatbot.results.memoryDetail')}
              />
              <ScoreGauge
                label={t('chatbot.results.attentionSkills')}
                score={analysis.attention_score}
                description={t('chatbot.results.attentionDesc')}
                detail={t('chatbot.results.attentionDetail')}
              />
              <ScoreGauge
                label={t('chatbot.results.comprehensionSkills')}
                score={analysis.comprehension_score}
                description={t('chatbot.results.comprehensionDesc')}
                detail={t('chatbot.results.comprehensionDetail')}
              />
            </div>

            {/* Overall risk */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`rounded-3xl p-6 text-center shadow-xl border ${
                analysis.overall_cognitive_risk === 'Low'
                  ? 'bg-green-50 border-green-200'
                  : analysis.overall_cognitive_risk === 'Moderate'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <h3 className="text-xl font-bold mb-2 text-gray-800">
                {t('chatbot.results.overallRiskLevel')}
              </h3>
              <span
                className={`inline-block text-2xl font-extrabold px-6 py-2 rounded-full ${
                  analysis.overall_cognitive_risk === 'Low'
                    ? 'bg-green-200 text-green-800'
                    : analysis.overall_cognitive_risk === 'Moderate'
                    ? 'bg-yellow-200 text-yellow-800'
                    : 'bg-red-200 text-red-800'
                }`}
              >
                {analysis.overall_cognitive_risk === 'Low'
                  ? t('chatbot.results.riskLow')
                  : analysis.overall_cognitive_risk === 'Moderate'
                  ? t('chatbot.results.riskModerate')
                  : t('chatbot.results.riskHigh')}
              </span>

              <div className="mt-4 text-left max-w-lg mx-auto text-sm text-gray-600 space-y-2">
                {analysis.overall_cognitive_risk === 'Low' && (
                  <p>
                    {t('chatbot.results.lowRiskMsg')}
                  </p>
                )}
                {analysis.overall_cognitive_risk === 'Moderate' && (
                  <>
                    <p>
                      {t('chatbot.results.moderateRiskMsg1')}
                    </p>
                    <p>
                      <strong>{t('chatbot.results.moderateRiskMsg2')}</strong>
                    </p>
                  </>
                )}
                {analysis.overall_cognitive_risk === 'High' && (
                  <>
                    <p>
                      {t('chatbot.results.highRiskMsg1')}
                    </p>
                    <p>
                      <strong>{t('chatbot.results.highRiskMsg2')}</strong>
                    </p>
                  </>
                )}
              </div>
            </motion.div>

            {/* Explanation for parents */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/70 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/50"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-3">
                {t('chatbot.results.whatTested')}
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="bg-indigo-50 rounded-xl p-3">
                  <strong className="text-indigo-700">{t('chatbot.results.testedMemory')}</strong>
                  <p>{t('chatbot.results.testedMemoryDesc')}</p>
                </div>
                <div className="bg-pink-50 rounded-xl p-3">
                  <strong className="text-pink-700">{t('chatbot.results.testedPhonological')}</strong>
                  <p>{t('chatbot.results.testedPhonologicalDesc')}</p>
                </div>
                <div className="bg-teal-50 rounded-xl p-3">
                  <strong className="text-teal-700">{t('chatbot.results.testedAttention')}</strong>
                  <p>{t('chatbot.results.testedAttentionDesc')}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3">
                  <strong className="text-amber-700">{t('chatbot.results.testedStory')}</strong>
                  <p>{t('chatbot.results.testedStoryDesc')}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                {t('chatbot.results.scoreNote')}
              </p>
            </motion.div>

            {/* Continue button */}
            <div className="text-center">
              <button
                onClick={handleFinish}
                className="bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-bold py-3 px-10 rounded-full text-lg transition-transform hover:scale-105 shadow-lg"
              >
                {t('chatbot.results.continueToResults')}
              </button>
            </div>
          </motion.div>
        )}

        {/* ============ COMPLETE ============ */}
        {phase === 'complete' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/70 backdrop-blur-md rounded-3xl p-8 text-center shadow-xl border border-white/50"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="text-6xl mb-4"
            >
              🌟
            </motion.div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              {t('chatbot.complete.title')}
            </h2>
            <p className="text-lg text-gray-500">
              {t('chatbot.complete.subtitle')}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
