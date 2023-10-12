import Cloudflare from "cloudflare";
import { NextResponse } from "next/server";

export interface DNSRecord {
  id: string;
  zone_id: string;
  zone_name: string;
  name: string;
  type: string;
  content: string;
  proxiable: boolean;
  proxied: boolean;
  ttl: number;
  locked: boolean;
  meta: Meta;
  comment: null;
  tags: any[];
  created_on: Date;
  modified_on: Date;
}

export interface Meta {
  auto_added: boolean;
  managed_by_apps: boolean;
  managed_by_argo_tunnel: boolean;
  source: string;
}
export async function createSubDomainSafe(ip: string, subDomain: string) {
  const oldDNS = (await cf.dnsRecords.browse(CLOUDFLARE_ZONE_ID)).result?.find(
    (x: any) => x.name == subDomain
  ) as DNSRecord;

  if (!oldDNS) {
    return NextResponse.json(
      await cf.dnsRecords.add(CLOUDFLARE_ZONE_ID, {
        name: subDomain,
        content: ip,
        type: "A",
        ttl: 1,
      })
    );
  }
  return NextResponse.json(
    await cf.dnsRecords.edit(CLOUDFLARE_ZONE_ID, oldDNS.id, {
      name: oldDNS.name,
      type: oldDNS.type as any,
      content: ip,
      proxied: oldDNS.proxied,
      ttl: oldDNS.ttl,
    })
  );
}
export const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID as string;
const cf = new Cloudflare({
  email: "thanhns2k1@gmail.com",
  key: process.env.CLOUDFLARE_TOKEN,
});

export default cf;
