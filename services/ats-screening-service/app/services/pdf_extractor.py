import fitz  # PyMuPDF
from fastapi import HTTPException
import re

class PDFExtractionService:
    @staticmethod
    def extract_text_from_bytes(content: bytes) -> str:
        try:
            doc = fitz.open(stream=content, filetype="pdf")
            full_text = []
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                full_text.append(page.get_text("text"))
            doc.close()

            raw_text = "\n".join(full_text)
            cleaned_text = re.sub(r'\s+', ' ', raw_text).strip()

            if len(cleaned_text) < 50:
                raise HTTPException(
                    status_code=422, 
                    detail="Submitted PDF has insufficient readable text or might be a scanned image."
                )
            return cleaned_text
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PDF extraction error: {str(e)}")
