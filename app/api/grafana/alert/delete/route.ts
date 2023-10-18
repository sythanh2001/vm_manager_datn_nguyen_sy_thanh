import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import util from "@/lib/util";
import grafana from "@/lib/grafana";
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const baseUrl = p.get("baseUrl");
  const uid = p.get("uid");

  if (!baseUrl || !uid) {
    return util.ResponseErrorBadRequest();
  }
  const session = await getServerSession(authOptions);
  if (!session?.user) return util.ResponseErrorAuth();
  grafana.changeBaseURL(baseUrl);

  const res = await grafana.deleteAlertRule(uid);
  return NextResponse.json(res.data);
}
