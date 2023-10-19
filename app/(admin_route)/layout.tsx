import { getServerSession } from "next-auth";
import * as React from "react";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { UserDocument } from "@/models/userModel";

export interface IPrivateLayoutProps {}

export default async function PrivateLayout({
  children,
}: React.PropsWithChildren) {
  const session = await getServerSession(authOptions);
  const user = session?.user as UserDocument;
  const isAdmin = user?.role === "admin";
  if (!isAdmin) return <div>This page only admin access</div>;

  return <>{children}</>;
}
