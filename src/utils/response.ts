import { Response } from 'express';
import { ApiResponse } from '../types';

export function ok<T>(res: Response, data: T, message?: string, meta?: ApiResponse['meta']): Response {
  return res.status(200).json({ success: true, data, message, meta } satisfies ApiResponse<T>);
}

export function created<T>(res: Response, data: T, message = 'Created successfully'): Response {
  return res.status(201).json({ success: true, data, message } satisfies ApiResponse<T>);
}

export function noContent(res: Response): Response {
  return res.status(204).send();
}

export function badRequest(res: Response, message: string, errors?: string[]): Response {
  return res.status(400).json({ success: false, message, errors } satisfies ApiResponse);
}

export function unauthorized(res: Response, message = 'Unauthorized'): Response {
  return res.status(401).json({ success: false, message } satisfies ApiResponse);
}

export function forbidden(res: Response, message = 'Forbidden'): Response {
  return res.status(403).json({ success: false, message } satisfies ApiResponse);
}

export function notFound(res: Response, message = 'Not found'): Response {
  return res.status(404).json({ success: false, message } satisfies ApiResponse);
}

export function conflict(res: Response, message: string): Response {
  return res.status(409).json({ success: false, message } satisfies ApiResponse);
}

export function serverError(res: Response, message = 'Internal server error'): Response {
  return res.status(500).json({ success: false, message } satisfies ApiResponse);
}

export function paginated<T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number
): Response {
  return res.status(200).json({
    success: true,
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  } satisfies ApiResponse<T[]>);
}
