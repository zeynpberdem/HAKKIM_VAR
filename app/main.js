const MUNICIPALITIES_URL = "./data/municipalities.json";
const API_URL = "/api/generate";

const landingPage = document.getElementById("landingPage");
const formPage = document.getElementById("formPage");
const startApplication = document.getElementById("startApplication");
const goLanding = document.getElementById("goLanding");
const goForm = document.getElementById("goForm");
const backToLanding = document.getElementById("backToLanding");
const quickButtons = document.querySelectorAll(".quickBtn");
const appCount = document.getElementById("appCount");
const particlesCanvas = document.getElementById("particles");

const citySelect = document.getElementById("citySelect");
const districtSelect = document.getElementById("districtSelect");
const categorySelect = document.getElementById("categorySelect");
const userText = document.getElementById("sorun-textarea");
const fullName = document.getElementById("fullName");
const tcKimlik = document.getElementById("tcKimlik");
const address = document.getElementById("address");
const phone = document.getElementById("phone");
const charHint = document.getElementById("charHint");
const form = document.getElementById("complaintForm");
const btn = document.getElementById("generateBtn");
const statusEl = document.getElementById("status");

const result = document.getElementById("result");
const channelsList = document.getElementById("channelsList");
const petitionText = document.getElementById("petitionText");
const copyChannels = document.getElementById("copyChannels");
const copyPetition = document.getElementById("copyPetition");
const pdfBtn = document.getElementById("pdfBtn");
const micBtn = document.getElementById("mikrofon-btn");

const municipalityInfo = document.getElementById("municipalityInfo");
const infoName = document.getElementById("infoName");
const infoPhone = document.getElementById("infoPhone");
const infoWhatsapp = document.getElementById("infoWhatsapp");
const infoEmail = document.getElementById("infoEmail");
const infoWebsite = document.getElementById("infoWebsite");
const infoMayor = document.getElementById("infoMayor");
const whatsBtn = document.getElementById("whatsBtn");
const emailBtn = document.getElementById("emailBtn");

let municipalitiesRaw = null;

function showLanding() {
  if (landingPage) {
    landingPage.classList.remove("hidden");
    formPage?.classList.add("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    window.location.href = "index.html";
  }
}

function showForm(presetCategory) {
  if (document.getElementById("complaintForm")) {
    landingPage?.classList.add("hidden");
    formPage?.classList.remove("hidden");
    if (presetCategory) {
      setTimeout(() => {
        if (categorySelect) {
          categorySelect.value = presetCategory;
          categorySelect.dispatchEvent(new Event("change"));
        }
      }, 0);
    }
    setTimeout(() => {
      citySelect?.focus?.();
    }, 50);
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    const url = presetCategory ? `apply.html?cat=${encodeURIComponent(presetCategory)}` : "apply.html";
    window.location.href = url;
  }
}

function getDraftTextForCategory(category) {
  const c = String(category || "");
  if (c === "Sokak Aydınlatması") {
    return "Mahallemizde ... sokaktaki lambalar ... süredir yanmıyor. Gece saatlerinde güvenlik açısından sorun oluşturuyor. Gerekli kontrol ve onarımın yapılmasını rica ederim.";
  }
  if (c === "Su Kesintisi") {
    return "... tarihinden beri suyumuz kesilmiş durumda. Mahalle/sokak genelinde mağduriyet yaşanıyor. Arızanın giderilerek suyun yeniden verilmesini arz ederim.";
  }
  if (c === "Yol/Kaldırım") {
    return "Bulunduğumuz bölgede yol/kaldırım bozukluğu nedeniyle yaya ve araç trafiği olumsuz etkileniyor. Gerekli bakım-onarımın yapılmasını talep ederim.";
  }
  if (c === "Çöp/Atık") {
    return "Mahallemizde çöp/atık toplama düzenli yapılmıyor. Koku ve hijyen sorunu oluşuyor. Temizlik çalışmalarının artırılmasını rica ederim.";
  }
  return "";
}

function setUserTextDraft(text) {
  if (!text) return;
  if (!userText.value.trim()) {
    userText.value = text;
    userText.dispatchEvent(new Event("input"));
  }
}

function canSpeech() {
  return typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);
}

function initSpeechRecognition() {
  // User requested: delete and re-implement from scratch
  if (!micBtn || !userText) return;

  const isSecure = window.isSecureContext || location.hostname === "localhost" || location.hostname === "127.0.0.1";
  if (!isSecure) {
    micBtn.disabled = true;
    micBtn.title = "Sesli komut için HTTPS veya localhost gerekir.";
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    micBtn.style.display = "none";
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "tr-TR";
  recognition.continuous = false;
  recognition.interimResults = false;

  function setListening(listening) {
    micBtn.setAttribute("aria-pressed", listening ? "true" : "false");
    micBtn.classList.toggle("pulsing", listening);
  }

  recognition.onresult = (event) => {
    const text = event?.results?.[0]?.[0]?.transcript || "";
    if (text) {
      const base = userText.value.trim();
      userText.value = base ? `${base} ${text}` : text;
      userText.dispatchEvent(new Event("input"));
    }
    setListening(false);
    setStatus("Sesli giriş eklendi.");
  };

  recognition.onerror = (event) => {
    setListening(false);
    if (event?.error === "not-allowed" || event?.error === "service-not-allowed") {
      setStatus("Mikrofon erişimine izin vermeniz gerekiyor", "error");
      return;
    }
    if (event?.error === "not-found" || event?.error === "audio-capture") {
      setStatus("Mikrofon bulunamadı. Cihazınızı kontrol edin.", "error");
      return;
    }
    setStatus("Mikrofon erişimine izin vermeniz gerekiyor", "error");
  };

  recognition.onend = () => {
    setListening(false);
  };

  micBtn.onclick = () => {
    try {
      setStatus("Dinleniyor…");
      setListening(true);
      recognition.start(); // triggers browser permission prompt if needed
    } catch {
      // ignored (start called while already started)
    }
  };
}

async function buildPdf() {
  const jspdf = window.jspdf;
  const JsPDF = jspdf?.jsPDF;
  if (!JsPDF) {
    setStatus("PDF oluşturma kütüphanesi yüklenemedi.", "error");
    return;
  }

  setStatus("PDF hazırlanıyor...", "info");
  
  try {
    const fontRes = await fetch("./roboto.ttf");
    if (!fontRes.ok) throw new Error("Font yüklenemedi.");
    const fontBuffer = await fontRes.arrayBuffer();

    let binary = '';
    const bytes = new Uint8Array(fontBuffer);
    const chunk = 8192;
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    const base64Font = window.btoa(binary);

    const rec = getSelectedMunicipalityRecord();
    const municipalityName = rec?.municipality || "Belediye";
    const city = rec?.city || "";
    const district = rec?.district || "";

    const dateStr = new Date().toLocaleDateString("tr-TR");
    const full = fullName.value.trim() || "…";

    const doc = new JsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 18;
    let y = 18;

    doc.addFileToVFS("Roboto-Regular.ttf", base64Font);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    doc.setFont("Roboto", "normal");
    doc.setFontSize(11);

    const body = petitionText.textContent?.trim() || "";
    const lines = doc.splitTextToSize(body, pageW - margin * 2);
    doc.text(lines, margin, y);

    doc.save("dilekce.pdf");
    setStatus("PDF başarıyla indirildi.");
  } catch (err) {
    setStatus("PDF indirme hatası: " + err.message, "error");
  }
}

function setStatus(text, kind = "info") {
  statusEl.textContent = text || "";
  statusEl.classList.toggle("error", kind === "error");
}

function formatTrNumber(n) {
  try {
    return Number(n).toLocaleString("tr-TR");
  } catch {
    return String(n);
  }
}

function animateCountUp(el) {
  if (!el) return;
  const target = Number(el.dataset.target || "0");
  if (!Number.isFinite(target) || target <= 0) return;

  const durationMs = 1100;
  const start = performance.now();

  function tick(now) {
    const t = Math.min(1, (now - start) / durationMs);
    const eased = 1 - Math.pow(1 - t, 3);
    const val = Math.floor(eased * target);
    el.textContent = formatTrNumber(val);
    if (t < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function initParticles(canvas) {
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let w = 0;
  let h = 0;
  let raf = 0;

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const particles = [];
  const count = 48;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    w = Math.max(1, Math.floor(rect.width));
    h = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function reset(p) {
    p.x = rand(0, w);
    p.y = rand(0, h);
    p.r = rand(1.2, 2.8);
    p.vx = rand(-0.12, 0.12);
    p.vy = rand(-0.20, 0.20);
    p.a = rand(0.20, 0.55);
    p.c = Math.random() < 0.5 ? "rgba(139,92,255," : "rgba(47,211,255,";
  }

  function init() {
    particles.length = 0;
    for (let i = 0; i < count; i++) {
      const p = {};
      reset(p);
      particles.push(p);
    }
  }

  function step() {
    ctx.clearRect(0, 0, w, h);

    // soft connections
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 > 140 * 140) continue;
        const alpha = (1 - Math.sqrt(dist2) / 140) * 0.12;
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;

      ctx.fillStyle = `${p.c}${p.a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    raf = requestAnimationFrame(step);
  }

  const ro = new ResizeObserver(() => {
    resize();
    init();
  });
  ro.observe(canvas);
  resize();
  init();
  step();

  // Pause when hidden
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else step();
  });
}

function uniq(arr) {
  return [...new Set(arr)];
}

function upperTr(s) {
  return String(s || "").trim().toLocaleUpperCase("tr-TR");
}

function titleTr(s) {
  const t = String(s || "").trim().toLocaleLowerCase("tr-TR");
  return t
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toLocaleUpperCase("tr-TR") + w.slice(1))
    .join(" ");
}

function getMunicipalityName(city, district) {
  const d = String(district || "").trim();
  if (d.toLocaleLowerCase("tr-TR") === "merkez") return `${city} Belediyesi`;
  return `${d} Belediyesi`;
}

function getContactFor(city, district) {
  const data = municipalitiesRaw;
  if (!data) return null;
  const schema = data.contactSchema || {
    phone: null,
    whatsapp: null,
    email: null,
    website: null,
    mayor: null,
  };
  const cityKey = upperTr(city);
  const districtKey = upperTr(district);
  const override =
    data?.overridesByCity?.[cityKey]?.[districtKey] ||
    data?.overridesByCity?.[cityKey]?.[district] ||
    null;
  return { ...schema, ...(override || {}) };
}

function getSelectedMunicipalityRecord() {
  const city = citySelect.value;
  const district = districtSelect.value;
  if (!city || !district) return null;
  return {
    city,
    district,
    municipality: getMunicipalityName(city, district),
    contact: getContactFor(city, district),
  };
}

function renderCities() {
  const cities = Object.keys(municipalitiesRaw?.districtsByCity || {})
    .map((c) => titleTr(c))
    .sort((a, b) => a.localeCompare(b, "tr"));
  for (const c of cities) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    citySelect.appendChild(opt);
  }
}

function resetDistricts() {
  districtSelect.innerHTML =
    '<option value="" selected disabled>Önce il seçin</option>';
  districtSelect.disabled = true;
}

function renderDistrictsForCity(city) {
  const key = upperTr(city);
  const list = Array.isArray(municipalitiesRaw?.districtsByCity?.[key])
    ? municipalitiesRaw.districtsByCity[key]
    : [];
  const items = list.map((d) => titleTr(d)).sort((a, b) => a.localeCompare(b, "tr"));

  districtSelect.innerHTML =
    '<option value="" selected disabled>İlçe / Belediye seçin</option>';

  for (const d of items) {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = `${d} — ${getMunicipalityName(city, d)}`;
    districtSelect.appendChild(opt);
  }
  districtSelect.disabled = false;
}

function renderResult(payload) {
  channelsList.innerHTML = "";
  petitionText.textContent = payload?.petitionText || "";

  const channels = Array.isArray(payload?.channels) ? payload.channels : [];
  if (channels.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Bu seçim için kayıtlı kanal bulunamadı.";
    channelsList.appendChild(li);
  } else {
    for (const ch of channels) {
      const li = document.createElement("li");
      li.textContent = ch;
      channelsList.appendChild(li);
    }
  }

  result.classList.remove("hidden");
  pdfBtn?.classList.remove("hidden");
  result.scrollIntoView({ behavior: "smooth", block: "start" });
}

function safeText(v) {
  return v === null || v === undefined || String(v).trim() === "" ? "null" : String(v);
}

function normalizeDigits(s) {
  const t = String(s || "").replace(/[^\d+]/g, "");
  return t || null;
}

function updateMunicipalityInfo() {
  const rec = getSelectedMunicipalityRecord();
  if (!rec) {
    municipalityInfo?.classList.add("hidden");
    return;
  }

  const c = rec.contact || {};
  municipalityInfo?.classList.remove("hidden");
  infoName.textContent = `${rec.municipality} · ${rec.city}/${rec.district}`;

  const setInfo = (el, val) => {
    const text = safeText(val);
    if (text === "null") {
      el.parentElement.style.display = "none";
    } else {
      el.parentElement.style.display = "";
      el.textContent = text;
    }
  };

  setInfo(infoPhone, c.phone);
  setInfo(infoWhatsapp, c.whatsapp);
  setInfo(infoEmail, c.email);
  setInfo(infoWebsite, c.website);
  setInfo(infoMayor, c.mayor);

  const w = normalizeDigits(c.whatsapp);
  if (w) {
    const digits = w.startsWith("+") ? w.slice(1) : w;
    whatsBtn.href = `https://wa.me/${encodeURIComponent(digits)}`;
    whatsBtn.classList.remove("hidden");
  } else {
    whatsBtn.classList.add("hidden");
    whatsBtn.removeAttribute("href");
  }

  const e = c.email ? String(c.email).trim() : "";
  if (e) {
    const subject = encodeURIComponent(`Başvuru: ${categorySelect.value || "Genel"}`);
    emailBtn.href = `mailto:${encodeURIComponent(e)}?subject=${subject}`;
    emailBtn.classList.remove("hidden");
  } else {
    emailBtn.classList.add("hidden");
    emailBtn.removeAttribute("href");
  }
}

async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

function channelsAsPlainText() {
  return [...channelsList.querySelectorAll("li")].map((li) => li.textContent).join("\n");
}

async function loadMunicipalities() {
  const res = await fetch(MUNICIPALITIES_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("Belediye verisi yüklenemedi.");
  const json = await res.json();
  municipalitiesRaw = json;
}

function validateInputs() {
  const rec = getSelectedMunicipalityRecord();
  const category = categorySelect.value;
  const text = userText.value.trim();
  const name = fullName.value.trim();
  const tc = tcKimlik.value.trim();
  const addr = address.value.trim();
  const tel = phone.value.trim();

  if (!rec) return { ok: false, message: "Lütfen il ve ilçe/belediye seçin." };
  if (!category) return { ok: false, message: "Lütfen kategori seçin." };
  if (!text) return { ok: false, message: "Lütfen sorununuzu yazın." };
  if (text.length > 2000) return { ok: false, message: "Metin çok uzun (maks. 2000 karakter)." };
  if (!name) return { ok: false, message: "Lütfen Ad Soyad alanını doldurun." };
  if (!/^\d{11}$/.test(tc)) return { ok: false, message: "T.C. Kimlik No 11 haneli olmalı." };
  if (!tel) return { ok: false, message: "Lütfen Telefon alanını doldurun." };
  if (!addr) return { ok: false, message: "Lütfen Adres alanını doldurun." };
  if (addr.length > 400) return { ok: false, message: "Adres çok uzun (maks. 400 karakter)." };
  if (name.length > 80) return { ok: false, message: "Ad Soyad çok uzun (maks. 80 karakter)." };
  return { ok: true, rec, category, text, identity: { fullName: name, tcKimlik: tc, address: addr, phone: tel } };
}

function setLoading(isLoading) {
  btn.disabled = isLoading;
  citySelect.disabled = isLoading;
  districtSelect.disabled = isLoading || !citySelect.value;
  categorySelect.disabled = isLoading;
  userText.disabled = isLoading;
  fullName.disabled = isLoading;
  tcKimlik.disabled = isLoading;
  address.disabled = isLoading;
  phone.disabled = isLoading;
}

function updateCharHint() {
  const len = userText.value.length;
  charHint.textContent = len ? `${len}/2000` : "";
}

citySelect?.addEventListener("change", () => {
  setStatus("");
  result?.classList.add("hidden");
  municipalityInfo?.classList.add("hidden");
  const city = citySelect.value;
  if (!city) {
    resetDistricts();
    return;
  }
  renderDistrictsForCity(city);
});

districtSelect?.addEventListener("change", () => {
  setStatus("");
  result?.classList.add("hidden");
  updateMunicipalityInfo();
});

userText?.addEventListener("input", updateCharHint);
if(userText) updateCharHint();

copyChannels?.addEventListener("click", async () => {
  try {
    await copyText(channelsAsPlainText());
    setStatus("Kanallar kopyalandı.");
  } catch {
    setStatus("Kopyalama başarısız. Tarayıcı izinlerini kontrol edin.", "error");
  }
});

copyPetition?.addEventListener("click", async () => {
  try {
    await copyText(petitionText.textContent || "");
    setStatus("Dilekçe kopyalandı.");
  } catch {
    setStatus("Kopyalama başarısız. Tarayıcı izinlerini kontrol edin.", "error");
  }
});

pdfBtn?.addEventListener("click", async () => {
  try {
    await buildPdf();
  } catch {
    setStatus("PDF oluşturma başarısız.", "error");
  }
});

startApplication?.addEventListener("click", () => showForm());
goForm?.addEventListener("click", () => showForm());
backToLanding?.addEventListener("click", showLanding);
goLanding?.addEventListener("click", showLanding);

for (const btnEl of quickButtons) {
  btnEl.addEventListener("click", () => {
    const cat = btnEl.dataset.category;
    showForm(cat);
    setUserTextDraft(getDraftTextForCategory(cat));
  });
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus("");

  const v = validateInputs();
  if (!v.ok) {
    setStatus(v.message, "error");
    return;
  }

  setLoading(true);
  setStatus("Hazırlanıyor… (en geç 5 sn)");

  try {
    const resp = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city: v.rec.city,
        district: v.rec.district,
        municipality: v.rec.municipality,
        category: v.category,
        userText: v.text,
        identity: v.identity,
      }),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new Error(data?.error || "Bir hata oluştu. Lütfen tekrar deneyin.");
    }

    renderResult(data);
    setStatus("Hazır. Kopyalayıp ilgili kanala iletebilirsiniz.");
  } catch (err) {
    setStatus(err?.message || "Bir hata oluştu. Lütfen tekrar deneyin.", "error");
  } finally {
    setLoading(false);
  }
});

(async () => {
  try {
    await loadMunicipalities();
    renderCities();
  } catch (e) {
    setStatus(e?.message || "Başlatma hatası.", "error");
  }
  // Testimonials'ı hero dışına taşı
const testimonials = document.querySelector('.testimonials');
const landingPage = document.getElementById('landingPage');
if (testimonials && landingPage) {
  landingPage.appendChild(testimonials);
}
})();

// landing enhancements
animateCountUp(appCount);
initParticles(particlesCanvas);
initSpeechRecognition();

window.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const cat = urlParams.get("cat");
  if (cat && categorySelect) {
    setTimeout(() => {
      categorySelect.value = cat;
      categorySelect.dispatchEvent(new Event("change"));
      setUserTextDraft(getDraftTextForCategory(cat));
    }, 150);
  }
});
