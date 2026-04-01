import { NextRequest, NextResponse } from "next/server";

const DT_API_URL = process.env.DYNATRACE_API_URL ?? "";
const DT_API_TOKEN = process.env.DYNATRACE_API_TOKEN ?? "";

export async function POST(req: NextRequest) {
  // If Dynatrace is not configured, silently succeed
  if (!DT_API_URL || !DT_API_TOKEN) {
    return NextResponse.json({ ok: true });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const statusCode = typeof body.status_code === "number" ? body.status_code : 0;
  const severity = statusCode >= 500 ? "ERROR" : "WARN";

  const entry = {
    content: String(body.message ?? "unknown error"),
    status: severity,
    timestamp: new Date().toISOString(),
    attributes: {
      service: "hris-frontend",
      path: body.path ?? "",
      method: body.method ?? "",
      status_code: statusCode,
      ...(body.extra && typeof body.extra === "object" ? body.extra : {}),
    },
  };

  try {
    const dtRes = await fetch(`${DT_API_URL}/api/v2/logs/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Api-Token ${DT_API_TOKEN}`,
      },
      body: JSON.stringify([entry]),
    });

    if (!dtRes.ok) {
      console.error(`[dynatrace] ingest responded ${dtRes.status}`);
    }
  } catch (err) {
    console.error("[dynatrace] ingest request failed:", err);
  }

  return NextResponse.json({ ok: true });
}
