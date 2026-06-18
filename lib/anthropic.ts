// Back-compat shim. The generation engine is now provider-pluggable and lives
// in lib/llm.ts (Anthropic / Groq / Gemini / OpenRouter). Import from there.
export * from "./llm";
