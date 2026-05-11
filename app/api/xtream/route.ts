import { NextRequest, NextResponse } from "next/server";
import { xtreamService } from "@/lib/xtream-api";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get("action");

  if (!action) {
    return NextResponse.json({ error: "Action is required" }, { status: 400 });
  }

  // Coleta todos os outros parâmetros
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (key !== "action") {
      params[key] = value;
    }
  });

  try {
    const data = await xtreamService.executeAction(action, params);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
