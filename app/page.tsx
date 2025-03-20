"use client";
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export default function Home() {
  const [scriptText, setScriptText] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('speechText', (text) => {
      setScriptText((prevText) => prevText + '\n' + text);
    });

    return () => newSocket.close();
  }, []);

  const startSpeechRecognition = () => {
    if (socket) {
      socket.emit('startSpeech');
    }
  };

  return (
    <div className="container">
      <h1>Script Writing App</h1>
      <button onClick={startSpeechRecognition}>Start Speaking</button>
      <div id="scriptOutput" style={{ whiteSpace: 'pre-wrap', marginTop: '20px' }}>
        {scriptText}
      </div>
    </div>
  );
}
