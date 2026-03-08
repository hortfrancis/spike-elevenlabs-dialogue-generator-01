/**
 * Structured error codes and helpers for API responses.
 */

export type ErrorCode =
  | "INVALID_REQUEST"
  | "UNKNOWN_PROJECT"
  | "UNKNOWN_VOICE"
  | "ELEVENLABS_ERROR"
  | "INTERNAL_ERROR";

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
  };
}

export function apiError(code: ErrorCode, message: string): ApiErrorBody {
  return {
    error: { code, message },
  };
}
