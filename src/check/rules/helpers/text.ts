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

const STOP_WORDS = new Set([
	"the",
	"and",
	"for",
	"with",
	"this",
	"that",
	"from",
	"into",
	"tool",
	"given",
	"specified",
	"provided",
	"using",
	"its",
	"are",
	"was",
	"can",
	"will",
	"you",
	"your",
	"all",
	"any",
]);

function stem(word: string): string {
	return word.replace(/(ies)$/, "y").replace(/(ing|ed|es|s)$/, "");
}

/** Stemmed content words, ignoring short words and common filler. */
export function contentWords(value: string): string[] {
	return value
		.toLowerCase()
		.split(/[^a-z0-9]+/)
		.filter((word) => word.length >= 3 && !STOP_WORDS.has(word))
		.map(stem);
}

export function wordCount(value: string): number {
	return value.split(/\s+/).filter(Boolean).length;
}
