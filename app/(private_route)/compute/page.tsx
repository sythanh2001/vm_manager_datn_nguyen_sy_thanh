"use client";
import * as React from "react";
import { useSession } from "next-auth/react";
import { v4 } from "uuid";
import axios from "axios";

import {
  Autorenew,
  CheckCircleOutline,
  Dashboard,
  Delete,
  Info,
  MoreVert,
  PauseCircleOutline,
  PlayCircle,
  Refresh,
  RestartAlt,
  StopCircle,
} from "@mui/icons-material/";

import Link from "next/link";
import { protos } from "@google-cloud/compute";
import util from "@/lib/util";
import { DefaultLoading } from "@/components/Loading";
import { toast } from "react-toastify";

export interface IComputeProps {}

function InstanceList() {
  const { data, status } = useSession();

  const isAuth = status == "authenticated";
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
        <div className="text-lg font-bold">Bảng Điều Khiển</div>
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
              const actionHandler = (e: any) => {
                const actionName = e.target.value;
                const res = util.InstanceActionHandler(
                  actionName,
                  i.name as string,
                  zoneName as string
                );

                toast.promise(res, {
                  pending: `Đang ${actionName}`,
                  success: `${actionName} thành công`,
                  error: `${actionName} thất bại`,
                });
              };
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
                          <button
                            value={
                              i.status == "SUSPENDED"
                                ? "resumeInstance"
                                : "startInstance"
                            }
                            onClick={actionHandler}
                          >
                            <PlayCircle></PlayCircle>
                            Khởi động
                          </button>
                        </li>
                        <li>
                          <button value="stopInstance" onClick={actionHandler}>
                            <StopCircle></StopCircle>
                            Dừng
                          </button>
                        </li>
                        <li>
                          <button
                            value="suspendInstance"
                            onClick={actionHandler}
                          >
                            <PauseCircleOutline></PauseCircleOutline>
                            Tạm dừng
                          </button>
                        </li>
                        <li>
                          <button value="resetInstance" onClick={actionHandler}>
                            <RestartAlt></RestartAlt>
                            Khởi động lại
                          </button>
                        </li>
                        <li>
                          <button
                            value="deleteInstance"
                            onClick={actionHandler}
                          >
                            <Delete></Delete>
                            Xoá
                          </button>
                        </li>
                        <li>
                          <Link
                            href={`/compute/detail?zone=${zoneName}&instanceName=${i.name}`}
                          >
                            <Info></Info>Chi tiết
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </th>
                </tr>
              );
            })}
        </tbody>
      </table>
      {!instanceList && <DefaultLoading></DefaultLoading>}
    </div>
  );
}

export default function Compute(props: IComputeProps) {
  return (
    <div className="mr-32">
      <InstanceList></InstanceList>
    </div>
  );
}
