import { NextResponse, NextRequest } from "next/server";
import gc from "@/lib/gCompute";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.error();
  }
  const p = req.nextUrl.searchParams;
  const action = p.get("action");
  const instanceName = p.get("instanceName");
  const zone = p.get("zone");
  if (
    !action ||
    ![
      "startInstance",
      "resumeInstance",
      "stopInstance",
      "suspendInstance",
      "resetInstance",
      "deleteInstance",
    ].includes(action) ||
    !instanceName ||
    !zone
  ) {
    return NextResponse.json({ error: "Bad request!" });
  }
  const instance = await (gc as any)[action](zone, instanceName);
  return NextResponse.json(instance);
}
