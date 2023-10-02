import * as React from "react";
import { useSession, signOut } from "next-auth/react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
export interface IProfileProps {}

export default async function Profile(props: IProfileProps) {
  const session = await getServerSession(authOptions);
  console.log("🚀 ~ file: page.tsx:8 ~ Profile ~ session:", session);
  return (
    <>
      <div>This is test page</div>
    </>
  );
}
