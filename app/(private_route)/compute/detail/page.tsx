"use client";
import * as React from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { InstanceInfo } from "@/lib/gComputeInterface";
import { v4 } from "uuid";
import { google } from "@google-cloud/compute/build/protos/protos";
import { log } from "console";
import util from "@/lib/util";
import Link from "next/link";
import { DNSRecord } from "@/lib/cloudflare";

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
                    <td>{x.value}</td>
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
  const router = useRouter();
  const [i, setInstance] = React.useState<google.cloud.compute.v1.IInstance>();
  const [externalIP, setExternalIP] = React.useState<string>();
  const [domain, setDomain] = React.useState<string>();
  const [zone, setZone] = React.useState<string>();
  const [cloudflareDNS, setCloudflareDNS] = React.useState<DNSRecord>();
  const [loadingSyncDNS, setLoadingSyncDNS] = React.useState(false);
  const onSyncDNS = () => {
    setLoadingSyncDNS(true);
    axios
      .get("/api/instance/sync-dns", {
        params: { instanceName: i?.name, zone },
      })
      .then(({ data }) => {
        if (data.success) {
          setCloudflareDNS({
            ...(cloudflareDNS as any),
            content: data.result.content,
          });
          setLoadingSyncDNS(false);
        }
      });
  };
  React.useEffect(() => {
    axios
      .get(
        `/api/instance/detail?zone=${sp.get("zone")}&instanceName=${sp.get(
          "instanceName"
        )}`
      )
      .then(({ data }) => {
        console.log("🚀 ~ file: page.tsx:72 ~ .then ~ data:", data);

        setInstance(data.instance);

        const domainTemp = data.instance.metadata?.items?.find(
          (x: any) => x.key == "domain"
        )?.value as string;
        setDomain(domainTemp);
        setExternalIP(
          data.instance.networkInterfaces?.at(0)?.accessConfigs?.at(0)
            ?.natIP as string
        );
        setZone(data.instance.zone?.split("/").pop());
        setCloudflareDNS(data.cloudflare);
      });
  }, [sp]);

  if (!i) return <div>Loading...</div>;
  return (
    <div className="ml-52 mr-52">
      <div className="space-y-5">
        {/* Basic info */}
        <CollapseInfoTable
          title="Thông tin cơ bản"
          data={[
            { label: "Tên", value: i.name },
            { label: "ID", value: i.id },
            { label: "Mô tả", value: i.description },
            { label: "Trạng thái", value: i.status },
            {
              label: "Danh sách quản lý",
              value: i.metadata?.items
                ?.find((x) => x.key == "managers")
                ?.value?.split(";")
                .map((x) => (
                  <div key={v4()} className="badge badge-outline mr-3">
                    {x}
                  </div>
                )),
            },
            { label: "Khu vực", value: zone },
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
        {/* Resource manager */}
        <CollapseInfoTable
          title="Quản lý tài nguyên"
          data={[
            { label: "Kiểu máy", value: i.machineType?.split("/").pop() },
            { label: "CPU platform", value: i.cpuPlatform },
            { label: "Minimum CPU platform", value: i.minCpuPlatform },
            {
              label: "Hiển thị",
              value: i.displayDevice?.enableDisplay ? "Hỗ trợ" : "Không hỗ trợ",
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
            {
              label: "Hiển thị",
              value: i.displayDevice?.enableDisplay ? "Hỗ trợ" : "Không hỗ trợ",
            },
          ]}
        ></CollapseInfoTable>
        {/* Network config */}
        <CollapseInfoTable
          title="Cấu hình mạng"
          data={[
            {
              label: "Tên miền",
              value: domain && (
                <Link
                  href={"//" + domain}
                  target="_blank"
                  className="link link-accent"
                >
                  {domain}
                </Link>
              ),
            },
            {
              label: "Internal IP",
              value: i.networkInterfaces?.at(0)?.networkIP,
            },
            {
              label: "External IP",
              value: externalIP ? (
                <Link
                  href={"//" + externalIP}
                  target="_blank"
                  className="link link-accent"
                >
                  {i.networkInterfaces?.at(0)?.accessConfigs?.at(0)?.natIP}
                </Link>
              ) : (
                "None"
              ),
            },
            {
              label: "Cloudflare DNS",
              value: domain ? (
                <div className="space-x-5">
                  <Link
                    href={"//" + cloudflareDNS?.content}
                    target="_blank"
                    className="link link-accent"
                  >
                    {cloudflareDNS?.content}
                  </Link>
                  {externalIP &&
                    (!cloudflareDNS || cloudflareDNS.content != externalIP) && (
                      <span className="text-red-500">
                        <button
                          className="btn btn-primary btn-xs"
                          onClick={() => onSyncDNS()}
                        >
                          {loadingSyncDNS && (
                            <span className="loading loading-spinner"></span>
                          )}
                          Đồng bộ
                        </button>
                        <span className="ml-4">
                          DNS và External IP không đồng bộ!
                        </span>
                      </span>
                    )}
                </div>
              ) : (
                "None"
              ),
            },
          ]}
        ></CollapseInfoTable>
        {/* Cloudflare */}
      </div>
    </div>
  );
}
