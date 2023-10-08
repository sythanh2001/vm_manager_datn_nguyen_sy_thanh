import { NextResponse, NextRequest } from "next/server";
import gc from "@/lib/gCompute";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import cf, { CLOUDFLARE_ZONE_ID, DNSRecord } from "@/lib/cloudflare";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const zone = p.get("zone");
  const instanceName = p.get("instanceName");

  const session = await getServerSession(authOptions);
  if (!zone || !instanceName || !session) {
    return NextResponse.error();
  }
  const instance = await gc.getInstanceInfo(zone, instanceName);

  if (!gc.containsEmail(instance, session?.user?.email as string)) {
    return NextResponse.error();
  }
  const externalIP = instance.networkInterfaces?.at(0)?.accessConfigs?.at(0)
    ?.natIP as string;
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

  const oldDNS = (await cf.dnsRecords.browse(CLOUDFLARE_ZONE_ID)).result?.find(
    (x: any) => x.name == domainTemp
  ) as DNSRecord;

  if (!oldDNS) {
    return NextResponse.json(
      await cf.dnsRecords.add(CLOUDFLARE_ZONE_ID, {
        name: domainTemp,
        content: externalIP,
        type: "A",
        ttl: 1,
      })
    );
  }

  return NextResponse.json(
    await cf.dnsRecords.edit(CLOUDFLARE_ZONE_ID, oldDNS.id, {
      name: oldDNS.name,
      type: oldDNS.type as any,
      content: externalIP,
      proxied: oldDNS.proxied,
      ttl: oldDNS.ttl,
    })
  );
}
