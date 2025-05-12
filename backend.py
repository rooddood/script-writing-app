from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM, AutoModelForSeq2SeqLM
import torch
import os
from dotenv import load_dotenv
import logging
from HuggingFaceAI import HuggingFaceAI

# Initialize FastAPI app
app = FastAPI()

# Enable CORS for the FastAPI app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize HuggingFaceAI instance
huggingface_ai = HuggingFaceAI()
huggingface_ai.setup_pipeline()

# Define request model for text generation
class GenerateRequest(BaseModel):
    prompt: str

@app.post("/generate")
async def generate(request: GenerateRequest):
    """Endpoint to generate text using the Hugging Face model."""
    try:
        prompt = request.prompt
        if not prompt:
            raise HTTPException(status_code=400, detail="Prompt is required")

        logger.info(f"Received prompt: {prompt}")

        # Use HuggingFaceAI to generate text
        response = huggingface_ai.generate_text(prompt)
        if response is None:
            raise HTTPException(status_code=500, detail="Failed to generate text")

        logger.info(f"Generated response: {response}")
        return {"response": response}
    except Exception as e:
        logger.error(f"Error during generation: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/format_script")
async def format_script_endpoint(request: GenerateRequest):
    """Endpoint to format a script using the Hugging Face model."""
    try:
        script = request.prompt
        if not script:
            raise HTTPException(status_code=400, detail="Script is required")

        logger.info(f"Received script for formatting: {script}")

        # Use HuggingFaceAI to format the script
        formatted_script = huggingface_ai.format_script(script)
        if formatted_script is None:
            raise HTTPException(status_code=500, detail="Failed to format script")

        logger.info(f"Formatted script: {formatted_script}")
        return {"formatted_script": formatted_script}
    except Exception as e:
        logger.error(f"Error during script formatting: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint to verify Hugging Face model and tokenizer."""
    try:
        # test_prompt = "Hello, world!"
        # response = huggingface_ai.generate_text(test_prompt)
        # if response is None:
        #     raise HTTPException(status_code=500, detail="Health check failed")

        return {"status": "healthy", "test_response": "Health check Succeeded"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {"status": "unhealthy", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)