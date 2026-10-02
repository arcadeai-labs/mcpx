import type { GradeReport, GradeReportRule } from "../check/report.ts";
import { theme } from "./theme.ts";

const LETTERS: Record<string, string[]> = {
	A: ["  /\\  ", " /  \\ ", "/ /\\ \\", "| __ |", "|_||_|"],
	B: ["|~~~\\ ", "|___/ ", "|~~~\\ ", "|   / ", "|___/ "],
	C: [" /~~~\\", "/     ", "|     ", "\\     ", " \\___/"],
	D: ["|~~~\\ ", "|    \\", "|    |", "|    /", "|___/ "],
	F: ["|~~~~~", "|____ ", "|     ", "|     ", "|     "],
	"+": ["      ", "  |   ", "--+-- ", "  |   ", "      "],
};

export function formatGradeReport(report: GradeReport): string {
	const lines: string[] = [];
	const color = scoreColor(report.score);
	const gradeLetters = report.grade.split("");
	const art = Array.from({ length: 5 }, (_, row) =>
		gradeLetters.map((letter) => (LETTERS[letter] ?? LETTERS.F)![row]).join("  "),
	);

	lines.push(theme.underline(64));
	lines.push(theme.tool("MCP SERVER QUALITY REPORT"));
	lines.push(
		`${theme.label("Server")} ${theme.server(report.server)}   ${theme.label("Rubric")} v${report.rubricVersion}`,
	);
	lines.push("");
	lines.push(...art.map(color));
	lines.push("");
	lines.push(`${color(pieGlyph(report.score))}  ${color(`${report.score.toFixed(1)} / 100`)}  ${color(report.grade)}`);
	lines.push(color(scoreBar(report.score, 32)));
	lines.push(
		`${theme.success(`${report.summary.passed} passed`)}  ${theme.warn(`${report.summary.warnings} warnings`)}  ${theme.error(`${report.summary.failed} failed`)}  ${theme.muted(`${report.summary.skipped} skipped`)}`,
	);

	lines.push("");
	lines.push(theme.tool("CATEGORY PIES"));
	for (const category of report.categories) {
		const name = categoryLabel(category.category).padEnd(14);
		const categoryColor = scoreColor(category.score);
		lines.push(
			`${categoryColor(pieGlyph(category.score))}  ${theme.tool(name)} ${categoryColor(`${category.score.toFixed(1).padStart(5)}%`)}  ${categoryColor(scoreBar(category.score, 20))}`,
		);
	}

	lines.push("");
	lines.push(theme.tool("RULES"));
	for (const category of report.categories) {
		lines.push("");
		lines.push(
			`${theme.label(categoryLabel(category.category))} ${scoreColor(category.score)(`${category.score.toFixed(1)}%`)}`,
		);
		for (const rule of report.rules.filter((candidate) => candidate.category === category.category)) {
			lines.push(formatRule(rule));
		}
	}

	const remediations = report.rules
		.filter((rule) => rule.status !== "pass" && rule.status !== "skip" && rule.remediation)
		.sort((a, b) => a.score - b.score)
		.slice(0, 5);
	if (remediations.length > 0) {
		lines.push("");
		lines.push(theme.tool("TOP IMPROVEMENTS"));
		for (const [index, rule] of remediations.entries()) {
			lines.push(`${theme.warn(`${index + 1}.`)} ${theme.tool(rule.name)} — ${rule.remediation}`);
		}
	}

	lines.push("");
	lines.push(theme.muted("Machine output: mcpx grade <server> --json"));
	lines.push(theme.underline(64));
	return lines.join("\n");
}

function formatRule(rule: GradeReportRule): string {
	const marker =
		rule.status === "pass"
			? theme.glyph.ok
			: rule.status === "fail"
				? theme.glyph.fail
				: rule.status === "warn"
					? theme.glyph.warn
					: theme.glyph.info;
	const statusColor =
		rule.status === "pass"
			? theme.success
			: rule.status === "fail"
				? theme.error
				: rule.status === "warn"
					? theme.warn
					: theme.muted;
	return `  ${marker} ${rule.name} ${statusColor(`${rule.score.toFixed(1)}%`)} ${theme.muted(`— ${rule.evidence}`)}`;
}

/** Unicode quarter-circle glyphs make compact pie charts that work in narrow terminals. */
export function pieGlyph(score: number): string {
	if (score >= 99.5) return "●";
	if (score >= 75) return "◕";
	if (score >= 50) return "◑";
	if (score >= 25) return "◔";
	return "○";
}

export function scoreBar(score: number, width: number): string {
	const filled = Math.max(0, Math.min(width, Math.round((score / 100) * width)));
	return `${"█".repeat(filled)}${"░".repeat(width - filled)}`;
}

function categoryLabel(category: string): string {
	return category
		.split("-")
		.map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
		.join(" ");
}

function scoreColor(score: number): (value: string) => string {
	if (score >= 80) return theme.success;
	if (score >= 60) return theme.warn;
	return theme.error;
}
