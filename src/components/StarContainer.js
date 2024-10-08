import React, { useEffect } from 'react';
import './StarContainer.css';

const StarContainer = () => {
  useEffect(() => {
    const starContainer = document.getElementById('starContainer');
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    const starCount = 30;
    const minDistance = 100;
    const stars = [];

    function addStars() {
      for (let i = 0; i < starCount; i++) {
        let attempts = 0;
        let x, y;
        do {
          x = Math.random() * containerWidth;
          y = Math.random() * containerHeight;
          attempts++;
          if (attempts > 100) break;
        } while (!checkDistance(x, y));

        if (attempts <= 100) {
          const star = document.createElement('div');
          star.classList.add('star');
          star.style.left = `${x}px`;
          star.style.top = `${y}px`;
          const size = 30 + Math.random() * 20;
          star.style.width = `${size}px`;
          star.style.height = `${size}px`;
          star.style.animationDuration = `${2 + Math.random() * 3}s`;
          starContainer.appendChild(star);
          stars.push({ x, y });
        }
      }
    }

    function checkDistance(x, y) {
      for (let star of stars) {
        const dx = x - star.x;
        const dy = y - star.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minDistance) return false;
      }
      return true;
    }

    window.addEventListener('resize', () => {
      starContainer.innerHTML = '';
      addStars();
    });
    
    addStars();

    return () => window.removeEventListener('resize', () => { starContainer.innerHTML = ''; });
  }, []);

  return <div className="star-container" id="starContainer"></div>;
};

export default StarContainer;
