export function sanitizeFilterTerm(value: string) {
  return value.trim().replace(/[,%()]/g, " ").replace(/\s+/g, " ").trim();
}

export function buildIlikeOrFilter(columns: string[], value: string) {
  const term = sanitizeFilterTerm(value);
  if (!term) return "";
  return columns.map((column) => column + ".ilike.%" + term + "%").join(",");
}
