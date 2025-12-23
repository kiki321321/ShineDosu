const inputEl = document.querySelector("#inputText");
const outputEl = document.querySelector("#outputText");
const statusEl = document.querySelector("#statusText");

function setStatus(message) {
  statusEl.textContent = message;
}

async function convertWithGPT(text) {
  const res = await fetch("/api/convert", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`APIエラー: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  if (!data?.result) {
    throw new Error("APIレスポンスが不正です。");
  }
  return data.result.trim();
}

function setLoading(isLoading) {
  const btn = document.querySelector("#convertBtn");
  btn.disabled = isLoading;
  btn.textContent = isLoading ? "変換中..." : "変換する";
}

document.querySelector("#convertBtn").addEventListener("click", async () => {
  const input = inputEl.value.trim();
  if (!input) {
    setStatus("入力が空です。");
    return;
  }

  try {
    setLoading(true);
    setStatus("GPTで変換しています...");
    const result = await convertWithGPT(input);
    outputEl.value = result;
    setStatus("変換完了");
  } catch (err) {
    outputEl.value = "";
    setStatus(err.message || "変換に失敗しました。");
  } finally {
    setLoading(false);
  }
});

document.querySelector("#clearBtn").addEventListener("click", () => {
  inputEl.value = "";
  outputEl.value = "";
  setStatus("クリアしました");
});

document.querySelector("#swapBtn").addEventListener("click", () => {
  const tmp = inputEl.value;
  inputEl.value = outputEl.value;
  outputEl.value = tmp;
  setStatus("入れ替えました");
});

document.querySelector("#copyBtn").addEventListener("click", async () => {
  if (!outputEl.value) return;
  try {
    await navigator.clipboard.writeText(outputEl.value);
    setStatus("コピーしました");
  } catch {
    outputEl.select();
    document.execCommand("copy");
    setStatus("コピーしました");
  }
});
