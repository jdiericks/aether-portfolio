export function isMissingTableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybePrismaError = error as { code?: unknown; message?: unknown };
  return (
    maybePrismaError.code === "P2021" ||
    (typeof maybePrismaError.message === "string" &&
      maybePrismaError.message.includes("does not exist in the current database"))
  );
}

export function isMissingDatabaseConfigError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybePrismaError = error as { message?: unknown };
  return (
    typeof maybePrismaError.message === "string" &&
    maybePrismaError.message.includes("Environment variable not found: DATABASE_URL")
  );
}

export function isUnavailablePrismaReadError(error: unknown) {
  return isMissingTableError(error) || isMissingDatabaseConfigError(error);
}
