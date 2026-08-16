import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export type AdminRole = "admin" | "super";

const COOKIE_NAME = "wedding-admin";
const SESSION_LENGTH = 12 * 60 * 60;

const hash = (value: string) =>
  createHmac("sha256", "wedding-admin-password-check").update(value).digest();

const matches = (value: string, expected?: string) =>
  Boolean(expected) && timingSafeEqual(hash(value), hash(expected!));

const secret = () => `${process.env.ADMIN_PASSWORD ?? ""}\0${process.env.SUPER_ADMIN_PASSWORD ?? ""}`;

const signature = (value: string) =>
  createHmac("sha256", secret()).update(value).digest("base64url");

export function roleForPassword(password: string): AdminRole | null {
  if (matches(password, process.env.SUPER_ADMIN_PASSWORD)) return "super";
  if (matches(password, process.env.ADMIN_PASSWORD)) return "admin";
  return null;
}

export async function createAdminSession(role: AdminRole) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_LENGTH;
  const payload = `${role}.${expires}`;
  (await cookies()).set(COOKIE_NAME, `${payload}.${signature(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_LENGTH,
    path: "/admin",
  });
}

export async function getAdminRole(): Promise<AdminRole | null> {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return null;

  const [role, expires, suppliedSignature] = value.split(".");
  const payload = `${role}.${expires}`;
  const validRole = role === "admin" || role === "super";
  const validExpiry = Number(expires) > Date.now() / 1000;
  const validSignature = Boolean(suppliedSignature) && matches(suppliedSignature, signature(payload));

  return validRole && validExpiry && validSignature ? role : null;
}

export async function requireAdmin(superOnly = false) {
  const role = await getAdminRole();
  if (!role || (superOnly && role !== "super")) throw new Error("Unauthorized");
  return role;
}

export async function deleteAdminSession() {
  (await cookies()).delete(COOKIE_NAME);
}
