import os
import io
from groq import Groq

class SpeechToTextService:
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    async def transcribe_audio_bytes(self, audio_bytes: bytes, filename: str = "response.webm") -> str:
        # Transcribe in-memory audio bytes using Groq Whisper-Large-v3
        try:
            audio_file = io.BytesIO(audio_bytes)
            audio_file.name = filename

            transcription = self.client.audio.transcriptions.create(
                file=audio_file,
                model="whisper-large-v3",
                response_format="text",
                language="en"
            )
            return transcription.strip()
        except Exception as e:
            return f"[Transcription Error: {str(e)}]"
