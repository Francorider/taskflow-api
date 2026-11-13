/** Turns free-text input like "Bug, frontend,bug" into ["bug", "frontend"]. */
export function parseTagInput(input: string): string[] {
  const tags = input
    .split(',')
    .map((tag) => tag.trim().toLowerCase().replace(/\s+/g, '-'))
    .filter((tag) => tag.length > 0);
  return [...new Set(tags)];
}
