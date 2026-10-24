"""Export only an approved three-cell excerpt, not the full private reading.

Usage: python scripts/prepare-thesis-excerpt.py --image PATH --readings PATH
Public image reuse and coauthor approval confirmed by Anton on 24 October 2026.
No API request, names, estate keys or linkage data are exported.
"""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE_HASH = "bb1c3765259d76159a6de30a0d6f8dd13ad79452ee59c5603acd630e7c44fba4"
READINGS_HASH = "501daae6c3d2c2c26b155f9e7a3b67d9edcb8554d4c3093abb5331fa7307d633"
CROPS = {"headings": (1730, 365, 2025, 645), "row": (1730, 775, 2025, 845)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", type=Path, required=True)
    parser.add_argument("--readings", type=Path, required=True)
    args = parser.parse_args()
    for path, expected in [(args.image, SOURCE_HASH), (args.readings, READINGS_HASH)]:
        if hashlib.sha256(path.read_bytes()).hexdigest() != expected:
            raise ValueError(f"Unexpected input hash: {path.name}")
    sheet = json.loads(args.readings.read_text(encoding="utf-8"))["207"]
    row = next(r for r in sheet["rows"] if r["row"] == 3)
    fields = ("creoles", "africans", "total")
    record = {f: row[f] for f in fields}
    if record != {"creoles": 54, "africans": 32, "total": 86}:
        raise ValueError("Reviewed excerpt changed")
    flagged = {(r, f) for r, f in sheet.get("decided_by_totals", [])}
    corrected = {(r["row"], r["field"]) for r in sheet.get("corrected_on_original", [])}
    if any((3, f) in flagged | corrected for f in fields):
        raise ValueError("Chosen cells have arithmetic-assistance/correction flags")
    if record["creoles"] + record["africans"] != record["total"]:
        raise ValueError("Row identity does not hold")
    image = Image.open(args.image)
    if image.size != (4033, 3331):
        raise ValueError("Unexpected source dimensions; crop would be unsafe")
    out = ROOT / "public" / "assets" / "research" / "thesis-excerpt"
    out.mkdir(parents=True, exist_ok=True)
    for name, box in CROPS.items():
        image.crop(box).save(out / f"1792-origin-{name}.png")
    manifest = {
        "source": {"institution": "Rigsarkivet", "title": "St. Croix General Tabell, 31 December 1792",
                   "epid": 20201795, "bsid": 292226, "image": 207, "imageId": 58788329,
                   "quarter": 2, "row": 3, "unit": "persons recorded as enslaved",
                   "url": "https://arkivalieronline.rigsarkivet.dk/da/billedviser?epid=20201795#292226,58788329"},
        "record": record,
        "reading": {"method": sheet["read_by"], "date": sheet["read_on"]},
        "checks": {"reviewDate": "2026-10-24", "visualReview": "AI-assisted visual comparison of these three cells and headings only",
                   "rowIdentity": "54 + 32 = 86", "selectedCellsFlaggedOrCorrected": False,
                   "scope": "Not independent human ground truth; not a linkage or full-sheet accuracy test"},
        "sourceSha256": SOURCE_HASH, "readingsSha256": READINGS_HASH,
        "sourceDimensions": list(image.size), "cropBoxes": CROPS,
        "reuse": "Public image reproduction permission confirmed by Anton on 2026-10-24; no general licence is granted here.",
    }
    (out / "provenance.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print("Exported two name-free crops and a three-cell provenance record")


if __name__ == "__main__":
    main()
