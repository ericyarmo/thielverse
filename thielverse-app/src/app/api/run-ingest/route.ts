import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // TODO: Implement ingestion logic
  // For now, just return a placeholder
  return NextResponse.json(
    { message: "Ingestion endpoint - to be implemented" },
    { status: 501 }
  );
}

export async function GET() {
  return NextResponse.json(
    { error: "Use POST to trigger ingestion" },
    { status: 405 }
  );
}
