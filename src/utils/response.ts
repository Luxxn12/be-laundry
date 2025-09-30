export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: Record<string, unknown>;
  errors?: unknown;
}

export function successResponse<T>(data: T, message = 'OK', meta?: Record<string, unknown>): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    meta,
  };
}

export function errorResponse(message: string, errors?: unknown, meta?: Record<string, unknown>): ApiResponse<null> {
  return {
    success: false,
    message,
    data: null,
    errors,
    meta,
  };
}
