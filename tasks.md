# Hakkım Var — Geliştirme Görev Listesi (PRD v1.0)

Bu dosya `prd.md`’deki gereksinimlere göre, uygulamayı adım adım geliştirmek için hazırlanmış görev listesidir.

## 0) Karar & Kapsam Netleştirme (MVP)
- [ ] **MVP hedefi**: Seçilen belediye için en az 1 doğru kanal + düzgün dilekçe metni, 5 saniye içinde yanıt.
- [ ] **Tek sayfa akışı**: Şehir → ilçe/belediye → kategori → kullanıcı metni → “AI Destekli Çözüm Üret” → sonuç.
- [ ] **MVP dışı**: Üyelik, doğrudan belediyeye gönderim.

## 1) Proje Kurulumu
- [ ] **Klasör yapısı**: `app/` (frontend), `api/` (serverless), `data/` (belediye JSON), `docs/` (opsiyonel).
- [ ] * **Ortam değişkenleri**: `.env.example` oluştur 
  (LLM API anahtarı, Supabase URL ve Anon Key)
- [ ] **Temel README**: Proje amacı, kurulum, çalıştırma, deploy notları.

## 2) Veri: Belediye / İletişim Kanalı Datası
- [ ] **JSON şeması tanımı**: il, ilçe, belediye adı, kanallar (ALO 153, Beyaz Masa, WhatsApp, e-posta, web formu).
- [ ] **`data/municipalities.json` (seed)**: MVP için en az 1 il + 1 ilçe + 1 doğru kanal (PRD başarı kriteri).
- [ ] **Veri doğrulama**: Eksik/bozuk kayıtlar için fallback mesajları.

## 3) Frontend — UI (PRD’deki bileşenler)
- [ ] **Karşılama ekranı**: Başlık + kısa slogan.
- [ ] **Form alanları**:
  - [ ] Şehir seçimi (`<select>`)
  - [ ] İlçe/Belediye seçimi (`<select>`, şehre göre dinamik)
  - [ ] Sorun kategorisi (`<select>`)
  - [ ] Sorun metni (`<textarea>`)
- [ ] **Aksiyon butonu**: “AI Destekli Çözüm Üret” (disabled/loading durumları).
- [ ] **Sonuç alanı**:
  - [ ] Başlangıçta gizli
  - [ ] Yanıttan sonra görünür
  - [ ] 2 bölüm: “İletişim Kanalları” + “Dilekçe Metni”
- [ ] **Kopyala butonları**: Kanallar ve dilekçe için tek tıkla kopyala.
- [ ] **Hata/uyarı durumları**: Boş alan, API hatası, zaman aşımı, “tekrar dene”.
- [ ] **Mobil uyumluluk**: Responsive layout (telefon öncelikli).
- [ ] **Erişilebilirlik**: Label’lar, klavye ile kullanım, odak stilleri.

## 4) Backend — Serverless Function (API anahtarı gizli)
- [ ] **Endpoint tasarımı**: Örn. `POST /api/generate`
  - [ ] Request: `{ city, district, category, userText }`
  - [ ] Response: `{ channels: [...], petitionText: "..." }` (veya tek string + parse)
- [ ] **Güvenlik**: LLM anahtarı sadece sunucu tarafında, loglarda sızdırma yok.
- [ ] **Rate limiting (MVP-lite)**: Basit IP bazlı limit veya minimum koruma.
- [ ] **Timeout**: 5 saniye hedefi için sunucu tarafında timeout ve kullanıcıya net hata mesajı.
- [ ] **Input validation**: Çok uzun metin, boş değerler, beklenmeyen değerler.

## 5) Promptlama & Çıktı Biçimi (PRD “AI / Backend Mantığı”)
- [ ] **System prompt**: PRD’deki rol + iki parçalı çıktı isteği.
- [ ] **Belediye kanal eşleme**:
  - [ ] Seçilen belediyenin kanallarını JSON’dan al
  - [ ] Prompt’a “bilinen resmi kanallar” olarak ekle (hallucination riskini azaltmak için)
- [ ] **Çıktı formatını sabitle**:
  - [ ] Kısım 1: Madde madde kanallar
  - [ ] Kısım 2: Dilekçe metni (blok)
- [ ] **Parse stratejisi**: LLM çıktısını güvenilir ayrıştırmak için delimiter/JSON mode (mümkünse).

## 6) Frontend ↔ Backend Entegrasyonu
- [ ] **Submit akışı**: Form değerlerini backend’e gönder.
- [ ] **Loading UX**: Spinner/skeleton + “hazırlanıyor” metni.
- [ ] **Başarılı yanıt**: Sonuç alanını göster, kopyala butonlarını aktive et.
- [ ] **Hata yanıtı**: Kullanıcı dostu mesaj + yeniden dene.

## 7) Kalite: Test & Doğrulama
- [ ] **Manuel test senaryoları**:
  - [ ] Minimum veriyle başarı (MVP)
  - [ ] Boş alanlar / invalid input
  - [ ] LLM timeout / ağ hatası
  - [ ] Mobil ekranda taşma/okunabilirlik
- [ ] **Basit otomasyon (opsiyonel)**:
  - [ ] Backend için validation testleri
  - [ ] UI smoke test (form render + submit)

## 8) Performans & Güvenilirlik
- [ ] **Yanıt süresi**: Ortalama < 5s hedefi için prompt kısa, model seçimi uygun, gereksiz token yok.
- [ ] **Cache (opsiyonel)**: Aynı belediye+kategori benzer istekler için kısa süreli cache.
- [ ] **Gözlemlenebilirlik**: Hata logları (PII sızdırmadan), basit metrikler (istek sayısı, hata oranı).

## 9) Deploy
- [ ] **Serverless sağlayıcı seçimi**: Vercel veya Netlify (PRD önerisi).
- [ ] **Prod ortam değişkenleri**: LLM key, model adı vb.
- [ ] **Domain / HTTPS**: Varsayılan platform domaini yeterli (MVP).
- [ ] **Smoke test**: Prod’da 1 örnek istekle uçtan uca doğrula.

## 10) Sonrası (MVP sonrası fikir havuzu)
- [ ] **Belediye veri setini genişlet**: Türkiye geneli kapsam.
- [ ] **Kanuni dayanaklar**: Dilekçeye opsiyonel mevzuat referansları (doğruluk kontrolü ile).
- [ ] **Çoklu dil / sadeleştirme**: Yaşlı kullanıcılar için daha basit anlatım modu.
- [ ] **Paylaşım**: Dilekçeyi PDF’e dönüştürme (yerelde) / yazdırma görünümü.

