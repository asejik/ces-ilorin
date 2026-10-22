/**
 * Logs the real database/service error on the server and returns a generic,
 * user-safe failure so internal details never reach the browser.
 */
export function failWith(context: string, err: unknown, userMessage: string): { success: false; error: string } {
  const detail = err instanceof Error ? err.message : typeof err === 'object' && err && 'message' in err ? String((err as { message: unknown }).message) : String(err);
  console.error(`[${context}]`, detail);
  return { success: false, error: userMessage };
}
