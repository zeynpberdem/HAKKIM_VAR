exports.handler = async (event) => {
  const q = event.queryStringParameters?.q || "";
  if (!q || q.length < 2) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Missing query" }),
    };
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=tr`;
    const res = await fetch(url, {
      headers: {
        "Accept-Language": "tr",
        "User-Agent": "HakkimVar/1.0",
      },
    });
    const data = await res.json();
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
