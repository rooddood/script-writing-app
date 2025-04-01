const socket = io();

document.getElementById('startButton').addEventListener('click', () => {
  socket.emit('startSpeech');
});

socket.on('speechText', (text) => {
  const scriptOutput = document.getElementById('scriptOutput');
  scriptOutput.innerHTML += `<p>${text}</p>`;
});
