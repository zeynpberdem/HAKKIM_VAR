# idea.md
## Proje Adı
HAKKIM VAR
## Problem
Türkiye’de vatandaşlar, belediye ve şehir altyapısıyla ilgili sorunlar (örneğin kaldırım bozuk, sokak lambası yanmıyor, çöp toplanmıyor, su kesintisi, doğalgaz kesintisi, elektrik kesintisi, gürültü,su akıntısı, park yokluğu vb.) yaşadığında, **nereye, ne diye, hangi kanallarla şikayet edeceğini genellikle bilmiyor.**  
Sistemi bilenler kanallardan yararlanırken, bilmeyenler sessiz kalıyor veya yanlış yerlere başvuruyor. Bu durum, hizmetlerin **daha adaletli ve erişilebilir bir şekilde sunulmasına engel oluyor.**
## Kullanıcı
- Her yaştan Türk vatandaşı  
- Belediye hizmetlerinden etkilenen mahalle halkı  
- Teknolojiye erişimi ve bilgisi sınırlı olan bireyler (yaşlı, köy sakinleri)  
- Belediyeye sesini duyurmak isteyen ama dilekçe yazma ve kanal bilgisi eksik olan kullanıcılar
## Çözüm
Kullanıcı:  
1. Şehir ve belediyesini seçiyor,  
2. Sorunun kategorisini seçiyor (örneğin: kaldırım, sokak lambası, su kesintisi, elektrik kesintisi, doğalgaz kesintisi, çöp, park, gürültü, vb.),  
3. Sorunu kendi cümleleriyle anlatarak detaylı bilgi giriyor (ne oldu, ne zaman, nerede, ne istiyor).
## AI'nın Rolü
AI, bu metni anlayarak:
- Soruna uygun **resmi şikayet kanallarını** gösteriyor (örneğin belediye çağrı merkezi, ALO 153, e‑devlet, belediye web sitesi, e‑posta, WhatsApp hattı, vb.).  
- Kullanıcının girdisini resmi dilekçe diliyle **hazır bir dilekçe metni** olarak üretiyor.  
Kullanıcı, sadece birkaç dakikada,  
- **Nereye** ve **hangi kanallarla** başvuru yapması gerektiğini,  
- **Ne yazması** gerektiğini (örnek dilenmek),  
öğrenmiş oluyor ve bu metni kullanarak belediye veya ilgili kuruma başvurabiliyor.
## Rakip Durum
- Belediyelerin kendi web siteleri ve mobil uygulamaları, şehir–şehir değişiyor ve kullanımı karmaşık.  
- Bazı şehirlerde WhatsApp hattı, bazılarında ALO 153, bazılarında e‑devlet ve e‑imza kanalları var.  
- Dilekçe yazma ve resmi dilekçe formatı, birçok kullanıcı için bir engel.  
- “Hakkım Var” projesi,  
  - Farklı belediyeleri ve kanalları **tek bir arayüzde** topluyor,  
  - “Ne yazılmalı, nereye” sorusunu **AI’ın anlatımıyla** çözüyor,  
  - Dilekçe yazma sürecini kullanıcı için **tamamen otomatize** ediyor.
## Başarı Kriteri
 Vatandaş,  
  1) Şehir ve belediyesini seçiyor,  
  2) Sorunun kategorisini seçiyor,  
  3) Sorununu kendi cümleleriyle yazıyor.   
-Ardından:
  - Nereye başvurması gerektiğini,  
  - Ne yazması gerektiğini (örnek bir dilekçe metni),  
  - Hangi resmi kanalların kullanılabileceğini anlayabiliyor.  
- Uygulama, en az 1 belediyenin (örneğin Elazığ Belediyesi) resmi kanallarına göre test edilerek, çalışan bir prototip olarak GitHub’da yayımlanıyor.  
