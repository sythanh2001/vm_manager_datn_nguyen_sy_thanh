import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import util from "@/lib/util";
import grafana from "@/lib/grafana";
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const baseUrl = p.get("baseUrl");
  const uid = p.get("uid");
  const limit = Number(p.get("limit"));
  const isPaused = p.get("isPaused") == "true";
  console.log("🚀 ~ file: route.ts:12 ~ GET ~ isPaused:", isPaused);
  console.log("🚀 ~ file: route.ts:11 ~ GET ~ limit:", limit);
  if (!baseUrl || !uid) {
    return util.ResponseErrorBadRequest();
  }
  const session = await getServerSession(authOptions);
  if (!session?.user) return util.ResponseErrorAuth();
  grafana.changeBaseURL(baseUrl);
  const oldRule = (await grafana.getAlertRule(uid)).data;
  oldRule.data.map((x: any) => {
    if (x.refId == "C") {
      if (limit) {
        x.model.conditions[0].evaluator.params[0] = limit;
      }
    }

    return x;
  });
  if (isPaused != null) {
    oldRule.isPaused = isPaused;
  }
  const res = await grafana.updateAlertRule(uid, oldRule);
  return NextResponse.json(res.data);
}
