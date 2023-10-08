import Cloudflare from "cloudflare";

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

export const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID as string;
const cf = new Cloudflare({
  email: "thanhns2k1@gmail.com",
  key: process.env.CLOUDFLARE_TOKEN,
});

export default cf;
