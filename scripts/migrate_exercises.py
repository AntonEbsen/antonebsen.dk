import os
import re
import json
import glob

SOURCE_DIR = r"c:\Users\Anton\antonebsen.dk\src\pages\exercises"
DEST_DA = r"c:\Users\Anton\antonebsen.dk\src\content\exercises\da"
DEST_EN = r"c:\Users\Anton\antonebsen.dk\src\content\exercises\en"

os.makedirs(DEST_DA, exist_ok=True)
os.makedirs(DEST_EN, exist_ok=True)

def parse_js_object(js_str):
    # Very basic parser for the specific format in these files
    # Returns a python dict
    data = {}
    
    # Extract arrays
    for key in ['muscles', 'benefits', 'setup', 'execution']:
        match = re.search(f'{key}:\s*\[([\s\S]*?)\]', js_str)
        if match:
            items = []
            block = match.group(1)
            # Find strings in quotes
            for im in re.finditer(r'"(.*?)"', block):
                items.append(im.group(1))
            data[key] = items
            
    # Extract title
    match = re.search(r'title:\s*"(.*?)"', js_str)
    if match:
        data['title'] = match.group(1)
        
    return data

def extract_focus_points(content):
    points = []
    # Find the grid that likely contains the focus points
    # They usually start with the icon div
    # Pattern: <i class="fa-solid ... text-xs"></i>
    # Followed by span with title
    # Followed by p with text
    
    # We'll simple scan for the pattern sequence
    # <i class="(.*?) text-xs"></i>[\s\S]*?<span.*?>(.*?)</span>[\s\S]*?<p.*?>(.*?)</p>
    
    # But we need to be careful not to match across too much context.
    # Let's find each "card" div first.
    
    # Looking at file content:
    # <div class="p-4 bg-accent/5 ...">
    #     <div class="...">
    #         <i class="..."></i>
    #         <span ...>TITLE</span>
    #     </div>
    #     <p ...>TEXT</p>
    # </div>
    
    cards = re.findall(r'<div class="p-4 bg-accent/5.*?rounded-xl.*?">([\s\S]*?)</div>', content)
    
    for card in cards:
        icon_m = re.search(r'<i class="(.*?) text-xs"></i>', card)
        title_m = re.search(r'<span.*?>(.*?)</span>', card)
        text_m = re.search(r'<p.*?>(.*?)</p>', card)
        
        if icon_m and title_m and text_m:
            points.append({
                "icon": icon_m.group(1),
                "title": title_m.group(1).strip(),
                "text": text_m.group(1).strip().replace('"', "'") # avoid double quote issues
            })
            
    if not points: 
        # Fallback/Debug
        pass
        
    return points

def extract_tempo(content):
    # Find tempo section
    # Look for "Tempo Guide"
    # Then find the numbers/letters
    
    tempo_vals = []
    
    # Find the blocks. They contain:
    # <div class="text-lg font-black ...">(VAL)</div>
    # <div ...>Ned/Bund/Op/Top</div>
    
    # Matches for the 4 phases
    phases = ['Ned', 'Bund', 'Op', 'Top']
    for phase in phases:
        # Look for the block containing the phase label
        # Then find the value immediately preceding it (or in the same block container)
        # Regex: <div class="text-lg.*?">(.*?)</div>\s*<div.*?>PHASE</div>
        res = re.search(r'<div class="text-lg.*?">\s*(.*?)\s*</div>\s*<div.*?>' + phase + r'</div>', content, re.IGNORECASE)
        if res:
            val = res.group(1)
            try:
                # Convert to int if possible, else generic (keep string?? Schema said tuple of numbers...)
                # Schema: z.tuple([z.number(), ...])
                # Wait, "X" is a value in deadlift! "X" is not a number.
                # I might need to update schema to allow strings or handle X.
                # 'X' usually means 0 or explosive. 
                # If schema enforces number, I might need to change 0 or 1 or update schema to string.
                # Let's check schema again. Schema has z.number().
                # If "X" is used, I should probably map it to 0 or 1 and add a note, OR change schema to z.union([z.number(), z.string()]).
                # I'll update schema later if needed. For now let's extract.
                parsed_val = int(val)
                tempo_vals.append(parsed_val)
            except ValueError:
                # If X, maybe map to 0? Or 1?
                # Usually X means explosive (fast as possible). 
                # Let's map X to 0 for now and maybe update schema to allow strings later if UI needs to show X.
                # Actually UI shows X. So Schema MUST allow string.
                # I will update schema in next step. For migration script, I keep it as string or conversion.
                tempo_vals.append(val)
        else:
            tempo_vals.append(0)
            
    # Extract Note
    # <p class="... text-dim ...">(.*?)</p> after the tempo block
    # This is hard to pinpoint exactly without context. 
    # But usually it's the paragraph immediately following the 4th tempo card.
    
    # Let's look for "Tempo Guide" then the last </p> in the card.
    tempo_card = re.search(r'Tempo Guide[\s\S]*?<p class=".*?text-dim.*?">\s*(.*?)\s*</p>', content)
    tempo_note = tempo_card.group(1) if tempo_card else ""
    
    return tempo_vals, tempo_note

def process_file(filepath):
    filename = os.path.basename(filepath)
    if filename == 'squat.astro': return # Already done
    
    print(f"Processing {filename}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Extract TechInfo
    tech_match = re.search(r'const techInfo = ({[\s\S]*?});', content)
    if not tech_match:
        print(f"  Skipping (no techInfo)")
        return
        
    data = parse_js_object(tech_match.group(1))
    
    # Extract Focus
    focus = extract_focus_points(content)
    if focus:
        data['focusPoints'] = focus
    else:
        data['focusPoints'] = [] # Schema requires it? Yes array.
        
    # Extract Tempo
    tempo, note = extract_tempo(content)
    # Check if tempo is valid (4 items)
    if len(tempo) == 4:
        # Convert all to number if possible, or handle string logic later
        # For JSON serialization, we keep them as is.
        data['tempo'] = tempo
    else:
        data['tempo'] = [3, 0, 1, 0] # Default
        
    if note:
        data['tempoNote'] = note
        
    # Save DA
    slug = filename.replace('.astro', '')
    with open(os.path.join(DEST_DA, f"{slug}.json"), 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        
    # Save EN (Copy for now)
    with open(os.path.join(DEST_EN, f"{slug}.json"), 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

# Run
files = glob.glob(os.path.join(SOURCE_DIR, "*.astro"))
for p in files:
    try:
        process_file(p)
    except Exception as e:
        print(f"Error processing {p}: {e}")

print("Done.")
