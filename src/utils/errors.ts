export const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

export const getResponseError = async (
  response: Response,
  fallback: string,
) => {
  const data = await response.json().catch(() => ({}));
  return typeof data.error === "string" ? data.error : fallback;
};
