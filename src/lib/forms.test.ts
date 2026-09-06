import { describe, expect, it, vi } from "vitest";

import { toUserMessage } from "@/lib/forms";

describe("toUserMessage", () => {
  it("returns the fallback, never the raw error message", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = toUserMessage(
      { message: "new row violates row-level security policy for table \"milestones\"" },
      "Aşama güncellenemedi.",
    );
    expect(result).toBe("Aşama güncellenemedi.");
    consoleError.mockRestore();
  });

  it("logs the real error server-side", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    toUserMessage({ message: "constraint violation xyz" }, "İşlem tamamlanamadı.");
    expect(consoleError).toHaveBeenCalledWith("[FAIL]", "constraint violation xyz");
    consoleError.mockRestore();
  });
});
