// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ChatPage from './pages/ChatPage';
import HomePage from './pages/HomePage';

function AnimatedRoutes() {
  const location = useLocation();

  // 페이지 전환 변형 효과 정의
  const pageVariants = {
    initial: {
      opacity: 0,
      scale: 0.8,
      x: '100%',
      y: '100%',
      rotate: 15, // 약간의 회전 효과 추가
    },
    animate: {
      opacity: 1,
      scale: 1,
      x: '0%',
      y: '0%',
      rotate: 0,
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      x: '-100%',
      y: '-100%',
      rotate: -15,
    },
  };

  // 전환 효과의 타이밍과 이징 정의
  const pageTransition = {
    type: "tween", // 선형 애니메이션 사용
    duration: 0.5,
    ease: [0.43, 0.13, 0.23, 0.96], // 커스텀 이징 곡선
  };

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                background: "white", // 페이지 배경색 설정
                transformOrigin: "bottom right", // 변형 원점을 오른쪽 아래로 설정
              }}
            >
              <HomePage />
            </motion.div>
          }
        />
        <Route
          path="/chat"
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                background: "white",
                transformOrigin: "bottom right",
              }}
            >
              <ChatPage />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <div style={{ 
        position: "relative", 
        overflow: "hidden", 
        width: "100%", 
        height: "100vh",
        perspective: "1200px", // 3D 효과를 위한 perspective 추가
      }}>
        <AnimatedRoutes />
      </div>
    </Router>
  );
}

export default App;