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
  console.log("🚀 ~ file: route.ts:17 ~ GET ~ zone:", zone);
  const instanceName = p.get("instanceName");
  console.log("🚀 ~ file: route.ts:19 ~ GET ~ instanceName:", instanceName);
  const machineType = p.get("machineType");
  console.log("🚀 ~ file: route.ts:21 ~ GET ~ machineType:", machineType);

  if (!instanceName || !zone || !machineType) {
    return util.ResponseErrorBadRequest();
  }
  return NextResponse.json(
    await gc.changeInstanceMachineType(zone, instanceName, machineType)
  );
}
