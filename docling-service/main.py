import os
import re
import tempfile
import logging
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("docling-service")

app = FastAPI(
    title="PlaceIQ Docling Document Intelligence Service",
    description="Document parsing, layout understanding, table extraction, and structure analysis powered by Docling.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global converter instance with lazy initialization
_converter = None

def get_converter():
    global _converter
    if _converter is None:
        try:
            from docling.document_converter import DocumentConverter
            _converter = DocumentConverter()
            logger.info("Docling DocumentConverter initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize Docling DocumentConverter: {e}")
            raise e
    return _converter

class ExtractedFieldData(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    studentId: Optional[str] = None
    rollNumber: Optional[str] = None
    institution: Optional[str] = None
    documentType: Optional[str] = None
    dates: Optional[List[str]] = None
    cgpaOrGrade: Optional[str] = None
    certificateNumber: Optional[str] = None

class DocumentSection(BaseModel):
    title: str
    level: int
    text: str

class DocumentTable(BaseModel):
    tableIndex: int
    headers: List[str]
    rows: List[List[str]]

class DoclingProcessResponse(BaseModel):
    success: bool
    fileName: str
    pages: int
    documentType: str
    text: str
    markdown: str
    sections: List[DocumentSection]
    tables: List[DocumentTable]
    fields: ExtractedFieldData
    metadata: Dict[str, Any]
    error: Optional[str] = None

def extract_heuristic_fields(text: str, markdown: str) -> ExtractedFieldData:
    fields = ExtractedFieldData()
    combined = f"{text}\n{markdown}"

    # 1. Candidate Name
    name_match = re.search(r'(?:Name|Candidate\s*Name|Student\s*Name)[:\s]+([A-Za-z\s]{3,35})', combined, re.IGNORECASE)
    if name_match:
        fields.name = name_match.group(1).strip()
    else:
        # Check first non-empty lines for probable name
        for line in combined.split('\n')[:8]:
            clean_line = line.strip().lstrip('#').strip()
            if not clean_line or any(w in clean_line.lower() for w in ['resume', 'curriculum', 'page', 'email', 'phone', 'http']):
                continue
            if re.match(r'^[A-Z][a-zA-Z\.\s]{2,35}$', clean_line) and len(clean_line.split()) <= 4:
                fields.name = clean_line
                break

    # 2. Email
    email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b', combined)
    if email_match:
        fields.email = email_match.group(0).strip()

    # 3. Phone
    phone_match = re.search(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?91[-.\s]?[6-9]\d{9}', combined)
    if phone_match:
        fields.phone = phone_match.group(0).strip()

    # 4. Roll Number / Student ID
    roll_match = re.search(r'(?:Roll\s*(?:No|Number|#)?|PRN|Registration\s*(?:No|Number)?|Student\s*ID)[:\s]+([A-Za-z0-9\-_/]{4,20})', combined, re.IGNORECASE)
    if roll_match:
        fields.rollNumber = roll_match.group(1).strip()
        fields.studentId = roll_match.group(1).strip()

    # 5. Certificate Number
    cert_match = re.search(r'(?:Certificate\s*(?:No|Number|ID)|Doc\s*(?:No|Number))[:\s]+([A-Za-z0-9\-_/]{4,25})', combined, re.IGNORECASE)
    if cert_match:
        fields.certificateNumber = cert_match.group(1).strip()

    # 6. CGPA / Percentage / Marks
    cgpa_match = re.search(r'(?:CGPA|SGPA|GPA|Percentage|Marks\s*Obtained)[:\s]+(\d+(?:\.\d+)?(?:\s*%)?(?:\s*/\s*10(?:\.0)?)?)', combined, re.IGNORECASE)
    if cgpa_match:
        fields.cgpaOrGrade = cgpa_match.group(1).strip()

    # 7. Dates
    date_matches = re.findall(r'\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b', combined, re.IGNORECASE)
    if date_matches:
        fields.dates = list(dict.fromkeys(date_matches))[:5]

    # 8. Inferred Document Type
    lower_text = combined.lower()
    if 'resume' in lower_text or 'curriculum vitae' in lower_text or ('experience' in lower_text and 'skills' in lower_text):
        fields.documentType = 'Resume'
    elif 'marksheet' in lower_text or 'grade card' in lower_text or 'statement of marks' in lower_text:
        fields.documentType = 'Marksheet'
    elif 'transcript' in lower_text or 'academic record' in lower_text:
        fields.documentType = 'Transcript'
    elif 'internship' in lower_text and ('certificate' in lower_text or 'completion' in lower_text):
        fields.documentType = 'Internship Certificate'
    elif 'degree' in lower_text or 'provisional certificate' in lower_text or 'convocation' in lower_text:
        fields.documentType = 'Degree Certificate'
    elif 'certificate' in lower_text:
        fields.documentType = 'Certificate'
    elif 'identity card' in lower_text or 'student id' in lower_text or 'aadhar' in lower_text or 'passport' in lower_text:
        fields.documentType = 'Identity Card'
    else:
        fields.documentType = 'Other'

    # 9. Institution
    inst_match = re.search(r'(?:University|Institute|College|Academy|School)\s+(?:of\s+)?[A-Za-z\s&,\.]{3,50}', combined)
    if inst_match:
        fields.institution = inst_match.group(0).strip()

    return fields

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "placeiq-docling-processor",
        "version": "1.0.0",
        "doclingAvailable": True
    }

@app.post("/process-document", response_model=DoclingProcessResponse)
async def process_document(
    file: UploadFile = File(...),
    documentTypeHint: Optional[str] = Form(None)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is missing")

    temp_file_path = None
    try:
        suffix = os.path.splitext(file.filename)[1] or ".pdf"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        file_size = len(content)

        # 1. Run Docling Conversion
        converter = get_converter()
        logger.info(f"Processing document {file.filename} ({file_size} bytes) with Docling...")
        
        result = converter.convert(temp_file_path)
        doc = result.document

        # 2. Extract Text & Markdown
        markdown_text = doc.export_to_markdown() if hasattr(doc, "export_to_markdown") else ""
        plain_text = doc.export_to_text() if hasattr(doc, "export_to_text") else markdown_text

        # 3. Extract Tables
        tables: List[DocumentTable] = []
        if hasattr(doc, "tables") and doc.tables:
            for idx, tbl in enumerate(doc.tables):
                try:
                    try:
                        df = tbl.export_to_dataframe(doc=doc)
                    except TypeError:
                        df = tbl.export_to_dataframe()
                    headers = [str(c) for c in df.columns]
                    rows = [[str(val) for val in row] for row in df.values]
                    tables.append(DocumentTable(
                        tableIndex=idx,
                        headers=headers,
                        rows=rows
                    ))
                except Exception as tbl_err:
                    logger.warning(f"Error parsing table {idx}: {tbl_err}")

        # 4. Extract Headings and Sections
        sections: List[DocumentSection] = []
        lines = markdown_text.split('\n')
        current_title = "Document Overview"
        current_level = 1
        current_lines = []

        for line in lines:
            if line.startswith('#'):
                if current_lines:
                    sections.append(DocumentSection(
                        title=current_title,
                        level=current_level,
                        text="\n".join(current_lines).strip()
                    ))
                    current_lines = []
                
                heading_level = len(line) - len(line.lstrip('#'))
                current_title = line.lstrip('#').strip()
                current_level = heading_level
            else:
                current_lines.append(line)

        if current_lines:
            sections.append(DocumentSection(
                title=current_title,
                level=current_level,
                text="\n".join(current_lines).strip()
            ))

        # 5. Extract Structured Fields
        fields = extract_heuristic_fields(plain_text, markdown_text)
        if documentTypeHint and fields.documentType == "Other":
            fields.documentType = documentTypeHint

        # 6. Page Metrics & Metadata
        pages_count = 1
        try:
            if hasattr(doc, "num_pages"):
                pages_count = doc.num_pages() if callable(doc.num_pages) else doc.num_pages
            elif hasattr(doc, "pages"):
                pages_count = len(doc.pages)
            pages_count = int(pages_count) if pages_count else 1
        except Exception:
            pages_count = 1

        metadata = {
            "tablesCount": len(tables),
            "sectionsCount": len(sections),
            "characterCount": len(plain_text),
            "fileSizeBytes": file_size,
            "hasOcr": hasattr(doc, "has_ocr") and doc.has_ocr or False,
            "producer": getattr(doc, "producer", "Docling/IBM")
        }

        return DoclingProcessResponse(
            success=True,
            fileName=file.filename,
            pages=pages_count or 1,
            documentType=fields.documentType or documentTypeHint or "Other",
            text=plain_text,
            markdown=markdown_text,
            sections=sections,
            tables=tables,
            fields=fields,
            metadata=metadata
        )

    except Exception as e:
        logger.error(f"Docling processing error for {file.filename}: {e}", exc_info=True)
        return DoclingProcessResponse(
            success=False,
            fileName=file.filename,
            pages=1,
            documentType=documentTypeHint or "Other",
            text="",
            markdown="",
            sections=[],
            tables=[],
            fields=ExtractedFieldData(documentType=documentTypeHint or "Other"),
            metadata={"error": str(e)},
            error=str(e)
        )
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception:
                pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
