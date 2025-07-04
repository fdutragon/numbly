import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Este endpoint não está mais disponível. Use o login automático via push notification.",
    },
    { status: 410 },
  );
}
