"use client";
import * as React from "react";
import { useSession, signOut } from "next-auth/react";
import { v4 } from "uuid";
import axios from "axios";
import { InstanceInfo } from "@/lib/gComputeInterface";
import Link from "next/link";

export interface IComputeProps {}

function InstanceList() {
  const [colTitles] = React.useState([
    "Trạng thái",
    "Tên",
    "Tên miền",
    "Khu vực",
    "Ngày tạo",
  ]);
  const [instanceList, setInstanceList] = React.useState<InstanceInfo[]>();

  const InstanceActionHandler = (
    action: string,
    instanceName: string,
    zone: string
  ) => {
    axios
      .get("/api/instance/control", {
        params: { action, instanceName, zone },
      })
      .then(({ data }) => {
        console.log("🚀 ~ file: page.tsx:38 ~ InstanceList ~ data:", data);
      });
  };
  const [refreshLoading, setRefreshLoading] = React.useState<boolean>(false);
  const updateInstanceList = () => {
    axios
      .get("/api/instance/list")
      .then(({ data }: { data: InstanceInfo[] }) => {
        console.log("🚀 ~ file: page.tsx:23 ~ .then ~ data:", data);

        setInstanceList(data);
        setRefreshLoading(false);
      });
  };

  React.useEffect(() => {
    updateInstanceList();
  }, []);
  return (
    <div>
      {/* Controller */}
      <div className="flex space-x-9">
        <div className="text-lg font-bold">Dashboard</div>
        <Link href={"/compute/create"} className="btn btn-sm btn-primary">
          Tạo máy ảo
        </Link>

        <button
          className="btn btn-sm btn-primary"
          onClick={() => {
            setRefreshLoading(true);
            updateInstanceList();
          }}
        >
          Làm mới
          {refreshLoading && <span className="loading loading-spinner"></span>}
        </button>
      </div>
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
          {/* row*/}
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
                          <div
                            onClick={(e) => {
                              if (i.status == "SUSPENDED") {
                                InstanceActionHandler(
                                  "resumeInstance",
                                  i.name as string,
                                  i.zoneName as string
                                );
                                return;
                              }
                              InstanceActionHandler(
                                "startInstance",
                                i.name as string,
                                i.zoneName as string
                              );
                            }}
                          >
                            Khởi động
                          </div>
                        </li>
                        <li>
                          <div
                            onClick={(e) =>
                              InstanceActionHandler(
                                "stopInstance",
                                i.name as string,
                                i.zoneName as string
                              )
                            }
                          >
                            Dừng
                          </div>
                        </li>
                        <li>
                          <div
                            onClick={(e) =>
                              InstanceActionHandler(
                                "suspendInstance",
                                i.name as string,
                                i.zoneName as string
                              )
                            }
                          >
                            Tạm dừng
                          </div>
                        </li>
                        <li>
                          <div
                            onClick={(e) =>
                              InstanceActionHandler(
                                "resetInstance",
                                i.name as string,
                                i.zoneName as string
                              )
                            }
                          >
                            Khởi động lại
                          </div>
                        </li>
                        <li>
                          <div
                            onClick={(e) =>
                              InstanceActionHandler(
                                "deleteInstance",
                                i.name as string,
                                i.zoneName as string
                              )
                            }
                          >
                            Xoá
                          </div>
                        </li>
                        <li>
                          <Link
                            href={`/compute/detail?zone=${i.zoneName}&instanceName=${i.name}`}
                          >
                            Chi tiết
                          </Link>
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
    </div>
  );
}

export default function Compute(props: IComputeProps) {
  const { data, status } = useSession();

  const isAuth = status == "authenticated";

  return (
    <div className="ml-32 mr-32">
      <InstanceList></InstanceList>
    </div>
  );
}
