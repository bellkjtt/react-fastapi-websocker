import React from 'react';
import geminiLogo from '../images/liferary_logo.png';

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

export default Header;
