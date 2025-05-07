import logging
from transformers import pipeline, GPT2Tokenizer

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class HuggingFaceAI:
    def __init__(self):
        self.text_generation_pipeline = None
        self.tokenizer = None
        self.script_formatting_prompt = None

    def setup_pipeline(self):
        """Sets up the HuggingFace pipeline for text generation."""
        try:
            logging.info("Initializing HuggingFace pipeline...")
            model_name = "gpt2"
            self.tokenizer = GPT2Tokenizer.from_pretrained(model_name)
            self.text_generation_pipeline = pipeline("text-generation", model=model_name)
            logging.info("Pipeline initialized successfully.")
        except Exception as e:
            logging.error(f"Failed to initialize pipeline: {e}")

    def load_prompt(self, script):
        """Loads the script formatting prompt and replaces {script} with the inputted script."""
        try:
            with open("script_formatting_prompt.txt", "r") as prompt_file:
                prompt_template = prompt_file.read()
                self.script_formatting_prompt = prompt_template.replace("{script}", script)
        except Exception as e:
            logging.error(f"Error loading prompt: {e}")

    def generate_text(self, prompt, max_new_tokens=512):
        """Generates text based on the provided prompt."""
        if not self.text_generation_pipeline:
            logging.error("Pipeline not initialized. Please call setup_pipeline() first.")
            return None

        try:
            return self.text_generation_pipeline(prompt, max_new_tokens=max_new_tokens, num_return_sequences=1)[0]["generated_text"]
        except Exception as e:
            logging.error(f"Error generating text: {e}")
            return None

    def format_script(self, script):
        """Formats a script by appending it to a predefined prompt."""
        if not self.text_generation_pipeline:
            logging.error("Pipeline not initialized. Please call setup_pipeline() first.")
            return None

        # Load the prompt with the inputted script
        self.load_prompt(script)

        try:
            # Generate the formatted script
            return self.text_generation_pipeline(self.script_formatting_prompt, max_new_tokens=512, num_return_sequences=1)[0]["generated_text"]
        except Exception as e:
            logging.error(f"Error formatting script: {e}")
            return None

# Example usage of the HuggingFaceAI class for testing
if __name__ == "__main__":
    ai = HuggingFaceAI()

    # Ensure the pipeline is set up before proceeding
    ai.setup_pipeline()
    if not ai.text_generation_pipeline:
        logging.error("Pipeline setup failed. Cannot proceed with text generation.")
    else:
        # Load the run-on script text from a file
        with open("run_on_script_text.txt", "r") as text_file:
            run_on_script_text = text_file.read()

        # Test the format_script method
        formatted_script = ai.format_script(run_on_script_text)

        if formatted_script:
            print("Formatted Script:")
            print(formatted_script)
        else:
            print("Failed to format script.")