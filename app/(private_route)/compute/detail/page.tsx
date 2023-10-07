"use client";
import * as React from "react";
import { useSession, signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { InstanceInfo } from "@/lib/gComputeInterface";
import { v4 } from "uuid";
import { google } from "@google-cloud/compute/build/protos/protos";
import { log } from "console";
import util from "@/lib/util";
export interface IPageProps {}

function Control() {
  return <div></div>;
}

function CollapseInfoTable({
  title,
  data,
}: {
  title: string;
  data: { label: string; value: any }[];
}) {
  return (
    <div className="collapse collapse-arrow bg-base-200">
      <input type="checkbox" defaultChecked={true} />
      <div className="collapse-title text-xl font-medium">{title}</div>
      <div className="collapse-content">
        <div className="overflow-x-auto">
          <table className="table table-xs">
            <thead>
              <tr>
                <th className="w-60"></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data &&
                data.map((x) => (
                  <tr key={v4()}>
                    <th>{x.label}</th>
                    <td>{String(x.value)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export default function Page(props: IPageProps) {
  const sp = useSearchParams();
  const [i, setInstance] = React.useState<google.cloud.compute.v1.IInstance>();
  React.useEffect(() => {
    axios
      .get(
        `/api/instance/detail?zone=${sp.get("zone")}&instanceName=${sp.get(
          "instanceName"
        )}`
      )
      .then(({ data }) => {
        console.log("🚀 ~ file: page.tsx:56 ~ .then ~ data:", data);

        setInstance(data);
      });
  }, [sp]);
  if (!i) return <div>Loading...</div>;

  const data: [] = [];
  return (
    <div className="space-y-5">
      {/* Basic info */}
      <CollapseInfoTable
        title="Thông tin cơ bản"
        data={[
          { label: "Tên", value: i.name },
          { label: "ID", value: i.id },
          { label: "Mô tả", value: i.description },
          { label: "Trạng thái", value: i.status },
          { label: "Khu vực", value: i.zone?.split("/").pop() },
          {
            label: "Ngày tạo",
            value: util.timeFormat(i.creationTimestamp),
          },
          {
            label: "Lần khởi động gần nhất",
            value: util.timeFormat(i.lastStartTimestamp),
          },
          {
            label: "Lần tạm dừng gần nhất",
            value: util.timeFormat(i.lastSuspendedTimestamp),
          },
          {
            label: "Lần dừng gần nhất",
            value: util.timeFormat(i.lastStopTimestamp),
          },
        ]}
      ></CollapseInfoTable>
      {/* Machine config */}
      <CollapseInfoTable
        title="Cấu hình máy"
        data={[
          { label: "Kiểu máy", value: i.machineType?.split("/").pop() },
          { label: "CPU platform", value: i.cpuPlatform },
          { label: "Minimum CPU platform", value: i.minCpuPlatform },
          { label: "Hiển thị", value: i.displayDevice?.enableDisplay },
        ]}
      ></CollapseInfoTable>
    </div>
  );
}
