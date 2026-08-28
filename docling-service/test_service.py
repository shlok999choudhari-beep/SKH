import os
import sys
import tempfile

# Force UTF-8 on Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

def test_docling():
    print("=" * 60)
    print("Testing IBM Docling Document Intelligence Pipeline...")
    print("=" * 60)

    try:
        from docling.document_converter import DocumentConverter
        converter = DocumentConverter()
        print("✅ DocumentConverter successfully initialized!")

        sample_content = """# Johnathan Doe
Email: johnathan.doe@university.edu | Phone: +1 555-0199 | Roll No: CS-2024-8841

## Education
- B.Tech in Computer Science & Engineering (2020-2024)
- University of Technology
- CGPA: 9.2 / 10

## Technical Skills
- Programming Languages: Python, TypeScript, Java, C++
- Frameworks & Tools: Next.js, FastAPI, Docker, PyTorch, React, PostgreSQL

## Academic Grade Report
| Subject Code | Subject Name | Credits | Grade |
| --- | --- | --- | --- |
| CS401 | Distributed Systems | 4 | A+ |
| CS402 | Machine Learning | 4 | A |
| CS403 | Cloud Computing | 3 | A+ |
| CS404 | Compiler Design | 3 | B+ |

## Experience
### AI Research Intern - IBM Research
- Implemented deep learning document parsing pipelines.
- Extracted tables and layout structure with high accuracy.
"""

        with tempfile.NamedTemporaryFile(delete=False, suffix=".md", mode="w", encoding="utf-8") as temp_file:
            temp_file.write(sample_content)
            temp_path = temp_file.name

        try:
            print(f"\n📄 Converting document with Docling: {temp_path}")
            result = converter.convert(temp_path)
            doc = result.document
            
            markdown = doc.export_to_markdown() if hasattr(doc, "export_to_markdown") else ""
            print("✅ Exported Markdown Length:", len(markdown))
            print("\n--- Extracted Markdown Preview ---")
            print(markdown[:300] + "...\n")

            # Check tables
            tables_count = len(doc.tables) if hasattr(doc, "tables") and doc.tables else 0
            print(f"📊 Extracted Tables Count: {tables_count}")
            if tables_count > 0:
                for idx, tbl in enumerate(doc.tables):
                    df = tbl.export_to_dataframe()
                    print(f"\nTable {idx + 1} DataFrame:")
                    print(df)

            # Test Heuristics from main.py
            from main import extract_heuristic_fields
            fields = extract_heuristic_fields(markdown, markdown)
            print("\n🔍 Heuristic Extracted Fields:")
            print(f" - Name: {fields.name}")
            print(f" - Email: {fields.email}")
            print(f" - Phone: {fields.phone}")
            print(f" - Roll Number: {fields.rollNumber}")
            print(f" - Institution: {fields.institution}")
            print(f" - CGPA: {fields.cgpaOrGrade}")
            print(f" - Inferred Document Type: {fields.documentType}")

            assert fields.rollNumber == "CS-2024-8841", "Roll number match failed"
            assert fields.cgpaOrGrade is not None, "CGPA match failed"
            print("\n🎉 ALL DOCLING TESTS PASSED SUCCESSFULLY!")

        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    except Exception as e:
        print(f"\n❌ Docling Test Failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    test_docling()
