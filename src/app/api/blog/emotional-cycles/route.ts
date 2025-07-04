import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const emotionalCycleSchema = z.object({
  userId: z.string(),
  mood: z.enum([
    "PEACEFUL",
    "ANXIOUS",
    "GRATEFUL",
    "REFLECTIVE",
    "ENERGETIC",
    "MELANCHOLIC",
    "INSPIRED",
    "CONFUSED",
    "BALANCED",
  ]),
  energy: z.number().min(1).max(10),
  activity: z.string().optional(),
  blogPostRead: z.string().optional(),
  meditationDone: z.boolean().default(false),
  journalWritten: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: "Sistema de ciclos emocionais ainda não implementado",
      message: "Modelo emotionalCycle não encontrado no Prisma schema",
    },
    { status: 501 },
  );
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: "Sistema de ciclos emocionais ainda não implementado",
      message: "Modelo emotionalCycle não encontrado no Prisma schema",
    },
    { status: 501 },
  );
}
