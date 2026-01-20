const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

const appEl = $('#app');
const screenEl = $('#screen');
const backBtn = $('#backBtn');
const toastEl = $('#toast');
const modalEl = $('#modal');
const modalCard = $('#modalCard');
const topbar = $('#topbar');
const topbarTitle = $('#topbarTitle');
const cartMiniBtn = $('#cartMiniBtn');
const cartMiniTotal = $('#cartMiniTotal');
const cartMiniBadge = $('#cartMiniBadge');

const STORAGE_KEY = 'kleuterwinkel.v1';
const DEFAULT_CATALOG_VERSION = 4;

const DEFAULT_PRODUCTS = {
  '100': { code: '100', name: 'Banaan', price: 1, photo: 'assets/banaan.png' },
  '101': { code: '101', name: 'Sinaasappel', price: 1, photo: 'assets/sinaasappel.png' },
  '102': { code: '102', name: 'Brood', price: 2, photo: 'assets/brood.png' },
  '103': { code: '103', name: 'Croissant', price: 1, photo: 'assets/croissant.png' },
  '104': { code: '104', name: 'Melk', price: 2, photo: 'assets/melk.png' },
  '105': { code: '105', name: 'Boter', price: 2, photo: 'assets/boter.png' },
  '106': { code: '106', name: 'Ei', price: 1, photo: 'assets/ei.png' },
  '107': { code: '107', name: 'Eierdoos', price: 3, photo: 'assets/eierdoos.png' },
  '108': { code: '108', name: 'Worst', price: 2, photo: 'assets/worst.png' },
  '109': { code: '109', name: 'Ijs', price: 2, photo: 'assets/ijs.png' },
  '110': { code: '110', name: 'Soep', price: 2, photo: 'assets/soep.png' },
  '111': { code: '111', name: 'Snoep', price: 1, photo: 'assets/snoep.png' },
  '112': { code: '112', name: 'Chocolade', price: 2, photo: 'assets/chocolade.png' },
  '113': { code: '113', name: 'Appel', price: 1, photo: 'assets/appel.png' },
  '114': { code: '114', name: 'Peer', price: 1, photo: 'assets/peer.png' },
  '115': { code: '115', name: 'Druiven', price: 1, photo: 'assets/druiven.png' },
  '116': { code: '116', name: 'Mandarijn', price: 1, photo: 'assets/mandarijn.png' },
  '117': { code: '117', name: 'Wortel', price: 1, photo: 'assets/wortel.png' },
  '118': { code: '118', name: 'Mais', price: 1, photo: 'assets/mais.png' },
  '119': { code: '119', name: 'Hamburger', price: 2, photo: 'assets/hamburger.png' },
  '120': { code: '120', name: 'Hagelslag', price: 2, photo: 'assets/hagelslag.png' },
  '121': { code: '121', name: 'Choco Pops', price: 2, photo: 'assets/choco_pops.png' },
  '122': { code: '122', name: 'Drinkyoghurt', price: 2, photo: 'assets/drinkyoghurt.png' },
  '123': { code: '123', name: 'Sap', price: 1, photo: 'assets/sap.png' },
  '124': { code: '124', name: 'Appelsap', price: 2, photo: 'assets/appelsap.png' },
  '125': { code: '125', name: 'Chocomel', price: 1, photo: 'assets/chocomel.png' },
  '126': { code: '126', name: 'Koffiemelk', price: 2, photo: 'assets/koffiemelk.png' },
  '127': { code: '127', name: 'Cappuccino', price: 2, photo: 'assets/cappuccino.png' },
  '128': { code: '128', name: 'Thee', price: 2, photo: 'assets/thee.png' },
  '129': { code: '129', name: 'Potje', price: 2, photo: 'assets/potje.png' },
  '130': { code: '130', name: 'Kruiden', price: 2, photo: 'assets/kruiden.png' },
  '131': { code: '131', name: 'Philadelphia', price: 3, photo: 'assets/philadelphia.png' },
  '132': { code: '132', name: 'Koekjes', price: 1, photo: 'assets/koekjes.png' },
  '133': { code: '133', name: 'Bonbon', price: 2, photo: 'assets/bonbon.png' },
  '134': { code: '134', name: 'Chocola', price: 1, photo: 'assets/chocola.png' },

  '135': { code: '135', name: 'Banaan 2', price: 1, photo: 'assets/banaan_2.png' },
  '136': { code: '136', name: 'Appel 2', price: 1, photo: 'assets/appel_2.png' },
  '137': { code: '137', name: 'Sinaasappel 2', price: 1, photo: 'assets/sinaasappel_2.png' },
  '138': { code: '138', name: 'Boter 2', price: 2, photo: 'assets/boter_2.png' },
  '139': { code: '139', name: 'Boter 3', price: 2, photo: 'assets/boter_3.png' },
  '140': { code: '140', name: 'Melk 2', price: 2, photo: 'assets/melk_2.png' },
  '141': { code: '141', name: 'Ijs 2', price: 2, photo: 'assets/ijs_2.png' },
  '142': { code: '142', name: 'Soep 2', price: 2, photo: 'assets/soep_2.png' }
};

const state = loadState();
if (window.__needsCatalogSave) {
  try { state.catalogVersion = DEFAULT_CATALOG_VERSION; saveState(); } catch {}
  window.__needsCatalogSave = false;
}

let activeStream = null;
let detector = null;
let qrMode = null; // 'barcode' | 'jsqr'
let scanCanvas = null;
let scanCtx = null;
let lastScan = { code: '', t: 0 };
let cameraStarting = false;
let teacherFlowOpen = false;

// Startknop en inactiviteit
window.__gameStarted = window.__gameStarted || false;
window.__cameraActive = window.__cameraActive || false;
let inactivityTimerId = 0;

function clearInactivityTimer(){
  if (!inactivityTimerId) return;
  try { clearTimeout(inactivityTimerId); } catch {}
  inactivityTimerId = 0;
}

function resetInactivityTimer(){
  if (!window.__cameraActive) return;
  clearInactivityTimer();
  inactivityTimerId = setTimeout(() => {
    // Alleen terug naar start als de camera actief is en er verder niets speelt
    if (!window.__cameraActive) return;
    if (teacherFlowOpen) return;
    if (!modalEl.classList.contains('hidden')) return;
    if (window.__currentScannedProduct) return;
    if (window.location.hash !== '#shop') return;
    window.__gameStarted = false;
    pauseScanner();
    renderShop();
  }, 40000);
}

function setCameraActive(on){
  window.__cameraActive = Boolean(on);
  if (window.__cameraActive) resetInactivityTimer();
  else clearInactivityTimer();
}

function isPortrait(){
  // iPad Safari kan tijdens laden heel even een verkeerde orientation melden.
  // Daarom beschouwen we het pas als portret als zowel matchMedia als de schermmaten dat bevestigen.
  const byMedia = Boolean(window.matchMedia && window.matchMedia('(orientation: portrait)').matches);
  const bySize = (window.innerHeight || 0) > (window.innerWidth || 0);
  return byMedia && bySize;
}

function pauseScanner(){
  window.__isScanning = false;
  setCameraActive(false);
  stopScanLoop({ stopStream: true });
}

function resumeScanner(){
  if (teacherFlowOpen) return;
  if (isPortrait()) return;
  window.__currentScannedProduct = null;
  window.__isScanning = Boolean(window.__gameStarted);
  if (window.location.hash === '#shop') renderShop();
}

let audioCtx = null;
function beep({ freq = 520, dur = 0.06, type = 'sine', vol = 0.06 } = {}){
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioCtx = audioCtx || new Ctx();
    const t0 = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  } catch {
    // ignore
  }
}
function playClick(){
  beep({ freq: 560, dur: 0.045, type: 'sine', vol: 0.06 });
}
function playScanPing(){
  // geen geluid bij het scannen
}
function playSuccess(){
  beep({ freq: 660, dur: 0.06, type: 'sine', vol: 0.07 });
  setTimeout(() => beep({ freq: 880, dur: 0.07, type: 'sine', vol: 0.07 }), 70);
}
function playError(){
  beep({ freq: 220, dur: 0.12, type: 'square', vol: 0.05 });
}

// MP3 effecten (betrouwbaar op iPad, alleen na een gebruikersactie)
const SFX = {
  add: null,
  paid: null
};

function ensureSfx(){
  try {
    if (!SFX.add) {
      SFX.add = new Audio('assets/biepgeluid.mp3');
      SFX.add.preload = 'auto';
    }
    if (!SFX.paid) {
      SFX.paid = new Audio('assets/betaald.mp3');
      SFX.paid.preload = 'auto';
    }
  } catch {
    // ignore
  }
}

function playSfx(which){
  ensureSfx();
  const a = SFX[which];
  const src = which === 'add' ? 'assets/biepgeluid.mp3' : (which === 'paid' ? 'assets/betaald.mp3' : '');
  if (!a || !src) return;

  const tryPlay = (audio) => {
    try {
      audio.pause();
      audio.currentTime = 0;
      const p = audio.play();
      if (p && typeof p.catch === 'function') return p;
      return Promise.resolve();
    } catch {
      return Promise.reject(new Error('audio'));
    }
  };

  tryPlay(a).catch(() => {
    // iPad Safari valt soms stil bij herhaald play. Een verse Audio werkt dan wél.
    try {
      const fresh = new Audio(src);
      fresh.preload = 'auto';
      tryPlay(fresh).catch(() => {
        // laatste vangnet
        if (which === 'add') beep({ freq: 780, dur: 0.06, type: 'sine', vol: 0.07 });
        if (which === 'paid') beep({ freq: 520, dur: 0.08, type: 'sine', vol: 0.07 });
      });
    } catch {
      if (which === 'add') beep({ freq: 780, dur: 0.06, type: 'sine', vol: 0.07 });
      if (which === 'paid') beep({ freq: 520, dur: 0.08, type: 'sine', vol: 0.07 });
    }
  });
}


function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {
      products: DEFAULT_PRODUCTS,
      cartLines: [],
      teacherPin: '1234',
      catalogVersion: DEFAULT_CATALOG_VERSION
    };
  }
  try {
    const data = JSON.parse(raw);
    const cartLines = Array.isArray(data.cartLines)
      ? data.cartLines
      : Array.isArray(data.cart)
        ? migrateCart(data.cart)
        : [];

    const teacherPin = typeof data.teacherPin === 'string' ? data.teacherPin : '1234';
    const storedVersion = Number(data.catalogVersion) || 0;

    // v4: standaardcodes starten bij 100 (voorheen 101). We migreren bestaande data 1x.
    if (storedVersion > 0 && storedVersion < 4) {
      const map = {
        '101':'100','102':'101','103':'102','104':'103','105':'104','106':'105','107':'106','108':'107','109':'108','110':'109',
        '111':'110','112':'111','113':'112','114':'113','115':'114','116':'115','117':'116','118':'117','119':'118','120':'119',
        '121':'120','122':'121','123':'122','124':'123','125':'124','126':'125','127':'126','128':'127','129':'128','130':'129',
        '131':'130','132':'131','133':'132','134':'133','135':'134'
      };

      // Alleen migreren als het echt nog de oude set is
      const hasOld = data?.products && data.products['101'] && !data.products['100'];
      if (hasOld) {
        // producten
        const nextProducts = { ...(data.products || {}) };
        for (const [oldCode, newCode] of Object.entries(map)) {
          const p = nextProducts[oldCode];
          if (!p) continue;
          if (!nextProducts[newCode]) {
            nextProducts[newCode] = { ...p, code: newCode };
          }
          delete nextProducts[oldCode];
        }
        data.products = nextProducts;

        // mandje
        for (const line of cartLines) {
          const nc = map[String(line?.code || '').trim()];
          if (nc) line.code = nc;
        }

        // We willen na de migratie opslaan, zodat print.html ook meteen goed zit
        window.__needsCatalogSave = true;
      }
    }

    if (storedVersion < DEFAULT_CATALOG_VERSION) window.__needsCatalogSave = true;

    // Bij een nieuwe standaard productset: voeg nieuwe producten toe, maar behoud eigen wijzigingen.
    const existing = (data.products && Object.keys(data.products).length) ? data.products : {};
    const upgraded = (storedVersion < DEFAULT_CATALOG_VERSION);
    const products = upgraded
      ? { ...DEFAULT_PRODUCTS, ...existing }
      : (Object.keys(existing).length ? existing : DEFAULT_PRODUCTS);

    // Na een upgrade slaan we 1x terug op, zodat print.html direct de nieuwste set ziet
    if (upgraded) window.__needsCatalogSave = true;

    return {
      products,
      cartLines,
      teacherPin,
      catalogVersion: DEFAULT_CATALOG_VERSION
    };
  } catch {
    return { products: DEFAULT_PRODUCTS, cartLines: [], teacherPin: '1234', catalogVersion: DEFAULT_CATALOG_VERSION };
  }
}

function migrateCart(cartArr){
  const map = new Map();
  for (const it of cartArr || []) {
    const code = String(it?.code || '').trim();
    if (!code) continue;
    const prev = map.get(code) || { code, qty: 0, updatedAt: 0 };
    prev.qty += 1;
    prev.updatedAt = Math.max(prev.updatedAt, Number(it?.addedAt) || Date.now());
    map.set(code, prev);
  }
  return [...map.values()];
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateBadge();
}

function money(n){
  const v = Math.round((Number(n) || 0) * 100) / 100;
  return '€ ' + v.toFixed(v % 1 === 0 ? 0 : 2);
}

function moneyTag(n){
  return money(n).replace('€ ', '€');
}

function cartTotal(){
  return (state.cartLines || []).reduce((sum, line) => {
    const p = state.products?.[line.code];
    const price = Number(p?.price) || 0;
    const qty = Number(line.qty) || 0;
    return sum + price * qty;
  }, 0);
}

function cartCount(){
  return (state.cartLines || []).reduce((n, line) => n + (Number(line.qty) || 0), 0);
}

function updateBadge(){
  const count = cartCount();
  const total = cartTotal();

  if (cartMiniTotal) cartMiniTotal.textContent = money(total);

  if (count > 0) {
    if (cartMiniBtn) cartMiniBtn.classList.remove('hidden');
    if (cartMiniBadge) {
      cartMiniBadge.textContent = String(count);
      cartMiniBadge.classList.remove('hidden');
    }
  } else {
    if (cartMiniBadge) cartMiniBadge.classList.add('hidden');
    // Op home tonen we ook een leeg totaal, dus knop blijft zichtbaar
    if (cartMiniBtn && (window.location.hash || '#home') !== '#shop') {
      cartMiniBtn.classList.remove('hidden');
    }
  }
}

function addToCartLine(code){
  const c = String(code || '').trim();
  if (!c) return;
  const now = Date.now();
  const lines = state.cartLines || (state.cartLines = []);
  const existing = lines.find(l => l.code === c);
  if (existing) {
    existing.qty = (Number(existing.qty) || 0) + 1;
    existing.updatedAt = now;
  } else {
    lines.push({ code: c, qty: 1, updatedAt: now });
  }
}

function setTopbar(mode){
  // mode: 'home' | 'shop'
  if (!topbar) return;
  const isHome = mode === 'home';
  topbar.classList.toggle('hidden', isHome);
  topbar.classList.toggle('topbar--shop', mode === 'shop');
  if (appEl) appEl.classList.toggle('noTopbar', isHome);
  if (cartMiniBtn) cartMiniBtn.classList.add('hidden');
}

function toast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 1400);
}

function navigate(hash){
  window.location.hash = hash;
}

function setBack(visible, onClick){
  if (visible) backBtn.classList.remove('hidden');
  else backBtn.classList.add('hidden');
  backBtn.onclick = onClick || null;
}


function waitVideoReady(video){
  if (!video) return Promise.resolve();
  if (video.videoWidth && video.videoHeight) return Promise.resolve();
  return new Promise((resolve) => {
    const on = () => resolve();
    video.addEventListener('loadedmetadata', on, { once: true });
  });
}

function stopCamera(){
  if (activeStream) {
    activeStream.getTracks().forEach(t => t.stop());
    activeStream = null;
  }
  setCameraActive(false);
}

function sleep(ms){
  return new Promise(r => setTimeout(r, ms));
}

async function animateProductToReceipt(code){
  const c = String(code || '').trim();
  if (!c) return;

  const receipt = document.getElementById('receiptList');
  const srcImg = document.querySelector('.productWindow .productPhoto img');

  // Geen bonnetje in beeld, voeg dan gewoon toe
  if (!receipt) {
    addToCartLine(c);
    saveState();
    return;
  }

  const cssEscape = (s) => {
    try {
      if (window.CSS && typeof CSS.escape === 'function') return CSS.escape(String(s));
    } catch {}
    return String(s).replace(/[^a-zA-Z0-9_\-]/g, (m) => `\\${m}`);
  };

  const getCodeFromItem = (el) => {
    const del = el.querySelector('.receiptDel');
    return del ? (del.getAttribute('data-del') || '') : '';
  };

  // Oude posities vastleggen
  const oldRects = {};
  receipt.querySelectorAll('.receiptItem').forEach(el => {
    const k = getCodeFromItem(el);
    if (k) oldRects[k] = el.getBoundingClientRect();
  });

  // State updaten en bonnetje opnieuw tekenen (nieuwe item bovenaan)
  addToCartLine(c);
  saveState();
  renderReceipt();
  updatePayBar();

  // Nieuwe posities
  const items = Array.from(receipt.querySelectorAll('.receiptItem'));
  const newRects = {};
  items.forEach(el => {
    const k = getCodeFromItem(el);
    if (k) newRects[k] = el.getBoundingClientRect();
  });

  const D = 620;

  // FLIP animatie voor bestaande items
  items.forEach(el => {
    const k = getCodeFromItem(el);
    const oldR = oldRects[k];
    const newR = newRects[k];
    if (!oldR || !newR) return;
    const dx = oldR.left - newR.left;
    const dy = oldR.top - newR.top;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
    el.style.transition = 'transform 0s';
    el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
  });

  // Force reflow
  void receipt.offsetHeight;

  items.forEach(el => {
    el.style.transition = `transform ${D}ms cubic-bezier(.2,.85,.2,1)`;
    el.style.transform = '';
  });

  // Doel element voor het nieuwe item
  const targetItem = receipt.querySelector('.receiptDel[data-del="' + c + '"]')?.closest('.receiptItem');
  const targetImg = targetItem?.querySelector('.receiptThumb img');

  if (targetItem) {
    targetItem.classList.add('isJustAdded');
    clearTimeout(targetItem._addT);
    targetItem._addT = setTimeout(() => targetItem.classList.remove('isJustAdded'), 900);
  }

  // Vlieg animatie: laat de productillustratie precies landen op de thumbnail plek
  const fly = async () => {
    if (!srcImg || !targetImg) return;
    const s = srcImg.getBoundingClientRect();
    const d = targetImg.getBoundingClientRect();

    // Thumb tijdelijk verbergen zodat het lijkt alsof het echt landt
    targetImg.style.transition = 'opacity 140ms ease';
    targetImg.style.opacity = '0';

    const clone = srcImg.cloneNode(true);
    clone.classList.add('flyToCart');
    clone.style.position = 'fixed';
    clone.style.left = `${s.left}px`;
    clone.style.top = `${s.top}px`;
    clone.style.width = `${s.width}px`;
    clone.style.height = `${s.height}px`;
    clone.style.margin = '0';
    clone.style.pointerEvents = 'none';
    clone.style.zIndex = '9999';
    clone.style.objectFit = 'contain';
    clone.style.transformOrigin = 'top left';
    clone.style.filter = 'drop-shadow(0 16px 22px rgba(0,0,0,.22))';
    document.body.appendChild(clone);

    const dx = d.left - s.left;
    const dy = d.top - s.top;
    const sx = s.width ? (d.width / s.width) : 1;
    const sy = s.height ? (d.height / s.height) : 1;

    const anim = clone.animate([
      { transform: 'translate3d(0px,0px,0) scale(1,1) rotate(0deg)', opacity: 1 },
      { transform: `translate3d(${dx*0.55}px, ${dy*0.55 - 46}px, 0) scale(${1 + (sx-1)*0.35}, ${1 + (sy-1)*0.35}) rotate(-7deg)`, opacity: 1 },
      { transform: `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy}) rotate(0deg)`, opacity: 0.92 }
    ], {
      duration: D,
      easing: 'cubic-bezier(.2,.85,.2,1)',
      fill: 'forwards'
    });

    try { await anim.finished; } catch {}

    clone.remove();
    targetImg.style.opacity = '1';
  };

  await Promise.all([
    fly(),
    sleep(D + 20)
  ]);
}

function parseCodeFromRaw(raw){
  const s = String(raw ?? '').trim();
  // QR stickers bevatten soms extra tekst of een URL, pak dan de eerste code
  const m = s.match(/(\d{3,6})/);
  if (!m) return s.trim();
  const digits = m[1];
  // Normaliseer: verwijder eventuele voorloopnullen (bijv. 0140 -> 140)
  const n = parseInt(digits, 10);
  if (!Number.isFinite(n)) return digits.trim();
  // Houd 3-cijferige logica aan, maar breek toekomstige 4-6 cijfers niet
  if (digits.length === 3) return digits.trim();
  return String(n);
}

async function ensureDetector(){
  if (detector) return detector;
  if (!('BarcodeDetector' in window)) return null;
  try {
    // Sommige browsers melden BarcodeDetector maar ondersteunen geen QR
    if (typeof BarcodeDetector.getSupportedFormats === 'function') {
      const fmts = await BarcodeDetector.getSupportedFormats();
      if (!Array.isArray(fmts) || !fmts.includes('qr_code')) return null;
    }
    detector = new BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13', 'ean_8'] });
    return detector;
  } catch {
    return null;
  }
}

function render(){
  const hash = (window.location.hash || '#shop').replace('#', '');
  if (hash === 'home') {
    // Home wordt niet meer gebruikt, start direct in de winkel
    navigate('#shop');
    return;
  }
  if (hash === 'shop') return renderShop();
  return renderShop();
}

function renderHome(){
  stopCamera();
  setBack(false);
  if (topbar) topbar.classList.add('hidden');
  if (topbar) topbar.classList.remove('topbar--shop');
  if (cartMiniBtn) cartMiniBtn.classList.add('hidden');

  screenEl.innerHTML = `
    <div class="screenInner">
      <section class="card pad" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; flex:1">
        <button class="bigCircle" id="startBtn" aria-label="Start een nieuwe winkelmand">
          <span class="bigCircle__ring" aria-hidden="true"></span>
          <img src="assets/winkelmandje2.png" alt="" />
        </button>
      </section>
    </div>
  `;

  $('#startBtn').onclick = () => startNewCart();
}


function resetCartAndStay(){
  state.cartLines = [];
  saveState();
  window.__currentScannedProduct = null;
  window.__isScanning = false;
  window.__gameStarted = false;
  pauseScanner();
  playSuccess();
  renderShop();
}

function startNewCart(){
  state.cartLines = [];
  saveState();
  navigate('#shop');
  toast('🧺');
}

function renderShop(){
  // Belangrijk voor iPad: voorkom dat een oude scan loop blijft draaien na een rerender
  stopScanLoop({ stopStream: false });
  setBack(true, () => resetCartAndStay());
  if (topbar) topbar.classList.remove('hidden');
  if (topbar) topbar.classList.add('topbar--shop');
  if (cartMiniBtn) cartMiniBtn.classList.add('hidden');

  const current = window.__currentScannedProduct || null;
  const scanning = true;

  const total = cartTotal();

  screenEl.innerHTML = `
    <div class="screenInner">
      <div class="studentLayout">
        <section class="card scanCard studentScan">
          <div class="scanFrame" id="scanFrame">
            <div class="scanFrame__inner" id="scanInner"></div>
          </div>
        </section>

        <section class="card receiptCard studentReceipt" id="receiptCard" aria-label="Bonnetje">
          <div class="receiptHeader" aria-hidden="true">
            <img src="assets/kassa.png" class="cashierHero" alt="" />
          </div>
          <div class="receiptList" id="receiptList"></div>
          <div class="payStrip">
            <button class="payBtn2" id="payBtn" aria-label="Betaal">
              <span id="payTotal" class="payTotal">${money(total)}</span>
              <span class="payCoin" aria-hidden="true">
                <img id="payCoinImg" src="assets/betaalanimatie.gif" alt="" />
              </span>
            </button>
          </div>
        </section>
      </div>
    </div>
  `;

  renderReceipt();
  wireReceiptInteractions();
  updatePayBar();

  $('#payBtn').onclick = () => payNow();

  const scanInner = $('#scanInner');
  const scanFrameEl = $('#scanFrame');
  if (scanFrameEl) scanFrameEl.classList.toggle('scanFrame--active', true);

  if (current) {
    scanInner.innerHTML = productViewKid(current);
    $('#addToCart').onclick = async () => {
      if (window.__isAddingToCart) return;
      window.__isAddingToCart = true;

      // Geluid meteen bij start van de animatie
      playSfx('add');

      // Tijdens de animatie geen scanning
      window.__isScanning = false;
      pauseScanner();

      try { await animateProductToReceipt(current.code); } catch {}

      window.__currentScannedProduct = null;
      window.__isScanning = true;

      renderShop();
      window.__isAddingToCart = false;
    };
    $('#cancelProduct').onclick = () => {
      window.__currentScannedProduct = null;
      window.__isScanning = true;
      renderShop();
    };
    return;
  }

  // Eerst een duidelijke startknop, daarna pas de camera
  if (!window.__gameStarted) {
    pauseScanner();
    scanInner.innerHTML = startViewKid();
    const startBtn = $('#startScanBtn');
    if (startBtn) {
      startBtn.onclick = () => {
        startBtn.classList.add('isPressed');
        ensureSfx();
        try { audioCtx && audioCtx.state === 'suspended' && audioCtx.resume(); } catch {}
        window.__gameStarted = true;
        playClick();
        renderShop();
      };
    }
    const manual = $('#manualBtn');
    if (manual) manual.onclick = () => openManualEntry();
    return;
  }

  // Camera weergave
  scanInner.innerHTML = scanningViewKid();
  $('#manualBtn').onclick = () => openManualEntry();
  window.__isScanning = true;
  // Start camera zodra het videovak in de DOM staat
  setTimeout(() => { startScanning(); resetInactivityTimer(); }, 0);

  // iPad Safari: soms zijn er direct na start nog geen frames, geef een extra kick
  setTimeout(() => {
    const v = $('#video');
    if (!v) return;
    const noFramesYet = !v.videoWidth || v.readyState < 2;
    if (noFramesYet) startScanning();
  }, 700);
}

function startViewKid(){
  return `
    <div class="scanFrame__hint">
      <button class="scannerBtn" id="startScanBtn" aria-label="Start">
        <img src="assets/scanner.png" alt="" />
      </button>
      <div class="scanMiniRow">
        <button class="kbdBtn" id="manualBtn" aria-label="Code invoeren"><span class="kbdIcon" aria-hidden="true"></span></button>
      </div>
    </div>
  `;
}

function scanningViewKid(){
  return `
    <div class="videoWrap">
      <video id="video" autoplay muted playsinline></video>
      <div class="scanOverlay">
        <div class="scanPulse"></div>
        <div class="scanBox"></div>
        <div class="scanLine" aria-hidden="true"></div>
      </div>
    </div>
    <div class="scanMiniRow" style="padding:12px 12px 4px">
      <button class="kbdBtn" id="manualBtn" aria-label="Code invoeren"><span class="kbdIcon" aria-hidden="true"></span></button>
    </div>
  `;
}

function productViewKid(p){
  const fx = Boolean(window.__foundFx);
  const isLandscape = window.matchMedia && window.matchMedia('(orientation: landscape)').matches;
  const addBtnImg = isLandscape ? 'assets/inmandje_horizontaal.gif' : 'assets/inmandje_vertikaal.gif';

  return `
    <div class="productWrap">
      <div class="productRow">
        <div class="productWindow" aria-label="${escapeAttr(p.name)}">
          <div class="productPriceTag">${money(p.price)}</div>
          ${fx ? '<div class="foundBurst" aria-hidden="true"></div>' : ''}
          <div class="productPhoto">
            <img src="${escapeAttr(p.photo)}" alt="${escapeAttr(p.name)}" />
          </div>
          <div class="productName">${escapeHtml(p.name)}</div>
        </div>

        <button class="productCancel" id="cancelProduct" aria-label="Opnieuw scannen">
          <img src="assets/kruisje.png" alt="" />
        </button>
      </div>

      <button class="addToCartImgBtn" id="addToCart" aria-label="In mandje">
        <img id="addToCartImg" src="${addBtnImg}" alt="" />
      </button>
    </div>
  `;
}

function renderReceipt(){
  const list = $('#receiptList');
  if (!list) return;

  const lines = (state.cartLines || []).slice().sort((a,b) => (Number(b.updatedAt)||0) - (Number(a.updatedAt)||0));
  if (!lines.length) {
    list.innerHTML = `
      <div class="card pad" style="background:rgba(255,255,255,.72); box-shadow:none; text-align:center">
        <img src="assets/boodschappenmand_leeg.png" alt="" style="width:140px; height:auto; opacity:.95" />
      </div>
    `;
    return;
  }

  list.innerHTML = lines.map(line => {
    const code = String(line.code || '').trim();
    const qty = Math.max(1, Number(line.qty) || 1);
    const p = state.products?.[code] || { code, name: code, price: 0, photo: makeSvgDataUrl('?', '#eaeaea', '🛒') };
    const lineTotal = (Number(p.price) || 0) * qty;
    return `
      <div class="receiptItem" aria-label="Item">
        <button class="qtyPill" type="button" data-code="${escapeAttr(code)}" aria-label="Aantal">${qty}</button>
        <div class="unitPill" aria-label="Stukprijs">x ${moneyTag(p.price)}</div>
        <div class="receiptThumb"><img src="${escapeAttr(p.photo)}" alt="" /></div>
        <div>
          <p class="receiptName kidtext">${escapeHtml(p.name)}</p>
          <p class="receiptMeta kidtext">${escapeHtml(code)}</p>
        </div>
        <div class="receiptPrice">${money(lineTotal)}</div>
        <button class="receiptDel" type="button" data-del="${escapeAttr(code)}" aria-label="Verwijderen">
          <img src="assets/kruisje.png" alt="" />
        </button>
      </div>
    `;
  }).join('');

  // Nieuwste bovenaan zichtbaar houden
  try { list.scrollTop = 0; } catch {}
}


function updatePayBar(){
  const el = $('#payTotal');
  if (el) el.textContent = money(cartTotal());
}

function wireReceiptInteractions(){
  const list = $('#receiptList');
  if (!list || list._wired) return;
  list._wired = true;
  list.addEventListener('click', (e) => {
    const del = e.target.closest('.receiptDel');
    if (del) {
      const code = del.getAttribute('data-del');
      if (code) {
        state.cartLines = (state.cartLines || []).filter(l => l.code !== code);
        saveState();
        playClick();
        renderReceipt();
        updatePayBar();
      }
      return;
    }
    const btn = e.target.closest('.qtyPill');
    if (!btn) return;
    const code = btn.getAttribute('data-code');
    if (!code) return;
    openQtyModal(code);
  });
}

function openQtyModal(code){
  const c = String(code || '').trim();
  const line = (state.cartLines || []).find(l => l.code === c);
  const p = state.products?.[c];
  if (!line || !p) return;

  const renderBody = () => {
    const qty = Math.max(1, Number(line.qty) || 1);
    return `
      <div class="qtyModal">
        <div class="qtyModalTop">
          <div class="qtyModalThumb"><img src="${escapeAttr(p.photo)}" alt="" /></div>
          <button class="iconSquare qtyClose" id="qtyClose" aria-label="Sluiten">✕</button>
        </div>

        <div class="qtyBig" id="qtyBig">${qty}</div>

        <div class="qtyControls">
          <button class="qtyBtn" id="qtyMinus" aria-label="Minder">−</button>
          <button class="qtyBtn" id="qtyPlus" aria-label="Meer">+</button>
        </div>
      </div>
    `;
  };

  openModal({
    title: '',
    body: renderBody(),
    closeOnOverlay: false
  });

  modalEl.classList.add('modal--qty');

  const sync = () => {
    $('#qtyBig').textContent = String(Math.max(1, Number(line.qty) || 1));
    renderReceipt();
    updatePayBar();
  };

  const close = () => {
    modalEl.classList.remove('modal--qty');
    closeModal();
  };

  $('#qtyClose').onclick = close;
  $('#qtyPlus').onclick = () => {
    line.qty = (Number(line.qty) || 1) + 1;
    line.updatedAt = Date.now();
    saveState();
    playClick();
    sync();
  };
  $('#qtyMinus').onclick = () => {
    const q = Math.max(1, Number(line.qty) || 1);
    if (q <= 1) {
      // verwijder regel
      state.cartLines = (state.cartLines || []).filter(l => l.code !== c);
    } else {
      line.qty = q - 1;
      line.updatedAt = Date.now();
    }
    saveState();
    playClick();
    sync();
    if (cartCount() === 0) close();
  };
}

async function startScanning(){
  if (cameraStarting) return;

  if (!navigator.mediaDevices?.getUserMedia) {
    playError();
    toast('📷');
    showCameraHelp('noapi');
    openManualEntry();
    return;
  }

  window.__isScanning = true;
  window.__currentScannedProduct = null;

  const video = $('#video');
  if (!video) return;

  // Als er nog een stream openstaat (bijvoorbeeld na een rerender), hergebruik die eerst
  if (activeStream && video.srcObject !== activeStream) {
    try {
      video.srcObject = activeStream;
      await video.play();
      await waitVideoReady(video);
      setCameraActive(true);
      startScanLoop();
      return;
    } catch {
      try { stopCamera(); } catch {}
      activeStream = null;
    }
  }

  // Als de camera al loopt, start alleen de scanloop opnieuw
  if (activeStream && video.srcObject === activeStream) {
    try { await video.play(); } catch {}
    setCameraActive(true);
    startScanLoop();
    return;
  }

  cameraStarting = true;

  try {
    const getStream = (facing) => navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: facing },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });

    // iPad: voorkeur voor de camera aan de voorkant, valt terug op achter
    try {
      activeStream = await getStream('user');
    } catch {
      activeStream = await getStream('environment');
    }

    // kleine iPad boost, helpt bij scherpstellen
    try {
      const track = activeStream.getVideoTracks?.()[0];
      const caps = track?.getCapabilities?.() || {};
      const adv = {};
      if (Array.isArray(caps.focusMode) && caps.focusMode.includes('continuous')) adv.focusMode = 'continuous';
      if (Array.isArray(caps.exposureMode) && caps.exposureMode.includes('continuous')) adv.exposureMode = 'continuous';
      if (Array.isArray(caps.whiteBalanceMode) && caps.whiteBalanceMode.includes('continuous')) adv.whiteBalanceMode = 'continuous';
      if (Object.keys(adv).length) await track.applyConstraints({ advanced: [adv] });
    } catch {
      // ignore
    }

    video.srcObject = activeStream;
    await video.play();
    await waitVideoReady(video);
  } catch (err) {
    // Geen automatische terugval naar een startscherm, camera werkt dan toch niet
    try { stopCamera(); } catch {}
    window.__isScanning = false;
    scanLoopRunning = false;
    cameraStarting = false;
    playError();
    showCameraHelp(err);
    openManualEntry();
    return;
  } finally {
    cameraStarting = false;
  }

  // Kies beste scanmodus
  const det = await ensureDetector();
  qrMode = det ? 'hybrid' : 'jsqr';
  if (qrMode !== 'barcode') {
    scanCanvas = scanCanvas || document.createElement('canvas');
    scanCtx = scanCtx || scanCanvas.getContext('2d', { willReadFrequently: true });
  }

  // Camera is nu echt actief
  setCameraActive(true);
  startScanLoop();
}

function showCameraHelp(err){
  // Kort en duidelijk, maar toch bruikbaar voor de leerkracht
  const isLock = !window.isSecureContext && location.hostname !== 'localhost';
  const hint = isLock
    ? 'Open de app via een https link (bijvoorbeeld GitHub Pages).'
    : 'Geef toestemming voor de camera in Safari.';

  openModal({
    title: 'Camera',
    body: `
      <div style="display:grid; gap:12px; text-align:center; padding:10px 0">
        <div style="font-size:44px" aria-hidden="true">${isLock ? '🔒' : '📷'}</div>
        <p class="p" style="margin:0">${hint}</p>
      </div>
    `
  });
}

function stopScanning(){
  stopScanLoop({ stopStream: true });
  renderShop();
}

function decodeWithJsQR(video){
  if (!scanCtx || !scanCanvas || !window.jsQR) return '';
  const vw = video.videoWidth || 0;
  const vh = video.videoHeight || 0;
  if (vw < 2 || vh < 2) return '';

  // iPad Safari: houd de resolutie zo hoog mogelijk (te agressief schalen maakt kleine QR’s onleesbaar).
  // We doen een paar slimme, maar snelle pogingen: full-frame, center-crop, en één keer met extra contrast.
  const attempts = [
    { kind: 'full', max: 1200, filter: 'none' },
    { kind: 'center', max: 1000, filter: 'none' },
    { kind: 'full', max: 1000, filter: 'contrast(1.35) saturate(0)' }
  ];

  scanCtx.imageSmoothingEnabled = false;

  for (const a of attempts) {
    scanCtx.filter = a.filter;
    let w = 0, h = 0;

    if (a.kind === 'center') {
      const side = Math.min(vw, vh);
      const cropSide = Math.max(320, Math.floor(side * 0.92));
      const sx = Math.floor((vw - cropSide) / 2);
      const sy = Math.floor((vh - cropSide) / 2);
      const target = Math.min(a.max, 1800);
      w = h = Math.max(360, Math.min(target, cropSide));
      if (scanCanvas.width !== w) scanCanvas.width = w;
      if (scanCanvas.height !== h) scanCanvas.height = h;
      scanCtx.drawImage(video, sx, sy, cropSide, cropSide, 0, 0, w, h);
    } else {
      const longest = Math.max(vw, vh);
      const scale = Math.min(1, a.max / longest);
      w = Math.max(420, Math.floor(vw * scale));
      h = Math.max(420, Math.floor(vh * scale));
      if (scanCanvas.width !== w) scanCanvas.width = w;
      if (scanCanvas.height !== h) scanCanvas.height = h;
      scanCtx.drawImage(video, 0, 0, w, h);
    }

    const img = scanCtx.getImageData(0, 0, w, h);
    const res = window.jsQR(img.data, w, h, { inversionAttempts: 'attemptBoth' });
    if (res && res.data) {
      scanCtx.filter = 'none';
      return parseCodeFromRaw(res.data);
    }
  }

  scanCtx.filter = 'none';
  return '';
}


let scanLoopRunning = false;
let scanRafId = 0;
let scanLoopToken = 0;

function stopScanLoop({ stopStream = false } = {}){
  // Invalideer elke lopende tick die nog een oud video element gebruikt
  scanLoopToken += 1;
  window.__isScanning = false;
  setCameraActive(false);
  scanLoopRunning = false;
  if (scanRafId) {
    try { cancelAnimationFrame(scanRafId); } catch {}
    scanRafId = 0;
  }
  if (stopStream) stopCamera();
}
async function startScanLoop(){
  if (scanLoopRunning) return;
  scanLoopRunning = true;

  const myToken = ++scanLoopToken;

  const video = $('#video');
  const det = await ensureDetector();

  if (!video) {
    scanLoopRunning = false;
    return;
  }

  qrMode = det ? 'hybrid' : 'jsqr';

  if (qrMode !== 'barcode') {
    scanCanvas = scanCanvas || document.createElement('canvas');
    scanCtx = scanCtx || scanCanvas.getContext('2d', { willReadFrequently: true });
  }

  let lastFrame = 0;
  let lastPing = 0;

  const tick = async (tNow) => {
    try {
      // Stop meteen als we intussen opnieuw gerenderd zijn of een nieuwe scan sessie startte
      if (myToken !== scanLoopToken) {
        scanLoopRunning = false;
        scanRafId = 0;
        return;
      }
      if (!window.__isScanning) {
        scanLoopRunning = false;
        scanRafId = 0;
        return;
      }

      // Throttle zodat iPad soepel blijft
      if (tNow - lastFrame < 120) {
        scanRafId = requestAnimationFrame(tick);
        return;
      }
      lastFrame = tNow;

      // kleuterlaag, voel en zie dat er echt gescand wordt
      if (tNow - lastPing > 950) {
        lastPing = tNow;
        playScanPing();
      }

      let found = '';

      // 1) BarcodeDetector als die echt QR ondersteunt
      if (det) {
        const results = await det.detect(video);
        if (results && results.length) {
          found = parseCodeFromRaw(results[0].rawValue);
        }
      }

      // 2) jsQR, robuust op iPad (center crop + minder downscale)
      if (!found) found = decodeWithJsQR(video);

      if (found) {
        // Belangrijk: laat onScanned de dedupe en state-afhandeling doen.
        // Als we hier lastScan al zetten, blokkeert onScanned zichzelf.
        onScanned(found);
        scanLoopRunning = false;
        scanRafId = 0;
        return;
      }
    } catch {
      // ignore
    }
    scanRafId = requestAnimationFrame(tick);
  };

  scanRafId = requestAnimationFrame(tick);
}

function onScanned(code){
  const now = Date.now();
  const c = parseCodeFromRaw(code);
  if (!c) return;
  if (lastScan.code === c && (now - lastScan.t) < 1200) return;
  lastScan = { code: c, t: now };

  stopCamera();
  window.__isScanning = false;

  const p = state.products[c];
  if (!p) {
    // Altijd terug naar scannen: toetsenbord alleen openen als je zelf op de knop drukt
    toast('❓');
    // Herstart scanner zonder handmatige invoer
    setTimeout(() => {
      renderShop();
      startCamera();
    }, 200);
    return;
  }

  playSuccess();
  // Extra kleuterlaag: korte burst zodat je ziet dat het gelukt is
  window.__foundFx = Date.now();
  window.__currentScannedProduct = p;
  renderShop();

  setTimeout(() => {
    if (window.__currentScannedProduct && window.__currentScannedProduct.code === p.code) {
      window.__foundFx = 0;
      renderShop();
    }
  }, 650);
}

function openManualEntry(prefill = ''){
  stopCamera();
  window.__isScanning = false;

  let entered = String(prefill || '').replace(/\D/g,'').slice(0,6);

  const render = () => {
    const shown = entered || '…';
    modalCard.innerHTML = `
      <div class="modalBody manualBody">
        <div class="manualTop">
          <div class="manualEntered" aria-label="Ingevoerde code">${escapeHtml(shown)}</div>
        </div>

        <div class="manualPadImg" id="manualPadImg" aria-label="Toetsenbord">
          <button class="padHit" data-k="CLEAR" aria-label="Alles wissen" style="left:82%; top:14%; width:16%; height:16%"></button>

          <button class="padHit" data-k="1" aria-label="1" style="left:18%; top:36%; width:24%; height:16%"></button>
          <button class="padHit" data-k="2" aria-label="2" style="left:50%; top:36%; width:24%; height:16%"></button>
          <button class="padHit" data-k="3" aria-label="3" style="left:82%; top:36%; width:24%; height:16%"></button>

          <button class="padHit" data-k="4" aria-label="4" style="left:18%; top:54%; width:24%; height:16%"></button>
          <button class="padHit" data-k="5" aria-label="5" style="left:50%; top:54%; width:24%; height:16%"></button>
          <button class="padHit" data-k="6" aria-label="6" style="left:82%; top:54%; width:24%; height:16%"></button>

          <button class="padHit" data-k="7" aria-label="7" style="left:18%; top:72%; width:24%; height:16%"></button>
          <button class="padHit" data-k="8" aria-label="8" style="left:50%; top:72%; width:24%; height:16%"></button>
          <button class="padHit" data-k="9" aria-label="9" style="left:82%; top:72%; width:24%; height:16%"></button>

          <button class="padHit" data-k="Wis" aria-label="Wis" style="left:18%; top:90%; width:24%; height:16%"></button>
          <button class="padHit" data-k="0" aria-label="0" style="left:50%; top:90%; width:24%; height:16%"></button>
          <button class="padHit" data-k="OK" aria-label="Ok" style="left:82%; top:90%; width:24%; height:16%"></button>
        </div>
      </div>
    `;

    const pad = $('#manualPadImg');
    if (pad) {
      // Drukfeedback (werkt beter op iPad dan alleen :active)
      pad.querySelectorAll('.padHit').forEach((btn) => {
        const down = () => btn.classList.add('isPressed');
        const up = () => setTimeout(() => btn.classList.remove('isPressed'), 80);
        btn.addEventListener('pointerdown', down, { passive: true });
        btn.addEventListener('pointerup', up, { passive: true });
        btn.addEventListener('pointercancel', up, { passive: true });
        btn.addEventListener('pointerleave', up, { passive: true });
      });

      pad.onclick = (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const k = btn.getAttribute('data-k');
        if (!k) return;
        if (k === 'CLEAR') {
          entered = '';
          playClick();
          render();
          return;
        }
        if (k === 'Wis') {
          entered = entered.slice(0, -1);
          playClick();
          render();
          return;
        }
        if (k === 'OK') {
          const code = entered.trim();
          closeModal();
          if (!code) return;
          onScanned(code);
          return;
        }
        if (/^[0-9]$/.test(k) && entered.length < 6) {
          entered += k;
          playClick();
          render();
        }
      };
    }
  };

  modalEl.classList.remove('hidden');
  $('.modal__overlay').onclick = (e) => {
    if (e.target && e.target.getAttribute('data-close') === '1') closeModal();
  };
  render();
}

function payNow(){
  if (cartCount() === 0) {
    toast('🧺');
    return;
  }

  // iPad performance: stop camera en scan loop tijdens de betaal animatie
  stopScanLoop({ stopStream: true });

  const btn = $('#payBtn');
  const coin = $('#payCoinImg');
  if (btn) btn.disabled = true;
  // Laat de knop animatie gewoon doorlopen, niet herladen (scheelt haperen op iPad)

  // Betaald animatie in beeld, en pas daarna het geluid
  openModal({
    title: '',
    body: `
      <div class="payModalAnim">
        <img id="payAnim" src="assets/betaald.gif" alt="" />
      </div>
    `,
    noClose: true,
    closeOnOverlay: false
  });
  modalEl.classList.add('modal--pay');

  // wacht 1 frame zodat de animatie echt zichtbaar is, daarna pas het geluid
  requestAnimationFrame(() => {
    setTimeout(() => {
      playSfx('paid');
    }, 120);
  });

  // Korter in beeld, zodat de GIF meestal maar 1x afspeelt
  setTimeout(() => {
    modalEl.classList.remove('modal--pay');
    state.cartLines = [];
    saveState();
    if (btn) btn.disabled = false;
    closeModal();
    window.__currentScannedProduct = null;
    window.__isScanning = false;
    window.__gameStarted = false;
    navigate('#shop');
    renderShop();
  }, 1900);
}

function openModal({ title, body, noClose, closeOnOverlay = true }){
  modalCard.innerHTML = `
    <div class="modalHeader">
      <h3 class="modalTitle">${escapeHtml(title || '')}</h3>
      ${noClose ? '' : '<button class="iconbtn" id="modalClose" aria-label="Sluiten">✕</button>'}
    </div>
    <div class="modalBody">${body || ''}</div>
  `;
  modalEl.classList.remove('hidden');

  if (!noClose) {
    $('#modalClose').onclick = () => closeModal();
    $('.modal__overlay').onclick = closeOnOverlay
      ? (e) => { if (e.target && e.target.getAttribute('data-close') === '1') closeModal(); }
      : null;
  } else {
    $('.modal__overlay').onclick = null;
  }
}

function exitTeacherMode(){
  if (!teacherFlowOpen) {
    closeModal();
    return;
  }
  teacherFlowOpen = false;
  closeModal();
  resumeScanner();
}

function closeModal(){
  modalEl.classList.add('hidden');
  modalEl.classList.remove('modal--qty');
  modalCard.innerHTML = '';
}

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

function makeSvgDataUrl(title, bg, emoji){
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.92"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity="0.70"/>
      </linearGradient>
    </defs>
    <rect width="512" height="512" rx="64" fill="${bg}"/>
    <rect x="36" y="36" width="440" height="440" rx="56" fill="url(#g)" opacity="0.92"/>
    <text x="256" y="284" font-size="180" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
    <text x="256" y="438" font-size="42" font-family="system-ui, -apple-system, Segoe UI, Roboto" font-weight="800" text-anchor="middle" fill="rgba(0,0,0,.75)">${escapeXml(title)}</text>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
function escapeXml(s){
  return String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
}

// Nav events
// Geen vaste knoppen, leerlingen gebruiken vooral de grote acties

// Long press on topbar for teacher mode
let lpTimer = null;
let lpTriggered = false;
function clearLongPress(){
  if (lpTimer) clearTimeout(lpTimer);
  lpTimer = null;
}

topbar.addEventListener('pointerdown', (e) => {
  lpTriggered = false;
  clearLongPress();
  lpTimer = setTimeout(() => {
    lpTriggered = true;
    openTeacherPin();
  }, 650);
});

topbar.addEventListener('pointerup', () => clearLongPress());

topbar.addEventListener('pointercancel', () => clearLongPress());

topbar.addEventListener('pointermove', (e) => {
  if (!lpTimer) return;
  // tiny move cancels
  if (Math.abs(e.movementX) + Math.abs(e.movementY) > 10) clearLongPress();
});

function openTeacherPin(){
  let entered = '';

  teacherFlowOpen = true;
  pauseScanner();

  openModal({
    title: 'Docentenmodus',
    body: `
      <p class="p">Voer je pincode in.</p>
      <div class="pinDots" id="pinDots"></div>
      <div class="keypad" id="keypad"></div>
      <p class="smallmuted">Standaard is 1234.</p>
    `,
    closeOnOverlay: false
  });

  const closeBtn = $('#modalClose');
  if (closeBtn) closeBtn.onclick = () => exitTeacherMode();

  const dots = $('#pinDots');
  const keypad = $('#keypad');

  function renderDots(){
    dots.innerHTML = Array.from({ length: 4 }).map((_, i) => `<span class="dot ${i < entered.length ? 'fill' : ''}"></span>`).join('');
  }

  const keys = ['1','2','3','4','5','6','7','8','9','Wis','0','OK'];
  keypad.innerHTML = keys.map(k => `<button class="key" data-k="${k}">${k}</button>`).join('');

  keypad.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const k = btn.getAttribute('data-k');

    if (k === 'Wis') {
      entered = entered.slice(0, -1);
      renderDots();
      return;
    }
    if (k === 'OK') {
      if (entered === state.teacherPin) {
        openTeacherMode();
      } else {
        entered = '';
        renderDots();
        toast('Niet goed');
      }
      return;
    }
    if (entered.length < 4 && /^[0-9]$/.test(k)) {
      entered += k;
      renderDots();
    }
  });

  renderDots();
}

function openTeacherMode(){
  teacherFlowOpen = true;
  pauseScanner();

  openModal({
    title: 'Docentenmodus',
    body: teacherModeView(),
    closeOnOverlay: false
  });

  const closeBtn = $('#modalClose');
  if (closeBtn) closeBtn.onclick = () => exitTeacherMode();

  $('#addProductBtn').onclick = () => openAddOrEditProduct();
  $('#pinBtn').onclick = () => openChangePin();
  $('#printBtn').onclick = () => {
    // Open print view in a new tab so printing is clean
    window.open('print.html', '_blank', 'noopener');
  };

  const exportBtn = $('#exportBtn');
  if (exportBtn) exportBtn.onclick = () => exportProducts();

  const importBtn = $('#importBtn');
  const importFile = $('#importFile');
  if (importBtn && importFile) {
    importBtn.onclick = () => importFile.click();
    importFile.onchange = async () => {
      const f = importFile.files && importFile.files[0];
      if (!f) return;
      try {
        const text = await f.text();
        const data = JSON.parse(text);
        const prods = data && (data.products || data);
        if (!prods || typeof prods !== 'object') throw new Error('no');
        state.products = prods;
        state.catalogVersion = DEFAULT_CATALOG_VERSION;
        saveState();
        toast('Bewaard');
        openTeacherMode();
      } catch {
        toast('Niet gelukt');
      } finally {
        // reset input zodat dezelfde file opnieuw kan
        try { importFile.value = ''; } catch {}
      }
    };
  }

  $$('[data-edit]').forEach(btn => {
    btn.onclick = () => {
      const code = btn.getAttribute('data-edit');
      openAddOrEditProduct(code);
    };
  });
  $$('[data-delprod]').forEach(btn => {
    btn.onclick = () => {
      const code = btn.getAttribute('data-delprod');
      deleteProduct(code);
    };
  });
}

function exportProducts(){
  try {
    const payload = {
      products: state.products,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kleuterwinkel_producten.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch {
    toast('Niet gelukt');
  }
}

function teacherModeView(){
  const products = Object.values(state.products).sort((a,b) => a.code.localeCompare(b.code));
  const list = products.map(p => `
    <div class="teacherItem">
      <div class="teacherItem__thumb"><img src="${escapeAttr(p.photo)}" alt="" /></div>
      <div>
        <p class="teacherItem__title">${escapeHtml(p.name)}</p>
        <p class="teacherItem__meta">Code, ${escapeHtml(p.code)} , prijs, ${money(p.price)}</p>
      </div>
      <div class="teacherActions">
        <button class="delbtn" data-edit="${escapeAttr(p.code)}">Bewerk</button>
        <button class="delbtn" data-delprod="${escapeAttr(p.code)}">Verwijder</button>
      </div>
    </div>
  `).join('');

  return `
    <p class="p">Hier beheer je je producten, prijzen en foto’s.</p>

    <div style="margin-top:12px; display:grid; gap:10px">
      <button class="primary" id="addProductBtn">Nieuw product</button>
      <button class="secondary" id="printBtn">Opslaan als PDF</button>
      <button class="secondary" id="exportBtn">Exporteer producten</button>
      <button class="secondary" id="importBtn">Importeer producten</button>
      <input id="importFile" type="file" accept="application/json" style="display:none" />
      <button class="secondary" id="pinBtn">Pincode aanpassen</button>
    </div>

    <div style="margin-top:14px" class="teacherList">${list || '<p class="smallmuted">Nog geen producten.</p>'}</div>
  `;
}

function openAddOrEditProduct(code){
  const existing = code ? state.products[code] : null;
  const suggestedCode = (() => {
    if (existing) return existing.code;
    const codes = Object.keys(state.products || {}).map(k => parseInt(String(k), 10)).filter(n => Number.isFinite(n));
    const max = codes.length ? Math.max(...codes) : 100;
    return String(max + 1);
  })();

  teacherFlowOpen = true;
  pauseScanner();
  openModal({
    title: existing ? 'Product bewerken' : 'Nieuw product',
    body: `
      <div class="formRow">
        <div class="label">Code</div>
        <input class="input" id="pCode" inputmode="numeric" value="${escapeAttr(suggestedCode)}" placeholder="101" ${existing ? 'disabled' : ''} />
      </div>

      <div class="formRow">
        <div class="label">Naam</div>
        <input class="input" id="pName" value="${escapeAttr(existing?.name || '')}" placeholder="Bijvoorbeeld Banaan" />
      </div>

      <div class="formRow">
        <div class="label">Prijs</div>
        <input class="input" id="pPrice" inputmode="decimal" value="${escapeAttr(existing?.price ?? '')}" placeholder="1 of 2" />
        <div style="display:flex; gap:10px">
          <button class="secondary" id="p1" type="button">€ 1</button>
          <button class="secondary" id="p2" type="button">€ 2</button>
        </div>
      </div>

      <div class="formRow">
        <div class="label">Foto</div>
        <input class="input" id="pPhoto" type="file" accept="image/*" />
        <p class="smallmuted">Als je geen foto kiest, blijft de huidige foto staan.</p>
      </div>

      <div style="display:grid; gap:10px">
        <button class="primary" id="saveProd" type="button">Bewaar product</button>
        <button class="secondary" id="cancelProd" type="button">Annuleren</button>
      </div>
    `,
    closeOnOverlay: false
  });

  const closeBtn = $('#modalClose');
  if (closeBtn) closeBtn.onclick = () => exitTeacherMode();

  // iPad Safari: na het kiezen van een foto kan de volgende tik soms niet "pakken".
  // We blurren de file input en zorgen dat de bewaar-knop bereikbaar blijft.
  const photoInput = $('#pPhoto');
  if (photoInput) {
    photoInput.addEventListener('change', () => {
      setTimeout(() => {
        try { photoInput.blur(); } catch {}
        const saveBtn = $('#saveProd');
        if (saveBtn && saveBtn.scrollIntoView) {
          saveBtn.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }, 80);
    });
  }

  $('#p1').onclick = () => { $('#pPrice').value = '1'; };
  $('#p2').onclick = () => { $('#pPrice').value = '2'; };

  $('#cancelProd').onclick = () => openTeacherMode();

  $('#saveProd').onclick = async () => {
    const pCode = ($('#pCode').value || '').trim();
    const pName = ($('#pName').value || '').trim();
    const rawPrice = ($('#pPrice').value || '').toString().replace(/[^0-9,\.]/g, '').replace(',', '.');
    const pPrice = Number(rawPrice);

    if (!pCode || !pName || !isFinite(pPrice) || pPrice < 0) {
      toast('Vul alles in');
      return;
    }

    const prev = state.products[pCode] || null;
    const file = $('#pPhoto').files && $('#pPhoto').files[0];

    let photo = prev?.photo || makeSvgDataUrl(pName, '#d7f1ff', '🛒');
    if (file) {
      photo = await readFileAsDataUrl(file);
    }

    state.products[pCode] = { code: pCode, name: pName, price: pPrice, photo };
    saveState();

    toast('Bewaard');
    openTeacherMode();
  };
}

function deleteProduct(code){
  if (!state.products[code]) return;

  teacherFlowOpen = true;
  pauseScanner();

  openModal({
    title: 'Verwijderen',
    body: `
      <p class="p">Weet je zeker dat je dit product wilt verwijderen, code ${escapeHtml(code)}?</p>
      <div style="margin-top:12px; display:grid; gap:10px">
        <button class="primary" id="doDel">Ja, verwijderen</button>
        <button class="secondary" id="noDel">Toch niet</button>
      </div>
    `,
    closeOnOverlay: false
  });

  const closeBtn = $('#modalClose');
  if (closeBtn) closeBtn.onclick = () => exitTeacherMode();

  $('#noDel').onclick = () => openTeacherMode();
  $('#doDel').onclick = () => {
    delete state.products[code];
    saveState();
    toast('Verwijderd');
    openTeacherMode();
  };
}

function openChangePin(){
  teacherFlowOpen = true;
  pauseScanner();
  openModal({
    title: 'Pincode aanpassen',
    body: `
      <div class="formRow">
        <div class="label">Nieuwe pincode</div>
        <input class="input" id="newPin" inputmode="numeric" maxlength="4" placeholder="4 cijfers" />
        <p class="smallmuted">Kies iets dat jij onthoudt.</p>
      </div>
      <div style="display:grid; gap:10px">
        <button class="primary" id="savePin">Bewaar pincode</button>
        <button class="secondary" id="backTeacher">Terug</button>
      </div>
    `,
    closeOnOverlay: false
  });

  const closeBtn = $('#modalClose');
  if (closeBtn) closeBtn.onclick = () => exitTeacherMode();

  $('#backTeacher').onclick = () => openTeacherMode();
  $('#savePin').onclick = () => {
    const p = ($('#newPin').value || '').trim();
    if (!/^\d{4}$/.test(p)) {
      toast('Gebruik 4 cijfers');
      return;
    }
    state.teacherPin = p;
    saveState();
    toast('Pincode bewaard');
    openTeacherMode();
  };
}

function readFileAsDataUrl(file){
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('file')); 
    r.readAsDataURL(file);
  });
}

// Init
// iPad: voorkom dubbelklik zoom en pinch-zoom in de app
document.addEventListener('dblclick', (e) => {
  e.preventDefault();
}, { passive: false });

// Inactiviteit alleen wanneer camera actief is
document.addEventListener('pointerdown', () => {
  if (window.__cameraActive) resetInactivityTimer();
}, { passive: true });

document.addEventListener('keydown', () => {
  if (window.__cameraActive) resetInactivityTimer();
}, { passive: true });

['gesturestart','gesturechange','gestureend'].forEach(ev => {
  document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
});

// iPad: portretstand toont alleen een "draai je iPad" scherm, en we pauzeren de camera
let viewportTimer = 0;
function handleViewportChange(){
  if (isPortrait()) {
    pauseScanner();
    return;
  }
  if (teacherFlowOpen) {
    pauseScanner();
    return;
  }
  if (window.location.hash === '#shop' && modalEl.classList.contains('hidden')) {
    // opnieuw renderen zorgt dat de juiste assets gekozen worden (en start direct de scanner)
    renderShop();
  }
}
function scheduleViewportChange(){
  if (viewportTimer) clearTimeout(viewportTimer);
  viewportTimer = setTimeout(() => {
    viewportTimer = 0;
    handleViewportChange();
  }, 120);
}

window.addEventListener('orientationchange', () => scheduleViewportChange());
window.addEventListener('resize', () => scheduleViewportChange());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseScanner();
  else scheduleViewportChange();
});

// Drukfeedback voor toetsenbordknoppen (werkt beter op touch dan alleen :active)
function wirePressFx(){
  const pressables = '.kbdBtn, .padHit';
  const clear = () => {
    try {
      document.querySelectorAll('.kbdBtn.isPressed, .padHit.isPressed')
        .forEach(el => el.classList.remove('isPressed'));
    } catch {}
  };

  // Pointer events (modern)
  document.addEventListener('pointerdown', (e) => {
    const el = e.target && e.target.closest ? e.target.closest(pressables) : null;
    if (el) el.classList.add('isPressed');
  }, true);
  document.addEventListener('pointerup', clear, true);
  document.addEventListener('pointercancel', clear, true);

  // Fallback voor oudere touch events
  document.addEventListener('touchstart', (e) => {
    const t = e.targetTouches && e.targetTouches[0] ? e.targetTouches[0].target : e.target;
    const el = t && t.closest ? t.closest(pressables) : null;
    if (el) el.classList.add('isPressed');
  }, { capture:true, passive:true });
  document.addEventListener('touchend', clear, true);
  document.addEventListener('touchcancel', clear, true);
}

window.addEventListener('hashchange', () => render());

updateBadge();
wirePressFx();
if (!window.location.hash) navigate('#shop');
render();
// zorg dat portretstand meteen de camera pauzeert
scheduleViewportChange();
