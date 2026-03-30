import "dotenv/config";

/**
 * Reusable Convai API client.
 * @param {string} method - HTTP method (GET, POST, DELETE, etc.)
 * @param {string} path   - API path, e.g. "/v1/character/create"
 * @param {object} [body] - Optional request body (will be JSON-encoded)
 * @returns {Promise<any>} Parsed JSON response
 */
export async function convaiRequest(method, path, body) {
  const apiKey = process.env.CONVAI_API_KEY;
  if (!apiKey) {
    throw new Error("CONVAI_API_KEY is not set in environment variables");
  }

  const url = `https://api.convai.com${path}`;
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      "CONVAI-API-KEY": apiKey,
    },
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);

  if (!res.ok) {
    let errorBody = "";
    try {
      errorBody = await res.text();
    } catch {
      // ignore
    }
    throw new Error(
      `Convai API error ${res.status} ${res.statusText}: ${errorBody}`
    );
  }

  // Some endpoints may return empty body (e.g. DELETE)
  const text = await res.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}
