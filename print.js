const STORAGE_KEY = 'kleuterwinkel.v1';

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

const pickerEl = $('#picker');
const cardsEl = $('#cards');
const sheetMetaEl = $('#sheetMeta');

const showPhotoEl = $('#showPhoto');
const colsEl = $('#cols');
const sizeEl = $('#size');

const printBtn = $('#printBtn');
const closeBtn = $('#closeBtn');

function escapeHtml(s){
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttr(s){
  return escapeHtml(s).replaceAll('\n', ' ');
}

function moneyTag(n){
  const v = Number(n) || 0;
  const digits = (Math.round(v * 100) % 100 === 0) ? 0 : 2;
  const txt = v.toLocaleString('nl-NL', { minimumFractionDigits: digits, maximumFractionDigits: 2 });
  return `€${txt}`;
}

function loadProducts(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    const data = JSON.parse(raw);
    return data && data.products ? data.products : {};
  } catch {
    return {};
  }
}

function qrPx(){
  const s = String(sizeEl.value || 'm');
  if (s === 's') return 180;
  if (s === 'l') return 260;
  return 220;
}

function buildPicker(products){
  const list = Object.values(products).sort((a,b) => String(a.code).localeCompare(String(b.code)));
  if (!list.length) {
    pickerEl.innerHTML = `
      <div class="card pad" style="background:rgba(255,255,255,.72); box-shadow:none">
        <p class="p" style="margin:0">Nog geen producten gevonden. Voeg producten toe in docentenmodus, daarna deze pagina opnieuw openen.</p>
      </div>
    `;
    return;
  }

  pickerEl.innerHTML = list.map(p => {
    const label = `${escapeHtml(p.name)} (${escapeHtml(p.code)})`;
    return `
      <div class="pickRow" data-row="${escapeAttr(p.code)}">
        <label class="pickLabel">
          <input type="checkbox" class="pick" data-code="${escapeAttr(p.code)}" checked />
          <span>${label}</span>
        </label>
        <input type="number" class="qty" data-qty="${escapeAttr(p.code)}" min="0" max="60" value="1" aria-label="Aantal kaartjes" />
      </div>
    `;
  }).join('');
}

function selectedMap(){
  const map = {};
  const picks = $$('input.pick', pickerEl);
  for (const cb of picks) {
    const code = cb.getAttribute('data-code');
    const qtyEl = pickerEl.querySelector(`input[data-qty="${CSS.escape(code)}"]`);
    const qty = Math.max(0, Math.min(60, Number(qtyEl?.value || 0)));
    if (cb.checked && qty > 0) map[code] = qty;
  }
  return map;
}

function chunk(arr, size){
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function renderCards(products){
  const cols = Math.max(2, Math.min(4, Number(colsEl.value || 3)));
  const size = String(sizeEl.value || 'm');
  const showPhoto = !!showPhotoEl.checked;
  const picks = selectedMap();

  cardsEl.setAttribute('data-cols', String(cols));

  const px = qrPx();
  const cards = [];
  let count = 0;

  for (const code of Object.keys(picks).sort((a,b) => a.localeCompare(b))) {
    const p = products[code];
    if (!p) continue;

    const qty = picks[code];
    for (let i = 0; i < qty; i += 1) {
      count += 1;

      // Hoge foutcorrectie zodat een klein prijslabel in de marge netjes blijft scannen
      const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=${px}x${px}&ecc=H&margin=12&data=${encodeURIComponent(code)}`;
      const photoHtml = showPhoto ? `<img class="qrPhoto" src="${escapeAttr(p.photo)}" alt="" />` : '';

      cards.push(`
        <div class="qrCard" data-size="${escapeAttr(size)}">
          <div class="qrImgWrap">
            <img class="qrImg" data-qr="1" data-code="${escapeAttr(code)}" src="${qrSrc}" alt="QR code ${escapeAttr(code)}" />
            <div class="qrBadge" aria-hidden="true">${moneyTag(p.price)}</div>
          </div>
          <div class="qrBottom">
            ${photoHtml}
            <div class="qrCodeOnly">${escapeHtml(code)}</div>
          </div>
        </div>
      `);
    }
  }

  if (!cards.length) {
    cardsEl.innerHTML = `
      <div class="card pad" style="background:rgba(255,255,255,.72); box-shadow:none">
        <p class="p" style="margin:0">Selecteer minstens een product en zet het aantal op 1 of hoger.</p>
      </div>
    `;
  } else {
    const rows = chunk(cards, cols).map(row => `<div class="qrRow">${row.join('')}</div>`).join('');
    cardsEl.innerHTML = rows;
  }

  const today = new Date();
  const d = today.toLocaleDateString('nl-NL');
  sheetMetaEl.textContent = `${count} kaartjes, datum ${d}`;

  // Fallback if QR image cannot load
  $$('img[data-qr="1"]', cardsEl).forEach(img => {
    img.onerror = () => {
      const code = img.getAttribute('data-code') || '';
      const fallback = document.createElement('div');
      fallback.style.padding = '18px 10px';
      fallback.style.textAlign = 'center';
      fallback.style.fontWeight = '900';
      fallback.style.fontSize = '22px';
      fallback.style.opacity = '0.85';
      fallback.textContent = code;
      img.replaceWith(fallback);
    };
  });
}

function wireUp(products){
  const rerender = () => renderCards(products);

  showPhotoEl.addEventListener('change', rerender);
  colsEl.addEventListener('change', rerender);
  sizeEl.addEventListener('change', rerender);

  pickerEl.addEventListener('input', (e) => {
    const t = e.target;
    if (!t) return;
    if (t.matches('input.pick') || t.matches('input.qty')) rerender();
  });

  printBtn.addEventListener('click', () => window.print());

  closeBtn.addEventListener('click', () => {
    try { window.close(); } catch {}
    setTimeout(() => {
      if (!document.hidden) window.location.href = 'index.html#home';
    }, 120);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeBtn.click();
  });
}

function init(){
  const products = loadProducts();
  buildPicker(products);
  wireUp(products);
  renderCards(products);
}

init();
