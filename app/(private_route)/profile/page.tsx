"use client";
import * as React from "react";
import { useSession, signOut } from "next-auth/react";
export interface IProfileProps {}

export default function Profile(props: IProfileProps) {
  const { data, status } = useSession();
  console.log("🚀 ~ file: page.tsx:8 ~ Profile ~ data:", data);
  const isAuth = status == "authenticated";

  return (
    <>
      {isAuth && <button onClick={() => signOut()}>Logout</button>}
      <div>This is Profile dashboard page</div>
    </>
  );
}
