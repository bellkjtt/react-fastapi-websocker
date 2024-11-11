// App.js
import { useState, useEffect, useCallback, useRef } from 'react';
import './styles/App.css';
import biglifelogo from './images/life2.png';
import smalllifelogo from './images/liferary_logo.png';
import StepTracker from './components/StepTracker';

function Header() {
  return (
    <header className="header">
      <img src={biglifelogo}
        alt="Gemini Logo"
        className="header-logo"
      />
    </header>
  )
}

// getCookie 함수 추가
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

function ChatContainer({ messages, onSendMessage, currentTranscript, onRecord, isRecording }) {
  const [inputText, setInputText] = useState("")
  const chatContainerRef = useRef(null)

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages, currentTranscript])

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText)
      setInputText("")
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <img
          img src={smalllifelogo}
          alt="Liferary Logo2"
          className="chat-header-logo"
        />
        <button id="recordButton" onClick={onRecord} className="chat-button">
          {isRecording ? "말하기 중지" : "말하기 시작"}
        </button>
      </div>
      <div className="chat-messages" ref={chatContainerRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.sender === "user" ? "user-message" : "bot-message"}`}>
            {msg.text}
          </div>
        ))}
        {currentTranscript && <div className="chat-message user-message">{currentTranscript}</div>}
      </div>
      <div className="input-container">
        <input
          id="textInput"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSend()
            }
          }}
          placeholder="메시지를 입력하세요..."
          className="input-field"
        />
        <button id="sendButton" onClick={handleSend} className="send-button">
          전송
        </button>
      </div>
    </div>
  )
}

// Header, getCookie, ChatContainer 컴포넌트는 그대로 유지...

const useSpeechRecognition = (addMessage) => {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [middleTranscript, setMiddleTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [silenceTimer, setSilenceTimer] = useState(null);
  const currentAudioRef = useRef(null);

  // 오디오 중지 함수
  const stopCurrentAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      if (currentAudioRef.current.src) {
        URL.revokeObjectURL(currentAudioRef.current.src);
      }
      currentAudioRef.current = null;
    }
  }, []);

  // TTS 함수
  const speakResponse = useCallback(async (text) => {
    try {
      stopCurrentAudio(); // 기존 오디오 중지

      const response = await fetch('http://127.0.0.1:3389/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: text }),
      });

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      currentAudioRef.current = audio;

      audio.play();
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };
    } catch (error) {
      console.error('TTS Error:', error);
      currentAudioRef.current = null;
    }
  }, [stopCurrentAudio]);

  // 백엔드 통신 함수
  const sendToBackend = useCallback(async (transcript) => {
    stopCurrentAudio();
    try {
      console.time("tts2");
      const response = await fetch('http://127.0.0.1:8000/process_speech/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ text: transcript }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log('Response from backend:', data);

      if (data.response) {
        await speakResponse(data.response);
        addMessage('bot', data.response);
      }
      console.timeEnd("tts2");
    } catch (error) {
      console.error('Error sending transcript to backend:', error);
      addMessage('bot', '죄송합니다. 오류가 발생했습니다.');
    }
  }, [speakResponse, addMessage]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognitionInstance = new window.webkitSpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'ko-KR';

      recognitionInstance.onstart = () => {
        console.log('Speech recognition started');
        stopCurrentAudio();
      };

      recognitionInstance.onresult = (event) => {
        let currentInterimTranscript = '';
        let currentFinalTranscript = '';

        if (event.results.length > 0) {
          stopCurrentAudio();
        }

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            currentFinalTranscript += event.results[i][0].transcript + ' ';
          } else {
            currentInterimTranscript += event.results[i][0].transcript;
          }
        }

        setInterimTranscript(currentInterimTranscript);

        if (currentFinalTranscript) {
          setFinalTranscript(currentFinalTranscript);
          setMiddleTranscript(prev => prev + currentFinalTranscript);

          if (silenceTimer) {
            clearTimeout(silenceTimer);
          }

          const newTimer = setTimeout(() => {
            if (currentFinalTranscript.trim()) {
              sendToBackend(currentFinalTranscript);
            }
            setMiddleTranscript('');
          }, 750);

          setSilenceTimer(newTimer);
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech' || event.error === 'aborted') {
          console.log(`Speech recognition error ignored: ${event.error}`);
          return;
        }
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        if (isListening) {
          recognitionInstance.start();
        }
      };

      setRecognition(recognitionInstance);
    }
  }, [isListening, sendToBackend]);

  const startListening = useCallback(() => {
    if (recognition) {
      stopCurrentAudio(); // recognition 시작 전 현재 재생 중인 오디오 중지
      recognition.start();
      setIsListening(true);
      setInterimTranscript('');
      setFinalTranscript('');
      setMiddleTranscript('');
    }
  }, [recognition, stopCurrentAudio]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }
      const finalText = middleTranscript.trim();
      if (finalText) {
        addMessage('user', finalText);
        sendToBackend(finalText);
      }
    }
  }, [recognition, silenceTimer, middleTranscript, addMessage, sendToBackend]);

  return {
    isListening,
    interimTranscript,
    finalTranscript,
    startListening,
    stopListening,
    sendToBackend,  // 외부에서 사용할 수 있도록 export
    stopCurrentAudio // 외부에서 사용할 수 있도록 export
  };
};

function App() {
  const [messages, setMessages] = useState([]);
  const [audioContext, setAudioContext] = useState(null);
  // const videoRef = useCameraStream(); // 카메라 스트림 참조
  const [cameraError, setCameraError] = useState(null)
  const videoRef = useRef(null)

  const addMessage = useCallback((sender, text) => {
    setMessages(prevMessages => [...prevMessages, { sender, text }]);
  }, []);


  const {
    isListening,
    interimTranscript,
    finalTranscript,
    startListening,
    stopListening,
    sendToBackend
  } = useSpeechRecognition(addMessage);

  useEffect(() => {
    const initializeCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter(device => device.kind === 'videoinput')
        const obsCamera = videoDevices.find(device => device.label.includes('OBS Virtual Camera'))

        if (obsCamera) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: obsCamera.deviceId }
          })
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        } else {
          console.error("OBS 가상 카메라가 감지되지 않았습니다.")
        }
      } catch (err) {
        console.error("카메라 초기화 중 오류 발생:", err)
      }
    }

    initializeCamera()
  }, [])

  useEffect(() => {
    const resetCount = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/reset_count', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ session_id: 'default_session' })
        });
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
      } catch (error) {
        console.error('Failed to reset count:', error);
      }
    };

    resetCount();
  }, []);

  const handleRecord = async () => {
    if (audioContext && audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    if (isListening) {
      console.log("Stopping listening at:", new Date().toLocaleString());
      stopListening();
    } else {
      console.log("Starting listening at:", new Date().toLocaleString());
      startListening();
    }
  };

  const handleSendMessage = async (message) => {
    if (message.trim()) {
      addMessage('user', message);
      await sendToBackend(message);
    }
  };

  useEffect(() => {
    if (finalTranscript) {
      addMessage('user', finalTranscript);
    }
  }, [finalTranscript, addMessage]);

  return (
    <div className="main-container">
      <Header />
      
      <main className="main-content">
      <StepTracker />
        <div className="chat-wrapper">
          <div className="camera-section">
            {cameraError ? (
              <div className="camera-error">{cameraError}</div>
            ) : (
              <video ref={videoRef} autoPlay playsInline className="camera-video" />
            )}
          </div>
          <div className="chat-section">
            <ChatContainer
              messages={messages}
              onSendMessage={handleSendMessage}
              currentTranscript={interimTranscript}
              onRecord={handleRecord}
              isRecording={isListening}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;