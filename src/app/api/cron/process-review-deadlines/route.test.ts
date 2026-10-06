import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

describe("TBK m. 477 Process Review Deadlines Cron Route", () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-cron-secret-123";
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalSecret;
  });

  it("returns 401 Unauthorized when no secret is provided in GET", async () => {
    const req = new NextRequest("http://localhost:3000/api/cron/process-review-deadlines");
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 Unauthorized when invalid secret is provided in POST", async () => {
    const req = new NextRequest("http://localhost:3000/api/cron/process-review-deadlines", {
      method: "POST",
      headers: {
        authorization: "Bearer wrong-secret",
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });
});
