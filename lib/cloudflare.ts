import Cloudflare from "cloudflare";

const cf = new Cloudflare({
  email: "thanhns2k1@gmail.com",
  key: process.env.CLOUDFLARE_TOKEN,
});

// await cf.dnsRecords.add("98cfa7d6a5330f22242b864353921198", {
//     type: "A",
//     name: "test",
//     content: "8.8.4.4",
//     ttl: 1,
//     proxied: false,
//   })
export default cf;
