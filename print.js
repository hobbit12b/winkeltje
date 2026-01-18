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

let paginateTimer = null;
let isPaginating = false;


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
  return '€ ' + v.toFixed(v % 1 === 0 ? 0 : 2);
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

      const photoHtml = showPhoto ? `<img class="qrPhoto" src="${escapeAttr(p.photo)}" alt="" />` : '';
      const nameHtml = showName ? `<div class="qrName">${escapeHtml(p.name)}</div>` : '';
      const priceHtml = showPrice ? `<div class="qrPrice"><span aria-hidden="true">🏷️</span><span>${money(p.price)}</span></div>` : '';

      cards.push(`
        <div class="qrCard" data-size="${escapeAttr(size)}">
          <div class="qrImgWrap">
            <img class="qrImg" data-qr="1" data-code="${escapeAttr(code)}" src="${qrSrc}" alt="QR code ${escapeAttr(code)}" />
          </div>
          <div class="qrMeta">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px">
              <div>
                ${nameHtml}
                <div class="qrCode">Code, ${escapeHtml(code)}</div>
              </div>
              ${photoHtml}
            </div>
            ${priceHtml}
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

  schedulePagination();

}


function mmToPx(mm){
  const div = document.createElement('div');
  div.style.width = `${mm}mm`;
  div.style.position = 'absolute';
  div.style.left = '-1000mm';
  div.style.top = '0';
  div.style.visibility = 'hidden';
  document.body.appendChild(div);
  const px = div.getBoundingClientRect().width;
  div.remove();
  // Fallback in the unlikely case the browser returns 0
  return px || (mm * 3.7795275591);
}

function unpaginate(){
  const pages = [...cardsEl.querySelectorAll('.printPage')];
  if (!pages.length) return;
  const rows = [];
  for (const page of pages) {
    rows.push(...[...page.querySelectorAll(':scope > .qrRow')]);
  }
  cardsEl.innerHTML = '';
  for (const row of rows) cardsEl.appendChild(row);
}

function calcRowsPerPageA4(){
  const firstRow = cardsEl.querySelector('.qrRow');
  if (!firstRow) return 0;

  const rect = firstRow.getBoundingClientRect();
  const cs = getComputedStyle(firstRow);
  const mb = Number.parseFloat(cs.marginBottom || '0') || 0;
  const rowTotal = rect.height + mb;

  // A4 portrait, with @page margin 10mm on all sides
  const printableHeightMm = 297 - 20;
  const printableHeightPx = mmToPx(printableHeightMm);

  return Math.max(1, Math.floor((printableHeightPx + 0.5) / rowTotal));
}

async function paginateForPrint(){
  if (isPaginating) return;
  isPaginating = true;

  try {
    unpaginate();
    const rows = [...cardsEl.querySelectorAll('.qrRow')];
    if (!rows.length) return;

    // Force print styling on screen, so our measurements match the printed page
    document.body.classList.add('forcePrint');

    // Wait for layout to settle
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    const perPage = calcRowsPerPageA4();

    // Wrap rows into pages
    const frag = document.createDocumentFragment();
    let page = null;

    for (let i = 0; i < rows.length; i += 1) {
      if (i % perPage == 0) {
        page = document.createElement('div');
        page.className = 'printPage';
        frag.appendChild(page);
      }
      page.appendChild(rows[i]);
    }

    cardsEl.innerHTML = '';
    cardsEl.appendChild(frag);

  } finally {
    document.body.classList.remove('forcePrint');
    isPaginating = false;
  }
}

function schedulePagination(){
  if (paginateTimer) clearTimeout(paginateTimer);
  paginateTimer = setTimeout(() => { paginateForPrint(); }, 60);
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

  printBtn.addEventListener('click', async () => {
    await paginateForPrint();
    window.print();
  });

  window.addEventListener('beforeprint', () => { paginateForPrint(); });
  window.addEventListener('afterprint', () => { unpaginate(); });

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
