export type OllamaMessage = { role: "system" | "user" | "assistant"; content: string };

type OllamaChatRequest = {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
  format?: any; // JSON schema or "json"
  options?: Record<string, any>;
};

type OllamaChatResponse = {
  message?: { role: string; content: string };
  response?: string; // some endpoints/models may return this
};

export async function ollamaChatJSON<T>(
  messages: OllamaMessage[],
  schema: any
): Promise<T> {
  const baseUrl = process.env.OLLAMA_BASE_URL?.trim() || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL?.trim() || "gpt-oss:20b";
  const temperatureRaw = process.env.OLLAMA_TEMPERATURE?.trim();
  const temperature = temperatureRaw ? Number(temperatureRaw) : 0.4;

  const body: OllamaChatRequest = {
    model,
    messages,
    stream: false,
    format: schema,
    options: { temperature },
  };

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Ollama error ${res.status}: ${text}`);
  }

  let data: OllamaChatResponse;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Ollama returned non-JSON response: ${text.slice(0, 500)}`);
  }

  const content = data.message?.content ?? data.response;
  if (!content) throw new Error("Ollama response missing message.content");

  try {
    return JSON.parse(content) as T;
  } catch {
    throw new Error(`Ollama content was not valid JSON: ${content.slice(0, 800)}`);
  }
}
