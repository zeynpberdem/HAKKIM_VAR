/**
 * Hakkım Var - Legal Parser Agent
 * Görev: Kullanıcı metnini analiz eder ve ilgili hukuk kategorisini belirler.
 */

const legalKeywords = {
    "İş Hukuku": ["tazminat", "mesai", "mobbing", "istifa", "kovulma", "maaş", "izin"],
    "Tüketici Hukuku": ["ayıplı mal", "iade", "garanti", "fatura", "bozuk", "değişim", "kargo"],
    "Aile Hukuku": ["boşanma", "nafaka", "velayet", "miras", "evlilik"],
    "Bilişim Hukuku": ["dolandırıcılık", "hack", "şifre", "sosyal medya", "hakaret", "veriler"]
};

function analyzeLegalProblem(userText) {
    const text = userText.toLowerCase();
    let detectedCategory = "Genel Hukuk / Diğer";
    let foundKeywords = [];

    // Anahtar kelime taraması yapan ajan mantığı
    for (const [category, keywords] of Object.entries(legalKeywords)) {
        keywords.forEach(word => {
            if (text.includes(word)) {
                detectedCategory = category;
                foundKeywords.push(word);
            }
        });
    }

    return {
        category: detectedCategory,
        keywords: foundKeywords,
        confidence: foundKeywords.length > 0 ? "High" : "Low",
        timestamp: new Date().toISOString()
    };
}

// Örnek Test Kullanımı
const userComplaint = "İş yerinde mobbinge uğruyorum ve tazminat haklarımı merak ediyorum.";
const analysis = analyzeLegalProblem(userComplaint);

console.log("--- Legal Agent Analiz Sonucu ---");
console.log(`Kategori: ${analysis.category}`);
console.log(`Tespit Edilen Kelimeler: ${analysis.keywords.join(", ")}`);
