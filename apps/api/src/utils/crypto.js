import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";

const ROUNDS = 12;

export const hashPassword = (plain) => bcrypt.hash(plain, ROUNDS);
export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);

/**
 * One-way hash of a mobile number. Lets us recognise a repeat visitor without
 * ever persisting the number itself.
 */
export const hashMobile = (mobile) =>
  createHash("sha256").update(mobile.trim()).digest("hex");

export const randomToken = (bytes = 32) => randomBytes(bytes).toString("hex");
