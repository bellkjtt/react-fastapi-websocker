// Waveform.js
import React, { useEffect, useRef } from 'react';

const Waveform = ({ analyser, isActive }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const drawWaveform = () => {
      analyser.getByteTimeDomainData(dataArray);
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = 'rgb(0, 123, 255)';

      canvasCtx.beginPath();
      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    };

    let animationId;
    const renderFrame = () => {
      if (isActive) {
        drawWaveform();
      }
      animationId = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyser, isActive]);

  return <canvas ref={canvasRef} width="500" height="100" />;
};

export default Waveform;
