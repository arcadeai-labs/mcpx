import { expect, test } from "bun:test";
import type { GradeReport } from "../../src/check/report.ts";
import { formatGradeReport, pieGlyph, scoreBar } from "../../src/output/grade-report.ts";
import { resetMode, setMode } from "../../src/output/tty.ts";

const report: GradeReport = {
	schemaVersion: 1,
	server: "example",
	score: 92,
	grade: "A+",
	rubricVersion: 2,
	earnedPoints: 92,
	applicableWeight: 100,
	skippedWeight: 0,
	categories: [{ category: "security", score: 75, earnedPoints: 15, applicableWeight: 20 }],
	summary: { passed: 1, warnings: 1, failed: 0, skipped: 0 },
	rules: [
		{
			id: "security.https",
			category: "security",
			name: "HTTPS",
			weight: 1,
			status: "pass",
			score: 100,
			evidence: "secure",
		},
		{
			id: "security.scope",
			category: "security",
			name: "Scopes",
			weight: 1,
			status: "warn",
			score: 50,
			evidence: "partial",
			remediation: "Add scopes",
		},
	],
};

test("grade report renders ASCII A+ art and improvements", () => {
	setMode({ interactive: false, color: false, json: false, verbose: false });
	const output = formatGradeReport(report);
	expect(output).toContain("/ /\\ \\");
	expect(output).toContain("--+--");
	expect(output).toContain("TOP IMPROVEMENTS");
	expect(output).toContain("Add scopes");
	resetMode();
});

test("pie glyphs and score bars represent percentages", () => {
	expect([pieGlyph(0), pieGlyph(25), pieGlyph(50), pieGlyph(75), pieGlyph(100)]).toEqual(["○", "◔", "◑", "◕", "●"]);
	expect(scoreBar(50, 10)).toBe("█████░░░░░");
});
