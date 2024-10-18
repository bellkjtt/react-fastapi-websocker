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
  const BASE_CIRCLE_SIZE = 60; // 기본 원 크기
  const MAX_CIRCLE_GROWTH = 120; // 최대 크기 증가량

  useEffect(() => {
    if (transcript) {
      addMessage('user', transcript);
    }
  }, [transcript]);

  useEffect(() => {
    let audioContext, analyser, microphone, javascriptNode;

    if (isListening) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      setAudioContext(audioContext);
      analyser = audioContext.createAnalyser();
      setAnalyser(analyser);

      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        microphone = audioContext.createMediaStreamSource(stream);
        javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

        analyser.fftSize = 256;
        microphone.connect(analyser);
        analyser.connect(javascriptNode);
        javascriptNode.connect(audioContext.destination);

        javascriptNode.onaudioprocess = () => {
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(dataArray);

          const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setVolume(volume);
          
          // 볼륨에 따른 크기 변화를 제한
          const normalizedVolume = Math.min(volume, 100); // 볼륨 최대치를 100으로 제한
          const growthFactor = (normalizedVolume / 100) * MAX_CIRCLE_GROWTH; // 크기 증가량을 계산
          const newSize = BASE_CIRCLE_SIZE + growthFactor; // 새로운 크기 계산
          
          setCircleSize(newSize);
        };
      });
    }

    return () => {
      if (audioContext) {
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