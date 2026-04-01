import { NextRequest, NextResponse } from "next/server";

const SIGNOZ_ENDPOINT = process.env.SIGNOZ_ENDPOINT ?? "";
const SIGNOZ_ACCESS_TOKEN = process.env.SIGNOZ_ACCESS_TOKEN ?? "";

// OTLP severity numbers
const SEVERITY_WARN = 13;
const SEVERITY_ERROR = 17;

export async function POST(req: NextRequest) {
  // If SigNoz is not configured, silently succeed
  if (!SIGNOZ_ENDPOINT) {
    return NextResponse.json({ ok: true });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const statusCode = typeof body.status_code === "number" ? body.status_code : 0;
  const isError = statusCode >= 500;
  const severityNumber = isError ? SEVERITY_ERROR : SEVERITY_WARN;
  const severityText = isError ? "ERROR" : "WARN";

  const attrs: Array<{ key: string; value: { stringValue?: string; intValue?: string } }> = [
    { key: "service", value: { stringValue: "hris-frontend" } },
    { key: "path", value: { stringValue: String(body.path ?? "") } },
    { key: "method", value: { stringValue: String(body.method ?? "") } },
    { key: "status_code", value: { intValue: String(statusCode) } },
  ];

  if (body.extra && typeof body.extra === "object") {
    for (const [k, v] of Object.entries(body.extra)) {
      attrs.push({ key: k, value: { stringValue: String(v) } });
    }
  }

  const payload = {
    resourceLogs: [
      {
        resource: {
          attributes: [
            { key: "service.name", value: { stringValue: "hris-frontend" } },
          ],
        },
        scopeLogs: [
          {
            scope: { name: "hris-frontend" },
            logRecords: [
              {
                timeUnixNano: String(Date.now() * 1_000_000),
                severityNumber,
                severityText,
                body: { stringValue: String(body.message ?? "unknown error") },
                attributes: attrs,
              },
            ],
          },
        ],
      },
    ],
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (SIGNOZ_ACCESS_TOKEN) {
    headers["signoz-access-token"] = SIGNOZ_ACCESS_TOKEN;
  }

  try {
    const res = await fetch(`${SIGNOZ_ENDPOINT}/v1/logs`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(`[signoz] ingest responded ${res.status}`);
    }
  } catch (err) {
    console.error("[signoz] ingest request failed:", err);
  }

  return NextResponse.json({ ok: true });
}
