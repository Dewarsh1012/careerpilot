import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

/**
 * Service for orchestrating Lemma Cloud AI Agent runs
 * Communicates with the user's dedicated CareerPilot pod (01a0e97d-0079-77d5-88d3-5b56d6c87198)
 */

const DEFAULT_POD_ID = process.env.LEMMA_POD_ID || '01a0e97d-0079-77d5-88d3-5b56d6c87198';
const DEFAULT_API_URL = process.env.LEMMA_API_URL || 'https://api.lemma.work';

let cachedToken = null;
let tokenCachedAt = 0;

function isTokenValid(token) {
  if (!token || typeof token !== 'string') return false;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return false;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    if (payload.exp) {
      // Return false if expires within 60 seconds
      return Date.now() < (payload.exp - 60) * 1000;
    }
    return true;
  } catch (e) {
    return false;
  }
}

export function getLemmaToken(forceRefresh = false) {
  if (process.env.LEMMA_API_TOKEN && !forceRefresh) {
    return process.env.LEMMA_API_TOKEN;
  }

  // If token is still cached and valid, reuse it
  if (!forceRefresh && cachedToken && isTokenValid(cachedToken)) {
    return cachedToken;
  }

  // 1. Try CLI refresh first when forced or if cached is invalid
  try {
    const cliToken = execSync('lemma auth print-token', {
      encoding: 'utf8',
      timeout: 8000,
    }).trim();
    if (cliToken && isTokenValid(cliToken)) {
      cachedToken = cliToken;
      tokenCachedAt = Date.now();
      return cliToken;
    }
  } catch (err) {
    console.warn('Lemma CLI print-token refresh attempt:', err.message);
  }

  // 2. Try reading from ~/.lemma/config.json
  try {
    const configPath = path.join(os.homedir(), '.lemma', 'config.json');
    if (fs.existsSync(configPath)) {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const server = cfg.active_server || 'default';
      const fileToken = cfg.servers?.[server]?.token;
      if (fileToken && isTokenValid(fileToken)) {
        cachedToken = fileToken;
        tokenCachedAt = Date.now();
        return fileToken;
      }
    }
  } catch (err) {
    // continue
  }

  return cachedToken;
}

/**
 * Invoke the Lemma AI Agent in the dedicated pod with automatic 401 retry
 * @param {string} prompt - User message / prompt for the agent
 * @param {string} systemInstruction - Optional system context or role prompt
 * @param {string} agentName - Agent name in pod (defaults to 'pod_default')
 * @returns {Promise<string>} - Completed answer text from agent
 */
export async function runLemmaAgent(prompt, systemInstruction = '', agentName = 'pod_default', retryCount = 0) {
  let token = getLemmaToken(retryCount > 0);
  const podId = DEFAULT_POD_ID;
  const apiUrl = DEFAULT_API_URL;

  if (!token) {
    throw new Error('No Lemma authentication token available. Please ensure lemma auth login is active.');
  }

  // 1. Create a fresh conversation with the agent
  let convRes = await fetch(`${apiUrl}/pods/${podId}/conversations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agent_name: agentName,
      title: `CareerPilot ${Date.now()}`,
    }),
  });

  if (convRes.status === 401 && retryCount === 0) {
    console.warn('[Lemma Service] Access token expired (401). Refreshing token and retrying...');
    token = getLemmaToken(true);
    return runLemmaAgent(prompt, systemInstruction, agentName, 1);
  }

  if (!convRes.ok) {
    const errText = await convRes.text();
    throw new Error(`Failed to create Lemma conversation (${convRes.status}): ${errText}`);
  }

  const conv = await convRes.json();
  const conversationId = conv.id;

  // 2. Send message and read SSE response stream
  const fullContent = systemInstruction
    ? `${systemInstruction}\n\nTask:\n${prompt}`
    : prompt;

  let msgRes = await fetch(`${apiUrl}/pods/${podId}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content: fullContent }),
  });

  if (msgRes.status === 401 && retryCount === 0) {
    console.warn('[Lemma Service] Message token expired (401). Refreshing token and retrying...');
    getLemmaToken(true);
    return runLemmaAgent(prompt, systemInstruction, agentName, 1);
  }

  if (!msgRes.ok) {
    const errText = await msgRes.text();
    throw new Error(`Failed to send message to Lemma agent (${msgRes.status}): ${errText}`);
  }

  const sseText = await msgRes.text();
  let answer = '';

  for (const line of sseText.split('\n')) {
    if (line.startsWith('data: ')) {
      try {
        const payload = JSON.parse(line.slice(6));
        if (payload.type === 'completed' && payload.data?.output_data?.answer) {
          answer = payload.data.output_data.answer;
        }
      } catch (e) {
        // skip non-json sse lines
      }
    }
  }

  if (!answer) {
    // If completed event did not contain answer, inspect last message in conversation
    try {
      const msgsRes = await fetch(`${apiUrl}/pods/${podId}/conversations/${conversationId}/messages?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (msgsRes.ok) {
        const msgs = await msgsRes.json();
        const items = msgs.items || msgs;
        const assistantMsgs = items.filter((m) => m.role === 'assistant' || m.agent_name);
        if (assistantMsgs.length > 0) {
          answer = assistantMsgs[assistantMsgs.length - 1].content || '';
        }
      }
    } catch (e) {
      console.warn('Failed to fetch message history fallback:', e.message);
    }
  }

  return answer;
}

/**
 * Safely parse JSON from LLM output, stripping markdown formatting
 */
export function extractJsonFromResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;

  let text = rawText.trim();

  // Strip ```json ... ``` or ``` ... ```
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }

  // Find first { or [ and last } or ]
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');
  let startIdx = -1;
  let endIdx = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    endIdx = text.lastIndexOf('}');
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endIdx = text.lastIndexOf(']');
  }

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    text = text.substring(startIdx, endIdx + 1);
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    // Try minor sanitization for common LLM JSON syntax quirks (trailing commas)
    try {
      const sanitized = text
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/[\u0000-\u0019]+/g, '');
      return JSON.parse(sanitized);
    } catch (innerErr) {
      console.error('Failed to parse JSON from AI response:', err.message, '\nRaw snippet:', text.slice(0, 200));
      return null;
    }
  }
}

let cachedOrgId = null;

export async function getPodOrganizationId() {
  if (cachedOrgId) return cachedOrgId;
  const token = getLemmaToken();
  if (!token) return '019efdaa-8b05-746b-9004-181d2b2f6064';

  try {
    const res = await fetch(`${DEFAULT_API_URL}/pods/${DEFAULT_POD_ID}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const pod = await res.json();
      if (pod.organization_id) {
        cachedOrgId = pod.organization_id;
        return cachedOrgId;
      }
    }
  } catch (err) {
    console.warn('[Lemma Service] Could not fetch pod organization ID:', err.message);
  }
  return '019efdaa-8b05-746b-9004-181d2b2f6064';
}

export async function getConnectorAccounts() {
  const token = getLemmaToken();
  const orgId = await getPodOrganizationId();
  if (!token || !orgId) return [];

  try {
    const res = await fetch(`${DEFAULT_API_URL}/organizations/${orgId}/connectors/accounts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      return data.items || [];
    }
  } catch (err) {
    console.warn('[Lemma Service] Could not fetch connector accounts:', err.message);
  }
  return [];
}

export async function createConnectRequest(connectorId = 'google_calendar') {
  const token = getLemmaToken();
  const orgId = await getPodOrganizationId();
  if (!token || !orgId) {
    throw new Error('Lemma token or Organization ID not available.');
  }

  const res = await fetch(`${DEFAULT_API_URL}/organizations/${orgId}/connectors/connect-requests`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ connector_id: connectorId }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create connect request (${res.status}): ${text}`);
  }

  return await res.json();
}
