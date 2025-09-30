import { compare, hash } from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await compare(password, hashedPassword);
  } catch {
    return false;
  }
}
