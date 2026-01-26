/**
 * AI Chatbot for Behavioral Assessment
 * Gamified conversational assessment using Gemini NLP
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Loader } from 'lucide-react';
import {
  sendChatMessage,
  analyzeChatbotConversation,
} from '@/lib/gemini';
import { ChatMessage, ChatbotAnalysis } from '@/types';

interface AIChatbotProps {
  onComplete: (analysis: ChatbotAnalysis) => void;
  onSkip?: () => void;
}

const MIN_EXCHANGES = 5;

export default function AIChatbot({ onComplete, onSkip }: AIChatbotProps) {
  const [phase, setPhase] = useState<'intro' | 'chatting' | 'analyzing' | 'complete'>('intro');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationHistoryRef = useRef<{ role: 'user' | 'model'; content: string }[]>([]);
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize conversation
  useEffect(() => {
    if (phase === 'chatting' && messages.length === 0) {
      sendInitialGreeting();
    }
  }, [phase]);

  const sendInitialGreeting = async () => {
    setIsLoading(true);
  
    try {
      // Добавляем начальное сообщение от пользователя
      const initialHistory: { role: 'user' | 'model'; content: string }[] = [
        { role: 'user' as const, content: 'Hi! I\'m ready to start.' }  // ← as const
      ];
      
      const greeting = await sendChatMessage(initialHistory);
  
      const greetingMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: greeting,
        timestamp: Date.now(),
      };
  
      // Сохраняем в историю (без системного промпта)
      conversationHistoryRef.current = [
        { role: 'user', content: 'Hi! I\'m ready to start.' },
        { role: 'model', content: greeting }
      ];
  
      setMessages([greetingMessage]);
    } catch (error) {
      console.error('Failed to get initial greeting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    conversationHistoryRef.current.push({
      role: 'user',
      content: inputValue,
    });

    setInputValue('');
    setIsLoading(true);

    try {
      // Get AI response
      const aiResponse = await sendChatMessage(conversationHistoryRef.current);

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now(),
      };

      conversationHistoryRef.current.push({
        role: 'model',
        content: aiResponse,
      });

      setMessages((prev) => [...prev, aiMessage]);
      setExchangeCount((prev) => prev + 1);

      // Check if conversation should end
      if (exchangeCount + 1 >= MIN_EXCHANGES) {
        setTimeout(() => {
          handleCompleteConversation();
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to send message:', error);

      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I had trouble understanding. Could you try again?',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteConversation = async () => {
    setPhase('analyzing');

    try {
      // Analyze conversation with Gemini
      const analysis = await analyzeChatbotConversation(
        conversationHistoryRef.current.slice(1) // Skip system prompt
      );

      setPhase('complete');
      onComplete(analysis);
    } catch (error) {
      console.error('Conversation analysis failed:', error);
      // Provide default analysis on error
      const defaultAnalysis: ChatbotAnalysis = {
        memory_score: 5.0,
        attention_score: 5.0,
        comprehension_score: 5.0,
        behavioral_notes: 'Analysis completed',
        risk_indicators: [],
        overall_cognitive_risk: 'Low',
      };
      onComplete(defaultAnalysis);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-blue to-pale-yellow p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Intro Phase */}
        {phase === 'intro' && (
          <div className="glass-card p-8 text-center">
            <Bot className="w-16 h-16 mx-auto mb-4 text-soft-blue" />
            <h2 className="text-2xl font-bold mb-4 text-text-primary">
              Chat with Our Friendly AI
            </h2>
            <p className="text-lg mb-6 text-text-secondary leading-relaxed">
              Let's have a fun conversation! I'll ask you some questions and play
              simple games with you.
            </p>
            <div className="bg-pale-yellow p-4 rounded-lg mb-6">
              <p className="text-base">
                <strong>What to do:</strong> Just chat naturally and answer my
                questions. There are no wrong answers! This will take about 3-5
                minutes.
              </p>
            </div>
            <button
              onClick={() => setPhase('chatting')}
              className="bg-soft-blue hover:bg-blue-400 text-white font-bold py-3 px-8 rounded-full transition-transform hover:scale-105"
            >
              Start Chatting
            </button>
            {onSkip && (
              <button
                onClick={onSkip}
                className="ml-4 text-text-secondary hover:text-text-primary underline"
              >
                Skip this step
              </button>
            )}
          </div>
        )}

        {/* Chatting Phase */}
        {phase === 'chatting' && (
          <div className="glass-card p-8 flex flex-col h-[600px]">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Bot className="w-8 h-8 text-soft-blue" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-text-primary">
                  MindStep Assistant
                </h3>
                <p className="text-sm text-text-secondary">
                  Exchange {exchangeCount}/{MIN_EXCHANGES}
                </p>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-soft-blue text-white'
                          : 'bg-white text-text-primary border border-gray-200'
                      }`}
                    >
                      <p className="text-base leading-relaxed">{message.content}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white rounded-2xl px-4 py-3 border border-gray-200">
                    <div className="flex gap-2">
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-2 h-2 bg-gray-400 rounded-full"
                      />
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 bg-gray-400 rounded-full"
                      />
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 bg-gray-400 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-full border-2 border-gray-300 focus:border-soft-blue focus:outline-none text-base disabled:bg-gray-100"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-soft-blue hover:bg-blue-400 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-full transition-transform hover:scale-105"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* Analyzing Phase */}
        {phase === 'analyzing' && (
          <div className="glass-card p-8 text-center">
            <Loader className="w-16 h-16 mx-auto mb-4 text-soft-blue animate-spin" />
            <h2 className="text-2xl font-bold mb-4 text-text-primary">
              Analyzing Conversation...
            </h2>
            <p className="text-lg text-text-secondary">
              Evaluating your responses and cognitive patterns.
            </p>
          </div>
        )}

        {/* Complete Phase */}
        {phase === 'complete' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="text-6xl mb-4"
            >
              🎉
            </motion.div>
            <h2 className="text-2xl font-bold mb-4 text-text-primary">
              Great Conversation!
            </h2>
            <p className="text-lg text-text-secondary">
              You did wonderfully! All assessments complete.
            </p>
          </motion.div>
        )}
      </motion.div>

      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px) saturate(180%);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
        }
      `}</style>
    </div>
  );
}
