import { NextRequest, NextResponse } from "next/server";
import gc from "@/lib/gCompute";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import util from "@/lib/util";
import { UserDocument } from "@/models/userModel";
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return util.ResponseErrorAuth();
  }
  const user = session.user as UserDocument;
  if (user.role != "admin") return util.ResponseErrorAdminRole();

  const p = req.nextUrl.searchParams;
  const zone = p.get("zone");
  const diskName = p.get("diskName");
  const newDiskSizeGb = Number(p.get("newDiskSizeGb"));

  if (!diskName || !zone || !newDiskSizeGb) {
    return NextResponse.json({ error: "Bad request!" });
  }
  return NextResponse.json(
    await gc.resizeInstanceDisk(zone, diskName, newDiskSizeGb)
  );
}
// export async function GET(req: Request) {
//   return NextResponse.json(await gc.listAllInstances());
// }
