const base = new URL('../../vendor/', import.meta.url).href;
let ocrScript = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Chargement impossible'));
    document.head.appendChild(s);
  });
}

async function pdfText(file, onProgress) {
  const pdfjs = await import(`${base}pdf/pdf.min.mjs`);
  pdfjs.GlobalWorkerOptions.workerSrc = `${base}pdf/pdf.worker.min.mjs`;
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer(), isEvalSupported: false }).promise;
  const lines = [];
  for (let n = 1; n <= Math.min(doc.numPages, 10); n++) {
    onProgress?.(`Lecture de la page ${n}…`);
    const content = await (await doc.getPage(n)).getTextContent();
    const items = content.items.filter((it) => it.str?.trim()).map((it) => ({ x: it.transform[4], y: it.transform[5], h: Math.abs(it.transform[3]) || 8, s: it.str }));
    items.sort((a, b) => b.y - a.y || a.x - b.x);
    const rows = [];
    for (const it of items) {
      const row = rows.find((r) => Math.abs(r.y - it.y) <= Math.max(2.5, it.h * 0.45));
      if (row) row.items.push(it); else rows.push({ y: it.y, items: [it] });
    }
    rows.sort((a, b) => b.y - a.y).forEach((r) => {
      lines.push(r.items.sort((a, b) => a.x - b.x).map((i) => i.s.trim()).join('   '));
    });
  }
  return lines.join('\n');
}

async function imageText(file, onProgress) {
  if (!window.Tesseract) { ocrScript = ocrScript || loadScript(`${base}ocr/tesseract.min.js`); await ocrScript; }
  onProgress?.('Préparation de la lecture…');
  const worker = await window.Tesseract.createWorker('fra', 1, {
    workerPath: `${base}ocr/worker.min.js`, corePath: `${base}ocr/`, langPath: `${base}ocr`,
    workerBlobURL: false, gzip: true,
    logger: (m) => { if (m.status === 'recognizing text') onProgress?.(`Lecture du ticket… ${Math.round(m.progress * 100)} %`); },
  });
  try {
    await worker.setParameters({ preserve_interword_spaces: '1' });
    const { data } = await worker.recognize(file);
    return data.text;
  } finally { await worker.terminate(); }
}

export async function ticketTextFromFile(file, onProgress) {
  if (!file) throw new Error('Aucun fichier');
  if (file.size > 15 * 1024 * 1024) throw new Error('Fichier trop lourd');
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');
  if (isPdf) {
    const text = await pdfText(file, onProgress);
    if (text.replace(/\s/g, '').length > 30) return text;
    throw new Error('Ce PDF ne contient pas de texte lisible. Envoie plutôt une capture d’écran.');
  }
  if (file.type.startsWith('image/')) return imageText(file, onProgress);
  throw new Error('Format non pris en charge (PDF ou image uniquement)');
}

export async function takeSharedTicket() {
  try {
    const cache = await caches.open('cocotte-share');
    const res = await cache.match('shared-ticket');
    if (!res) return null;
    await cache.delete('shared-ticket');
    const blob = await res.blob();
    let name = 'ticket';
    try { name = decodeURIComponent(res.headers.get('x-name') || 'ticket'); } catch {}
    return new File([blob], name, { type: blob.type });
  } catch { return null; }
}
