import { NextResponse } from "next/server";
import gc from "@/lib/gCompute";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { redirect } from "next/navigation";
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Bad request!" });
  return NextResponse.json(
    await gc.getInstancesByEmail(session?.user?.email as string)
  );
}
// export async function GET(req: Request) {
//   return NextResponse.json(await gc.listAllInstances());
// }
