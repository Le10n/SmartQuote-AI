export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Something went wrong. Please try again.";
}

export function assertData<T>(data: T | null, error: unknown): T {
  if (error) {
    throw error;
  }

  if (data === null) {
    throw new Error("The requested data was not found.");
  }

  return data;
}
