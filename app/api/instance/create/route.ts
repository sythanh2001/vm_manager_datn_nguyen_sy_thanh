import cf, { createSubDomainSafe } from "@/lib/cloudflare";
import gc from "@/lib/gCompute";
import { getServerSession } from "next-auth";

import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { UserDocument } from "@/models/userModel";
import util from "@/lib/util";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return util.ResponseErrorAuth();
  }
  const user = session.user as UserDocument;
  console.log("🚀 ~ file: route.ts:16 ~ GET ~ user:", user);
  if (user.role != "admin") return util.ResponseErrorAdminRole();

  const p = req.nextUrl.searchParams;
  const instanceName = p.get("instanceName");
  const zone = p.get("zone");
  const region = p.get("region");
  const diskSize = Number(p.get("diskSize"));
  const sourceImage = p.get("sourceImage");
  const subDomain = p.get("subDomain");
  const description = p.get("description") as string;

  if (
    !instanceName ||
    !zone ||
    !region ||
    !sourceImage ||
    !diskSize ||
    diskSize < 10
  ) {
    return util.ResponseErrorBadRequest();
  }

  const createInstanceRes = await gc.createInstance(
    instanceName,
    zone,
    region,
    sourceImage,
    diskSize,
    session.user?.email as string,
    subDomain as string,
    description
  );
  const instanceNATIP = createInstanceRes.networkInterfaces

    ?.at(0)
    ?.accessConfigs?.at(0)?.natIP;
  console.log("🚀 ~ file: route.ts:50 ~ GET ~ instanceNATIP:", instanceNATIP);
  if (!instanceNATIP) {
    return NextResponse.json({ error: "Missing external ip!" });
  }
  if (subDomain) {
    createSubDomainSafe(instanceNATIP, subDomain);
  }

  return NextResponse.json(createInstanceRes);
}
