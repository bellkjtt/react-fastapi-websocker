import React, { useState, useEffect } from 'react';
import './styles/App.css';
import StarContainer from './components/StarContainer';
import Header from './components/Header';
import ChatContainer from './components/ChatContainer';
import Waveform from './components/Waveform';
import useSpeechRecognition from './components/useSpeechRecognition';

function App() {
  const [messages, setMessages] = useState([]);
  const { isListening, transcript, interimTranscript, startListening, stopListening } = useSpeechRecognition();
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);

  useEffect(() => {
    if (transcript) {
      addMessage('user', transcript);
    }
  }, [transcript]);

  useEffect(() => {
    // Create AudioContext and AnalyserNode when the component mounts
    if (!audioContext) {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const analyserNode = context.createAnalyser();
      analyserNode.fftSize = 256; // 설정할 fftSize 값, 이 값은 필요에 따라 변경
      setAudioContext(context);
      setAnalyser(analyserNode);
    }
  }, []);

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
          <Waveform audioContext={audioContext} analyser={analyser} isActive={isListening} />
        )}
      </div>
    </div>
  );
}

export default App;