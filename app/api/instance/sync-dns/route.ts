import { NextResponse, NextRequest } from "next/server";
import gc from "@/lib/gCompute";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import cf, {
  CLOUDFLARE_ZONE_ID,
  DNSRecord,
  createSubDomainSafe,
} from "@/lib/cloudflare";
import util from "@/lib/util";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const zone = p.get("zone");
  const instanceName = p.get("instanceName");

  const session = await getServerSession(authOptions);
  if (!session) {
    return util.ResponseErrorAuth();
  }
  if (!zone || !instanceName) {
    return util.ResponseErrorBadRequest();
  }

  const instance = await gc.getInstanceInfo(zone, instanceName);

  if (!gc.containsEmail(instance, session?.user?.email as string)) {
    return util.ResponseErrorNotManager();
  }
  const externalIP = instance.networkInterfaces?.at(0)?.accessConfigs?.at(0)
    ?.natIP as string;
  ``;
  if (!externalIP)
    return NextResponse.json({
      errorID: 1,
      error: "External IP not found!",
    });

  const domainTemp = instance.metadata?.items?.find(
    (x) => x.key == "domain"
  )?.value;

  if (!domainTemp)
    return NextResponse.json({
      errorID: 2,
      error: "Instance base domain not found!",
    });

  return createSubDomainSafe(externalIP, domainTemp);
}
