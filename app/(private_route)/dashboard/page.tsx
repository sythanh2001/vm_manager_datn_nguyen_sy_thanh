"use client";
import * as React from "react";
import { useSession, signOut } from "next-auth/react";
export interface IDashboardProps {}

export default function Dashboard(props: IDashboardProps) {
  const { data, status } = useSession();
  console.log("🚀 ~ file: page.tsx:8 ~ Dashboard ~ data:", data);
  const isAuth = status == "authenticated";

  return (
    <>
      <div>This is dashboard page</div>
    </>
  );
}
