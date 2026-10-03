import { podClient } from '../lemma-client';

const TERMINAL = new Set(['COMPLETED', 'FAILED', 'CANCELLED']);

export async function runPodFunction(
  name: string,
  input: Record<string, unknown> = {},
  options: { pollMs?: number; timeoutMs?: number } = {},
): Promise<Record<string, unknown>> {
  const client = podClient();
  const pollMs = options.pollMs ?? 800;
  const timeoutMs = options.timeoutMs ?? 120_000;
  const started = Date.now();

  const created = await client.functions.run(name, { input });
  const runId = String((created as { id?: string }).id ?? '');
  if (!runId) {
    return (created as { output?: Record<string, unknown> }).output ?? {};
  }

  for (;;) {
    const run = await client.functions.runs.get(name, runId);
    const status = String(run.status ?? '').toUpperCase();
    if (TERMINAL.has(status)) {
      if (status === 'FAILED') {
        throw new Error(String(run.error ?? `Function ${name} failed`));
      }
      return (run.output_data as Record<string, unknown>) ?? {};
    }
    if (Date.now() - started > timeoutMs) {
      throw new Error(`Function ${name} timed out`);
    }
    await new Promise((r) => setTimeout(r, pollMs));
  }
}
