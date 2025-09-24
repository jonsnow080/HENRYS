import crypto from "node:crypto";

export function generateInviteCode(email: string) {
  const salt = process.env.INVITE_CODE_SALT ?? "henrys";
  const base = crypto
    .createHash("sha256")
    .update(`${salt}:${email}:${Date.now()}`)
    .digest("hex")
    .slice(0, 8)
    .toUpperCase();

  return `HENRYS-${base}`;
}
