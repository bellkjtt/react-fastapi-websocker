// pages/HomePage.js
import React from 'react';
import Header from '../components/common/Header';

const HomePage = () => {
  return (
    <div className="main-container">
      <Header />
      <main className="main-content">
        <h1>환영합니다!</h1>
        <p>채팅 페이지로 이동하려면 상단 메뉴를 사용하세요.</p>
      </main>
    </div>
  );
};

export default HomePage;
