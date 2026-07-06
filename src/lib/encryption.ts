import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCODING = 'hex';
const IV_LENGTH = 16;
// Ensure key is 32 bytes
// Fallback to randomBytes is dangerous for persistence because it resets on restart.
// We must use a stable secret. We can use AUTH_SECRET from env or a fixed fallback for dev.
const getEncryptionKey = () => {
  const secret = process.env.AUTH_SECRET || 'default_secret_for_development_only';
  return crypto.scryptSync(secret, 'salt', 32);
};

export function encrypt(text: string): string {
  if (!text) return text;
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', ENCODING);
    encrypted += cipher.final(ENCODING);
    return `${iv.toString(ENCODING)}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    return text; // Fallback to plain text on error (or we could throw)
  }
}

export function decrypt(text: string): string {
  if (!text) return text;
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) return text; // Not encrypted or malformed format
    
    const iv = Buffer.from(textParts[0], ENCODING);
    const encryptedText = Buffer.from(textParts[1], ENCODING);
    
    if (iv.length !== IV_LENGTH) return text;

    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error("Decryption error:", error);
    return text; // Return original on failure (maybe it was plain text)
  }
}
