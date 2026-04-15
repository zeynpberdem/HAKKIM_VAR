# 🏛️ Hakkım Var
> **AI Destekli Vatandaş Hakları Platformu**  
> Hakkını ara, doğru yere ilet.

## 🌍 Canlı Demo
🔗 **Yayın Linki:** https://hakkim-var.vercel.app         
      🔗 Test Sürecimiz: Kullanıcılara uyguladığımız anketin orijinal haline buradan https://forms.gle/YazgvT4PJFHpqiBV9 ulaşabilirsiniz.

## 💡 Problem
Türkiye'de milyonlarca vatandaş belediye sorunlarını (bozuk yol, su kesintisi, sokak lambası vb.) bildirmek istese de **nereye başvuracağını bilemiyor**, resmi dil bilmiyor ve doğru kuruma ulaşamıyor. Bu durum vatandaşın hakkını kullanamamasına yol açıyor.

## ✅ Çözüm
**Hakkım Var**, vatandaşın sorununu kendi cümleleriyle anlatmasını sağlar. Yapay zeka bu metni resmi dilekçeye dönüştürür, doğru kurumu ve iletişim kanallarını gösterir. Tek tıkla kopyala,düzenle ve gönder.

## 🤖 AI Nasıl Kullanılıyor?
- Kullanıcının kaba metnini → **resmi dilekçe diline** çevirir (Gemini API)
- Seçilen il/ilçeye göre → **doğru belediye bilgisi** otomatik gösterilir
- İletişim kanalları (telefon, WhatsApp, web sitesi) → kod içinde tanımlı statik veri yapısından otomatik çekilir.

## ✨ Özellikler
- 🗺️ **Şikayet Haritası** — Türkiye genelinde şikayetlerin yoğunluk haritası
- 📄 **AI Dilekçe Üretici** — Kendi cümlelerinle yaz, AI resmi dile çevirsin
- 🏘️ **Dinamik Mahalle Seçimi** — İl seçildiğinde ilçe ve mahalleler otomatik listelenir
- 📞 **Kanal Rehberi** — Seçilen ile göre belediye telefonu, WhatsApp ve web sitesi otomatik listelenir
- 📸 **Kanıt Fotoğrafı** — Başvuruya kanıt fotoğrafı ekle
- 📥 **PDF İndir / Kopyala** — Dilekçeyi anında kullan
- 🗄️ **Gerçek Veritabanı** — 42+ gerçek başvuru, 5 şehir desteği.

## 🛠️ Kullanılan Teknolojiler
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Netlify Serverless Functions
- **AI:** Gemini API (Google)
- **Veritabanı:** JSON tabanlı belediye veri seti
- **Harita:** Leaflet.js + OpenStreetMap
- **Deploy:** Vercel
  Veritabanı: Supabase (PostgreSQL) — vatandaş başvurularını saklar, harita verisini sağlar
  Statik Veri: JSON tabanlı belediye iletişim veri seti
  
## 🤖 Geliştirme Sürecinde Kullanılan AI Araçları
- **Antigravity** — Temel kod geliştirme
- **Claude Code** — Terminal tabanlı AI kod asistanı
- **Cursor** — Iterasyon ve hata düzeltme
- **Gemini** — Fikir üretimi, PRD ve dokümantasyon
- perplexity.ai
  
- ## 📊 Kullanıcı Testleri ve Başarı Verileri

"Hakkım Var" projemizi geliştirirken 20 farklı kullanıcıdan aldığımız geri bildirimler, çözümümüzün gerçek bir ihtiyaca hitap ettiğini kanıtlıyor:

### 🚀 Temel Başarı Metrikleri
* **Süreç Hızlandırma:** Kullanıcılarımızın **%75'i** dilekçe yazma sürecinde **%90'dan fazla zaman kazandığını** belirtti.
* **Hukuki Kalite:** Yapay zekanın oluşturduğu dilekçe dili, katılımcıların **%90'ı** tarafından "Profesyonel ve başarılı" bulundu.
* **Kullanılabilirlik:** Teknolojik çekincesi olan (yaşlılar vb.) birinin tek başına kullanabileceğine inananların oranı **%90.**

### 📈 Detaylı Analiz Grafikleri
| Süreç Kolaylığı | Hukuki Dil Kalitesi | Zaman Kazancı |
| :---: | :---: | :---: |
| ![Kolaylık](./Kullanıcı%20Geri%20Bildirim%20Formu/soru6.png) | ![Kalite](./Kullanıcı%20Geri%20Bildirim%20Formu/soru5.png) | ![Zaman](./Kullanıcı%20Geri%20Bildirim%20Formu/soru4.png) |

> **"Değerli emekleriniz ve duyarlılığınız için teşekkür ederiz."** - Kullanıcı Geri Bildirimi
## 📁 Proje Yapısı
```
app/      → Frontend (HTML/CSS/JS)
api/      → Serverless functions
data/     → Belediye iletişim verisi (JSON)
```

## ⚙️ Lokal Çalıştırma
```bash
# 1. Repoyu klonla
(https://github.com/zeynpberdem/HAKKIM_VAR.git)
