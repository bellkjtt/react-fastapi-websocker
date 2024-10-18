import React, { useState, useEffect, useRef } from 'react';
import './styles/App.css';
import Header from './components/Header';
import ChatContainer from './components/ChatContainer';
import Waveform from './components/Waveform';
import useSpeechRecognition from './components/useSpeechRecognition';
import backgroundImage from './images/Background.png';

function App() {
  const [messages, setMessages] = useState([]);
  const [showSpeakingUI, setShowSpeakingUI] = useState(false);
  const { isListening, transcript, interimTranscript, startListening, stopListening } = useSpeechRecognition();
  const [circleSize, setCircleSize] = useState(75); // 기본 크기를 200px로 증가
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [volume, setVolume] = useState(0);

  const audioRef = useRef(null);
  const VOLUME_THRESHOLD = 25;
  const BASE_CIRCLE_SIZE = 80; // 기본 원 크기
  const MAX_CIRCLE_GROWTH = 120; // 최대 크기 증가량

  useEffect(() => {
    if (transcript) {
      addMessage('user', transcript);
    }
  }, [transcript]);

  useEffect(() => {
    let audioContextInstance, analyserInstance, microphone, javascriptNode;
  
    const setupAudioContext = () => {
      if (!audioContextInstance || audioContext.state === 'closed') {
        audioContextInstance = new (window.AudioContext || window.webkitAudioContext)();
        setAudioContext(audioContextInstance);
        analyserInstance = audioContextInstance.createAnalyser();
        setAnalyser(analyserInstance);
  
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
          microphone = audioContextInstance.createMediaStreamSource(stream);
          javascriptNode = audioContextInstance.createScriptProcessor(2048, 1, 1);
  
          analyserInstance.fftSize = 256;
          microphone.connect(analyserInstance);
          analyserInstance.connect(javascriptNode);
          javascriptNode.connect(audioContextInstance.destination);
  
          javascriptNode.onaudioprocess = () => {
            const dataArray = new Uint8Array(analyserInstance.frequencyBinCount);
            analyserInstance.getByteFrequencyData(dataArray);
  
            const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setVolume(volume);
  
            const normalizedVolume = Math.min(volume, 100);
            const growthFactor = (normalizedVolume / 100) * MAX_CIRCLE_GROWTH;
            const newSize = BASE_CIRCLE_SIZE + growthFactor;
  
            setCircleSize(newSize);
          };
        });
      }
    };
  
    if (isListening) {
      setupAudioContext();
    }
  
    return () => {
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [isListening]);
  
  

  const handleRecord = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
      
    }
    setShowSpeakingUI(true);
  };

  const handleCloseSpeakingUI = () => {
    setShowSpeakingUI(false);
    stopListening();
  };

  const addMessage = (sender, text) => {
    setMessages(prevMessages => [...prevMessages, { sender, text }]);
  };

  const handleSendMessage = (message) => {
    addMessage('user', message);
  };

  return (
    <div>
      {!showSpeakingUI ? (
        <div id="container">
          <Header onRecord={handleRecord} isRecording={isListening} />
          <ChatContainer
            messages={messages}
            onSendMessage={handleSendMessage}
            currentTranscript={isListening ? interimTranscript : ''}
          />
        </div>
      ) : (
        <div
          style={{
            position: 'fixed',
            top: '10vh',
            left: '25%',
            width: '50%',
            height: '80vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div 
            className="speaking-ui"
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              borderRadius: '10px',
            }}
          >
            <div 
              style={{
                position: 'absolute',
                top: '35%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: `${circleSize}px`,
                  height: `${circleSize}px`,
                  borderRadius: '50%',
                  backgroundColor: 'black',
                  transition: volume > VOLUME_THRESHOLD ? 'none' : 'all 0.1s ease-in-out',
                }}
              />
            </div>
            
            <button
              onClick={handleCloseSpeakingUI}
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '10px 20px',
                borderRadius: '5px',
                border: 'none',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;