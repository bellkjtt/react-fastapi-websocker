// App.js
import React, { useState, useEffect } from 'react';
import './styles/App.css';
import StarContainer from './components/StarContainer';
import Header from './components/Header';
import ChatContainer from './components/ChatContainer';
import Waveform from './components/Waveform';
import useSpeechRecognition from './components/useSpeechRecognition';

function App() {
  const [messages, setMessages] = useState([]);
  const { isListening, interimTranscript, finalTranscript, startListening, stopListening } = useSpeechRecognition();
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [micError, setMicError] = useState(null); // 마이크 오류 상태

  useEffect(() => {
    if (finalTranscript) {
      addMessage('user', finalTranscript);
    }
  }, [finalTranscript]);

  useEffect(() => {
    if (!audioContext) {
      try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const analyserNode = context.createAnalyser();
        analyserNode.fftSize = 512; // FFT 사이즈를 설정하여 주파수 해상도 변경

        navigator.mediaDevices.getUserMedia({ audio: true })
          .then((stream) => {
            console.log("Microphone stream active");
            const source = context.createMediaStreamSource(stream);
            source.connect(analyserNode);
            setAudioContext(context);
            setAnalyser(analyserNode);
          })
          .catch((error) => {
            console.error('Error accessing microphone:', error);
            setMicError('마이크에 접근할 수 없습니다. 마이크 권한을 확인하세요.');
          });
      } catch (error) {
        console.error("Error initializing AudioContext:", error);
        setMicError('AudioContext를 초기화하는 동안 오류가 발생했습니다.');
      }
    }
  }, [audioContext]);

  // 마이크 오류 발생 시 안내 메시지 표시
  useEffect(() => {
    if (micError) {
      alert(micError);
    }
  }, [micError]);

  const handleRecord = () => {
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
    <div>
      <StarContainer />
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
