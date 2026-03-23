exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Supabase env yok" }) };
  }

  const contentType = event.headers["content-type"] || "application/octet-stream";
  const fileName = event.headers["x-file-name"] || `${Date.now()}.jpg`;
  const fileBuffer = Buffer.from(event.body, event.isBase64Encoded ? "base64" : "utf-8");

  const sbRes = await fetch(`${supabaseUrl}/storage/v1/object/complaint-images/${fileName}`, {
    method: "POST",
    headers: {
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`,
      "Content-Type": contentType,
    },
    body: fileBuffer,
  });

  const sbText = await sbRes.text();
  if (!sbRes.ok) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: sbText }),
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: `${supabaseUrl}/storage/v1/object/public/complaint-images/${fileName}`,
    }),
  };
};
