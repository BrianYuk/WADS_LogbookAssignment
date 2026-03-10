// lib/response.ts
import { NextResponse } from "next/server";

export function successResponse<T>(data: T, message: string, status = 200) {
  return NextResponse.json(
    { success: true, message, data },
    { status }
  );
}

export function errorResponse(message: string, status: number, details?: unknown) {
  return NextResponse.json(
    { success: false, message, ...(details ? { details } : {}) },
    { status }
  );
}

export function paginatedResponse<T>(
  data: T[],
  message: string,
  meta: { total: number; page: number; limit: number }
) {
  return NextResponse.json({
    success: true,
    message,
    data,
    meta: {
      ...meta,
      totalPages: Math.ceil(meta.total / meta.limit),
      hasNextPage: meta.page * meta.limit < meta.total,
      hasPrevPage: meta.page > 1,
    },
  });
}
