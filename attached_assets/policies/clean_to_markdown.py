import zipfile
import xml.etree.ElementTree as ET
import os
import re

WORD_NAMESPACE = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
PARA = WORD_NAMESPACE + 'p'
RUN = WORD_NAMESPACE + 'r'
TEXT = WORD_NAMESPACE + 't'
RPR = WORD_NAMESPACE + 'rPr'
B = WORD_NAMESPACE + 'b'
PSTYLE = WORD_NAMESPACE + 'pStyle'
NUMPR = WORD_NAMESPACE + 'numPr'

def clean_text(text):
    text = text.replace('\xa0', ' ')
    text = text.replace('\u2013', '-')
    text = text.replace('\u2014', '--')
    text = text.replace('\u201c', '"')
    text = text.replace('\u201d', '"')
    text = text.replace('\u2018', "'")
    text = text.replace('\u2019', "'")
    
    # Remove control characters
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', ' ', text)
    return text

def parse_docx(file_path):
    if not os.path.exists(file_path):
        return f"File not found: {file_path}"
    
    try:
        with zipfile.ZipFile(file_path) as docx:
            tree = ET.parse(docx.open('word/document.xml'))
            root = tree.getroot()
            
            markdown_paragraphs = []
            
            for para in root.iter(PARA):
                pPr = para.find(WORD_NAMESPACE + 'pPr')
                is_heading = False
                heading_level = 0
                is_bullet = False
                
                if pPr is not None:
                    pStyle = pPr.find(PSTYLE)
                    if pStyle is not None:
                        val = pStyle.get(WORD_NAMESPACE + 'val')
                        if val and val.startswith('Heading'):
                            is_heading = True
                            heading_level = int(val.replace('Heading', ''))
                    
                    numPr = pPr.find(NUMPR)
                    if numPr is not None:
                        is_bullet = True
                
                para_parts = []
                for run in para.iter(RUN):
                    rPr = run.find(RPR)
                    is_bold = False
                    if rPr is not None:
                        b = rPr.find(B)
                        if b is not None:
                            is_bold = True
                    
                    t_nodes = run.findall(TEXT)
                    run_text = "".join([t.text for t in t_nodes if t.text])
                    if run_text:
                        run_text = clean_text(run_text)
                        if is_bold:
                            leading_spaces = len(run_text) - len(run_text.lstrip())
                            trailing_spaces = len(run_text) - len(run_text.rstrip())
                            stripped = run_text.strip()
                            if stripped:
                                para_parts.append(run_text[:leading_spaces] + f"**{stripped}**" + run_text[len(run_text)-trailing_spaces:])
                            else:
                                para_parts.append(run_text)
                        else:
                            para_parts.append(run_text)
                
                para_text = "".join(para_parts).strip()
                if not para_text:
                    continue
                
                # Check for list items
                if para_text.startswith(('-', '*', '•', '\uf0b7')):
                    is_bullet = True
                    para_text = re.sub(r'^[-*•\uf0b7]\s*', '', para_text)
                
                # Let's check if there are bullet separators inside
                if '\uf0b7' in para_text or '\u2022' in para_text:
                    items = re.split(r'\s*[\uf0b7\u2022]\s*', para_text)
                    for item in items:
                        item_clean = item.strip()
                        if item_clean:
                            markdown_paragraphs.append(f"- {item_clean}")
                    continue

                if is_heading:
                    prefix = "#" * heading_level
                    markdown_paragraphs.append(f"{prefix} {para_text}")
                elif is_bullet:
                    markdown_paragraphs.append(f"- {para_text}")
                else:
                    markdown_paragraphs.append(para_text)
            
            return "\n\n".join(markdown_paragraphs)
    except Exception as e:
        return f"Error reading docx: {e}"

policy_dir = r"D:\FinHeal-Friend\f2-therapist-chatbot-frontend\attached_assets\policies"

mapping = {
    "Credit": "credit-consent.md",
    "DPDP": "dpdp-notice.md",
    "Data": "data-retention.md",
    "Privacy": "privacy-policy.md",
    "Terms": "terms-of-use.md"
}

for filename in os.listdir(policy_dir):
    if filename.endswith(".docx"):
        path = os.path.join(policy_dir, filename)
        content = parse_docx(path)
        
        out_name = None
        for key, name in mapping.items():
            if key in filename:
                out_name = name
                break
        if not out_name:
            out_name = filename.replace(".docx", ".md").lower().replace(" ", "-")
        
        print(f"===START_POLICY {out_name}===")
        print(content)
        print(f"===END_POLICY {out_name}===")
