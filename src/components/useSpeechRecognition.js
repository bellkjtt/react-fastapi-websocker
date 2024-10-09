import { useState, useEffect, useCallback } from 'react';

const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [middleTranscript, setmiddleTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [silenceTimer, setSilenceTimer] = useState(null); // 침묵 타이머 추가

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
          setmiddleTranscript((prev) => prev + currentFinalTranscript);
          setInterimTranscript(''); // Reset interim when final is available

          // 침묵 타이머 리셋
          if (silenceTimer) {
            clearTimeout(silenceTimer);
          }
          setSilenceTimer(
            setTimeout(() => {
              // 침묵이 3초 지속되면 middleTranscript를 백엔드로 전송
              sendToBackend(middleTranscript);
            }, 3000)
          );
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);

        // 'no-speech'와 'aborted' 에러는 무시하고 상태를 유지
        if (event.error === 'no-speech' || event.error === 'aborted') {
          console.log(`Speech recognition error ignored: ${event.error}`);
          return; // 이 에러는 무시하고 계속 진행
        }

        // 다른 에러인 경우에만 listening 중지
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        if (isListening) {
          recognitionInstance.start();
        }
      };

      setRecognition(recognitionInstance);
    } else {
      console.error('Speech recognition not supported');
    }
  }, [isListening, silenceTimer]); // silenceTimer 추가


  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Your device does not support speech recognition.");
    }
  }, []);
  

  useEffect(() => {
    console.log(middleTranscript);
  }, [middleTranscript]);

  const sendToBackend = async (transcript) => {
    try {
      const response = await fetch('YOUR_BACKEND_API_URL', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      console.log('Response from backend:', data);

      // middleTranscript 초기화
      setmiddleTranscript(''); // 백엔드로 전송 후 초기화

      // 데이터 전송 후 다시 음성 인식 활성화
      if (recognition && !isListening) {
        recognition.start();
        setIsListening(true);
      }
    } catch (error) {
      console.error('Error sending transcript to backend:', error);
    }
  };

  const startListening = useCallback(() => {
    if (recognition) {
      recognition.start();
      setIsListening(true);
      setInterimTranscript('');
      setFinalTranscript('');
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
      if (silenceTimer) {
        clearTimeout(silenceTimer); // 컴포넌트 종료 시 타이머 클리어
      }
    }
  }, [recognition, silenceTimer]);

  return { isListening, interimTranscript, finalTranscript, startListening, stopListening };
};

export default useSpeechRecognition;
