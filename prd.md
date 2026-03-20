# HAKKIM_VAR
# PRD: Hakkım Var (v1.0)
## 1. Proje Amacı
Hakkım Var, Türkiye'deki yerel yönetim bürokrasisini vatandaş için şeffaf ve erişilebilir kılmayı amaçlayan AI destekli bir rehberdir.  
Temel hedef, vatandaşı karşılaştığı altyapı sorununu (örneğin kaldırım bozuk, sokak lambası yanmıyor, su kesintisi, doğalgaz kesintisi, elektrik kesintisi, gürültü, park yokluğu vb.)  
doğru kuruma, doğru üslupla ve doğru kanaldan iletmesini sağlamaktır.  
AI sayesinde, “hak arama” sürecindeki teknik ve dilsel engeller kaldırılarak, herkesin belediyeye ve kamu kurumlarına eşit bir hâle sesini duyurması amaçlanır.  
## 2. Problem ve Kullanıcı
### Problem
Vatandaşlar, sorunlarını (örneğin bozuk yol, kesik su,-su/elektrik/doğalgaz kesintisi,sokak lambası yanmıyorvb.)  
nereye ve nasıl şikayet edeceklerini bilmiyor.  
Resmi dilekçe dili ve yazışma kurallarını bilmedikleri için belediye veya diğer kamu kurumlarına başvurduklarında ciddiye alınmayacaklarından korkuyor veya yanlış kuruma başvurup vakit kaybediyor.  
### Hedef Kullanıcı
- Teknoloji okuryazarlığı düşük olan yaşlılar ve köy sakinleri  
- Hızlı çözüm arayan yoğun çalışanlar ve öğrenciler  
- Resmi yazışma ve dilekçe yazma konularına hakim olmayan her yaştan vatandaş  
- Belediye hizmetlerinden doğrudan etkilenen ve sesini duyurmak isteyen bireyler.
## 3. Kullanıcı ve Kullanım Senaryosu (Adım Adım)
1. Kullanıcı web sayfasını açar ve sade bir “Hakkım Var” karşılama ekranı görür.  
2. Kullanıcı, açılır listeden (Dropdown) İl ve ardından İlçe Belediyesini seçer.  
3. Kullanıcı, sorun kategorisini seçer (örneğin: Çöp/Atık, Sokak Aydınlatması, Su Kesintisi, Elektrik Kesintisi, vb.).  
4. Kullanıcı, metin alanına kendi cümleleriyle sorununu yazıyor (örneğin: “Bizim sokağın lambası 1 haftadır yanmıyor, gece çocuklar korkuyor.”).  
5. Kullanıcı, “AI Destekli Çözüm Üret” butonuna tıklar.  
6. AI, saniyeler içinde o belediyeye özel iletişim kanallarını ve bir dilekçe metni hazırlar, sonuç alanına gösterir.  
7. Kullanıcı, sonuçları inceleyip, belediye veya ilgili kuruma başvuru yaparken kullanır. 
## 4. Genel Özellikler (Kullanıcı Tarafı)
- Sade Form Yapısı: Karmaşık kayıt formları yok; sadece şehir, belediye, sorun kategorisi ve metin alanı olan bir form.  
- Dinamik Belediye Listesi: Seçilen ile göre ilçelerin otomatik olarak gelmesi ve doğru belediyeyi seçmesi.  
- Akıllı Metin Dönüştürücü: Günlük konuşma dilini resmi dilekçe diline çevirme.  
- Kopyala‑Yapıştır Kolaylığı: Çıktıların tek bir tıkla kopyalanabilmesi ve belediye kanallarına gönderilmesi.
  
## 5. Örnek Arayüz ve HTML Bileşenleri
Sayfa, tek bir ana kapsayıcı (container) içinde şu bileşenlerden oluşur:  
- Header: Proje ismi ve kısa slogan.  
- Input Group 1 (Select): Şehir ve İlçe seçimi için `<select>` etiketleri.  
- Input Group 2 (Select): Sorun kategorisi (örneğin: Su, Yol, Park, vb.) için `<select>`.  
- Textarea: Kullanıcının derdini yazacağı geniş metin alanı (`<textarea>`).  
- Action Button: Şık, büyük bir “AI Destekli Çözüm Üret” butonu (`<button>`).  
- Result Area: Başlangıçta gizli, butona basıldıktan sonra görünen; içinde “İletişim Kanalları” ve “Dilekçe Metni” olan iki bölmeli alan.  

## 6. AI / Backend Mantığı
Sistem, kullanıcının girdilerini bir Prompt (istem) olarak paketleyip bir LLM’ye (örneğin Gemini API) gönderir.  

### Sistem Mesajı (System Prompt)
> "Sen bir kamu hukuku ve belediyecilik uzmanısın.  
> Kullanıcının verdiği şehir, kategori ve şikayeti alarak;  
> 1) İlgili kurumun resmi başvuru kanallarını (ALO 153, Beyaz Masa vb.) listeleyerek yaz.  
> 2) Kullanıcının şikayetini, ilgili belediye başkanlığına hitaben yazılmış, resmi, ciddi ve kanuni dayanaklara atıfta bulunan (opsiyonel) profesyonel bir dilekçeye dönüştür."  

### Çıktı Formatı
- Kısım 1: Başvuru Kanalları (Madde madde listelenir).  
- Kısım 2: Dilekçe Metni (Blok metin hâlinde bir paragraf veya paragraflar).  

## 7. Teknik Notlar
- API Güvenliği: API anahtarı (Key) kesinlikle HTML/Frontend tarafında açıkta bırakılmamalı. Basit bir “Serverless Function” (örneğin Vercel veya Netlify Functions) arkasına saklanmalı.  
- Veri Seti: İlk aşamada Türkiye'deki tüm belediyelerin WhatsApp/E‑posta bilgileri bir JSON dosyasında tutulabilir.  
- Mobil Uyumluluk: Kullanıcıların %80'inin mobilden gireceği için Responsive tasarım zorunludur.  

## 8. Başarı Kriteri (MVP - Minimum Uygulanabilir Ürün)
### Çalışması Gerekenler:
- Seçilen belediyeye ait en az 1 doğru iletişim kanalı (örneğin Elazığ Belediyesi için ALO 153).  
- Anlamlı ve imla hatası olmayan bir dilekçe çıktısı.  
- Butona basıldığında en geç 5 saniye içinde cevap gelmesi.  

### MVP Kapsamı Dışındakiler:
- Kullanıcı girişi / üye kaydı (şimdilik gerek yok).  
- Dilekçeyi doğrudan belediyeye sistem üzerinden göndermek (yasal ve teknik zorluklar nedeniyle kullanıcı kendi göndermeli).  