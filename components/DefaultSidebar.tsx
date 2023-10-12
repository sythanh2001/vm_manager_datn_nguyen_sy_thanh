"use client";
import { UserDocument } from "@/models/userModel";
import { Dashboard, Logout, Settings } from "@mui/icons-material";
import _ from "lodash";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import * as React from "react";
import { PropsWithChildren } from "react";

export interface DefaultSidebarProps extends PropsWithChildren {}

function UserInfo() {
  const { data, status } = useSession();
  const isAuth = status == "authenticated";
  const user = data?.user as UserDocument;
  if (!user) return <div></div>;

  let roleColor = "accent";
  if (user.role == "admin") {
    roleColor = "primary";
  } else if (user.role == "root") {
    roleColor = "secondary";
  }
  return (
    <div className="flex items-center absolute bottom-5 w-full">
      <img
        src={user?.image || "/defaultAvatar.png"}
        alt="Avatar"
        className="w-12 h-12 rounded-full dark:bg-gray-500"
      />
      <div className="ml-5">
        <h2 className="text-lg font-semibold">{user.name}</h2>
        <span className={`badge badge-${roleColor} badge-outline`}>
          {_.upperFirst(user.role)}
        </span>
      </div>
      <div className="dropdown dropdown-top dropdown-end absolute right-5">
        <Settings tabIndex={0} className="m-1 cursor-pointer"></Settings>
        <ul
          tabIndex={0}
          className="dropdown-content z-[9999] menu p-2 shadow bg-base-100 rounded-box w-52"
        >
          <li>
            <a onClick={() => signOut()}>
              <Logout></Logout>Đăng xuất
            </a>
          </li>
          {/* <li>
            <a>Item 2</a>
          </li> */}
        </ul>
      </div>
    </div>
  );
}
export function DefaultSidebar({ children }: DefaultSidebarProps) {
  return (
    <div className="drawer lg:drawer-open">
      <input id="my-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content">
        {/* Page content here */}
        {children}
      </div>
      <div className="drawer-side">
        <label
          htmlFor="my-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <ul className="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
          {/* Sidebar content here */}
          <Link href={"/"} className="btn btn-ghost normal-case text-xl">
            DATN
          </Link>
          <li>
            <Link href={"/compute"}>
              <Dashboard></Dashboard> Dashboard
            </Link>
          </li>
          <li>
            <a>Sidebar Item 2</a>
          </li>
          <UserInfo></UserInfo>
        </ul>
      </div>
    </div>
  );
}
