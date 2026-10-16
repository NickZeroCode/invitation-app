# -*- coding: utf-8 -*-
"""Assemble the exported invitation PDF from chunked base64 tool outputs, then verify with PyMuPDF."""
import base64
import json
import os

BASE = r"C:\Users\Ir. Nickson\AppData\Roaming\Code\User\workspaceStorage\50e28495c79f34a4f5308dbb8f0d0161\GitHub.copilot-chat\chat-session-resources\de51301f-0a7f-4a0e-b240-d81d4014ede0"
CHUNKS = [
    "call_bf26f4d9e3414926bb1a3525__vscode-1792133494815/content.txt",
    "call_4edc35ae68f14e97abd6b98a__vscode-1792133494816/content.txt",
    "call_9739ab9d11a746709b9d3a70__vscode-1792133494817/content.txt",
]
OUT_DIR = r"c:\Users\Ir. Nickson\Documents\GitHub\invitation-app\qa-screenshots\pdf-dl"
OUT = os.path.join(OUT_DIR, "invitation-jacinta-imre.pdf")

parts = {}
for rel in CHUNKS:
    path = os.path.join(BASE, rel.replace("/", os.sep))
    with open(path, "r", encoding="utf-8") as fh:
        raw = fh.read()
    # content.txt holds: Result: "<json-escaped string of the inner JSON>"
    idx = raw.find("Result: ")
    payload = raw[idx + len("Result: "):].strip()
    if payload.startswith('"'):
        payload = json.loads(payload)  # unwrap the JSON string literal
    data = json.loads(payload)
    assert "b64" in data, data.keys()
    parts[data["i"]] = data
    print("chunk", data["i"], "of", data.get("total", "?"), "size-meta", data["size"], "b64-len", len(data["b64"]))

order = [parts[i]["b64"] for i in sorted(parts)]
# each chunk was base64-encoded independently (own padding) — decode each, then join bytes
blob = b"".join(base64.b64decode(b64part) for b64part in order)
print("decoded bytes:", len(blob), "expected:", parts[0]["size"], "match:", len(blob) == parts[0]["size"])
print("magic:", blob[:8])
os.makedirs(OUT_DIR, exist_ok=True)
with open(OUT, "wb") as fh:
    fh.write(blob)
print("written:", OUT)

import fitz  # PyMuPDF

doc = fitz.open(OUT)
print("pages:", doc.page_count)
for i, page in enumerate(doc):
    text = page.get_text()
    imgs = page.get_images(full=True)
    dims = [im[2:4] for im in imgs]
    print(f"--- page {i}: {page.rect.width:.0f}x{page.rect.height:.0f} images={len(imgs)} dims={dims}")
    print("   text:", " | ".join(t for t in text.splitlines() if t.strip())[:300])
# render each page for visual proof
stem = os.path.splitext(os.path.basename(OUT))[0]
for i in range(doc.page_count):
    pix = doc[i].get_pixmap(dpi=90)
    png = os.path.join(OUT_DIR, f"{stem}-p{i}.png")
    pix.save(png)
    print("rendered:", png)
doc.close()
