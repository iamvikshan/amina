// @lib/api-response.ts

export function createResponse<T>(data: T, status = 200): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data,
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

export function createErrorResponse(
  message: string,
  status: number,
  details?: unknown
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        message,
        ...(details ? { details } : {}),
      },
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
