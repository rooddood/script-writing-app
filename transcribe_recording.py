import os
from huggingface_hub import login, hf_hub_download
from transformers import AutoTokenizer, AutoModelForCausalLM, AutoModelForSeq2SeqLM
from faster_whisper import WhisperModel
from AudioRecorder import AudioRecorder
from dotenv import load_dotenv
import torch

# ########## Environment Setup ##########
def setup_environment():
    """Load environment variables and check CUDA availability."""
    load_dotenv()
    login(token=os.getenv("HUGGINGFACE_TOKEN"))
    print("CUDA available:", torch.cuda.is_available())
    print("cuDNN version:", torch.backends.cudnn.version())
    print("CUDA device name:", torch.cuda.get_device_name(0) if torch.cuda.is_available() else "No CUDA device")

# ########## Model Utilities ##########
def get_and_save_model_if_not_exists(model_name, save_directory="./models/", revision="main", model_type="causal"):
    """
    Load or download a model and save it locally if not already present.

    Args:
        model_name (str): Name of the model to load.
        save_directory (str): Directory to save the model.
        revision (str): Model revision to use.
        model_type (str): Type of model ('causal' or 'seq2seq').

    Returns:
        model: Loaded model.
    """
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

# ########## Audio Transcription ##########
def transcribe_audio(recording_path, model_size="large-v3"):
    """
    Transcribe audio using WhisperModel.

    Args:
        recording_path (str): Path to the audio file.
        model_size (str): Size of the Whisper model.

    Returns:
        tuple: Transcription segments and language information.
    """
    print("Initializing WhisperModel...")
    model = WhisperModel(model_size, device="cuda", compute_type="float16")
    print("Transcribing audio...")
    segments, info = model.transcribe(recording_path, beam_size=5)
    print("Transcription completed.")
    print("Detected language '%s' with probability %f" % (info.language, info.language_probability))
    return segments, info

def format_transcription(segments):
    """
    Format transcription segments into a single text string.

    Args:
        segments (list): List of transcription segments.

    Returns:
        str: Formatted transcription text.
    """
    whole_text = ""
    for segment in segments:
        print("[%.2fs -> %.2fs] %s" % (segment.start, segment.end, segment.text))
        whole_text += segment.text + " "
    return whole_text.strip()

# ########## LLM Interaction ##########
def prepare_messages(system_prompt, user_input):
    """
    Prepare messages for the LLM.

    Args:
        system_prompt (str): System prompt for the LLM.
        user_input (str): User input text.

    Returns:
        list: List of messages for the LLM.
    """
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_input}
    ]

def generate_response(model, tokenizer, messages):
    """
    Generate a response from the LLM.

    Args:
        model: Loaded LLM model.
        tokenizer: Tokenizer for the model.
        messages (list): Messages to send to the LLM.

    Returns:
        str: Generated response.
    """
    tokenizer.chat_template = (
        "{% if not add_generation_prompt is defined %}{% set add_generation_prompt = false %}{% endif %}"
        "{% for message in messages %}{{'<|im_start|>' + message['role'] + '\n' + message['content'] + '<|im_end|>' + '\n'}}{% endfor %}"
        "{% if add_generation_prompt %}{{ '<|im_start|>assistant\n' }}{% endif %}"
    )
    inputs = tokenizer.apply_chat_template(messages, tokenize=True, return_tensors="pt").to(model.device)
    print("Contents of 'inputs':", inputs)
    outputs = model.generate(inputs, max_new_tokens=512)
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

# ########## Main Code ##########
if __name__ == "__main__":
    # Setup environment
    setup_environment()

    # Audio recording (commented out for now)
    # print("Starting audio recording...")
    # recorder = AudioRecorder(output_filename="./recordings/test.wav")
    # recorder.record(record_seconds=10)
    # print("Audio recording completed.")

    # Transcribe audio
    recording_path = "./recordings/test.wav"
    segments, info = transcribe_audio(recording_path)
    whole_text = format_transcription(segments)

    # Prepare system prompt
    system_prompt = (
        "You are an expert assistant. Based on the following transcription, "
        "please provide a nicely formatted version of the text in script form. "
        "Please pull out any necessary formatting and scene setting or other instructions to aid in formatting the text. "
        "Please output the script version of the following input:\n\n"
    )

    # Load LLM model and tokenizer
    model_list = [
        {"name": "deepseek-ai/DeepSeek-R1", "type": "causal"},
        {"name": "google/flan-t5-large", "type": "seq2seq"}
    ]
    model_config = model_list[1]  # Select the desired model
    model_name = model_config["name"]
    model_type = model_config["type"]
    save_directory = "./models/"

    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = get_and_save_model_if_not_exists(model_name, save_directory, model_type=model_type)

    # Generate response
    messages = prepare_messages(system_prompt, whole_text)
    response = generate_response(model, tokenizer, messages)

    # Output response
    print("Generated Output:")
    print(response)
    print("FIN!")