import { NextResponse } from "next/server";

export async function GET() {
  const ok =
    !!process.env.SUPABASE_URL &&
    !!process.env.SUPABASE_ANON_KEY &&
    !!process.env.NEXT_PUBLIC_SITE_URL;
  return NextResponse.json({
    ok,
    env: {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
      NEXT_PUBLIC_SITE_URL: !!process.env.NEXT_PUBLIC_SITE_URL,
    },
  });
}
