export const URL_PATTERN = /\bhttps?:\/\/[^\s)>\]}]+/i;

export function normalizedTokens(value: string): string[] {
	return value
		.toLowerCase()
		.split(/[^a-z0-9]+/)
		.filter((token) => token.length >= 3 && !["server", "mcp", "api", "www"].includes(token));
}

export function mentionsAny(value: string, words: readonly string[]): boolean {
	const lower = value.toLowerCase();
	return words.some((word) => lower.includes(word));
}
