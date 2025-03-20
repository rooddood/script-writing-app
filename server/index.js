const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const next = require('next');
const speechToText = require('./speechToText');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const server = express();
const httpServer = http.createServer(server);
const io = socketIo(httpServer);

app.prepare().then(() => {
  server.use(express.static('public'));

  server.get('*', (req, res) => {
    return handle(req, res);
  });

  io.on('connection', (socket) => {
    console.log('New client connected');
    
    socket.on('startSpeech', () => {
      speechToText.start((text) => {
        socket.emit('speechText', text);
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
