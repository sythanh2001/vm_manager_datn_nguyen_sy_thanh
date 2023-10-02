import { getServerSession } from "next-auth";
import * as React from "react";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export interface IPrivateLayoutProps {}

export default async function PrivateLayout({
  children,
}: React.PropsWithChildren) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin");

  return <>{children}</>;
}
