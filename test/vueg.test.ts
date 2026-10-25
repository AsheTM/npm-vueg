import { describe, it, expect, vi } from "vitest";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { run } from "../src/vueg";

// The built CLI (npm test builds it first, see "pretest")
const VUEG = path.join(__dirname, "..", "dist", "vueg.js");

function runCli(args: string[]): { status: number | null; stdout: string } {
    const result = spawnSync(process.execPath, [VUEG, ...args], { encoding: "utf-8" });
    return { status: result.status, stdout: result.stdout + result.stderr };
}

describe("run() (source)", () => {
    it.each([
        { label: "(no argument)",   args: [] },
        { label: "help",            args: ["help"] },
        { label: "--help",          args: ["--help"] },
        { label: "-h",              args: ["-h"] },
    ])("shows the main help for: vueg $label", ({ args }) => {
        const print = vi.fn();

        expect(run(args, print)).toBe(0);
        expect(print).toHaveBeenCalledWith(expect.stringContaining("vueg <command>"));
    });

    it("shows the component help for: vueg component", () => {
        const print = vi.fn();

        expect(run(["component"], print)).toBe(0);
        expect(print).toHaveBeenCalledWith(expect.stringContaining("vueg component --name"));
    });

    it("fails on an unknown command and lists the commands", () => {
        const print = vi.fn();

        expect(run(["nope"], print)).toBe(1);
        expect(print).toHaveBeenCalledWith(expect.stringContaining('Unknown command "nope", use one of: component'));
        expect(print).toHaveBeenCalledWith(expect.stringContaining("vueg <command>"));
    });
});

describe("vueg CLI (dist)", () => {
    it("runs as a command with the shebang build", () => {
        const { status, stdout } = runCli([]);

        expect(status).toBe(0);
        expect(stdout).toMatch(/vueg <command>/);
    });

    it("exits with 1 on an unknown command", () => {
        expect(runCli(["nope"]).status).toBe(1);
    });

    it("runs nothing when required", () => {
        const result = spawnSync(process.execPath, ["-e", `require(${ JSON.stringify(VUEG) })`], { encoding: "utf-8" });

        expect(result.status).toBe(0);
        expect(result.stdout).toBe("");
    });
});
