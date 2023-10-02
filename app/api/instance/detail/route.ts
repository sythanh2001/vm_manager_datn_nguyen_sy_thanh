import { NextResponse, NextRequest } from "next/server";
import gc from "@/lib/gCompute";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const zone = p.get("zone");
  const instanceName = p.get("instanceName");

  const session = await getServerSession(authOptions);
  if (!zone || !instanceName) {
    return NextResponse.error();
  }
  const instance = await gc.getInstanceInfo(zone, instanceName);

  if (!gc.containsEmail(instance, session?.user?.email as string)) {
    return NextResponse.error();
  }
  return NextResponse.json(instance);
}
