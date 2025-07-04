import { NextRequest, NextResponse } from "next/server";
import { sendPush } from "@/lib/push-server";

export const dynamic = "force-dynamic"; // Garante execução sempre no backend

export async function POST(req: NextRequest) {
  try {
    const { subscription, payload } = await req.json();
    if (!subscription || !payload) {
      return NextResponse.json(
        { error: "Missing subscription or payload" },
        { status: 400 },
      );
    }
    const ok = await sendPush({ subscription, payload });
    if (ok) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json(
      { error: "Failed to send push notification" },
      { status: 500 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
