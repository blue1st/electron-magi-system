import { Settings } from '../types';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function fetchAvailableModels(baseUrl: string, apiKey: string): Promise<string[]> {
  const cleanUrl = baseUrl.replace(/\/$/, '');
  const targetUrl = `${cleanUrl}/models`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(targetUrl, { method: 'GET', headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (Array.isArray(data.data)) {
    return data.data.map((m: any) => m.id || m.name).filter(Boolean);
  }
  return [];
}

export async function sendChatCompletion(
  settings: Settings,
  messages: ChatMessage[],
  modelOverride?: string,
  temperature: number = 0.7
): Promise<string> {
  const cleanUrl = settings.baseUrl.replace(/\/$/, '');
  const targetUrl = `${cleanUrl}/chat/completions`;
  const selectedModel = modelOverride || settings.defaultModel || 'gpt-4o';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (settings.apiKey) {
    headers['Authorization'] = `Bearer ${settings.apiKey}`;
  }

  const body = {
    model: selectedModel,
    messages: messages,
    temperature: temperature,
    response_format: { type: 'json_object' } // Request JSON if supported
  };

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      // Retry without response_format if some local servers reject it
      const fallbackBody = { model: selectedModel, messages, temperature };
      const fallbackRes = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(fallbackBody)
      });
      if (!fallbackRes.ok) {
        const errorText = await fallbackRes.text();
        throw new Error(`API Error (${fallbackRes.status}): ${errorText}`);
      }
      const data = await fallbackRes.json();
      return data.choices?.[0]?.message?.content || '';
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (err: any) {
    console.error('Chat Completion Call Failed:', err);
    throw err;
  }
}

/**
 * Robust JSON Extractor (extracts json object from markdown or raw text)
 */
export function extractJsonFromResponse<T>(rawText: string, fallback: T): T {
  try {
    // Direct parse test
    return JSON.parse(rawText) as T;
  } catch (e) {
    // Search for json codeblock or object {...}
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || rawText.match(/(\{[\s\S]*\})/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1]) as T;
      } catch (err2) {
        console.warn('Could not parse extracted JSON block:', err2, rawText);
      }
    }
  }
  return fallback;
}
