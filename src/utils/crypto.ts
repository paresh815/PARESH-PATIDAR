/**
 * Cryptographic utility mirroring Android's PBKDF2 / SHA-256 + Salt hashing
 */

export async function hashPasswordSha256(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateSalt(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

export function generateSuggestedPassword(name: string): string {
  const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase() || 'USER';
  const prefix = cleanName.slice(0, 5);
  const randNum = Math.floor(100 + Math.random() * 900);
  return `${prefix}${randNum}`;
}
