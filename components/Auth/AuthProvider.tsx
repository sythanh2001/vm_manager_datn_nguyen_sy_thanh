"use client";
import * as React from "react";
import { PropsWithChildren } from "react";
import { SessionProvider } from "next-auth/react";
export function AuthProvider({ children }: PropsWithChildren) {
  return <SessionProvider>{children}</SessionProvider>;
}
