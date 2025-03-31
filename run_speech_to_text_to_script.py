import os
from huggingface_hub import login, hf_hub_download  # Updated import
from transformers import AutoTokenizer, AutoModelForCausalLM, AutoModelForSeq2SeqLM
# from transformers import pipeline
from faster_whisper import WhisperModel
from AudioRecorder import AudioRecorder
from transformers import AutoTokenizer, AutoModelForCausalLM
# from diffusers import StableDiffusionPipeline
from dotenv import load_dotenv  # Import dotenv to load environment variables
import torch
print("CUDA available:", torch.cuda.is_available())
print("cuDNN version:", torch.backends.cudnn.version())
print("CUDA device name:", torch.cuda.get_device_name(0) if torch.cuda.is_available() else "No CUDA device")

# Load environment variables from .env file
load_dotenv()
login(token=os.getenv("HUGGINGFACE_TOKEN"))

def get_and_save_model_if_not_exists(model_name, save_directory="./models/", revision="main", model_type="causal"):
    model_path = save_directory + model_name
    if not os.path.exists(model_path):
        print(f"Model '{model_name}' not found locally. Attempting to download...")
    else:
        print(f"Loading model '{model_name}' from local path.")

    model_class = AutoModelForCausalLM if model_type == "causal" else AutoModelForSeq2SeqLM

    try:
        model = model_class.from_pretrained(
            model_name if not os.path.exists(model_path) else model_path,
            trust_remote_code=True,
            torch_dtype=torch.float32,  # Use float32 to avoid quantization issues
            revision=revision,  # Pin the revision
            low_cpu_mem_usage=True  # Explicitly disable quantization
        ).cuda()
        if not os.path.exists(model_path):
            model.save_pretrained(model_path)
    except ValueError as e:
        if "Unknown quantization type" in str(e):
            raise ValueError(
                f"Unsupported quantization type encountered for model '{model_name}'. "
                "Please check the model configuration or use a different model."
            ) from e
        else:
            raise
    return model



####### Main Code #######
print("Starting audio recording...")

# Record a 10-second audio segment - commente out for now to use same clip
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

# Add a clear prompt to the transcribed text
system_prompt = (
    "You are an expert assistant. Based on the following transcription, "
    "please provide a nicely formatted version of the text in scroipt form. "
    "Please pull out any necessary formatting and scene setting or other instructions to aid in formatting the text. "
    "Please output the script version of teh following input:\n\n"
)
whole_text = whole_text.strip()

print("Sending message to LLM...")
model_list = [
    {"name": "deepseek-ai/DeepSeek-R1", "type": "causal"},
    {"name": "google/flan-t5-large", "type": "seq2seq"}
]
model_config = model_list[1]  # Select the desired model
model_name = model_config["name"]
model_type = model_config["type"]

save_directory = "./models/"
tokenizer = AutoTokenizer.from_pretrained(model_name)  # , trust_remote_code=True
model = get_and_save_model_if_not_exists(model_name, save_directory, model_type=model_type).cuda()
messages=[
    {"role": "system", "content": system_prompt},
    { 'role': 'user', 'content': whole_text}
]

tokenizer.chat_template = "{% if not add_generation_prompt is defined %}{% set add_generation_prompt = false %}{% endif %}{% for message in messages %}{{'<|im_start|>' + message['role'] + '\n' + message['content'] + '<|im_end|>' + '\n'}}{% endfor %}{% if add_generation_prompt %}{{ '<|im_start|>assistant\n' }}{% endif %}"

# inputs = tokenizer.apply_chat_template(messages, tokenize=False) #add_generation_prompt=True, return_tensors="pt")#.to(model.device)
# print("Chat Template:")
# print(tokenizer.decode(inputs[0]))

# # tokenizer.eos_token_id is the id of <|EOT|> token
# outputs = model.generate(inputs, max_new_tokens=512)#, do_sample=False, top_k=50, top_p=0.95, num_return_sequences=1, eos_token_id=tokenizer.eos_token_id)
# print(tokenizer.decode(outputs[0]))

inputs = tokenizer.apply_chat_template(messages, tokenize=True, return_tensors="pt").to(model.device)
print("Contents of 'inputs':", inputs)
print(f"Type of 'inputs': {type(inputs)}")
print("Shape of inputs before generate:", inputs.shape)  # Access shape directly

outputs = model.generate(inputs, max_new_tokens=512)  # Pass the tensor directly

print("Generated Output:")
print(tokenizer.decode(outputs[0], skip_special_tokens=True))

print("FIN!")