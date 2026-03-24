const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Supabase env yok" });
  }

  const contentType = req.headers["content-type"] || "application/octet-stream";
  const fileName = req.headers["x-file-name"] || `${Date.now()}.jpg`;

  // Raw body okuma (bodyParser: false)
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const fileBuffer = Buffer.concat(chunks);

  const sbRes = await fetch(`${supabaseUrl}/storage/v1/object/complaint-images/${fileName}`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": contentType,
    },
    body: fileBuffer,
  });

  const sbText = await sbRes.text();
  if (!sbRes.ok) {
    return res.status(500).json({ error: sbText });
  }

  return res.status(200).json({
    url: `${supabaseUrl}/storage/v1/object/public/complaint-images/${fileName}`,
  });
};

// Vercel: body parser'ı kapat (raw binary için)
handler.config = { api: { bodyParser: false } };

module.exports = handler;
