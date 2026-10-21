"""Render the public English academic CV from the same source as the web CV.

Requires reportlab and pypdf. Run from the repository root, then inspect a PNG
render before committing a changed PDF. No private files or network access.
"""
import json
from html import escape
from pathlib import Path

from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, KeepTogether

ROOT = Path(__file__).resolve().parents[1]
source = json.loads((ROOT / "src/data/academic-cv.json").read_text(encoding="utf-8"))
content = source["en"]
target = ROOT / "public" / source["pdfPath"].lstrip("/")
target.parent.mkdir(parents=True, exist_ok=True)


def text(value):
    # WinAnsi fonts support the Danish name. Use ordinary hyphens in body text.
    return escape(value.replace("·", " | ").replace("–", "-").replace("—", "-").replace("’", "'"))


body = ParagraphStyle("Body", fontName="Helvetica", fontSize=9.5, leading=12.1,
                      textColor=colors.HexColor("#282828"), alignment=TA_LEFT)
name = ParagraphStyle("Name", parent=body, fontName="Helvetica-Bold", fontSize=21, leading=25)
section_style = ParagraphStyle("Section", parent=body, fontName="Helvetica-Bold", fontSize=10.8,
                               leading=14, textColor=colors.HexColor("#83452C"), spaceBefore=10, spaceAfter=5)
title_style = ParagraphStyle("Item", parent=body, fontName="Helvetica-Bold", spaceAfter=1)
meta_style = ParagraphStyle("Meta", parent=body, fontSize=8.6, leading=11, textColor=colors.HexColor("#555555"))
small = ParagraphStyle("Small", parent=meta_style, fontSize=8, leading=10)

story = [Paragraph(text(source["name"]), name), Spacer(1, 4),
         Paragraph(text(content["status"]), body),
         Paragraph(f'{text(content["location"])} | <link href="mailto:{source["email"]}">{text(source["email"])}</link>'
                   f' | <link href="{source["website"]}">antonebsen.com</link>', small),
         Paragraph(f'ORCID: <link href="{source["orcid"]}">{source["orcid"]}</link>', small),
         Spacer(1, 7), Paragraph(text(content["profile"]), body)]

for section in content["sections"]:
    story.append(Paragraph(text(section["title"]), section_style))
    for item in section["items"]:
        heading = text(item["title"])
        if item.get("url"):
            heading = f'<link href="https://www.antonebsen.com/en{item["url"]}">{heading}</link>'
        block = [Paragraph(heading, title_style)]
        if item.get("meta"):
            block.append(Paragraph(text(item["meta"]), meta_style))
        block.extend([Paragraph(text(item["text"]), body), Spacer(1, 5)])
        story.append(KeepTogether(block))


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#D8D8D8"))
    canvas.line(42, 34, A4[0] - 42, 34)
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(colors.HexColor("#666666"))
    canvas.drawString(42, 23, "Academic CV | Updated " + source["updated"])
    canvas.drawRightString(A4[0] - 42, 23, str(doc.page))
    canvas.restoreState()


doc = SimpleDocTemplate(str(target), pagesize=A4, rightMargin=42, leftMargin=42,
                        topMargin=37, bottomMargin=45, title=source["name"] + " - Academic CV",
                        author=source["name"], subject="Education, research and teaching", pageCompression=1)
doc.build(story, onFirstPage=footer, onLaterPages=footer)
reader = PdfReader(target)
assert len(reader.pages) == 1, f"Expected one concise page; got {len(reader.pages)}. Review layout."
assert "January 2027" in reader.pages[0].extract_text()
assert "PhD Candidate" not in reader.pages[0].extract_text()
print(f"Created {target} ({len(reader.pages)} page)")
