const MUNICIPALITIES_PATH = "app/data/municipalities.json";

const RATE = {
  windowMs: 60_000,
  max: 20,
};
const buckets = new Map();

function now() {
  return Date.now();
}

function getClientIp(event) {
  const h = event.headers || {};
  const xff = h["x-forwarded-for"] || h["X-Forwarded-For"];
  if (xff) return String(xff).split(",")[0].trim();
  return (
    h["x-real-ip"] ||
    h["X-Real-IP"] ||
    event?.requestContext?.identity?.sourceIp ||
    "unknown"
  );
}

function rateLimit(ip) {
  const t = now();
  const b = buckets.get(ip);
  if (!b || t - b.start > RATE.windowMs) {
    buckets.set(ip, { start: t, count: 1 });
    return { ok: true };
  }
  if (b.count >= RATE.max) return { ok: false };
  b.count += 1;
  return { ok: true };
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

function isNonEmptyString(x) {
  return typeof x === "string" && x.trim().length > 0;
}

function clampText(s, max) {
  if (!isNonEmptyString(s)) return "";
  const t = s.trim();
  return t.length > max ? t.slice(0, max) : t;
}

function sanitizeOneLine(s, max) {
  return clampText(String(s || "").replace(/\s+/g, " "), max);
}

function sanitizeMultiLine(s, max) {
  const t = String(s || "").trim().replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ");
  return t.length > max ? t.slice(0, max) : t;
}

async function loadMunicipalities() {
  const fs = await import("node:fs/promises");
  const raw = await fs.readFile(MUNICIPALITIES_PATH, "utf8");
  const parsed = JSON.parse(raw);
  return parsed && typeof parsed === "object" ? parsed : {};
}

async function loadBelediyelerInfo() {
  try {
    const typeofFs = typeof require !== "undefined" ? require("fs/promises") : await import("node:fs/promises");
    // Since this runs in api/ (or root), we use path from root
    const raw = await typeofFs.readFile("app/data/belediyeler.json", "utf8");
    return JSON.parse(raw);
  } catch (err) {
    return {};
  }
}

function titleTrCity(s) {
  return String(s || "").trim().toLocaleLowerCase("tr-TR")
    .split(" ").filter(Boolean)
    .map(w => w.charAt(0).toLocaleUpperCase("tr-TR") + w.slice(1))
    .join(" ");
}

function formatBelediyeChannels(cityData) {
  const out = [];
  if (!cityData) return out;
  if (cityData.telefon) {
    const p = normalizePhoneDigits(cityData.telefon);
    if (p) out.push(`Telefon: ${cityData.telefon} (tel:${p})`);
  }
  if (cityData.whatsapp) {
    const w = normalizePhoneDigits(cityData.whatsapp);
    if (w) out.push(`WhatsApp: ${cityData.whatsapp} (https://wa.me/90${w.startsWith('90') ? w.slice(2) : w})`);
  }
  if (cityData.email) {
    out.push(`E-posta: ${cityData.email} (mailto:${cityData.email})`);
  }
  if (cityData.website) {
    out.push(`Web Sitesi: ${cityData.website}`);
  }
  if (cityData.cimer) {
    out.push(`CİMER: ${cityData.cimer}`);
  }
  if (cityData.edevlet) {
    out.push(`e-Devlet: ${cityData.edevlet}`);
  }
  return out;
}

function upperTr(s) {
  return String(s || "").trim().toLocaleUpperCase("tr-TR");
}

function lowerTr(s) {
  return String(s || "").trim().toLocaleLowerCase("tr-TR");
}

function getMunicipalityName(city, district) {
  const d = String(district || "").trim();
  if (lowerTr(d) === "merkez") return `${String(city || "").trim()} Belediyesi`;
  return `${d} Belediyesi`;
}

function normalizePhoneDigits(s) {
  return String(s || "").replace(/[^\d+]/g, "").trim() || null;
}

function contactToChannels(municipalityName, contact) {
  const out = [];
  const phone = normalizePhoneDigits(contact?.phone);
  const whatsapp = normalizePhoneDigits(contact?.whatsapp);
  const email = contact?.email ? String(contact.email).trim() : null;
  const website = contact?.website ? String(contact.website).trim() : null;

  if (phone) out.push(`${municipalityName} Telefon: ${phone}`);
  if (whatsapp) out.push(`${municipalityName} WhatsApp: ${whatsapp}`);
  if (email) out.push(`${municipalityName} E-posta: ${email}`);
  if (website) out.push(`${municipalityName} Web: ${website}`);
  return out;
}

function uniqStrings(arr) {
  const out = [];
  const seen = new Set();
  for (const x of arr || []) {
    const s = String(x || "").trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

function normalizeCategory(category) {
  return String(category || "").trim().toLowerCase();
}

function categoryBasedChannels({ category, city }) {
  const c = normalizeCategory(category);
  const cityName = String(city || "").trim();

  if (c.includes("elektrik")) {
    const local =
      cityName === "Elazığ"
        ? "Yerel elektrik dağıtım şirketi (Elazığ için: EPDK/MEKE)"
        : "Yerel elektrik dağıtım şirketi";
    return ["TEDAŞ: 186", local];
  }
  if (c.includes("doğalgaz") || c.includes("dogalgaz")) {
    return ["BOTAŞ: 187", "Yerel doğalgaz dağıtım şirketi"];
  }
  if (c.includes("su")) {
    return ["Belediye su/arıza hattı: 185", "Belediye Su Müdürlüğü (online başvuru varsa web sitesinden)"];
  }
  if (c.includes("yol") || c.includes("kaldırım") || c.includes("aydinlatma") || c.includes("aydınlatma") || c.includes("sokak")) {
    return [`${String(city || "")} Belediyesi (Beyaz Masa): 153`, "TEDAŞ: 186"];
  }
  if (c.includes("çöp") || c.includes("cop") || c.includes("atık") || c.includes("atik")) {
    return ["Belediye Temizlik Müdürlüğü (ALO 153): 153"];
  }
  if (c.includes("gürültü") || c.includes("gurultu")) {
    return ["Zabıta (ALO 153): 153", "Jandarma: 156"];
  }

  return ["CİMER: 150", "BİMER (eski başvuru kanalı)"];
}

function buildSignatureBlock(identity) {
  const today = new Date();
  const dateStr = today.toLocaleDateString("tr-TR");
  const fullName = identity?.fullName || "…";
  const address = identity?.address || "…";
  const phone = identity?.phone || "…";

  return (
    `Tarih: ${dateStr}\n` +
    `Ad Soyad: ${fullName}\n` +
    `Adres: ${address}\n` +
    `Telefon: ${phone}\n`
  );
}

function ensureSignatureBlock(petitionText, identity) {
  const sig = buildSignatureBlock(identity).trim();
  const t = String(petitionText || "").trim();

  const replaced = t
    .replace(/Ad\s*Soyad\s*:\s*.*$/gim, `Ad Soyad: ${identity.fullName}`)
    .replace(/T\.?\s*C\.?\s*Kimlik\s*No\s*:\s*.*$/gim, `T.C. Kimlik No: ${identity.tcKimlik}`)
    .replace(/Adres\s*:\s*.*$/gim, `Adres: ${identity.address}`)
    .replace(/Telefon\s*:\s*.*$/gim, `Telefon: ${identity.phone}`)
    .replace(/İmza\s*:\s*.*$/gim, "")
    .replace(/Saygılarımla[,.]?\s*$/gim, "")
    .trim();

  const hasName = /Ad\s*Soyad\s*:/i.test(replaced);
  const hasTc = /T\.?\s*C\.?\s*Kimlik\s*No\s*:/i.test(replaced);
  const hasAddr = /Adres\s*:/i.test(replaced);
  const hasPhone = /Telefon\s*:/i.test(replaced);

  if (hasName && hasTc && hasAddr && hasPhone) return replaced.trim();
  return `${replaced}\n\n${sig}`.trim();
}

function fallbackPetition({ municipality, city, district, category, identity }) {
  const petition =
    `T.C.\n${municipality} Başkanlığı'na\n\n` +
    `Konu: ${category} hakkında şikayet ve talep\n\n` +
    `Sayın Yetkili,\n\n` +
    `${city} ili ${district} ilçesinde ikamet etmekteyim. ${category} konusunda ciddi bir sorun yaşanmakta olup bu durum mahalle sakinlerinin günlük yaşamını ve güvenliğini olumsuz etkilemektedir.\n\n` +
    `Söz konusu sorunun en kısa sürede yerinde incelenerek gerekli teknik ve idari tedbirlerin alınması, kalıcı çözüm sağlanması hususunda gereğini saygılarımla arz ederim.\n`;

  if (identity) return ensureSignatureBlock(petition, identity) + "\n";
  return petition + "Ad Soyad: …\nT.C. Kimlik No: …\nAdres: …\nTelefon: …\n";
}

async function saveToSupabase({ city, district, category, lat, lng, neighbourhood, imageUrl }) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return;
    await fetch(`${supabaseUrl}/rest/v1/complaints`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({ city, district, category, lat, lng, neighbourhood, image_url: imageUrl || null })
    });
  } catch (e) {
    console.error("Supabase kayıt hatası:", e);
  }
}

async function callClaude({ apiKey, systemPrompt, userPrompt, timeoutMs }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      throw new Error(`Claude hata: ${resp.status} ${errText}`.trim());
    }
    const data = await resp.json();
    return (data?.content?.map((b) => b.text).join("") || "").trim();
  } finally {
    clearTimeout(timer);
  }
}

async function callGemini({ apiKey, model, systemPrompt, userPrompt, timeoutMs }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text:
                  `${systemPrompt}\n\n` +
                  `---\n` +
                  `KULLANICI GİRDİSİ:\n${userPrompt}\n` +
                  `---\n` +
                  `Lütfen çıktıyı aşağıdaki formatta ver:\n` +
                  `KISIM 1: Başvuru Kanalları\n- ...\n\nKISIM 2: Dilekçe Metni\n<blok metin>\n`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 700,
        },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      throw new Error(`LLM hata: ${resp.status} ${errText}`.trim());
    }

    const data = await resp.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
    return text.trim();
  } finally {
    clearTimeout(timer);
  }
}

function parseTwoPartOutput(llmText) {
  const t = String(llmText || "");
  const parts = {
    channels: [],
    petitionText: "",
  };

  const idx1 = t.toUpperCase().indexOf("KISIM 1");
  const idx2 = t.toUpperCase().indexOf("KISIM 2");
  if (idx2 !== -1) {
    const channelsChunk = idx1 !== -1 ? t.slice(idx1, idx2) : t.slice(0, idx2);
    const petitionChunk = t.slice(idx2);

    const lines = channelsChunk
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .filter((l) => l.startsWith("-") || l.startsWith("•"))
      .map((l) => l.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean);

    parts.channels = lines;

    parts.petitionText = petitionChunk
      .split("\n")
      .slice(1)
      .join("\n")
      .replace(/^:\s*/gm, "")
      .trim();
  } else {
    parts.petitionText = t.trim();
  }

  return parts;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const ip = getClientIp(event);
  const rl = rateLimit(ip);
  if (!rl.ok) return json(429, { error: "Çok fazla istek. Lütfen biraz sonra tekrar deneyin." });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Geçersiz JSON." });
  }

  const city = clampText(body.city, 80);
  const district = clampText(body.district, 80);
  const municipality = clampText(body.municipality, 120);
  const category = clampText(body.category, 80);
  const userText = clampText(body.userText, 2000);
  const identity = body?.identity && typeof body.identity === "object" ? body.identity : null;
  const ident = identity
    ? {
        fullName: sanitizeOneLine(identity.fullName, 80),
        tcKimlik: sanitizeOneLine(identity.tcKimlik, 11),
        phone: sanitizeOneLine(identity.phone, 30),
        address: sanitizeMultiLine(identity.address, 400),
      }
    : null;

  if (![city, district, municipality, category, userText].every(isNonEmptyString)) {
    return json(400, { error: "Eksik alanlar var. İl/ilçe/belediye, kategori ve metin zorunlu." });
  }
  if (!ident) {
    return json(400, { error: "Kimlik bilgileri eksik." });
  }
  if (![ident.fullName, ident.address, ident.phone].every(isNonEmptyString)) {
    return json(400, { error: "Ad Soyad, Adres ve Telefon zorunlu." });
  }

  const all = await loadMunicipalities().catch(() => []);
  const cityKey = upperTr(city);
  const districtKey = upperTr(district);
  const schema = all?.contactSchema || {
    phone: null,
    whatsapp: null,
    email: null,
    website: null,
    mayor: null,
  };
  const override =
    all?.overridesByCity?.[cityKey]?.[districtKey] ||
    all?.overridesByCity?.[cityKey]?.[district] ||
    null;
  const contact = { ...schema, ...(override || {}) };
  const municipalityName = municipality || getMunicipalityName(city, district);
  
  const bData = await loadBelediyelerInfo();
  const belediCityData = bData[city] || bData[titleTrCity(city)] || null;
  const dataChannels = formatBelediyeChannels(belediCityData);

  const municipalityChannels = contactToChannels(municipalityName, contact);
  const categoryChannels = categoryBasedChannels({ category, city });
  const baseChannels = uniqStrings([...dataChannels, ...categoryChannels, ...municipalityChannels]);

  const neighbourhood = clampText(body.neighbourhood, 100);
  const imageUrl = body.imageUrl || null;

  await saveToSupabase({
    city, district, category,
    lat: body.userLat || belediCityData?.lat || null,
    lng: body.userLng || belediCityData?.lng || null,
    neighbourhood,
    imageUrl,
  });

  const claudeKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";

  if (!isNonEmptyString(claudeKey) && !isNonEmptyString(geminiKey)) {
    return json(200, {
      channels: baseChannels,
      petitionText: fallbackPetition({ municipality, city, district, category, identity: ident }),
      meta: { mode: "fallback_no_key" },
    });
  }

  const systemPrompt =
    `Sen bir kamu hukuku ve belediyecilik uzmanısın.\n` +
    `Kullanıcının verdiği şehir (${city}), ilçe (${district}), kategori (${category}) ve şikayet metnini alarak:\n` +
    `1) İlgili kurumların resmi başvuru kanallarını kurum kurum listele.\n` +
    `2) Şikayeti ${municipalityName} Başkanlığı'na hitaben resmi, hukuki ve açıklayıcı bir dilekçeye dönüştür.\n` +
    `Bunu yaparken kullanıcının yazdığı metni birebir kullanma; şu kurallara kesinlikle uy:\n` +
    `- Yazım ve imla hatalarını tamamen düzelt.\n` +
    `- Günlük konuşma dilini kesinlikle kullanma, resmi ve saygılı ifadeler kullan.\n` +
    `- Kullanıcının verdiği il, ilçe ve sorun kategorisi bilgilerini metin içinde organik geçir.\n` +
    `- Dilekçe gövdesini en az 3 ayrı paragraf halinde yaz:\n` +
    `   * 1. Paragraf: Sorunun ne olduğu ve ne kadar süredir devam ettiği.\n` +
    `   * 2. Paragraf: Bu sorunun vatandaşı nasıl olumsuz etkilediği.\n` +
    `   * 3. Paragraf: İlgili makamdan net çözüm talebi.\n` +
    `ÖNEMLİ: Dilekçeye tarih ekleme. Tarih sistem tarafından eklenecektir.\n` +
    `ÖNEMLİ: Dilekçeye İmza satırı ekleme. İmza satırı sistem tarafından eklenecektir.\n` +
    `Kanuni dayanak atıfları opsiyoneldir; uydurma bilgi üretme.\n` +
    `Aşağıdaki kanalları temel al:\n` +
    baseChannels.map((x) => `- ${x}`).join("\n") +
    `\n\nBelediye kanalları:\n` +
    (municipalityChannels.length ? municipalityChannels.map((x) => `- ${x}`).join("\n") : "- (belediye kanalı yok)") +
    `\n\nYanıtını KESİNLİKLE şu formatta ver:\n` +
    `KISIM 1: İletişim Kanalları\n` +
    `- [Kanal adı]: [Telefon/bilgi]\n\n` +
    `KISIM 2: Dilekçe\n` +
    `T.C.\n` +
    `[Belediye Adı] Başkanlığı'na\n\n` +
    `Konu: [Kategori] hakkında şikayet ve talep\n\n` +
    `Sayın Yetkili,\n\n` +
    `[1. paragraf]\n\n` +
    `[2. paragraf]\n\n` +
    `[3. paragraf]\n\n` +
    `Ad Soyad: [Ad Soyad]\n` +
    `T.C. Kimlik No: [TC]\n` +
    `Adres: [Adres]\n` +
    `Telefon: [Telefon]\n`;

  const userPrompt =
    `İl: ${city}\n` +
    `İlçe: ${district}\n` +
    `Belediye: ${municipality}\n` +
    `Kategori: ${category}\n` +
    `Kullanıcı metni: ${userText}\n` +
    `Ad Soyad: ${ident.fullName}\n` +
    `T.C. Kimlik No: ${ident.tcKimlik}\n` +
    `Adres: ${ident.address}\n` +
    `Telefon: ${ident.phone}\n`;

  try {
    let llmText, mode;

    if (isNonEmptyString(claudeKey)) {
      try {
        llmText = await callClaude({ apiKey: claudeKey, systemPrompt, userPrompt, timeoutMs: 20000 });
        mode = "claude";
      } catch (claudeErr) {
        console.warn("Claude hata, Gemini'ye geçiliyor:", claudeErr?.message);
        if (isNonEmptyString(geminiKey)) {
          llmText = await callGemini({ apiKey: geminiKey, model, systemPrompt, userPrompt, timeoutMs: 9000 });
          mode = "gemini";
        } else {
          throw claudeErr;
        }
      }
    } else {
      llmText = await callGemini({ apiKey: geminiKey, model, systemPrompt, userPrompt, timeoutMs: 9000 });
      mode = "gemini";
    }

    const parsed = parseTwoPartOutput(llmText);
    const channels = uniqStrings([...dataChannels, ...(parsed.channels || [])]);
    const petitionRaw =
      parsed.petitionText ||
      fallbackPetition({ municipality, city, district, category, identity: ident });
    const petition = ensureSignatureBlock(petitionRaw, ident);

    return json(200, { channels, petitionText: petition, meta: { mode } });
  } catch (err) {
    console.error("LLM error:", err?.message || err);
    return json(200, {
      channels: uniqStrings([...dataChannels, ...baseChannels]),
      petitionText: fallbackPetition({ municipality, city, district, category, identity: ident }),
      meta: { mode: "fallback_llm_error", error: err?.message || String(err) },
    });
  }
};