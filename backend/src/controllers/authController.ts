import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { AppError } from "../utils/errors";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function adminLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = loginSchema.parse(req.body);

    const admin = await prisma.admin.findUnique({ where: { username } });
    // Compare against a dummy hash even when the user doesn't exist, so login
    // takes roughly the same time either way (avoids trivial username enumeration
    // via timing).
    const hashToCheck = admin?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva";
    const valid = await bcrypt.compare(password, hashToCheck);

    if (!admin || !valid) {
      throw new AppError("Invalid username or password.", 401);
    }

    req.session.adminId = admin.id;
    req.session.adminUsername = admin.username;

    res.json({ username: admin.username });
  } catch (err) {
    next(err);
  }
}

export function adminLogout(req: Request, res: Response, next: NextFunction) {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("connect.sid");
    res.status(204).send();
  });
}

export function adminMe(req: Request, res: Response) {
  res.json({ username: req.session.adminUsername });
}
