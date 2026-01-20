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
  return '€ ' + v.toFixed(v % 1 === 0 ? 0 : 2);
}
function moneyTag(n){
  const s = money(n);
  return s.replace('€ ', '€');
}


function loadProducts(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    const data = JSON.parse(raw);
    const products = data && data.products ? data.products : {};

    // v4 migratie: standaardcodes starten bij 100 (voorheen 101)
    const storedVersion = Number(data?.catalogVersion) || 0;
    if (storedVersion > 0 && storedVersion < 4 && products['101'] && !products['100']) {
      const map = {
        '101':'100','102':'101','103':'102','104':'103','105':'104','106':'105','107':'106','108':'107','109':'108','110':'109',
        '111':'110','112':'111','113':'112','114':'113','115':'114','116':'115','117':'116','118':'117','119':'118','120':'119',
        '121':'120','122':'121','123':'122','124':'123','125':'124','126':'125','127':'126','128':'127','129':'128','130':'129',
        '131':'130','132':'131','133':'132','134':'133','135':'134'
      };
      const next = { ...products };
      for (const [oldCode, newCode] of Object.entries(map)) {
        const p = next[oldCode];
        if (!p) continue;
        if (!next[newCode]) next[newCode] = { ...p, code: newCode };
        delete next[oldCode];
      }
      return next;
    }

    return products;
  } catch {
    return {};
  }
}

const QR_PX = 220;


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
  const cols = Number(String(colsEl.value || '3')) || 3;
  const size = 'm';
  const showPrice = !!showPriceEl.checked;
  const showPhoto = !!showPhotoEl.checked;
  const picks = selectedMap();

  cardsEl.setAttribute('data-cols', String(cols));

  const px = QR_PX;
  const cards = [];
  let count = 0;

  const codes = Object.keys(picks).sort((a,b) => a.localeCompare(b));
  for (const code of codes) {
    const p = products[code];
    if (!p) continue;
    const qty = picks[code];
    for (let i = 0; i < qty; i += 1) {
      count += 1;
      const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=${px}x${px}&data=${encodeURIComponent(code)}`;

      const photoHtml = showPhoto
        ? `<div class="qrProductWrap"><img class="qrProductImg" src="${escapeAttr(p.photo)}" alt="" /></div>`
        : `<div class="qrProductWrap" aria-hidden="true"></div>`;

      // Prijs nooit op de QR zelf, anders kan de QR onleesbaar worden.
      const priceHtml = showPrice ? `<div class="qrPriceCorner">${moneyTag(p.price)}</div>` : `<div class="qrPriceCorner" aria-hidden="true"></div>`;

      cards.push(`
        <div class="qrCard" data-size="${escapeAttr(size)}">
          <div class="qrQrWrap">
            <img class="qrImg" data-qr="1" data-code="${escapeAttr(code)}" src="${qrSrc}" alt="QR code ${escapeAttr(code)}" />
          </div>
          ${photoHtml}
          <div class="qrBottom">
            <div class="qrBottomSpacer" aria-hidden="true"></div>
            <div class="qrCodeBig">${escapeHtml(code)}</div>
            ${priceHtml}
          </div>
        </div>
      `);
    }
  }

  // Bouw rijen, zodat pagina-afbreking alleen tussen rijen gebeurt
  if (!cards.length) {
    cardsEl.innerHTML = `
      <div class="card pad" style="background:rgba(255,255,255,.72); box-shadow:none">
        <p class="p" style="margin:0">Selecteer minstens één product en zet het aantal op 1 of hoger.</p>
      </div>
    `;
  } else {
    const rows = [];
    for (let i = 0; i < cards.length; i += cols) {
      const chunk = cards.slice(i, i + cols).join('');
      rows.push(`<div class="qrRow" data-cols="${cols}">${chunk}</div>`);
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
      fallback.style.fontWeight = '800';
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
pickerEl.addEventListener('input', (e) => {
    const t = e.target;
    if (!t) return;
    if (t.matches('input.pick') || t.matches('input.qty')) rerender();
  });

  printBtn.addEventListener('click', () => window.print());

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