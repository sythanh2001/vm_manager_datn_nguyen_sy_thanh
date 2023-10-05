"use client";
import * as React from "react";
import { useSession, signOut } from "next-auth/react";
import { v4 } from "uuid";
import axios from "axios";
import { InstanceInfo } from "@/lib/gComputeInterface";
import Link from "next/link";

export interface IComputeProps {}
function Controller() {
  return (
    <div className="flex space-x-9">
      <div className="text-lg font-bold">Dashboard</div>
      <Link href={"/compute/create"} className="btn btn-sm btn-primary">
        Create Instance
      </Link>
    </div>
  );
}
function InstanceList() {
  const [colTitles] = React.useState([
    "Status",
    "Name",
    "Domain",
    "Zone",
    "Creation time",
  ]);
  const [instanceList, setInstanceList] = React.useState<InstanceInfo[]>();
  React.useEffect(() => {
    axios
      .get("/api/instance/list")
      .then(({ data }: { data: InstanceInfo[] }) => {
        console.log("🚀 ~ file: page.tsx:23 ~ .then ~ data:", data);

        setInstanceList(data);
      });
  }, []);
  return (
    <table className="table">
      {/* head */}
      <thead>
        <tr>
          <th>
            <label>
              <input type="checkbox" className="checkbox" />
            </label>
          </th>
          {colTitles && colTitles.map((x) => <th key={v4()}>{x}</th>)}
        </tr>
      </thead>
      <tbody>
        {/* row 1 */}
        {instanceList &&
          instanceList.map((i) => {
            const createDate = new Date(
              i.creationTimestamp as unknown as string
            );
            const domain = i.metadata?.items?.find(
              (i) => i.key == "domain"
            )?.value;
            return (
              <tr className="hover" key={i.id}>
                <th>
                  <label>
                    <input type="checkbox" className="checkbox" />
                  </label>
                </th>
                <td>{i.status}</td>
                <td>
                  <Link
                    href={`/compute/detail?zone=${i.zoneName}&instanceName=${i.name}`}
                  >
                    {i.name}
                  </Link>
                </td>
                <td>
                  {domain && (
                    <Link
                      className="link link-info "
                      href={"http://" + domain}
                      target="_blank"
                    >
                      {domain}
                    </Link>
                  )}
                </td>
                <td>{i.zoneName}</td>
                <td>
                  {createDate.toLocaleTimeString() +
                    " " +
                    createDate.toLocaleDateString()}
                </td>
                <th>
                  <div className="dropdown dropdown-hover dropdown-bottom dropdown-end rounded-full">
                    <label tabIndex={0} className="btn m-1">
                      ...
                    </label>
                    <ul
                      tabIndex={0}
                      className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                    >
                      <li>
                        <div>Khởi động</div>
                      </li>
                      <li>
                        <div>Dừng</div>
                      </li>
                      <li>
                        <div>Tạm dừng</div>
                      </li>
                      <li>
                        <div>Khởi động lại</div>
                      </li>
                      <li>
                        <div>Xoá</div>
                      </li>
                      <li>
                        <div>Chi tiết</div>
                      </li>
                    </ul>
                  </div>
                </th>
              </tr>
            );
          })}
      </tbody>
      {/* foot */}
      <tfoot>
        <tr>
          <th></th>
          {colTitles && colTitles.map((x) => <th key={v4()}>{x}</th>)}
        </tr>
      </tfoot>
    </table>
  );
}

export default function Compute(props: IComputeProps) {
  const { data, status } = useSession();

  const isAuth = status == "authenticated";

  return (
    <div className="ml-32 mr-32">
      <Controller></Controller>
      <InstanceList></InstanceList>
    </div>
  );
}
