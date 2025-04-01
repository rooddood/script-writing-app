const SpeechToText = require('speech-to-text');

const start = (callback) => {
  const listener = new SpeechToText({
    onResult: (result) => {
      callback(result.transcript);
    },
    onError: (error) => {
      console.error(error);
    }
  });

  listener.startListening();
};

module.exports = { start };
