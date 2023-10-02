import { getServerSession } from "next-auth";
import * as React from "react";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export interface IPrivateLayoutProps {}

export default async function PrivateLayout({
  children,
}: React.PropsWithChildren) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role: string } | undefined;
  console.log("🚀 ~ file: layout.tsx:13 ~ user:", user);
  const isAdmin = user?.role === "admin";
  if (!isAdmin) redirect("/");

  return <>{children}</>;
}
