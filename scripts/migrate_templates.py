import os
import re

ROOT = r"c:\Users\Anton\antonebsen.dk\src\pages"
EN_DIR = os.path.join(ROOT, "en")
LANG_DIR = os.path.join(ROOT, "[lang]")

os.makedirs(LANG_DIR, exist_ok=True)

def migrate_file(filename):
    en_path = os.path.join(EN_DIR, filename)
    da_path = os.path.join(ROOT, filename)
    
    if not os.path.exists(en_path): return
    
    with open(en_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Check if simple wrapper
    # Looks for <ComponentName lang="en" />
    match = re.search(r'<(\w+)\s+lang="en"\s*/>', content)
    if not match:
        print(f"Skipping {filename} (not a simple wrapper)")
        return
        
    component_name = match.group(1)
    
    # Check imports
    import_match = re.search(f"import {component_name} from '(.*?)';", content)
    if not import_match:
        print(f"Skipping {filename} (import not found)")
        return
        
    import_path = import_match.group(1)
    
    # Create [lang] version
    # We need to adjust import path (../../ vs ../)
    # src/pages/en/file.astro -> imports from ../components
    # src/pages/[lang]/file.astro -> imports from ../../components
    
    # If import starts with @, it's fine.
    # If relative, we need to add ../
    
    new_import_path = import_path
    if import_path.startswith('.'):
        new_import_path = '../' + import_path
        
    lang_content = f"""---
import {component_name} from '{new_import_path}';

export async function getStaticPaths() {{
  return [
    {{ params: {{ lang: 'da' }} }},
    {{ params: {{ lang: 'en' }} }},
  ];
}}

const {{ lang }} = Astro.params;
---
<{component_name} lang={{lang}} />
"""

    dest_path = os.path.join(LANG_DIR, filename)
    with open(dest_path, 'w', encoding='utf-8') as f:
        f.write(lang_content)
        
    print(f"Migrated {filename} to [lang]/")
    
    # Delete EN file
    os.remove(en_path)
    print(f"Deleted {en_path}")
    
    # Root file? Keep it?
    # If we keep it, it just works as /page -> da
    # We don't touch DA file.

files = os.listdir(EN_DIR)
for f in files:
    if f.endswith(".astro"):
        migrate_file(f)
