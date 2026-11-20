const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];
let zxingPromise = null;

function loadZxing() {
  if (window.ZXing) return Promise.resolve(window.ZXing);
  if (!zxingPromise) {
    zxingPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'vendor/zxing.min.js';
      s.onload = () => resolve(window.ZXing);
      s.onerror = () => { zxingPromise = null; reject(new Error('Lecteur indisponible')); };
      document.head.appendChild(s);
    });
  }
  return zxingPromise;
}

async function nativeDetector() {
  if (!('BarcodeDetector' in window)) return null;
  try {
    const supported = await window.BarcodeDetector.getSupportedFormats();
    const formats = FORMATS.filter((f) => supported.includes(f));
    return formats.length ? new window.BarcodeDetector({ formats }) : null;
  } catch { return null; }
}

export async function startScan(video, onCode) {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Caméra indisponible sur ce navigateur');
  const detector = await nativeDetector();
  if (detector) {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    video.srcObject = stream;
    await video.play();
    let stopped = false;
    const tick = async () => {
      if (stopped) return;
      try {
        const codes = await detector.detect(video);
        if (codes[0]?.rawValue) { onCode(codes[0].rawValue); return; }
      } catch {}
      setTimeout(tick, 180);
    };
    tick();
    return () => { stopped = true; stream.getTracks().forEach((t) => t.stop()); video.srcObject = null; };
  }
  const ZX = await loadZxing();
  const reader = new ZX.BrowserMultiFormatReader();
  await reader.decodeFromConstraints({ video: { facingMode: 'environment' } }, video, (result) => { if (result) onCode(result.getText()); });
  return () => { try { reader.reset(); } catch {} };
}

export async function decodeImage(file) {
  const detector = await nativeDetector();
  if (detector) {
    const bmp = await createImageBitmap(file);
    const codes = await detector.detect(bmp);
    if (codes[0]?.rawValue) return codes[0].rawValue;
  }
  const ZX = await loadZxing();
  const url = URL.createObjectURL(file);
  try {
    const res = await new ZX.BrowserMultiFormatReader().decodeFromImageUrl(url);
    return res.getText();
  } finally { URL.revokeObjectURL(url); }
}
