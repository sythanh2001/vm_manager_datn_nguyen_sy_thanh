"use client";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "./Redux/Store";

export interface IDefaultHeaderProps {}

function Search() {
  return (
    <div className="form-control ">
      <input
        type="text"
        placeholder="Search"
        className="input input-bordered md:w-auto"
      />
    </div>
  );
}

function UserAuth() {
  const { data, status } = useSession();
  console.log("🚀 ~ file: DefaultHeader.tsx:98 ~ UserAuth ~ data:", data);

  const isAuth = status == "authenticated";
  return (
    <>
      {isAuth && (
        <>
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full">
                <img
                  src={
                    (data?.user?.image as string) ||
                    "https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg"
                  }
                  alt="user avatar"
                />
              </div>
            </label>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
            >
              <p className="self-center text-lg">{data?.user?.name}</p>
              <li>
                <a className="justify-between">
                  Profile
                  <span className="badge">New</span>
                </a>
              </li>
              <li>
                <a>Settings</a>
              </li>
              <li>
                <a onClick={() => signOut()}>Logout</a>
              </li>
            </ul>
          </div>
        </>
      )}
      {!isAuth && (
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-circle">
            <div className="indicator">
              {/* user svg */}
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="12"
                  cy="9"
                  r="3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M17.9691 20C17.81 17.1085 16.9247 15 11.9999 15C7.07521 15 6.18991 17.1085 6.03076 20"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </label>
          <div
            tabIndex={0}
            className="mt-3 z-[1] card card-compact dropdown-content w-52 bg-base-100 shadow"
          >
            <div className="card-body">
              <div className="card-actions">
                <Link href={"/auth/signin"}>
                  <div className="btn btn-primary btn-block">Đăng nhập</div>
                </Link>
                <span>
                  Bạn chưa có tài khoản ?
                  <Link href={"/auth/register"} className="link">
                    Đăng ký ngay
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
function Menu() {
  return (
    <div className="flex-1">
      <ul className="menu menu-horizontal px-1">
        <li>
          <Link href={"/compute"}>Compute</Link>
        </li>
        <li>
          <details>
            <summary>Parent</summary>
            <ul className="p-2 bg-base-100">
              <li>
                <a>Link 1</a>
              </li>
              <li>
                <a>Link 2</a>
              </li>
            </ul>
          </details>
        </li>
      </ul>
    </div>
  );
}
export function DefaultHeader(props: IDefaultHeaderProps) {
  const router = useRouter();
  const globalStore = useSelector((state: RootState) => state.global);
  const dispatch = useDispatch();
  return (
    <div className="sticky top-0 z-50 navbar bg-base-100">
      <div className="flex-1">
        <Link href={"/"} className="btn btn-ghost normal-case text-xl">
          daisyUI
        </Link>
      </div>
      <Menu></Menu>
      <div className="flex-none gap-2">
        <Search></Search>

        <UserAuth></UserAuth>
      </div>
    </div>
  );
}
