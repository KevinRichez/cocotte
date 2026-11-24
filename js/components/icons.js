import { h } from '../lib/h.js';

const P = {
  calendar: [['rect', { x: 3, y: 4, width: 18, height: 18, rx: 3 }], ['path', { d: 'M16 2v4M8 2v4M3 10h18' }]],
  cart: [['circle', { cx: 8, cy: 21, r: 1 }], ['circle', { cx: 19, cy: 21, r: 1 }], ['path', { d: 'M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12' }]],
  book: [['path', { d: 'M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z' }], ['path', { d: 'M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z' }]],
  user: [['circle', { cx: 12, cy: 8, r: 4 }], ['path', { d: 'M4 21a8 8 0 0 1 16 0' }]],
  plus: [['path', { d: 'M12 5v14M5 12h14' }]],
  minus: [['path', { d: 'M5 12h14' }]],
  check: [['path', { d: 'M20 6 9 17l-5-5' }]],
  checks: [['path', { d: 'M18 6 7 17l-5-5M22 10l-7.5 7.5L13 16' }]],
  x: [['path', { d: 'M18 6 6 18M6 6l12 12' }]],
  gear: [['path', { d: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' }], ['circle', { cx: 12, cy: 12, r: 3 }]],
  chevL: [['path', { d: 'm15 18-6-6 6-6' }]],
  chevR: [['path', { d: 'm9 18 6-6-6-6' }]],
  chevD: [['path', { d: 'm6 9 6 6 6-6' }]],
  chevU: [['path', { d: 'm18 15-6-6-6 6' }]],
  clock: [['circle', { cx: 12, cy: 12, r: 9 }], ['path', { d: 'M12 7v5l3 2' }]],
  flame: [['path', { d: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z' }]],
  search: [['circle', { cx: 11, cy: 11, r: 7 }], ['path', { d: 'm21 21-4.3-4.3' }]],
  swap: [['path', { d: 'm16 3 4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16' }]],
  trash: [['path', { d: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }]],
  receipt: [['path', { d: 'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z' }], ['path', { d: 'M16 8H8M16 12H8M13 16H8' }]],
  sparkles: [['path', { d: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z' }], ['path', { d: 'M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z' }]],
  fridge: [['rect', { x: 5, y: 2, width: 14, height: 20, rx: 2 }], ['path', { d: 'M5 10h14M9 5v2M9 13v3' }]],
  box: [['path', { d: 'M21 8 12 3 3 8v8l9 5 9-5z' }], ['path', { d: 'm3 8 9 5 9-5M12 13v8' }]],
  camera: [['path', { d: 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z' }], ['circle', { cx: 12, cy: 13, r: 3 }]],
  barcode: [['path', { d: 'M3 5v14M7 5v14M11 5v14M14 5v14M18 5v14M21 5v14' }]],
  clipboard: [['rect', { x: 8, y: 2, width: 8, height: 4, rx: 1 }], ['path', { d: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2' }]],
  edit: [['path', { d: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z' }]],
  utensils: [['path', { d: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7' }]],
  cloud: [['path', { d: 'M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9Z' }]],
  info: [['circle', { cx: 12, cy: 12, r: 9 }], ['path', { d: 'M12 16v-4M12 8h.01' }]],
  refresh: [['path', { d: 'M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5' }]],
  bag: [['path', { d: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z' }], ['path', { d: 'M3 6h18M16 10a4 4 0 0 1-8 0' }]],
  sliders: [['path', { d: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6' }]],
  globe: [['circle', { cx: 12, cy: 12, r: 9 }], ['path', { d: 'M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18' }]],
  upload: [['path', { d: 'M12 15V3M7 8l5-5 5 5' }], ['path', { d: 'M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4' }]],
  download: [['path', { d: 'M12 3v12M7 10l5 5 5-5' }], ['path', { d: 'M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4' }]],
  arrowR: [['path', { d: 'M5 12h14M13 6l6 6-6 6' }]],
  arrowL: [['path', { d: 'M19 12H5M11 18l-6-6 6-6' }]],
};

export function Icon({ name, size = 20, stroke = 2, class: cls = '' }) {
  return h('svg', {
    class: cls, width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    'stroke-width': stroke, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true',
  }, (P[name] || []).map(([tag, attrs], k) => h(tag, { ...attrs, key: k })));
}
