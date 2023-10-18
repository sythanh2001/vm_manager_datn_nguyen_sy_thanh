import { NextResponse, NextRequest } from "next/server";
import gc from "@/lib/gCompute";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import cf, { CLOUDFLARE_ZONE_ID } from "@/lib/cloudflare";
import grafana from "@/lib/grafana";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const zone = p.get("zone");
  const instanceName = p.get("instanceName");
  const firstStart = p.get("firstStart") == "true";

  const session = await getServerSession(authOptions);
  if (!zone || !instanceName || !session) {
    return NextResponse.error();
  }
  const instance = await gc.getInstanceInfo(zone, instanceName);

  if (!gc.containsEmail(instance, session?.user?.email as string)) {
    return NextResponse.error();
  }

  const domainTemp = instance.metadata?.items?.find(
    (x) => x.key == "domain"
  )?.value;
  let cloudflare = undefined;
  if (domainTemp) {
    cloudflare = (await cf.dnsRecords.browse(CLOUDFLARE_ZONE_ID)).result?.find(
      (x: any) => x.name == domainTemp
    );
  }
  const externalIP = instance.networkInterfaces
    ?.at(0)
    ?.accessConfigs?.at(0)?.natIP;

  let resData: any = { instance, cloudflare };

  if (externalIP) {
    try {
      grafana.changeBaseURL(externalIP);

      const alertRules = (await grafana.getAllAlertRules()).data;
      const defaultContact = (await grafana.getAllContactPoints()).data.find(
        (x: any) => x.name == "manager"
      );
      resData = { ...resData, grafana: { alertRules, defaultContact } };
    } catch (error) {
      console.log("🚀 ~ file: route.ts:49 ~ GET ~ error:", error);
    }
  }

  return NextResponse.json(resData);
}
