import { NextRequest, NextResponse } from "next/server";
import gc from "@/lib/gCompute";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { redirect } from "next/navigation";
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const zone = p.get("zone");
  if (!zone) {
    return NextResponse.json({ error: "bad request" });
  }
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Bad request!" });

  return NextResponse.json(await gc.getMachineTypes(zone));
}
