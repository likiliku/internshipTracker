import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowLeft, Send, Brain, User, Loader2, CheckCircle, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';



export default function MockInterview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<any>(null);
  
  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setInput(prev => {
          // A bit hacky, but overwrite current input with transcript while speaking
          return transcript; 
        });
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      if (synthRef.current) synthRef.current.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const speak = (text: string) => {
    if (isMuted) return;
    if (synthRef.current) {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to find a good English voice
      const voices = synthRef.current.getVoices();
      const preferred = voices.find(v => v.name.includes('Google') || v.name.includes('Samantha') || v.lang === 'en-US');
      if (preferred) utterance.voice = preferred;
      
      utterance.rate = 1.05;
      utterance.pitch = 1;
      synthRef.current.speak(utterance);
    }
  };

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (synthRef.current) synthRef.current.cancel(); // Stop AI talking when user talks
      setInput(''); // Clear input for new speech
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    api.post('/api/ai/mock-interview/start', { application_id: Number(id) })
      .then(res => {
        setMessages([{ role: 'AI', content: res.data.question }]);
        setLoading(false);
        speak(res.data.question);
      })
      .catch(err => {
        alert("Failed to start interview. " + (err.response?.data?.detail || err.message));
        navigate('/student/dashboard');
      });
  }, [id, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const userMsg = input.trim();
    const newMessages = [...messages, { role: 'User', content: userMsg }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/api/ai/mock-interview/reply', {
        application_id: Number(id),
        chat_history: messages,
        latest_answer: userMsg
      });

      if (res.data.type === 'feedback') {
        setFeedback(res.data);
      } else {
        setMessages([...newMessages, { role: 'AI', content: res.data.response }]);
        speak(res.data.response);
      }
    } catch (err: any) {
      alert("Error sending message.");
    } finally {
      setLoading(false);
    }
  };

  if (feedback) {
    return (
      <div style={{maxWidth: '800px', margin: '40px auto', padding: '30px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)'}}>
        <div style={{textAlign: 'center', marginBottom: '30px'}}>
          <CheckCircle size={60} color="#10b981" style={{marginBottom: '15px'}} />
          <h1 style={{fontSize: '2rem', margin: '0 0 10px 0'}}>Interview Complete!</h1>
          <p style={{color: '#6b7280', fontSize: '1.1rem', margin: 0}}>Here is your AI evaluation.</p>
        </div>
        
        <div style={{display: 'flex', justifyContent: 'center', marginBottom: '30px'}}>
          <div style={{
            width: '120px', height: '120px', borderRadius: '50%', 
            background: `conic-gradient(#10b981 ${feedback.score}%, #e5e7eb 0)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative'
          }}>
            <div style={{width: '100px', height: '100px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <span style={{fontSize: '2rem', fontWeight: 'bold', color: '#111827'}}>{feedback.score}</span>
            </div>
          </div>
        </div>

        <div style={{background: '#f9fafb', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #10b981'}}>
          <h3 style={{marginTop: 0, color: '#374151'}}>Feedback</h3>
          <p style={{lineHeight: 1.6, color: '#4b5563', margin: 0, whiteSpace: 'pre-wrap'}}>{feedback.response}</p>
        </div>

        <button onClick={() => navigate('/student/dashboard')} style={{display: 'block', width: '100%', padding: '15px', background: '#3b82f6', color: 'white', borderRadius: '8px', border: 'none', fontSize: '1.1rem', fontWeight: 'bold', marginTop: '30px', cursor: 'pointer'}}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', maxWidth: '900px', margin: '0 auto', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden'}}>
      <div style={{padding: '20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <button onClick={() => navigate('/student/dashboard')} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', padding: '5px'}}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 style={{margin: 0, fontSize: '1.2rem', color: '#0f172a'}}>AI Mock Interview</h2>
            <span style={{fontSize: '0.85rem', color: '#64748b'}}>Practicing for applied role</span>
          </div>
        </div>
        <button 
          onClick={() => {
            setIsMuted(!isMuted);
            if (!isMuted && synthRef.current) synthRef.current.cancel();
          }} 
          style={{background: 'white', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#475569'}}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          {isMuted ? 'Muted' : 'Sound On'}
        </button>
      </div>

      <div style={{flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', background: '#f1f5f9'}}>
        {messages.map((msg, i) => (
          <div key={i} style={{display: 'flex', gap: '15px', alignSelf: msg.role === 'AI' ? 'flex-start' : 'flex-end', maxWidth: '80%'}}>
            {msg.role === 'AI' && (
              <div style={{width: '36px', height: '36px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'white'}}>
                <Brain size={18} />
              </div>
            )}
            <div style={{
              padding: '15px', 
              borderRadius: '12px', 
              background: msg.role === 'AI' ? 'white' : '#3b82f6',
              color: msg.role === 'AI' ? '#334155' : 'white',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              borderBottomLeftRadius: msg.role === 'AI' ? 0 : '12px',
              borderBottomRightRadius: msg.role === 'User' ? 0 : '12px',
              lineHeight: 1.5
            }}>
              {msg.content}
            </div>
            {msg.role === 'User' && (
              <div style={{width: '36px', height: '36px', borderRadius: '50%', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#475569'}}>
                <User size={18} />
              </div>
            )}
          </div>
        ))}
        {loading && messages.length > 0 && (
          <div style={{display: 'flex', gap: '15px', alignSelf: 'flex-start'}}>
             <div style={{width: '36px', height: '36px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'white'}}>
                <Brain size={18} />
              </div>
              <div style={{padding: '15px', borderRadius: '12px', background: 'white', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px'}}>
                <Loader2 size={16} className="animate-spin" /> Thinking...
              </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{padding: '15px 20px', background: 'white', borderTop: '1px solid #e2e8f0'}}>
        {isListening && (
          <div style={{textAlign: 'center', color: '#ef4444', fontSize: '0.85rem', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'}}>
            <span style={{display: 'block', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite'}}></span>
            Listening... Speak now
          </div>
        )}
        <form onSubmit={sendMessage} style={{display: 'flex', gap: '10px'}}>
          <button 
            type="button" 
            onClick={toggleListen}
            disabled={loading}
            style={{
              width: '50px', height: '50px', borderRadius: '25px', 
              background: isListening ? '#ef4444' : '#f1f5f9', 
              color: isListening ? 'white' : '#475569', 
              border: isListening ? 'none' : '1px solid #cbd5e1',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s'
            }}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            placeholder={isListening ? "Listening..." : "Type or speak your answer..."}
            disabled={loading}
            style={{flex: 1, padding: '0 20px', borderRadius: '25px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none', background: isListening ? '#f8fafc' : 'white'}}
          />
          
          <button type="submit" disabled={loading || !input.trim()} style={{padding: '0 25px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '25px', cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer', opacity: (loading || !input.trim()) ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold'}}>
            Send <Send size={18} />
          </button>
        </form>
      </div>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
