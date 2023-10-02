"use client";
import * as React from "react";
import { useSession, signOut } from "next-auth/react";
export interface IProfileProps {}

export default function AdminDashboard(props: IProfileProps) {
  const { data, status } = useSession();
  const isAuth = status == "authenticated";

  return (
    <>
      {isAuth && <button onClick={() => signOut()}>Logout</button>}
      <div>This is Admin dashboard page</div>
    </>
  );
}
