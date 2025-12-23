const http = require("http");

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
  console.error("OPENAI_API_KEY が設定されていません。");
  process.exit(1);
}

async function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (err) {
        reject(err);
      }
    });
  });
}

async function convertText(text) {
  if (shouldSuggestLeaving(text)) {
    return "ぶぶ漬けでもどうどす？";
  }
  if (shouldReturnShine(text)) {
    return "死ねどす";
  }

  const systemPrompt =
    "あなたは日本語の言い回しを京都弁に変換するアシスタントです。" +
    "自然でやわらかい京都弁にしつつ、皮肉がにじむ表現を優先してください。" +
    "表向きは丁寧で上品、内側は遠回しに批判や違和感を伝える言い回しにしてください。" +
    "出力は変換結果のみ。";

  const examples = [
    {
      input: "もう帰ったほうがいいよ。",
      output: "ぶぶ漬けでもどうどす？"
    },
    {
      input: "食べすぎだよ。",
      output: "ようけ食べはりますなぁ"
    },
    {
      input: "派手すぎるよ。",
      output: "立派なお召しもんやこと"
    },
    {
      input: "うるさいよ。",
      output: "よう喋らはりますなぁ"
    },
    {
      input: "よくそんなこと言えるね。",
      output: "さすがですなぁ"
    },
    {
      input: "知ったかぶりしないで。",
      output: "よぅ知ってはりますなぁ"
    },
    {
      input: "似合ってない。",
      output: "まぁまぁ、よう似合ってますわ"
    }
  ];

  const payload = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      ...examples.flatMap((ex) => [
        { role: "user", content: ex.input },
        { role: "assistant", content: ex.output }
      ]),
      { role: "user", content: text }
    ],
    temperature: 0.7
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI API response invalid");
  }

  return content.trim();
}

function shouldSuggestLeaving(text) {
  const normalized = text.replace(/\s+/g, "");
  const patterns = [
    /帰ったほうがいい/,
    /帰った方がいい/,
    /そろそろ帰ったら/,
    /そろそろ帰ろ/,
    /もう帰ったら/,
    /もう帰ろ/,
    /帰ってくれる/,
    /帰ってもらえる/,
    /帰ってください/,
    /帰ってくれ/,
    /お開きにしよ/,
    /早く帰れ/,
    /はやく帰れ/,
    /さっさと帰れ/,
    /とっとと帰れ/,
    /帰れ/,
    /はやくかえれ/,
    /さっさとかえれ/,
    /とっととかえれ/,
    /かえれ/
  ];
  return patterns.some((re) => re.test(normalized));
}

function shouldReturnShine(text) {
  const normalized = text.replace(/\s+/g, "");
  const patterns = [
    /死ね/,
    /しね/,
    /くたばれ/,
    /消えろ/,
    /消えて/,
    /きもい/,
    /キモい/,
    /キモイ/,
    /気持ち悪い/,
    /キモすぎ/,
    /きもすぎ/
  ];
  return patterns.some((re) => re.test(normalized));
}

const server = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/api/convert") {
    try {
      const body = await readJson(req);
      const text = String(body.text || "");
      if (!text.trim()) {
        res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("text is required");
        return;
      }

      const result = await convertText(text);
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ result }));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(err.message || "server error");
    }
    return;
  }

  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(require("fs").readFileSync("index.html"));
    return;
  }

  if (req.method === "GET" && req.url === "/app.js") {
    res.writeHead(200, { "Content-Type": "application/javascript; charset=utf-8" });
    res.end(require("fs").readFileSync("app.js"));
    return;
  }

  if (req.method === "GET" && req.url === "/style.css") {
    res.writeHead(200, { "Content-Type": "text/css; charset=utf-8" });
    res.end(require("fs").readFileSync("style.css"));
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("not found");
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
