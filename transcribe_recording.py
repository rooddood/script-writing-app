from huggingface_hub import login
from transformers import AutoTokenizer, AutoModelForCausalLM
from transformers import pipeline

login(token = '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')


from faster_whisper import WhisperModel
from AudioRecorder import AudioRecorder

print("Starting audio recording...")

# Record a 4-second audio segment
recorder = AudioRecorder(output_filename="./recordings/test.wav")
recorder.record(record_seconds=10)

print("Audio recording completed.")

model_size = "large-v3"
recording = "./recordings/test.wav"

print("Initializing WhisperModel...")

# Run on GPU with FP16
model = WhisperModel(model_size, device="cuda", compute_type="float16")

# or run on GPU with INT8
# model = WhisperModel(model_size, device="cuda", compute_type="int8_float16")
# or run on CPU with INT8
# model = WhisperModel(model_size, device="cpu", compute_type="int8")

print("Transcribing audio...")

segments, info = model.transcribe(recording, beam_size=5)

print("Transcription completed.")
print("Detected language '%s' with probability %f" % (info.language, info.language_probability))

for segment in segments:
    print("[%.2fs -> %.2fs] %s" % (segment.start, segment.end, segment.text))



#Then Trying to interact with llm
# Load model directly
# from transformers import AutoTokenizer, AutoModelForCausalLM

# tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-3.3-70B-Instruct")
# model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3.3-70B-Instruct")

# # Use a pipeline as a high-level helper
# from transformers import pipeline

# messages = [
#     {"role": "user", "content": "Who are you?"},
# ]
# pipe = pipeline("text-generation", model="meta-llama/Llama-3.3-70B-Instruct")
# pipe(messages)