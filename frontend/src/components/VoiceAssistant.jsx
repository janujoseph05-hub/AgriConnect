import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/useAuth'
import { processVoiceQuery } from '../services/voiceAssistantService'
import './VoiceAssistant.css'

export default function VoiceAssistant() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [lang, setLang] = useState('en') // 'en' | 'ta'
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [assistantReply, setAssistantReply] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [textInput, setTextInput] = useState('')

  const recognitionRef = useRef(null)
  const [isSupported, setIsSupported] = useState(true)

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setIsSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event) => {
      const current = event.resultIndex
      const resultText = event.results[current][0].transcript
      setTranscript(resultText)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
  }, [])

  // Update recognition language when lang state changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang === 'ta' ? 'ta-IN' : 'en-US'
    }
  }, [lang])

  // Process completed speech transcript
  useEffect(() => {
    if (!isListening && transcript && transcript.trim()) {
      handleQuerySubmit(transcript)
    }
  }, [isListening])

  const toggleListening = () => {
    if (!isSupported || !recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setTranscript('')
      try {
        recognitionRef.current.start()
      } catch {
        setIsListening(false)
      }
    }
  }

  const speakText = (textToSpeak) => {
    if (!window.speechSynthesis || !textToSpeak) return

    window.speechSynthesis.cancel() // Stop any previous speech
    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-US'
    utterance.rate = 0.95
    window.speechSynthesis.speak(utterance)
  }

  const handleQuerySubmit = async (queryText) => {
    if (!queryText || !queryText.trim()) return

    setIsProcessing(true)
    setTranscript(queryText)
    const reply = await processVoiceQuery(queryText, lang, user)
    setAssistantReply(reply)
    setIsProcessing(false)

    // Speak reply
    speakText(reply)
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (textInput.trim()) {
      handleQuerySubmit(textInput.trim())
      setTextInput('')
    }
  }

  const sampleQueriesEn = [
    'What should I grow?',
    'Show available tomatoes.',
    'What is my delivery status?',
    'How do I list my produce?',
  ]

  const sampleQueriesTa = [
    'நான் எந்த பயிரை பயிரிடலாம்?',
    'தக்காளி கிடைக்கிறதா?',
    'என் டெலிவரி நிலை என்ன?',
    'எப்படி என் விளைபொருளை பதிவு செய்வது?',
  ]

  return (
    <>
      {/* Floating Circular Mic Trigger Button */}
      {!isOpen && (
        <button
          className="voice-floating-trigger"
          onClick={() => setIsOpen(true)}
          title="Ask AgriConnect Voice Assistant"
          aria-label="Ask AgriConnect"
        >
          <div className="mic-circle-icon">🎙️</div>
          <span className="trigger-label">Ask AgriConnect</span>
        </button>
      )}

      {/* Floating Panel / Modal */}
      {isOpen && (
        <div className="voice-modal-overlay" onClick={() => setIsOpen(false)}>
          <div
            className="voice-assistant-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="voice-header">
              <div className="voice-title-group">
                <span>🎙️</span>
                <div>
                  <h3>AgriConnect Assistant</h3>
                  <span className="voice-sub">Agricultural Intelligence</span>
                </div>
              </div>

              <div className="voice-header-actions">
                {/* Language Switcher [ English | தமிழ் ] */}
                <div className="lang-selector">
                  <button
                    type="button"
                    className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                    onClick={() => setLang('en')}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    className={`lang-btn ${lang === 'ta' ? 'active' : ''}`}
                    onClick={() => setLang('ta')}
                  >
                    தமிழ்
                  </button>
                </div>

                <button
                  type="button"
                  className="btn-close-voice"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close panel"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Chat Content Body */}
            <div className="voice-body">
              {!isSupported && (
                <div className="unsupported-notice">
                  ⚠️ Voice input is not supported in this browser. You can type your question instead.
                </div>
              )}

              {/* Listening Indicator */}
              {isSupported && (
                <div className="listening-container">
                  <button
                    type="button"
                    className={`pulse-mic-btn ${isListening ? 'is-listening' : ''}`}
                    onClick={toggleListening}
                  >
                    🎙️
                  </button>
                  <span className="listening-text">
                    {isListening
                      ? lang === 'ta'
                        ? 'கேட்கிறது... பேசுங்கள்...'
                        : 'Listening... Speak now...'
                      : lang === 'ta'
                      ? 'மைக் பட்டனை அழுத்தவும்'
                      : 'Tap mic to speak'}
                  </span>
                </div>
              )}

              {/* Speech Transcript */}
              {transcript && (
                <div className="chat-bubble user-speech">
                  🗣️ "{transcript}"
                </div>
              )}

              {/* Processing Loader */}
              {isProcessing && (
                <div className="chat-bubble assistant-reply" style={{ color: '#64748b' }}>
                  ⏳ {lang === 'ta' ? 'பதிலைப் பெறுகிறது...' : 'Processing question...'}
                </div>
              )}

              {/* Assistant Response */}
              {assistantReply && !isProcessing && (
                <div className="chat-bubble assistant-reply">
                  🌾 {assistantReply}
                  <div className="speech-controls">
                    <button
                      type="button"
                      className="btn-read-aloud"
                      onClick={() => speakText(assistantReply)}
                    >
                      🔊 {lang === 'ta' ? 'மீண்டும் கேட்க' : 'Read Aloud'}
                    </button>
                  </div>
                </div>
              )}

              {/* Sample Queries */}
              {!transcript && !assistantReply && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
                    {lang === 'ta' ? 'மாதிரி கேள்விகள்:' : 'Try asking:'}
                  </div>
                  <div className="sample-queries">
                    {(lang === 'ta' ? sampleQueriesTa : sampleQueriesEn).map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="sample-pill"
                        onClick={() => handleQuerySubmit(q)}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input Fallback Footer */}
            <form className="voice-footer" onSubmit={handleManualSubmit}>
              <input
                type="text"
                className="voice-input-box"
                placeholder={lang === 'ta' ? 'கேள்வி கேட்கவும்...' : 'Ask AgriConnect...'}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
              {isSupported && (
                <button
                  type="button"
                  className={`btn-mic-toggle ${isListening ? 'active' : ''}`}
                  onClick={toggleListening}
                  title="Toggle Microphone"
                >
                  🎙️
                </button>
              )}
              <button type="submit" className="btn-send">
                {lang === 'ta' ? 'அனுப்பு' : 'Ask'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
