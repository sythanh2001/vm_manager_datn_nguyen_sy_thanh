"use client";
import * as React from "react";
import { useSession } from "next-auth/react";
import { v4 } from "uuid";
import axios from "axios";

import {
  Autorenew,
  CheckCircleOutline,
  MoreVert,
  PauseCircleOutline,
  Refresh,
  StopCircle,
} from "@mui/icons-material/";

import Link from "next/link";
import { protos } from "@google-cloud/compute";
import util from "@/lib/util";

export interface IComputeProps {}

function InstanceList() {
  const [colTitles] = React.useState([
    "Trạng thái",
    "Tên",
    "Tên miền",
    "Khu vực",
    "Ngày tạo",
  ]);
  const [instanceList, setInstanceList] =
    React.useState<protos.google.cloud.compute.v1.IInstance[]>();

  const [refreshLoading, setRefreshLoading] = React.useState<boolean>(false);
  const updateInstanceList = () => {
    axios
      .get("/api/instance/list")
      .then(
        ({ data }: { data: protos.google.cloud.compute.v1.IInstance[] }) => {
          console.log("🚀 ~ file: page.tsx:23 ~ .then ~ data:", data);

          setInstanceList(data);
          setRefreshLoading(false);
        }
      );
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
          {refreshLoading ? (
            <span className="loading loading-spinner"></span>
          ) : (
            <Refresh></Refresh>
          )}
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
              const zoneName = i.zone?.split("/").pop();
              let StatusIcon = CheckCircleOutline;
              switch (i.status) {
                case "TERMINATED":
                  StatusIcon = StopCircle;
                  break;
                case "SUSPENDING":
                  StatusIcon = PauseCircleOutline;
                  break;
                case "STAGING":
                  StatusIcon = Autorenew;
                  break;
              }

              return (
                <tr className="hover" key={i.id as string}>
                  <th>
                    <label>
                      <input type="checkbox" className="checkbox" />
                    </label>
                  </th>
                  <td>
                    <StatusIcon></StatusIcon>
                    {i.status}
                  </td>
                  <td>
                    <Link
                      href={`/compute/detail?zone=${zoneName}&instanceName=${i.name}`}
                      className="link link-info"
                    >
                      {i.name}
                    </Link>
                  </td>
                  <td>
                    {domain && (
                      <Link
                        className="link link-info "
                        href={"//" + domain}
                        target="_blank"
                      >
                        {domain}
                      </Link>
                    )}
                  </td>
                  <td>{zoneName}</td>
                  <td>
                    {createDate.toLocaleTimeString() +
                      " " +
                      createDate.toLocaleDateString()}
                  </td>
                  <th>
                    <div className="dropdown dropdown-hover dropdown-bottom dropdown-end ">
                      <label tabIndex={0} className="">
                        <MoreVert></MoreVert>
                      </label>
                      <ul
                        tabIndex={0}
                        className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                      >
                        <li>
                          <div
                            onClick={(e) => {
                              if (i.status == "SUSPENDED") {
                                util.InstanceActionHandler(
                                  "resumeInstance",
                                  i.name as string,
                                  zoneName as string
                                );
                                return;
                              }
                              util.InstanceActionHandler(
                                "startInstance",
                                i.name as string,
                                zoneName as string
                              );
                            }}
                          >
                            Khởi động
                          </div>
                        </li>
                        <li>
                          <div
                            onClick={(e) =>
                              util.InstanceActionHandler(
                                "stopInstance",
                                i.name as string,
                                zoneName as string
                              )
                            }
                          >
                            Dừng
                          </div>
                        </li>
                        <li>
                          <div
                            onClick={(e) =>
                              util.InstanceActionHandler(
                                "suspendInstance",
                                i.name as string,
                                zoneName as string
                              )
                            }
                          >
                            Tạm dừng
                          </div>
                        </li>
                        <li>
                          <div
                            onClick={(e) =>
                              util.InstanceActionHandler(
                                "resetInstance",
                                i.name as string,
                                zoneName as string
                              )
                            }
                          >
                            Khởi động lại
                          </div>
                        </li>
                        <li>
                          <div
                            onClick={(e) =>
                              util.InstanceActionHandler(
                                "deleteInstance",
                                i.name as string,
                                zoneName as string
                              )
                            }
                          >
                            Xoá
                          </div>
                        </li>
                        <li>
                          <Link
                            href={`/compute/detail?zone=${zoneName}&instanceName=${i.name}`}
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
