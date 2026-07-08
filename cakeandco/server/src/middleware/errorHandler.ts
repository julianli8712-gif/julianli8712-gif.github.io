import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(`[ERROR] ${err.message}`, err instanceof AppError ? "" : err.stack);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      code: err.statusCode,
      data: null,
      message: err.message,
    });
  }

  return res.status(500).json({
    code: 500,
    data: null,
    message: "Internal server error",
  });
}
