const STORAGE_KEY = 'kleuterwinkel.v1';

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

const pickerEl = $('#picker');
const cardsEl = $('#cards');
const sheetMetaEl = $('#sheetMeta');

const showNameEl = $('#showName');
const showPriceEl = $('#showPrice');
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

function money(n){
  const v = Math.round((Number(n) || 0) * 100) / 100;
  const isInt = Math.abs(v % 1) < 0.0000001;
  const nf = new Intl.NumberFormat('nl-NL', {
    minimumFractionDigits: isInt ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return '€' + nf.format(v);
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

function renderCards(products){
  const cols = String(colsEl.value || '3');
  const colsNum = Math.max(1, Math.min(6, Number.parseInt(cols, 10) || 3));
  const size = String(sizeEl.value || 'm');
  const showName = !!showNameEl.checked;
  const showPrice = !!showPriceEl.checked;
  const showPhoto = !!showPhotoEl.checked;
  const picks = selectedMap();

  cardsEl.setAttribute('data-cols', cols);

  const px = qrPx();
  const cards = [];
  let count = 0;

  for (const code of Object.keys(picks).sort((a,b) => a.localeCompare(b))) {
    const p = products[code];
    if (!p) continue;

    const qty = picks[code];
    for (let i = 0; i < qty; i += 1) {
      count += 1;
      const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=${px}x${px}&data=${encodeURIComponent(code)}`;

      const photoHtml = showPhoto && p.photo ? `
        <div class="qrProductPhotoWrap" aria-hidden="true">
          <img class="qrProductPhoto" src="${escapeAttr(p.photo)}" alt="" />
        </div>
      ` : '';

      const safeName = String(p.name || '').toLowerCase();
      const nameHtml = showName ? `<div class="qrProductName">${escapeHtml(safeName)}</div>` : '';
      const productHtml = (photoHtml || nameHtml) ? `<div class="qrProduct">${photoHtml}${nameHtml}</div>` : '';

      const priceHtml = showPrice ? `<div class="qrPriceBox">${money(p.price)}</div>` : '';

      cards.push(`
        <div class="qrCard" data-size="${escapeAttr(size)}">
          <div class="qrImgWrap">
            <img class="qrImg" data-qr="1" data-code="${escapeAttr(code)}" src="${qrSrc}" alt="QR code ${escapeAttr(code)}" />
          </div>
          <div class="qrBottom" aria-label="Productinformatie">
            ${priceHtml}
            ${productHtml}
          </div>
        </div>
      `);
    }
  }

  if (!cards.length) {
    cardsEl.innerHTML = `
    <div class="card pad" style="background:rgba(255,255,255,.72); box-shadow:none">
      <p class="p" style="margin:0">Selecteer minstens één product en zet het aantal op 1 of hoger.</p>
    </div>
  `;
  } else {
    const rows = [];
    for (let i = 0; i < cards.length; i += colsNum) {
      rows.push(`<div class="qrRow">${cards.slice(i, i + colsNum).join('')}</div>`);
    }
    cardsEl.innerHTML = rows.join('');
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
      fallback.style.fontWeight = '950';
      fallback.style.fontSize = '22px';
      fallback.style.opacity = '0.85';
      fallback.textContent = code;
      img.replaceWith(fallback);
    };
  });

}


function wireUp(products){
  const rerender = () => renderCards(products);

  showNameEl.addEventListener('change', rerender);
  showPriceEl.addEventListener('change', rerender);
  showPhotoEl.addEventListener('change', rerender);
  colsEl.addEventListener('change', rerender);
  sizeEl.addEventListener('change', rerender);

  pickerEl.addEventListener('input', (e) => {
    const t = e.target;
    if (!t) return;
    if (t.matches('input.pick') || t.matches('input.qty')) rerender();
  });

  printBtn.addEventListener('click', () => {
    // Browsers kunnen eigen kopteksten (titel) printen als de gebruiker dat aan laat staan.
    // Een lege titel maakt dat minder storend.
    const oldTitle = document.title;
    document.title = ' ';
    setTimeout(() => {
      window.print();
      setTimeout(() => { document.title = oldTitle; }, 250);
    }, 50);
  });

  closeBtn.addEventListener('click', () => {
    try {
      window.close();
    } catch {
      // ignore
    }
    // If tab cannot close, go back to the app
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
