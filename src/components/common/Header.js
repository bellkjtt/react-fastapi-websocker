// components/common/Header.js
import React from 'react';
import biglifelogo from '../../images/life2.png';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <img src={biglifelogo} alt="Gemini Logo" className="header-logo" />
    </header>
  );
}

export default Header;
