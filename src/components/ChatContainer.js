import { useState, useEffect } from 'react';
import useSpeechRecognition from './useSpeechRecognition';
import ChatContainer from './ChatContainer';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const { 
    isListening, 
    interimTranscript, 
    finalTranscript, 
    startListening, 
    stopListening 
  } = useSpeechRecognition({
    onMessageReceived: (response) => {
      // 봇 메시지 추가
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: response.message // 백엔드 응답 형식에 맞게 조정
      }]);
    }
  });

  // 음성 인식 텍스트가 finalTranscript로 변경될 때 유저 메시지 추가
  useEffect(() => {
    if (finalTranscript) {
      setMessages(prev => [...prev, {
        sender: 'user',
        text: finalTranscript
      }]);
    }
  }, [finalTranscript]);

  const handleSendMessage = (text, image) => {
    // 텍스트 입력 처리
    if (text) {
      setMessages(prev => [...prev, {
        sender: 'user',
        text: text
      }]);
      
      // 백엔드로 전송
      fetch('http://127.0.0.1:8000/process_speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })
      .then(response => response.json())
      .then(data => {
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: data.message // 백엔드 응답 형식에 맞게 조정
        }]);
      })
      .catch(error => console.error('Error:', error));
    }
  };

  return (
    <div>
      <ChatContainer
        messages={messages}
        onSendMessage={handleSendMessage}
        currentTranscript={interimTranscript}
      />
      <button onClick={isListening ? stopListening : startListening}>
        {isListening ? '음성 인식 중지' : '음성 인식 시작'}
      </button>
    </div>
  );
};

export default Chat;