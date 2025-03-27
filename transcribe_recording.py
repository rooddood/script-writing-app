import os
import torch
print("CUDA available:", torch.cuda.is_available())
print("cuDNN version:", torch.backends.cudnn.version())
print("CUDA device name:", torch.cuda.get_device_name(0) if torch.cuda.is_available() else "No CUDA device")

from huggingface_hub import login, hf_hub_download  # Updated import
from transformers import AutoTokenizer, AutoModelForCausalLM
# from transformers import pipeline
from faster_whisper import WhisperModel
from AudioRecorder import AudioRecorder

from transformers import AutoTokenizer, AutoModelForCausalLM
import os
# from diffusers import StableDiffusionPipeline

def save_model_if_not_exists(model_name, save_directory):
    model_path = save_directory + model_name
    if not os.path.exists(model_path):
        model = AutoModelForCausalLM.from_pretrained(model_name, trust_remote_code=True, torch_dtype=torch.bfloat16).cuda()#StableDiffusionPipeline.from_pretrained(model_name)#, use_auth_token=True)
        model.save_pretrained(model_path)
    else:
        model = AutoModelForCausalLM.from_pretrained(model_path, trust_remote_code=True, torch_dtype=torch.bfloat16).cuda()
    return model#StableDiffusionPipeline.from_pretrained(model_path)

login(token = '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')

print("Starting audio recording...")

# # Record a 4-second audio segment
# recorder = AudioRecorder(output_filename="./recordings/test.wav")
# recorder.record(record_seconds=10)

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

whole_text = ""
for segment in segments:
    print("[%.2fs -> %.2fs] %s" % (segment.start, segment.end, segment.text))
    whole_text += segment.text + " "

print("Sending message to LLM...")
model_name = "deepseek-ai/deepseek-coder-6.7b-instruct"
save_directory = "./models/"
tokenizer = AutoTokenizer.from_pretrained(model_name) #, trust_remote_code=True)
model = save_model_if_not_exists(model_name, save_directory).cuda()
messages=[
    { 'role': 'user', 'content': whole_text}
]
inputs = tokenizer.apply_chat_template(messages, add_generation_prompt=True, return_tensors="pt").to(model.device)
# tokenizer.eos_token_id is the id of <|EOT|> token
outputs = model.generate(inputs, max_new_tokens=512, do_sample=False, top_k=50, top_p=0.95, num_return_sequences=1, eos_token_id=tokenizer.eos_token_id)
print(tokenizer.decode(outputs[0][len(inputs[0]):], skip_special_tokens=True))
print("FIN!")