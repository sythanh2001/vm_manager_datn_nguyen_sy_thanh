import { NextRequest, NextResponse } from "next/server";
import gc from "@/lib/gCompute";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Auth!" });
  const p = req.nextUrl.searchParams;
  const zone = p.get("zone");
  const instanceName = p.get("instanceName");
  const newDiskSizeGb = Number(p.get("newDiskSizeGb"));

  if (!instanceName || !zone || !newDiskSizeGb) {
    return NextResponse.json({ error: "Bad request!" });
  }
  return NextResponse.json(
    await gc.resizeInstanceDisk(zone, instanceName, newDiskSizeGb)
  );
}
// export async function GET(req: Request) {
//   return NextResponse.json(await gc.listAllInstances());
// }
