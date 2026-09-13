import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  Mic, MicOff, Volume2, VolumeX, RotateCcw, X, Send,
  Sparkles, Bot, ExternalLink, ArrowRight, CheckCircle2,
  TrendingUp, ShieldCheck, MapPin, Radio
} from 'lucide-react';

export const VoiceAssistant = ({ onNavigate, currentView, isOpenExternal, onCloseExternal }) => {
  const { language, setLanguage, t, currentLocale, availableLanguages } = useLanguage();
  const { role, user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [typedInput, setTypedInput] = useState('');
  const [audioWaves, setAudioWaves] = useState(false);

  // Sync external open request from Navbar
  useEffect(() => {
    if (isOpenExternal !== undefined) {
      setIsOpen(isOpenExternal);
    }
  }, [isOpenExternal]);

  const handleClose = () => {
    setIsOpen(false);
    stopListening();
    stopSpeaking();
    if (onCloseExternal) onCloseExternal();
  };

  // Conversation history
  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome',
      sender: 'assistant',
      text: t('voice.answers.welcome'),
      actionLink: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Update welcome message when language changes
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [{
          id: 'welcome',
          sender: 'assistant',
          text: t('voice.answers.welcome'),
          actionLink: null,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }];
      }
      return prev;
    });
  }, [language]);

  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);
  const audioPlayerRef = useRef(null);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isListening, isSpeaking]);

  // Primary: Native Neural TTS Streaming (Crystal-clear Hindi, Telugu & Indian English)
  const speakText = (text, targetLang = language) => {
    if (!text || !text.trim()) return;

    // Stop ongoing audio
    stopSpeaking();

    const langCodeMap = {
      en: 'en-IN',
      hi: 'hi',
      te: 'te'
    };
    const tl = langCodeMap[targetLang] || 'en-IN';
    const cleanText = text.replace(/[*_#`₹]/g, '').trim().slice(0, 250);

    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=${tl}&client=tw-ob`;

    try {
      const audio = new Audio(ttsUrl);
      audioPlayerRef.current = audio;

      audio.onplay = () => {
        setIsSpeaking(true);
        setAudioWaves(true);
      };

      audio.onended = () => {
        setIsSpeaking(false);
        setAudioWaves(false);
      };

      audio.onerror = (e) => {
        console.warn('Native audio stream error, falling back to SpeechSynthesis:', e);
        fallbackSpeechSynthesis(cleanText, targetLang);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio play prevented or offline, fallback to SpeechSynthesis:', err);
          fallbackSpeechSynthesis(cleanText, targetLang);
        });
      }
    } catch (err) {
      fallbackSpeechSynthesis(cleanText, targetLang);
    }
  };

  // Secondary Fallback: Browser Web Speech API Synthesis
  const fallbackSpeechSynthesis = (text, targetLang) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    const langLocaleMap = {
      en: 'en-IN',
      hi: 'hi-IN',
      te: 'te-IN'
    };
    utterance.lang = langLocaleMap[targetLang] || 'en-IN';

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const match = voices.find(v => {
        if (targetLang === 'hi') return v.lang.includes('hi') || v.name.toLowerCase().includes('hindi');
        if (targetLang === 'te') return v.lang.includes('te') || v.name.toLowerCase().includes('telugu');
        return v.lang.includes('en-IN') || v.name.toLowerCase().includes('india') || v.lang.includes('en');
      });
      if (match) utterance.voice = match;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setAudioWaves(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setAudioWaves(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setAudioWaves(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      audioPlayerRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setAudioWaves(false);
  };

  // Handle switching language with immediate voice confirmation in that language
  const handleLanguageSwitch = (newLang) => {
    setLanguage(newLang);
    stopSpeaking();

    const greetingPhrases = {
      hi: 'नमस्ते! अब मैं हिंदी में बोलूँगा। आप मुझसे टमाटर, मिर्च या किसी भी फसल का मंडी भाव पूछ सकते हैं।',
      te: 'నమస్కారం! నేను ఇప్పుడు తెలుగులో మాట్లాడతాను. మీరు నన్ను మార్కెట్ ధరలు లేదా రైతు ధృవీకరణ గురించి అడగవచ్చు.',
      en: 'Hello! I am now ready to speak in English. You can ask for mandi prices, farm verification, or orders.'
    };

    const greeting = greetingPhrases[newLang] || greetingPhrases.en;

    setMessages(prev => [
      ...prev,
      {
        id: `switch_${Date.now()}`,
        sender: 'assistant',
        text: greeting,
        actionLink: null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    // Immediately speak in the new language so the user hears it!
    setTimeout(() => {
      speakText(greeting, newLang);
    }, 150);
  };

  // Speech-To-Text (STT)
  const startListening = () => {
    stopSpeaking();
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback if browser doesn't have Web Speech Recognition
      setIsListening(true);
      setTranscript('Listening...');
      setTimeout(() => {
        // Fallback test query based on language
        const fallbackQueries = {
          en: 'What is tomato market price today?',
          hi: 'आज टमाटर का मंडी भाव क्या है?',
          te: 'ఈరోజు టమోటా మార్కెట్ ధర ఎంత?'
        };
        const sample = fallbackQueries[language] || fallbackQueries.en;
        handleUserQuery(sample);
        setIsListening(false);
      }, 2500);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;

      const langLocaleMap = {
        en: 'en-IN',
        hi: 'hi-IN',
        te: 'te-IN'
      };
      recognition.lang = langLocaleMap[language] || 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
        setAudioWaves(true);
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onend = () => {
        setIsListening(false);
        setAudioWaves(false);
        if (transcript && transcript.trim().length > 1) {
          handleUserQuery(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition status:', event.error);
        setIsListening(false);
        setAudioWaves(false);
      };

      recognition.start();
    } catch (e) {
      console.warn('Could not start recognition:', e);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setAudioWaves(false);
  };

  // Multilingual Intent Processor
  const handleUserQuery = (queryText) => {
    if (!queryText || !queryText.trim()) return;

    const clean = queryText.toLowerCase().trim();
    const userMsg = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    let responseText = '';
    let action = null;

    // 1. Tomatoes / टमाटर / టమోటా
    if (clean.includes('tomato') || clean.includes('टमाटर') || clean.includes('టమోటా') || clean.includes('తక్కాళి')) {
      responseText = t('voice.answers.tomato_price');
      action = { label: t('nav.market_intelligence'), view: 'farmer-market' };
    }
    // 2. Chilli / मिर्च / మిర్చి
    else if (clean.includes('chilli') || clean.includes('chili') || clean.includes('मिर्च') || clean.includes('మిర్చి')) {
      responseText = t('voice.answers.chilli_price');
      action = { label: t('nav.market_intelligence'), view: 'farmer-market' };
    }
    // 3. Cotton / कपास / పత్తి
    else if (clean.includes('cotton') || clean.includes('कपास') || clean.includes('పత్తి')) {
      responseText = t('voice.answers.cotton_price');
      action = { label: t('nav.market_intelligence'), view: 'farmer-market' };
    }
    // 4. Maize / मक्का / మొక్కజొన్న
    else if (clean.includes('maize') || clean.includes('corn') || clean.includes('मक्का') || clean.includes('మొక్కజొన్న')) {
      responseText = t('voice.answers.maize_price');
      action = { label: t('nav.market_intelligence'), view: 'farmer-market' };
    }
    // 5. Paddy / Rice / धान / వరి / ధాన్యం
    else if (clean.includes('paddy') || clean.includes('rice') || clean.includes('धान') || clean.includes('వరి') || clean.includes('ధాన్యం')) {
      responseText = t('voice.answers.paddy_price');
      action = { label: t('nav.market_intelligence'), view: 'farmer-market' };
    }
    // 6. Verification / KYC / सत्यापन / వెరిఫికేషన్
    else if (clean.includes('verif') || clean.includes('kyc') || clean.includes('सत्यापन') || clean.includes('ధృవీకరణ') || clean.includes('వెరిఫికేషన్') || clean.includes('ఆధార్') || clean.includes('passbook')) {
      responseText = t('voice.answers.navigating_verification');
      action = { label: t('nav.farmer_verification'), view: 'farmer-verification' };
      if (onNavigate) onNavigate('farmer-verification');
    }
    // 7. Market Intelligence / Mandi / भाव / రేట్లు
    else if (clean.includes('market') || clean.includes('mandi') || clean.includes('मंडी') || clean.includes('भाव') || clean.includes('మార్కెట్') || clean.includes('ధర') || clean.includes('రేటు')) {
      responseText = t('voice.answers.navigating_market');
      action = { label: t('nav.market_intelligence'), view: 'farmer-market' };
      if (onNavigate) onNavigate('farmer-market');
    }
    // 8. My Produce / फसल / పంటలు
    else if (clean.includes('produce') || clean.includes('crop') || clean.includes('फसल') || clean.includes('పంట') || clean.includes('హార్వెస్ట్')) {
      responseText = t('voice.answers.navigating_produce');
      action = { label: t('nav.my_produce'), view: 'farmer-produce' };
      if (onNavigate) onNavigate('farmer-produce');
    }
    // 9. Orders / डिलीवरी / ఆర్డర్లు
    else if (clean.includes('order') || clean.includes('delivery') || clean.includes('ऑर्डर') || clean.includes('डिलीवरी') || clean.includes('ఆర్డర్') || clean.includes('డెలివరీ')) {
      responseText = t('voice.answers.navigating_orders');
      const targetOrderView = role === 'buyer' ? 'buyer-orders' : 'farmer-orders';
      action = { label: t('nav.procurement_orders'), view: targetOrderView };
      if (onNavigate) onNavigate(targetOrderView);
    }
    // 10. Escrow / Payment / एस्क्रो / ఎస్క్రో
    else if (clean.includes('escrow') || clean.includes('payment') || clean.includes('money') || clean.includes('एस्क्रो') || clean.includes('भुगतान') || clean.includes('ఎస్క్రో') || clean.includes('డబ్బులు') || clean.includes('చెల్లింపు')) {
      responseText = t('voice.answers.escrow_info');
    }
    // 11. Greeting / Hello / नमस्ते / నమస్కారం
    else if (clean.includes('hello') || clean.includes('hi') || clean.includes('नमस्ते') || clean.includes('నమస్కారం') || clean.includes('హలో')) {
      responseText = t('voice.answers.welcome');
    }
    // 12. Fallback
    else {
      responseText = t('voice.answers.unknown');
    }

    const assistantMsg = {
      id: `a_${Date.now()}`,
      sender: 'assistant',
      text: responseText,
      actionLink: action,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setTranscript('');
    setTypedInput('');

    // Speak aloud in chosen language!
    speakText(responseText, language);
  };

  const handleSendTyped = (e) => {
    e.preventDefault();
    if (typedInput.trim()) {
      handleUserQuery(typedInput);
    }
  };

  const samplePrompts = t('voice.prompts') || [];

  return (
    <>
      {/* 1. FLOATING VOICE ASSISTANT PILL (Always accessible in bottom right) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40 animate-in fade-in zoom-in-75 duration-200">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 hover:from-emerald-800 hover:to-teal-600 text-white px-4 py-3 rounded-full shadow-xl shadow-emerald-900/25 border-2 border-white/60 hover:scale-105 transition-all duration-150"
            title="Open AgriLink Voice Assistant (English, हिंदी, తెలుగు)"
          >
            {/* Pulsing ring indicator */}
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-400 border border-white"></span>
            </span>

            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>

            <div className="text-left hidden sm:block">
              <div className="text-xs font-black tracking-tight leading-tight flex items-center gap-1">
                <span>AI Voice Assistant</span>
                <Sparkles className="w-3 h-3 text-amber-300" />
              </div>
              <div className="text-[10px] text-emerald-100 font-medium">
                {language === 'hi' ? 'हिंदी वॉयस' : language === 'te' ? 'తెలుగు వాయిస్' : 'Indian English'}
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-md bg-white/25 text-[10px] font-black uppercase tracking-wider">
              {language}
            </span>
          </button>
        </div>
      )}

      {/* 2. VOICE ASSISTANT FULL DIALOG DRAWER */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col h-[85vh] sm:h-[650px] overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-emerald-800 to-teal-700 text-white flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                    {t('voice.assistant_title')}
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-400/90 text-amber-950 font-black text-[9px]">
                      3 Languages
                    </span>
                  </h3>
                  <p className="text-[11px] text-emerald-100 leading-tight">
                    {t('voice.assistant_subtitle')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Speaking mute / cancel */}
                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs flex items-center gap-1"
                    title={t('voice.stop_speaking')}
                  >
                    <VolumeX className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Language Selection Tabs & Test Voice */}
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                <Radio className="w-3 h-3 text-emerald-600" />
                <span>{t('voice.switch_language')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="inline-flex rounded-xl bg-slate-200/80 p-0.5 text-xs font-bold shadow-xs">
                  {availableLanguages.map(l => (
                    <button
                      key={l.code}
                      onClick={() => handleLanguageSwitch(l.code)}
                      className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                        language === l.code
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                      title={`Switch to ${l.name} Voice`}
                    >
                      <span>{l.flag}</span>
                      <span>{l.native}</span>
                      {language === l.code && <Volume2 className="w-3 h-3 text-emerald-200 animate-pulse" />}
                    </button>
                  ))}
                </div>

                {/* Instant Play Voice Test Button */}
                <button
                  type="button"
                  onClick={() => {
                    const testPhrases = {
                      hi: 'नमस्ते! मैं एग्रीलिंक वॉयस असिस्टेंट हूँ। आप मुझसे टमाटर या मिर्च का मंडी भाव पूछ सकते हैं।',
                      te: 'నమస్కారం! నేను అగ్రిలింక్ వాయిస్ అసిస్టెంట్. మీరు నన్ను టమోటా లేదా మిర్చి మార్కెట్ ధరలు అడగవచ్చు.',
                      en: 'Hello! I am your AgriLink Voice Assistant. You can ask for live mandi prices or farm verification.'
                    };
                    speakText(testPhrases[language] || testPhrases.en, language);
                  }}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-xl text-[11px] font-bold transition flex items-center gap-1 shadow-xs"
                  title="Test spoken audio in current language"
                >
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Test Voice</span>
                </button>
              </div>
            </div>

            {/* Audio Waveform Visualization Bar */}
            {audioWaves && (
              <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-800 font-semibold animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <div className="flex items-end gap-1 h-4">
                    <span className="w-1 bg-emerald-600 rounded-full animate-pulse h-2"></span>
                    <span className="w-1 bg-emerald-600 rounded-full animate-pulse delay-75 h-4"></span>
                    <span className="w-1 bg-emerald-600 rounded-full animate-pulse delay-150 h-3"></span>
                    <span className="w-1 bg-emerald-600 rounded-full animate-pulse delay-100 h-4"></span>
                    <span className="w-1 bg-emerald-600 rounded-full animate-pulse h-2"></span>
                  </div>
                  <span>{isListening ? t('voice.listening') : t('voice.speaking')}</span>
                </div>

                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="text-[11px] text-rose-600 hover:underline font-bold"
                  >
                    {t('voice.stop_speaking')}
                  </button>
                )}
              </div>
            )}

            {/* Chat Conversation Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-[10px] opacity-75">
                        {msg.sender === 'user' ? (user?.name || 'You') : 'AgriLink AI'}
                      </span>
                      <span className="text-[9px] opacity-60">{msg.timestamp}</span>
                    </div>

                    <p className="font-medium whitespace-pre-wrap">{msg.text}</p>

                    {/* Action link card if any */}
                    {msg.actionLink && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => {
                            if (onNavigate && msg.actionLink.view) {
                              onNavigate(msg.actionLink.view);
                              handleClose();
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg transition text-[11px]"
                        >
                          <span>{msg.actionLink.label}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Replay audio button for assistant responses */}
                    {msg.sender === 'assistant' && (
                      <div className="mt-1.5 flex justify-end">
                        <button
                          onClick={() => speakText(msg.text, language)}
                          className="text-[10px] text-slate-400 hover:text-emerald-700 flex items-center gap-1 font-semibold"
                          title={t('voice.replay')}
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>{t('voice.replay')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Real-time transcript preview while listening */}
              {isListening && transcript && (
                <div className="flex flex-col items-end">
                  <div className="max-w-[85%] p-3 rounded-2xl bg-emerald-100 text-emerald-900 text-xs italic border border-emerald-300 animate-pulse">
                    "{transcript}..."
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick 1-Click Sample Questions in Active Language */}
            <div className="p-2.5 bg-white border-t border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 px-1">
                {t('voice.sample_prompts_title')}
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                {Array.isArray(samplePrompts) && samplePrompts.slice(0, 4).map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleUserQuery(p)}
                    className="flex-shrink-0 px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-900 border border-slate-200 rounded-lg transition font-medium text-left"
                  >
                    💬 {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Control Panel: Big Mic + Text input bar */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
              {/* Main Microphone Action Button */}
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 shadow-md ${
                  isListening
                    ? 'bg-rose-600 hover:bg-rose-700 text-white animate-bounce ring-4 ring-rose-200'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/25'
                }`}
                title={isListening ? t('voice.stop_listening') : t('voice.tap_to_speak')}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5 animate-spin" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>

              {/* Text Input Fallback Bar */}
              <form onSubmit={handleSendTyped} className="flex-1 flex items-center gap-1.5">
                <input
                  type="text"
                  value={typedInput}
                  onChange={(e) => setTypedInput(e.target.value)}
                  placeholder={isListening ? t('voice.listening') : t('voice.type_placeholder')}
                  disabled={isListening}
                  className="flex-1 text-xs px-3 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium disabled:bg-slate-100"
                />
                <button
                  type="submit"
                  disabled={!typedInput.trim() || isListening}
                  className="p-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl disabled:opacity-40 transition flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
