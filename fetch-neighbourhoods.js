// Overpass API'den 5 şehrin mahallelerini çekip neighbourhoods.json'a kaydeder
// Çalıştır: node fetch-neighbourhoods.js

const fs = require("fs");
const path = require("path");

const CITIES = ["Elazığ", "Diyarbakır", "Erzincan", "Tunceli"]; // Malatya zaten tamam

// Türkiye'de mahalleler admin_level=10
function buildQuery(cityName) {
  return `
[out:json][timeout:90];
area["name"="${cityName}"]["admin_level"="4"]->.prov;
(
  node["place"="neighbourhood"](area.prov);
  node["place"="suburb"](area.prov);
  node["place"="quarter"](area.prov);
);
out;
`.trim();
}

async function fetchCity(cityName) {
  const query = buildQuery(cityName);
  const url = "https://overpass-api.de/api/interpreter";
  console.log(`Çekiliyor: ${cityName}...`);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "data=" + encodeURIComponent(query),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} — ${cityName}`);
  const json = await res.json();

  const mahalles = [];
  for (const el of json.elements || []) {
    const name = el.tags?.name;
    const lat = el.center?.lat ?? el.lat;
    const lng = el.center?.lon ?? el.lon;
    const district = el.tags?.["addr:district"] || el.tags?.["is_in:district"] || null;
    if (name && lat && lng) {
      mahalles.push({ name, district, lat, lng });
    }
  }

  console.log(`  ${cityName}: ${mahalles.length} mahalle bulundu`);
  return mahalles;
}

(async () => {
  const result = {};

  for (const city of CITIES) {
    try {
      result[city] = await fetchCity(city);
      // Rate limit için bekle
      await new Promise((r) => setTimeout(r, 8000));
    } catch (err) {
      console.error(`HATA (${city}):`, err.message);
      result[city] = [];
    }
  }

  // Mevcut dosyayla birleştir
  const outPath = path.join(__dirname, "data", "neighbourhoods.json");
  let existing = {};
  try { existing = JSON.parse(fs.readFileSync(outPath, "utf-8")); } catch {}
  const merged = { ...existing, ...result };
  fs.writeFileSync(outPath, JSON.stringify(merged, null, 2), "utf-8");

  const total = Object.values(result).reduce((s, arr) => s + arr.length, 0);
  console.log(`\nTamamlandı! Toplam ${total} mahalle → ${outPath}`);
})();
