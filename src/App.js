// App.js
import { useState, useEffect, useCallback, useRef } from 'react';
import './styles/App.css';
import geminiLogo from './images/liferary_logo.png';

function Header({ onRecord, isRecording }) {
  return (
    <div id="header">
      <img src={geminiLogo} alt="Gemini Logo" className="logo" />
      <button id="recordButton" onClick={onRecord}>
        {isRecording ? "말하기 중지" : "말하기 시작"}
      </button>
    </div>
  );
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

// ChatContainer 컴포넌트
const ChatContainer = ({ messages, onSendMessage, currentTranscript }) => {
  const [inputText, setInputText] = useState('');
  const chatContainerRef = useRef(null);

  // 새 메시지가 추가될 때마다 스크롤을 맨 아래로
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, currentTranscript]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <div id="container">
      <div id="chatContainer" ref={chatContainerRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`chatMessage ${msg.sender}Message`}>
            {msg.text}
          </div>
        ))}
        {currentTranscript && (
          <div className="chatMessage userMessage interim">
            {currentTranscript}
          </div>
        )}
      </div>
      <div id="inputContainer">
        <input
          type="text"
          id="textInput"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSend();
            }
          }}
          placeholder="메시지를 입력하세요..."
        />
        <button id="sendButton" onClick={handleSend}>전송</button>
      </div>
    </div>
  );
};

const useSpeechRecognition = (addMessage) => {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [middleTranscript, setMiddleTranscript] = useState(''); // 이름 통일
  const [recognition, setRecognition] = useState(null);
  const [silenceTimer, setSilenceTimer] = useState(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognitionInstance = new window.webkitSpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'ko-KR';

      recognitionInstance.onresult = (event) => {
        let currentInterimTranscript = '';
        let currentFinalTranscript = '';

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

          // 이전 타이머 초기화
          if (silenceTimer) {
            clearTimeout(silenceTimer);
          }

          // 새로운 타이머 설정
          const newTimer = setTimeout(() => {
            const fullTranscript = currentFinalTranscript; // 현재까지 누적된 전체 텍스트
            if (fullTranscript.trim()) {
              // addMessage('user', fullTranscript); // 사용자 메시지 추가
              sendToBackend(fullTranscript); // 백엔드로 전송
            }
            setMiddleTranscript(''); // 전송 후 초기화
          }, 750); // 1.5초로 조정

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
  }, []); // addMessage를 의존성 배열에 추가

  const sendToBackend = async (transcript) => {
    try {
      console.time("tts2");
      const response = await fetch('http://127.0.0.1:8000/process_speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken')
        },
        credentials: 'include',
        body: JSON.stringify({ text: transcript }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      console.log('Response from backend:', data);

      // 응답을 채팅창에 추가
      // if (data.response) {
      addMessage('bot', data.response);
      // }
      console.timeEnd("tts2");
    } catch (error) {
      console.error('Error sending transcript to backend:', error);
      addMessage('bot', '죄송합니다. 오류가 발생했습니다.');
    }
  };

  const startListening = useCallback(() => {
    if (recognition) {
      recognition.start();
      setIsListening(true);
      setInterimTranscript('');
      setFinalTranscript('');
      setMiddleTranscript(''); // 시작할 때 초기화 추가
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }
      // 마지막으로 누적된 텍스트가 있다면 전송
      const finalText = middleTranscript.trim();
      if (finalText) {
        addMessage('user', finalText);
        sendToBackend(finalText);
      }
    }
  }, [recognition, silenceTimer, middleTranscript, addMessage]);

  return { 
    isListening, 
    interimTranscript, 
    finalTranscript, 
    startListening, 
    stopListening 
  };
};

function App() {
  const [messages, setMessages] = useState([]);
  const { isListening, interimTranscript, finalTranscript, startListening, stopListening } = useSpeechRecognition(
    (sender, text) => addMessage(sender, text)
  );
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [micError, setMicError] = useState(null);

  useEffect(() => {
    const resetCount = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8000/reset_count', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ session_id: 'default_session' }) // 세션 ID 전달
            });
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to reset count:', error);
        }
    };

    resetCount();  // 페이지 로드 시 카운트 초기화
}, []); // 빈 배열을 사용하여 페이지 로드 시에만 호출


  const addMessage = useCallback((sender, text) => {
    setMessages(prevMessages => [...prevMessages, { sender, text }]);
  }, []);

  const sendToBackend = async (transcript) => {
    try {
      console.time("tts");
      const response = await fetch('http://127.0.0.1:8000/process_speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken')
        },
        credentials: 'include',
        body: JSON.stringify({ text: transcript }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log('Response from backend:', data);

      addMessage('bot', data.response);
      console.timeEnd("tts");
    } catch (error) {
      console.error('Error:', error);
      addMessage('bot', '죄송합니다. 오류가 발생했습니다.');
    }
  };

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
    <div style={{
      width: '95%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '95%',
      flexDirection: 'column'
    }}>
      <Header onRecord={handleRecord} isRecording={isListening} />
      <ChatContainer messages={messages} onSendMessage={handleSendMessage} currentTranscript={interimTranscript} />
    </div>
  );
}

export default App;
