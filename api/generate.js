const MUNICIPALITIES_PATH = "app/data/municipalities.json";

// In-memory MVP rate-limit (per instance)
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
  // address can be multi-line; keep newlines but normalize excessive whitespace
  const t = String(s || "").trim().replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ");
  return t.length > max ? t.slice(0, max) : t;
}

async function loadMunicipalities() {
  // Netlify functions run with cwd at repo root
  const fs = await import("node:fs/promises");
  const raw = await fs.readFile(MUNICIPALITIES_PATH, "utf8");
  const parsed = JSON.parse(raw);
  return parsed && typeof parsed === "object" ? parsed : {};
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

  // User-specified mapping (MVP)
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
    return ["Belediye (Beyaz Masa / ALO 153): 153"];
  }
  if (c.includes("çöp") || c.includes("cop") || c.includes("atık") || c.includes("atik")) {
    return ["Belediye Temizlik Müdürlüğü (ALO 153): 153"];
  }
  if (c.includes("gürültü") || c.includes("gurultu")) {
    return ["Zabıta (ALO 153): 153", "Jandarma: 156"];
  }

  // General complaint
  return ["CİMER: 150", "BİMER (eski başvuru kanalı)"];
}

function buildSignatureBlock(identity) {
  const today = new Date();
  const dateStr = today.toLocaleDateString("tr-TR");
  const fullName = identity?.fullName || "…";
  const tcKimlik = identity?.tcKimlik || "…";
  const address = identity?.address || "…";
  const phone = identity?.phone || "…";

  return (
    `Tarih: ${dateStr}\n` +
    `Ad Soyad: ${fullName}\n` +
    `T.C. Kimlik No: ${tcKimlik}\n` +
    `Adres: ${address}\n` +
    `Telefon: ${phone}\n` +
    `İmza: ${fullName !== "…" ? fullName : "…"}\n`
  );
}

function ensureSignatureBlock(petitionText, identity) {
  const sig = buildSignatureBlock(identity).trim();
  const t = String(petitionText || "").trim();

  // Replace placeholders if the model produced them
  const replaced = t
    .replace(/Ad\s*Soyad\s*:\s*.*$/gim, `Ad Soyad: ${identity.fullName}`)
    .replace(/T\.?\s*C\.?\s*Kimlik\s*No\s*:\s*.*$/gim, `T.C. Kimlik No: ${identity.tcKimlik}`)
    .replace(/Adres\s*:\s*.*$/gim, `Adres: ${identity.address}`)
    .replace(/Telefon\s*:\s*.*$/gim, `Telefon: ${identity.phone}`)
    .replace(/İmza\s*:\s*.*$/gim, `İmza: ${identity.fullName}`);

  const hasName = /Ad\s*Soyad\s*:/i.test(replaced);
  const hasTc = /T\.?\s*C\.?\s*Kimlik\s*No\s*:/i.test(replaced);
  const hasAddr = /Adres\s*:/i.test(replaced);
  const hasPhone = /Telefon\s*:/i.test(replaced);

  if (hasName && hasTc && hasAddr && hasPhone) return replaced.trim();
  return `${replaced}\n\n${sig}`.trim();
}

function fallbackPetition({ municipality, city, district, category, userText, identity }) {
  const petition =
    `T.C.\n${municipality} Başkanlığı'na\n\n` +
    `Konu: ${category} hakkında şikayet ve talep\n\n` +
    `Sayın Yetkili,\n\n` +
    `${city} ili ${district} ilçesinde ikamet etmekteyim. ${userText}\n\n` +
    `Yaşanan durumun vatandaşların günlük yaşamını ve güvenliğini olumsuz etkilediğini bilgilerinize sunar; ` +
    `konunun incelenerek gerekli işlemlerin yapılmasını arz ederim.\n`;

  if (identity) return ensureSignatureBlock(petition, identity) + "\n";
  return petition + "Ad Soyad: …\nT.C. Kimlik No: …\nAdres: …\nTelefon: …\nİmza: …\n";
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
    // Eğer format bozulursa: tüm metni dilekçe gibi döndür
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
    return json(400, { error: "Kimlik bilgileri eksik. Ad Soyad, T.C. Kimlik No, Adres ve Telefon zorunlu." });
  }
  if (!/^\d{11}$/.test(ident.tcKimlik)) {
    return json(400, { error: "T.C. Kimlik No 11 haneli olmalı." });
  }
  if (![ident.fullName, ident.address, ident.phone].every(isNonEmptyString)) {
    return json(400, { error: "Kimlik bilgileri eksik. Ad Soyad, Adres ve Telefon zorunlu." });
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
  const municipalityChannels = contactToChannels(municipalityName, contact);
  const categoryChannels = categoryBasedChannels({ category, city });
  const baseChannels = uniqStrings([...categoryChannels, ...municipalityChannels]);

  // Fallback (anahtar yoksa)
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  if (!isNonEmptyString(apiKey)) {
    return json(200, {
      channels: baseChannels,
      petitionText: fallbackPetition({ municipality, city, district, category, userText, identity: ident }),
      meta: { mode: "fallback_no_key" },
    });
  }

  const systemPrompt =
    `Sen bir kamu hukuku ve belediyecilik uzmanısın.\n` +
    `Kullanıcının verdiği şehir (${city}), ilçe (${district}), kategori (${category}) ve şikayet metnini alarak:\n` +
    `1) İlgili kurumların resmi başvuru kanallarını kurum kurum listele.\n` +
    `2) Şikayeti ${municipalityName} Başkanlığı'na hitaben resmi, hukuki ve açıklayıcı bir dilekçeye dönüştür.\n` +
    `Bunu yaparken kullanıcının yazdığı metni birebir kullanma; şu kurallara kesinlikle uy:\n` +
    `- Yazım ve imla hatalarını tamamen düzelt (örneğin 'ısıklarımız' hatasını 'ışıklarımız' olarak düzelt).\n` +
    `- Günlük konuşma dilini ('yardım edin lutfen', 'bilmiyorum' vb.) kesinlikle kullanma, bunun yerine resmi, hukuki ve saygılı ifadeler ('gereğinin yapılmasını arz ederim' vb.) tercih et.\n` +
    `- Kullanıcının verdiği il, ilçe ve sorun kategorisi bilgilerini metin içinde mutlaka organik bir şekilde geçir.\n` +
    `- Dilekçe gövdesini genişleterek en az 3 ayrı paragraf halinde yaz:\n` +
    `   * 1. Paragraf: Sorunun tam olarak ne olduğu ve tahminen ne kadar süredir devam ettiği.\n` +
    `   * 2. Paragraf: Bu sorunun vatandaşı, çevreyi veya sosyal yaşamı nasıl olumsuz etkilediği (hukuki ve mantıksal dayanaklarıyla).\n` +
    `   * 3. Paragraf: İlgili makamdan net çözüm talebi (arz ve talep cümlesi).\n` +
    `ÖNEMLİ: Dilekçe metninin HİÇBİR YERİNE (sağ üst, son vb.) tarih ekleme. Tarih bilgisi sistem tarafından eklenecektir.\n` +
    `Kanuni dayanak atıfları opsiyoneldir; uydurma bilgi üretme.\n` +
    `Dilekçenin sonunda kullanıcı kimlik/iletişim bilgileri mutlaka yer alsın.\n` +
    `Aşağıdaki "kategoriye göre ilgili kurumlar/numaralar" listesini temel al:\n` +
    baseChannels.map((x) => `- ${x}`).join("\n") +
    `\n\n` +
    `Ayrıca belediye kaydı varsa bunu da ekle:\n` +
    (municipalityChannels.length ? municipalityChannels.map((x) => `- ${x}`).join("\n") : "- (belediye kanalı yok)") +
    `\n\n` +
    `Kurumlar için mümkünse telefon + online başvuru kanalı (web formu/e-posta/WhatsApp) başlıklarını ayrı ayrı yaz. Online kanal bilmiyorsan "online kanal bulunamadı" de, uydurma link/iletişim yazma.\n\n` +
    `Yanıtını KESİNLİKLE şu formatta ver, başka format kullanma:\n` +
    `KISIM 1: İletişim Kanalları\n` +
    `- [Kanal adı]: [Telefon/bilgi]\n` +
    `- [Kanal adı]: [Telefon/bilgi]\n` +
    `KISIM 2: Dilekçe\n` +
    `T.C.\n` +
    `[Belediye Adı] Başkanlığı'na\n` +
    `Konu: [Kategori] hakkında şikayet ve talep\n` +
    `Sayın Yetkili,\n` +
    `[1. paragraf: sorunun ne olduğu, ne kadar süredir devam ettiği — yazım hatalarını düzelt, resmi dile çevir]\n` +
    `[2. paragraf: vatandaşı ve çevreyi nasıl olumsuz etkilediği]\n` +
    `[3. paragraf: çözüm talebi]\n` +
    `Saygılarımla,\n` +
    `[Ad Soyad]\n` +
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
    const llmText = await callGemini({
      apiKey,
      model,
      systemPrompt,
      userPrompt,
      timeoutMs: 4500,
    });

    const parsed = parseTwoPartOutput(llmText);
    const channels = uniqStrings([...(parsed.channels || []), ...baseChannels]);
    const petitionRaw =
      parsed.petitionText ||
      fallbackPetition({ municipality, city, district, category, userText, identity: ident });
    const petition = ensureSignatureBlock(petitionRaw, ident);

    return json(200, {
      channels,
      petitionText: petition,
      meta: { mode: "gemini" },
    });
  } catch {
    // Timeout / API error fallback
    return json(200, {
      channels: baseChannels,
      petitionText: fallbackPetition({ municipality, city, district, category, userText, identity: ident }),
      meta: { mode: "fallback_llm_error" },
    });
  }
};

