from google import genai
from google.genai import types

class LLMService:
    def __init__(self, model='default-model', provider='gemini'):
        self.model = model
        self.provider = provider
        self.client = genai.Client(api_key="YOUR_API_KEY")

    def connect(self):
        if self.provider == 'gemini':
            return self._connect_to_gemini()
        else:
            raise ValueError(f"Provider {self.provider} is not supported")

    def _connect_to_gemini(self):
        # Placeholder for actual connection logic to Gemini
        print(f"Connecting to Gemini with model {self.model}")
        # ...connection logic...
        return True

    def generate_content(self, contents, max_output_tokens=500, temperature=0.1, system_instruction=None):
        if self.provider == 'gemini':
            return self._generate_content_gemini(contents, max_output_tokens, temperature, system_instruction)
        else:
            raise ValueError(f"Provider {self.provider} is not supported")

    def _generate_content_gemini(self, contents, max_output_tokens, temperature, system_instruction):
        config = types.GenerateContentConfig(
            max_output_tokens=max_output_tokens,
            temperature=temperature,
            system_instruction=system_instruction
        )
        response = self.client.models.generate_content(
            model=self.model, contents=contents, config=config
        )
        return response.text

    def generate_content_stream(self, contents):
        if self.provider == 'gemini':
            return self._generate_content_stream_gemini(contents)
        else:
            raise ValueError(f"Provider {self.provider} is not supported")

    def _generate_content_stream_gemini(self, contents):
        response = self.client.models.generate_content_stream(
            model=self.model, contents=contents
        )
        for chunk in response:
            print(chunk.text, end="")

    def chat(self, messages):
        if self.provider == 'gemini':
            return self._chat_gemini(messages)
        else:
            raise ValueError(f"Provider {self.provider} is not supported")

    def _chat_gemini(self, messages):
        chat = self.client.chats.create(model=self.model)
        for message in messages:
            response = chat.send_message(message)
            print(response.text)
        for message in chat.get_history():
            print(f'role - {message.role}', end=": ")
            print(message.parts[0].text)

    def chat_stream(self, messages):
        if self.provider == 'gemini':
            return self._chat_stream_gemini(messages)
        else:
            raise ValueError(f"Provider {self.provider} is not supported")

    def _chat_stream_gemini(self, messages):
        chat = self.client.chats.create(model=self.model)
        for message in messages:
            response = chat.send_message_stream(message)
            for chunk in response:
                print(chunk.text, end="")
        for message in chat.get_history():
            print(f'role - {message.role}', end=": ")
            print(message.parts[0].text)

# Example usage
llm_service = LLMService(model='gemini-2.0-flash')
llm_service.connect()
print(llm_service.generate_content("Explain how AI works", system_instruction="You are a cat. Your name is Neko."))
llm_service.generate_content_stream(["Explain how AI works"])
llm_service.chat(["I have 2 dogs in my house.", "How many paws are in my house?"])
llm_service.chat_stream(["I have 2 dogs in my house.", "How many paws are in my house?"])
