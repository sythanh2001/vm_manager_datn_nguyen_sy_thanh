import cf from "@/lib/cloudflare";
import gc from "@/lib/gCompute";

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // const instanceName = "test";
  // if (!instanceName) {
  //   return NextResponse.json({ error: "Missing field!" });
  // }
  // const createInstanceRes = await gc.createInstance(instanceName);
  // const instanceNATIP = createInstanceRes.networkInterfaces
  //   ?.at(0)
  //   ?.accessConfigs?.at(0)?.natIP;
  // if (!instanceNATIP) {
  //   return NextResponse.json({ error: "Missing external ip!" });
  // }
  // await cf.dnsRecords.add(process.env.CLOUDFLARE_ZONE_ID as string, {
  //   type: "A",
  //   name: instanceName,
  //   content: instanceNATIP,
  //   ttl: 1,
  //   proxied: false,
  // });
  return NextResponse.json({ test: "" });
}

export async function POST(req: Request) {
  const data = await req.json();

  const { instanceName } = data;
  if (!instanceName) {
    return NextResponse.json({ error: "Missing field!" });
  }
  const createInstanceRes = await gc.createInstance(instanceName);
  const instanceNATIP = createInstanceRes.networkInterfaces
    ?.at(0)
    ?.accessConfigs?.at(0)?.natIP;
  if (!instanceNATIP) {
    return NextResponse.json({ error: "Missing external ip!" });
  }
  await cf.dnsRecords.add(process.env.CLOUDFLARE_ZONE_ID as string, {
    type: "A",
    name: instanceName,
    content: instanceNATIP,
    ttl: 1,
    proxied: false,
  });
  return NextResponse.json(createInstanceRes);
}
