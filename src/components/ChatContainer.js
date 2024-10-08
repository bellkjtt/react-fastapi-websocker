// ChatContainer.js
import React, { useState, useRef, useEffect } from 'react';
import './ChatContainer.css';
import cameraIcon from '../images/camera_icon.png';

const ChatContainer = ({ messages, onSendMessage, currentTranscript }) => {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, currentTranscript]);

  const handleSend = () => {
    if (inputText.trim() || selectedImage) {
      onSendMessage(inputText, selectedImage);
      setInputText('');
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
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
        <div className="chatMessage userMessage interim">{currentTranscript}</div>
      )}
      </div>
      <div id="inputContainer">
        <input
          type="text"
          id="textInput"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="메시지를 입력하세요..."
        />
        <label htmlFor="imageInput" id="imageLabel">
          <img src={cameraIcon} alt="카메라 아이콘" className="camera-icon" />
          이미지 선택
        </label>
        <input
          type="file"
          id="imageInput"
          accept="image/*"
          onChange={handleImageChange}
          ref={fileInputRef}
        />
        <button id="sendButton" onClick={handleSend}>전송</button>
      </div>
    </div>
  );
};

export default ChatContainer;