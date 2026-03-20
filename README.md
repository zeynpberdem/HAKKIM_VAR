# Hakkım Var (MVP)

Türkiye'deki yerel yönetim bürokrasisini vatandaş için daha şeffaf ve erişilebilir kılmayı hedefleyen, AI destekli şikayet/dilekçe üretim aracı.

## Özellikler (PRD v1.0)
- İl / ilçe-belediye seçimi (dinamik)
- Sorun kategorisi seçimi
- Kullanıcı metnini resmi dilekçe diline çevirme
- Seçilen belediyeye ait başvuru kanallarını gösterme
- Tek tıkla kopyalama

## Proje Yapısı
- `app/`: Statik frontend (HTML/CSS/JS)
- `api/`: Serverless function (Netlify uyumlu)
- `data/`: Belediye iletişim verisi (JSON)

## Lokal Çalıştırma
Bu repo statik bir frontend içerir. En kolay yerel çalışma:

1) Bir statik sunucu ile `app/` klasörünü servis edin  
Örn: VSCode “Live Server” eklentisiyle `app/index.html` açın.

2) Serverless fonksiyonu yerelde çalıştırmak için Netlify CLI önerilir:
- Netlify CLI kurun ve çalıştırın:
  - `netlify dev`

> Not: Bu projede LLM anahtarı frontend'de **asla** kullanılmaz; sadece serverless function içinde kullanılır.

## Ortam Değişkenleri
`.env.example` dosyasını `.env` olarak kopyalayıp değerleri girin.

## Deploy
Netlify önerilir:
- Static publish directory: `app`
- Functions directory: `api`

