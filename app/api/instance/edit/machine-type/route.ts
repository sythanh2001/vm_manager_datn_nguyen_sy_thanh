import { NextRequest, NextResponse } from "next/server";
import gc from "@/lib/gCompute";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { UserDocument } from "@/models/userModel";
import util from "@/lib/util";
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return util.ResponseErrorAuth();
  }
  const user = session.user as UserDocument;
  if (user.role != "admin") return util.ResponseErrorAdminRole();

  const p = req.nextUrl.searchParams;
  const zone = p.get("zone");
  const instanceName = p.get("instanceName");
  const machineType = Number(p.get("machineType"));

  if (!instanceName || !zone || !machineType) {
    return NextResponse.json({ error: "Bad request!" });
  }
  return NextResponse.json(
    await gc.resizeInstanceDisk(zone, instanceName, machineType)
  );
}
// export async function GET(req: Request) {
//   return NextResponse.json(await gc.listAllInstances());
// }
