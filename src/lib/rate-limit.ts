/**
 * Rate limiting simples em memória, por instância.
 *
 * Serve para conter abuso óbvio (força bruta em login, spam de cadastro) sem
 * dependência externa. Em produção com múltiplas instâncias na Vercel cada
 * instância tem seu próprio contador — para proteção distribuída de verdade,
 * troque por Upstash Redis (veja docs/SECURITY.md).
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// limpeza periódica para não crescer indefinidamente
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
}

export type RateResult = { ok: true } | { ok: false; retryAfter: number };

/**
 * @param key      identificador (ex.: `login:1.2.3.4`)
 * @param limit    tentativas permitidas na janela
 * @param windowMs tamanho da janela em ms
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now();
  sweep(now);

  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (b.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { ok: true };
}

/** Zera o contador (usar após login bem-sucedido). */
export function rateLimitReset(key: string) {
  buckets.delete(key);
}

/** Extrai o IP do cliente a partir dos headers da requisição. */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "desconhecido";
}
