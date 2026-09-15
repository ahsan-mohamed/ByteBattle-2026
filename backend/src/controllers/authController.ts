import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { AppError } from "../utils/errors";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function adminLogin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { username, password } = loginSchema.parse(req.body);

    const admin = await prisma.admin.findUnique({
      where: { username },
    });

    // Compare against a dummy hash even when the user doesn't exist,
    // so login takes roughly the same time either way.
    const hashToCheck =
      admin?.passwordHash ??
      "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva";

    const valid = await bcrypt.compare(password, hashToCheck);

    if (!admin || !valid) {
      throw new AppError("Invalid username or password.", 401);
    }

    // Create the authenticated admin session.
    req.session.adminId = admin.id;
    req.session.adminUsername = admin.username;

    // Diagnostic logging for Render.
    console.log("ADMIN LOGIN SESSION:", {
      sessionID: req.sessionID,
      adminId: req.session.adminId,
      adminUsername: req.session.adminUsername,
      cookie: {
        httpOnly: req.session.cookie.httpOnly,
        secure: req.session.cookie.secure,
        sameSite: req.session.cookie.sameSite,
        maxAge: req.session.cookie.maxAge,
      },
    });

    // Explicitly save the session before returning the response.
    // This makes sure the session is persisted before the browser
    // receives the response containing the session cookie.
    req.session.save((err) => {
      if (err) {
        console.error("ADMIN SESSION SAVE ERROR:", err);
        return next(err);
      }

      console.log("ADMIN SESSION SAVED:", {
        sessionID: req.sessionID,
        adminUsername: req.session.adminUsername,
      });

      res.json({
        username: admin.username,
      });
    });
  } catch (err) {
    next(err);
  }
}

export function adminLogout(
  req: Request,
  res: Response,
  next: NextFunction
) {
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }

    res.clearCookie("connect.sid");
    res.status(204).send();
  });
}

export function adminMe(req: Request, res: Response) {
  res.json({
    username: req.session.adminUsername,
  });
}
