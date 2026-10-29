export function titleFromContent(content: string) {
  const firstWords = content.trim().split(/\s+/).slice(0, 3).join(" ");
  return Array.from(firstWords).slice(0, 120).join("") || "Untitled";
}
