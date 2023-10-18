import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import util from "@/lib/util";
import grafana from "@/lib/grafana";
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const baseUrl = p.get("baseUrl");
  const uid = p.get("uid");
  const addresses = p.get("addresses");

  if (!baseUrl || !uid || !addresses) {
    return util.ResponseErrorBadRequest();
  }
  const session = await getServerSession(authOptions);
  if (!session?.user) return util.ResponseErrorAuth();
  grafana.changeBaseURL(baseUrl);
  const oldContact = (await grafana.getAllContactPoints()).data.find(
    (x: any) => x.name == "manager"
  );
  if (!oldContact) {
    return util.ResponseErrorBadRequest();
  }
  const res = await grafana.updateContactPoint(uid, {
    ...oldContact,
    settings: { ...oldContact.settings, addresses },
  });
  return NextResponse.json(res.data);
}
