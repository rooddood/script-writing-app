import pyaudio
import wave

class AudioRecorder:
    def __init__(self, chunk=1024, format=pyaudio.paInt16, channels=2, rate=44100, output_filename="recordings/output.wav"):
        """
        Initialize the AudioRecorder with default or provided parameters.
        """
        self.chunk = chunk
        self.format = format
        self.channels = channels
        self.rate = rate
        self.output_filename = output_filename
        self.p = pyaudio.PyAudio()

    def record(self, record_seconds=5):
        """
        Record audio for a specified number of seconds.
        """
        stream = self.p.open(format=self.format,
                             channels=self.channels,
                             rate=self.rate,
                             input=True,
                             frames_per_buffer=self.chunk)

        print("* recording")

        frames = []

        for _ in range(0, int(self.rate / self.chunk * record_seconds)):
            data = stream.read(self.chunk)
            frames.append(data)

        print("* done recording")

        stream.stop_stream()
        stream.close()
        self.p.terminate()

        self.save(frames)

    def save(self, frames):
        """
        Save the recorded frames to a WAV file.
        """
        wf = wave.open(self.output_filename, 'wb')
        wf.setnchannels(self.channels)
        wf.setsampwidth(self.p.get_sample_size(self.format))
        wf.setframerate(self.rate)
        wf.writeframes(b''.join(frames))
        wf.close()


# # Example usage:
# # Initialize the recorder with default parameters
# recorder = AudioRecorder(output_filename="./recordings/test.wav")
# # Record for 4 seconds
# recorder.record(record_seconds=4)