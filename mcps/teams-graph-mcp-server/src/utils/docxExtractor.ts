import { execFileSync } from "child_process";

/**
 * Script Python que extrae el texto de un .docx usando zipfile + lxml.
 * Lee el binario desde stdin (no necesita fichero temporal en disco).
 * Preserva la jerarquía de headings como Markdown (#, ##, ###).
 * Python script that extracts text from a .docx using zipfile + lxml.
 * Reads the binary from stdin (no temp file on disk needed).
 * Preserves heading hierarchy as Markdown (#, ##, ###).
 */
const EXTRACT_SCRIPT = `
import sys, io, zipfile
from lxml import etree

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

HEADING_PREFIX = {
    'Ttulo1': '#',   'Ttulo2': '##',   'Ttulo3': '###',
    'Heading1': '#', 'Heading2': '##', 'Heading3': '###',
    'Title': '#',
}

def para_text(p):
    return ''.join(t.text or '' for t in p.iter('{%s}t' % W))

def para_style(p):
    pPr = p.find('{%s}pPr' % W)
    if pPr is None:
        return ''
    ps = pPr.find('{%s}pStyle' % W)
    return ps.get('{%s}val' % W, '') if ps is not None else ''

# Leer el binario .docx desde stdin en memoria, sin escribir en disco /
# Read the .docx binary from stdin into memory, without writing to disk
data = sys.stdin.buffer.read()
with zipfile.ZipFile(io.BytesIO(data)) as z:
    doc = etree.fromstring(z.read('word/document.xml'))

lines = []
for p in doc.iter('{%s}p' % W):
    text = para_text(p).strip()
    if not text:
        continue
    style = para_style(p)
    prefix = HEADING_PREFIX.get(style, '')
    lines.append(('\\n' + prefix + ' ' + text) if prefix else text)

print('\\n'.join(lines))
`;

/**
 * Extrae el texto de un buffer .docx usando Python (zipfile + lxml).
 * El binario se pasa por stdin y el script por -c: no se escriben ficheros temporales.
 * Extracts text from a .docx buffer using Python (zipfile + lxml).
 * Binary is passed via stdin and script via -c: no temp files are written.
 */
export function extractDocxText(buffer: Buffer): string {
  // Pasar el script con -c y el binario .docx por stdin; sin ficheros temporales /
  // Pass the script with -c and the .docx binary via stdin; no temp files
  return execFileSync("python3", ["-c", EXTRACT_SCRIPT], {
    input: buffer,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024, // 20 MB
    timeout: 30_000,
  });
}

