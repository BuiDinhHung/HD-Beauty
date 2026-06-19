const RAW_KEY = process.env.NEXT_PUBLIC_CRYPTO_KEY ?? 'hd-beauty-default-key-32chars!!';

function toBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function fromBase64(b64: string): Uint8Array {
  return new Uint8Array(atob(b64).split('').map((c) => c.charCodeAt(0)));
}

async function getKey(): Promise<CryptoKey> {
  const raw = new TextEncoder().encode(RAW_KEY.slice(0, 32).padEnd(32, '0'));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptPassword(plain: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plain),
  );
  const out = new Uint8Array(12 + cipher.byteLength);
  out.set(iv);
  out.set(new Uint8Array(cipher), 12);
  return toBase64(out.buffer);
}

export async function decryptPassword(encoded: string): Promise<string> {
  const key = await getKey();
  const buf = fromBase64(encoded);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: buf.slice(0, 12) },
    key,
    buf.slice(12),
  );
  return new TextDecoder().decode(decrypted);
}
