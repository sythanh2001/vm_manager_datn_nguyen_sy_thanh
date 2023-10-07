import cf from "@/lib/cloudflare";
import gc from "@/lib/gCompute";

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const instanceName = p.get("instanceName");
  const zone = p.get("zone");
  const region = p.get("region");
  const diskSize = Number(p.get("diskSize"));
  const sourceImage = p.get("sourceImage");
  const subDomain = p.get("subDomain");
  if (
    !instanceName ||
    !zone ||
    !region ||
    !sourceImage ||
    !diskSize ||
    diskSize < 10
  ) {
    return NextResponse.json({ error: "Bad request" });
  }

  const createInstanceRes = await gc.createInstance(
    instanceName,
    zone,
    region,
    sourceImage,
    diskSize
  );
  const instanceNATIP = createInstanceRes.networkInterfaces
    ?.at(0)
    ?.accessConfigs?.at(0)?.natIP;

  if (!instanceNATIP) {
    return NextResponse.json({ error: "Missing external ip!" });
  }
  if (subDomain) {
    await cf.dnsRecords.add(process.env.CLOUDFLARE_ZONE_ID as string, {
      type: "A",
      name: subDomain,
      content: instanceNATIP,
      ttl: 1,
      proxied: false,
    });
  }

  return NextResponse.json(createInstanceRes);
}

// export async function POST(req: Request) {
//   const data = await req.json();

//   const { instanceName } = data;
//   if (!instanceName) {
//     return NextResponse.json({ error: "Missing field!" });
//   }
//   const createInstanceRes = await gc.createInstance(instanceName);
//   const instanceNATIP = createInstanceRes.networkInterfaces
//     ?.at(0)
//     ?.accessConfigs?.at(0)?.natIP;F
//   if (!instanceNATIP) {
//     return NextResponse.json({ error: "Missing external ip!" });
//   }
//   await cf.dnsRecords.add(process.env.CLOUDFLARE_ZONE_ID as string, {
//     type: "A",
//     name: instanceName,
//     content: instanceNATIP,
//     ttl: 1,
//     proxied: false,
//   });
//   return NextResponse.json(createInstanceRes);
// }
