// HeroGen — featured image generator. Stage is always 1440x1080.
'use strict';

const STAGE_W = 1440;
const STAGE_H = 1080;
const LS_KEY = 'herogen_profiles_v1';

const $ = (id) => document.getElementById(id);
const els = {
  herobox: $('herobox'), overlaybox: $('overlaybox'), logoImg: $('logo-img'),
  headlinePreview: $('headline-preview'),
  viewport: $('stage-viewport'), scaler: $('stage-scaler'),
  logoInput: $('logo-input'), logoDrop: $('logo-drop'),
  logoScale: $('logo-scale'), logoScaleValue: $('logo-scale-value'),
  bgInput: $('bg-input'), bgDrop: $('bg-drop'),
  blockColor: $('block-color'), blockColorHex: $('block-color-hex'),
  blockOpacity: $('block-opacity'), blockOpacityValue: $('block-opacity-value'),
  headline: $('headline'),
  textColor: $('text-color'), textColorHex: $('text-color-hex'),
  themeToggle: $('theme-toggle'),
  profileSelect: $('profile-select'), profileName: $('profile-name'),
  exportBtn: $('export-btn'), exportFormat: $('export-format'),
};

// Current design state. logoData / bgData are data URLs, or null = bundled default.
const state = {
  logoData: null, logoScale: 100,
  blockColor: '#7ba5a1', blockOpacity: 95,
  bgData: null,
  headline: 'Clearly We Did NOT Think This Through',
  textColor: '#ffffff',
};

// ---------- helpers ----------
function hexToRgba(hex, opacityPct) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${opacityPct / 100})`;
}
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
function slug(s) {
  return (s || 'herogen').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'herogen';
}

// ---------- apply state to the stage ----------
function applyState() {
  els.logoImg.src = state.logoData || 'logo.svg';
  // Logo size: the img is constrained by max-width/max-height; scale via width %.
  els.logoImg.style.width = state.logoScale + '%';
  els.logoScale.value = state.logoScale;
  els.logoScaleValue.textContent = state.logoScale + '%';

  const rgba = hexToRgba(state.blockColor, state.blockOpacity);
  if (rgba) els.overlaybox.style.backgroundColor = rgba;
  els.blockColor.value = state.blockColor;
  els.blockColorHex.value = state.blockColor;
  els.blockOpacity.value = state.blockOpacity;
  els.blockOpacityValue.textContent = state.blockOpacity + '%';

  els.herobox.style.backgroundImage = state.bgData ? `url("${state.bgData}")` : '';
  els.headline.value = state.headline;
  els.headlinePreview.textContent = state.headline;
  // Text color is an inline stage style, so it is captured by the export.
  els.headlinePreview.style.color = state.textColor;
  els.textColor.value = state.textColor;
  els.textColorHex.value = state.textColor;
}

// ---------- preview scaling (stage itself stays 1440x1080) ----------
function fitStage() {
  const avail = els.viewport.clientWidth || STAGE_W;
  const scale = Math.min(1, avail / STAGE_W);
  els.scaler.style.transform = `scale(${scale})`;
  els.viewport.style.height = STAGE_H * scale + 'px';
}
window.addEventListener('resize', fitStage);

// ---------- profiles ----------
// Desktop (Electron): profiles live in herogen-profiles.json in userData via preload IPC.
// Browser fallback: localStorage.
let profiles = {};
async function loadProfiles() {
  try {
    if (window.herogen && window.herogen.loadProfiles) {
      profiles = (await window.herogen.loadProfiles()) || {};
    } else {
      profiles = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    }
  } catch { profiles = {}; }
  refreshProfileSelect();
}
async function persistProfiles() {
  try {
    if (window.herogen && window.herogen.saveProfiles) await window.herogen.saveProfiles(profiles);
    else localStorage.setItem(LS_KEY, JSON.stringify(profiles));
  } catch (err) {
    alert('Could not save profiles: ' + err.message + '\n(A very large logo/background can exceed browser storage — the desktop app does not have that limit.)');
  }
}
function refreshProfileSelect(selected) {
  const names = Object.keys(profiles).sort((a, b) => a.localeCompare(b));
  els.profileSelect.innerHTML = names.length
    ? '<option value="">— choose a profile —</option>' + names.map((n) => `<option value="${n.replace(/"/g, '&quot;')}">${n}</option>`).join('')
    : '<option value="">— none saved —</option>';
  if (selected && profiles[selected]) els.profileSelect.value = selected;
}
function currentAsProfile() {
  return { ...state };
}
function applyProfile(p) {
  Object.assign(state, {
    logoData: p.logoData ?? null, logoScale: p.logoScale ?? 100,
    blockColor: p.blockColor ?? '#7ba5a1', blockOpacity: p.blockOpacity ?? 95,
    bgData: p.bgData ?? null, headline: p.headline ?? '',
    textColor: p.textColor ?? '#ffffff',
  });
  applyState();
}

// ---------- controls wiring ----------
function wireDrop(dropEl, inputEl, onFile) {
  dropEl.addEventListener('click', () => inputEl.click());
  inputEl.addEventListener('change', () => { if (inputEl.files[0]) onFile(inputEl.files[0]); inputEl.value = ''; });
  ['dragenter', 'dragover'].forEach((ev) => dropEl.addEventListener(ev, (e) => { e.preventDefault(); dropEl.classList.add('dragover'); }));
  ['dragleave', 'drop'].forEach((ev) => dropEl.addEventListener(ev, (e) => { e.preventDefault(); dropEl.classList.remove('dragover'); }));
  dropEl.addEventListener('drop', (e) => { const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) onFile(f); });
}
wireDrop(els.logoDrop, els.logoInput, async (f) => { state.logoData = await fileToDataUrl(f); applyState(); });
wireDrop(els.bgDrop, els.bgInput, async (f) => { state.bgData = await fileToDataUrl(f); applyState(); });

$('logo-reset').addEventListener('click', () => { state.logoData = null; state.logoScale = 100; applyState(); });
$('bg-reset').addEventListener('click', () => { state.bgData = null; applyState(); });
els.logoScale.addEventListener('input', () => { state.logoScale = +els.logoScale.value; applyState(); });

els.blockColor.addEventListener('input', () => { state.blockColor = els.blockColor.value; applyState(); });
els.blockColorHex.addEventListener('change', () => {
  const v = els.blockColorHex.value.trim();
  if (/^#?[0-9a-f]{6}$/i.test(v)) { state.blockColor = v.startsWith('#') ? v.toLowerCase() : '#' + v.toLowerCase(); }
  applyState();
});
els.blockOpacity.addEventListener('input', () => { state.blockOpacity = +els.blockOpacity.value; applyState(); });
els.headline.addEventListener('input', () => { state.headline = els.headline.value; els.headlinePreview.textContent = state.headline; });

els.textColor.addEventListener('input', () => { state.textColor = els.textColor.value; applyState(); });
els.textColorHex.addEventListener('change', () => {
  const v = els.textColorHex.value.trim();
  if (/^#?[0-9a-f]{6}$/i.test(v)) { state.textColor = v.startsWith('#') ? v.toLowerCase() : '#' + v.toLowerCase(); }
  applyState();
});

// ---------- interface theme (UI only — never touches the stage or export) ----------
const THEME_KEY = 'herogen_theme';
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  els.themeToggle.textContent = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
  els.themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  try { localStorage.setItem(THEME_KEY, theme); } catch { /* private mode etc. — theme just won't persist */ }
}
function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch { /* ignore */ }
  if (saved === 'dark' || saved === 'light') return applyTheme(saved);
  applyTheme(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}
els.themeToggle.addEventListener('click', () => {
  applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
});

els.profileSelect.addEventListener('change', () => {
  const name = els.profileSelect.value;
  if (name && profiles[name]) { els.profileName.value = name; applyProfile(profiles[name]); }
});
$('profile-save').addEventListener('click', async () => {
  const name = els.profileName.value.trim();
  if (!name) { alert('Give the profile a name first.'); els.profileName.focus(); return; }
  profiles[name] = currentAsProfile();
  await persistProfiles();
  refreshProfileSelect(name);
});
$('profile-delete').addEventListener('click', async () => {
  const name = els.profileSelect.value || els.profileName.value.trim();
  if (!name || !profiles[name]) { alert('Choose a saved profile to delete.'); return; }
  if (!confirm(`Delete profile "${name}"?`)) return;
  delete profiles[name];
  await persistProfiles();
  refreshProfileSelect();
});
$('profile-export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(profiles, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'herogen-profiles.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$('profile-import-btn').addEventListener('click', () => $('profile-import').click());
$('profile-import').addEventListener('change', async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const imported = JSON.parse(await f.text());
    if (typeof imported !== 'object' || !imported) throw new Error('not a profiles file');
    profiles = { ...profiles, ...imported };
    await persistProfiles(); refreshProfileSelect();
  } catch (err) { alert('Import failed: ' + err.message); }
  e.target.value = '';
});

// ---------- export: ALWAYS exactly 1440x1080 ----------
els.exportBtn.addEventListener('click', async () => {
  const btn = els.exportBtn;
  const original = btn.textContent;
  btn.textContent = 'Exporting…'; btn.disabled = true;
  // Un-scale the preview so html2canvas sees the stage at its true size.
  const prevTransform = els.scaler.style.transform;
  els.scaler.style.transform = 'none';
  try {
    const captured = await html2canvas(els.herobox, {
      width: STAGE_W, height: STAGE_H, scale: 1, useCORS: true, backgroundColor: null, logging: false,
    });
    // Safety net: re-draw onto a canvas that is exactly 1440x1080, whatever html2canvas returned.
    const out = document.createElement('canvas');
    out.width = STAGE_W; out.height = STAGE_H;
    out.getContext('2d').drawImage(captured, 0, 0, STAGE_W, STAGE_H);

    const format = els.exportFormat.value;
    const ext = format === 'image/png' ? 'png' : format === 'image/jpeg' ? 'jpg' : 'webp';
    const nameBase = slug(els.profileName.value.trim() || state.headline);
    out.toBlob((blob) => {
      if (!blob) { alert('Export failed: could not create the image.'); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${nameBase}-1440x1080.${ext}`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, format, 0.92);
  } catch (err) {
    console.error('Export failed:', err);
    alert('Export failed: ' + err.message);
  } finally {
    els.scaler.style.transform = prevTransform;
    btn.textContent = original; btn.disabled = false;
  }
});

// ---------- init ----------
initTheme();
applyState();
fitStage();
loadProfiles();
