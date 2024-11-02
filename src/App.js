// App.js
import React, { useState, useEffect } from 'react';
import './styles/App.css';
import Header from './components/Header';
import ChatContainer from './components/ChatContainer';
import Waveform from './components/Waveform';
import useSpeechRecognition from './components/useSpeechRecognition';

function App() {
  const [messages, setMessages] = useState([]);
  const { isListening, interimTranscript, finalTranscript, startListening, stopListening } = useSpeechRecognition();
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [micError, setMicError] = useState(null);

  useEffect(() => {
    if (finalTranscript) {
      addMessage('user', finalTranscript);
    }
  }, [finalTranscript]);

  useEffect(() => {
    if (!audioContext) {
      initializeAudio();
    }
  }, [audioContext]);

  const initializeAudio = async () => {
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const analyserNode = context.createAnalyser();
      
      // Optimize analyser settings
      analyserNode.fftSize = 2048;
      analyserNode.smoothingTimeConstant = 0.8;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone stream active");
      
      // Resume AudioContext if suspended
      if (context.state === 'suspended') {
        await context.resume();
      }
      
      const source = context.createMediaStreamSource(stream);
      source.connect(analyserNode);
      
      setAudioContext(context);
      setAnalyser(analyserNode);
    } catch (error) {
      console.error('Error initializing audio:', error);
      setMicError('마이크에 접근할 수 없습니다. 마이크 권한을 확인하세요.');
    }
  };

  // 마이크 오류 발생 시 안내 메시지 표시
  useEffect(() => {
    if (micError) {
      alert(micError);
    }
  }, [micError]);

  const handleRecord = async () => {
    if (audioContext && audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    if (isListening) {
      console.log("Stopping listening...");
      stopListening();
    } else {
      console.log("Starting listening...");
      startListening();
    }
  };

  const addMessage = (sender, text) => {
    setMessages(prevMessages => [...prevMessages, { sender, text }]);
  };

  const handleSendMessage = (message, image) => {
    addMessage('user', message);
  };

  return (
    <div style={{ 
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding : '10px'
    }}>
      <div id="container">
        <Header onRecord={handleRecord} isRecording={isListening} />
        <ChatContainer 
          messages={messages} 
          onSendMessage={handleSendMessage} 
          currentTranscript={isListening ? interimTranscript : ''} 
        />
        {audioContext && analyser && (
          <Waveform analyser={analyser} isActive={isListening} />
        )}
      </div>
    </div>
  );
}

export default App;