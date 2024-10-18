import { useState, useEffect, useCallback, useRef } from 'react';

const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef(null);
  const restartTimeoutRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognitionInstance = new window.webkitSpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'ko-KR';

      recognitionInstance.onresult = (event) => {
        let currentInterimTranscript = '';
        let finalTranscript = '';
      
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          } else {
            currentInterimTranscript += event.results[i][0].transcript;
          }
        }
      
        setTranscript(finalTranscript);
        setInterimTranscript(currentInterimTranscript);
      };

      recognitionInstance.onerror = (event) => {
        // console.error('Speech recognition error', event.error);
        
        if (event.error === 'no-speech') {
          // no-speech 에러 발생 시 재시작
          restartRecognition();
        }
      };

      recognitionInstance.onend = () => {
        // 아직 listening 상태라면 자동으로 재시작
        if (isListening) {
          restartRecognition();
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognitionInstance;
    } else {
      console.error('Speech recognition not supported');
    }

    // cleanup
    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  const restartRecognition = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }

      // 약간의 지연 후 재시작
      restartTimeoutRef.current = setTimeout(() => {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error('Error restarting recognition:', e);
          setIsListening(false);
        }
      }, 200);
    }
  }, [isListening]);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setTranscript('');
        setInterimTranscript('');


        
      } catch (e) {
        console.error('Error starting recognition:', e);
        setIsListening(false);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
        setInterimTranscript('');
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
  }, []);

  return { isListening, transcript, interimTranscript, startListening, stopListening };
};

export default useSpeechRecognition;