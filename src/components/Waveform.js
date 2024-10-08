import React, { useEffect, useRef } from 'react';
import './Waveform.css';

const Waveform = ({ audioContext, analyser }) => {
  const waveformRef = useRef(null);

  useEffect(() => {
    if (!audioContext || !analyser) return;

    const draw = () => {
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const waveform = waveformRef.current;
      waveform.innerHTML = ''; // 기존 점 삭제

      const dotCount = 31;
      const centerIndex = Math.floor(dotCount / 2);

      for (let i = 0; i < dotCount; i++) {
        const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        const x = (i / (dotCount - 1)) * 100;
        const dataIndex = Math.floor(bufferLength / 2) + (i - centerIndex) * 2;
        const r = (dataArray[dataIndex] / 256) * 4 + 1;

        dot.setAttribute("cx", x);
        dot.setAttribute("cy", 15); // y 좌표 설정
        dot.setAttribute("r", r);
        dot.classList.add("dot");

        waveform.appendChild(dot);
      }

      requestAnimationFrame(draw);
    };

    draw();
  }, [audioContext, analyser]);

  return (
    <svg id="waveform" viewBox="0 0 100 30" ref={waveformRef}>
      {/* 오디오 시각화 점들이 추가될 부분 */}
    </svg>
  );
};

export default Waveform;
