import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "../config/env";

const JWKS = createRemoteJWKSet(
  new URL(`${env.FRONTEND_URL}/api/auth/jwks`),
);

export async function verifyAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "Missing or invalid authorization header",
      });
      return;
    }

    const token = authorization.slice("Bearer ".length);
    const { payload } = await jwtVerify(token, JWKS);
    const subject = payload.sub;

    if (typeof subject !== "string" || subject.length === 0) {
      res.status(401).json({
        success: false,
        error: "Invalid or expired session",
      });
      return;
    }

    req.userId = subject;
    next();
  } catch (error: unknown) {
    console.error("[middleware/verifyAuth]", error);
    res.status(401).json({
      success: false,
      error: "Invalid or expired session",
    });
  }
}
