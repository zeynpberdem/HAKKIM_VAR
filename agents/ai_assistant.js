/**
 * Hakkım Var - AI Assistant Agent
 * Görev: Kullanıcı metnini AI modeline (GPT/Claude vb.) göndermeden önce hazırlar.
 */

async function generateLegalDraft(userInput) {
    // 1. ADIM: PROMPT ENGINEERING (Ajanın Uzmanlık Alanı)
    const systemPrompt = `Sen bir hukuk asistanısın. Kullanıcının şu sorununu: "${userInput}" 
    resmi, hukuki ve etkili bir dilekçe formatına çevir. 
    İlgili kanun maddelerine atıfta bulun.`;

    // 2. ADIM: API ÇAĞRISI (Burada senin kullandığın AI servisi devreye girer)
    console.log("Ajan AI servisine bağlanıyor...");
    
    // Buraya senin mevcut AI fonksiyonun gelecek
    // return await callAI(systemPrompt); 
    
    return "Dilekçe taslağı başarıyla hazırlandı.";
}
