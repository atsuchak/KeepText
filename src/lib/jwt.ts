import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

export async function signToken(payload: { userId: string; email: string; tokenVersion?: number }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedSecret);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload as { userId: string; email: string; tokenVersion?: number };
  } catch (error) {
    return null;
  }
}
