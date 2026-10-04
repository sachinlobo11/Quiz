import { NextResponse } from "next/server";
import { questions } from "@/data/questions";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ questions });
}
