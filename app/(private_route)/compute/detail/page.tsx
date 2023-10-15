"use client";
import * as React from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { v4 } from "uuid";
import { google } from "@google-cloud/compute/build/protos/protos";
import util from "@/lib/util";
import Link from "next/link";
import { DNSRecord } from "@/lib/cloudflare";
import { DefaultLoading } from "@/components/Loading";
import CollapseInfoSide from "@/components/Collapse/CollapseInfoTable";
import { Save } from "@mui/icons-material";

export interface IPageProps {}

function RowDiskInfo({
  instance,
  disk,
}: {
  instance: google.cloud.compute.v1.IInstance;
  disk: google.cloud.compute.v1.IAttachedDisk;
}) {
  const [newDiskSizeGb, setNewDiskSizeGb] = React.useState(
    Number(disk.diskSizeGb)
  );
  const [sourceArr] = React.useState<string[]>(disk.source?.split("/") || []);
  const [zone] = React.useState(
    sourceArr[sourceArr.findIndex((x) => x == "zones") + 1]
  );
  const [diskName] = React.useState(disk.source?.split("/").pop());
  const saveDiskChange = (newDiskSizeGb: number) => {
    axios
      .get("/api/instance/edit/resize-disk", {
        params: {
          instanceName: instance.name,
          zone,
          diskName,
          newDiskSizeGb,
        },
      })
      .then(({ data }) => {
        window.location.reload();
      });
  };
  return (
    <tr key={v4()}>
      <td>{diskName}</td>
      <td>{disk.boot ? "Có" : "Không"}</td>
      <td>{disk.interface}</td>
      <th>
        <input
          type="number"
          defaultValue={Number(disk.diskSizeGb)}
          onChange={(e) => {
            setNewDiskSizeGb(Number(e.target.value));
            // Tối đa 65,536 GB
            if (e.target) {
            }
          }}
          value={newDiskSizeGb}
          className="input input-bordered input-xs"
        />
        {newDiskSizeGb != disk.diskSizeGb && (
          <button
            onClick={(e) => {
              saveDiskChange(newDiskSizeGb);
            }}
          >
            <Save></Save>
          </button>
        )}
      </th>
      <td>{zone}</td>
      <td>{disk.type}</td>
      <td>{disk.architecture}</td>
      <td>{disk.mode}</td>
      <td>{disk.autoDelete ? "Có" : "Không"}</td>
    </tr>
  );
}

function GrafanaIframe({ ip, id }: { ip: string; id: string }) {
  return (
    <iframe
      src={`http://${ip}:3001/d-solo/rYdddlPWk/node-exporter-full?orgId=1&panelId=${id}`}
      className="w-full"
      frameBorder="0"
      scrolling="no"
    ></iframe>
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
        // console.log("🚀 ~ file: page.tsx:72 ~ .then ~ data:", data);
        if (!data.name) {
          console.log("request fail");
        }
        console.log("🚀 ~ file: page.tsx:120 ~ .then ~ data:", data);
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

  if (!i) return <DefaultLoading></DefaultLoading>;
  return (
    <div className="">
      <div className="space-y-5">
        {/* Basic info */}
        <CollapseInfoSide
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
        ></CollapseInfoSide>
        {/* Resource manager */}
        {externalIP && (
          <div className="collapse collapse-arrow bg-base-200">
            <input type="checkbox" defaultChecked={true} />
            <div className="collapse-title text-xl font-medium">
              Quản lý tài nguyên
            </div>
            <div className="collapse-content">
              <div className="flex">
                <GrafanaIframe ip={externalIP} id="14"></GrafanaIframe>
                <GrafanaIframe ip={externalIP} id="75"></GrafanaIframe>
                <GrafanaIframe ip={externalIP} id="23"></GrafanaIframe>
                <GrafanaIframe ip={externalIP} id="15"></GrafanaIframe>
              </div>
              <div className="flex">
                <GrafanaIframe ip={externalIP} id="20"></GrafanaIframe>
                <GrafanaIframe ip={externalIP} id="16"></GrafanaIframe>
                <GrafanaIframe ip={externalIP} id="154"></GrafanaIframe>
                <GrafanaIframe ip={externalIP} id="19"></GrafanaIframe>
              </div>
              <div className="flex">
                <GrafanaIframe ip={externalIP} id="77"></GrafanaIframe>
                <GrafanaIframe ip={externalIP} id="78"></GrafanaIframe>
              </div>
              <div className="flex">
                <GrafanaIframe ip={externalIP} id="74"></GrafanaIframe>
                <GrafanaIframe ip={externalIP} id="152"></GrafanaIframe>
              </div>
            </div>
          </div>
        )}
        {/* Machine config */}
        <CollapseInfoSide
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
        ></CollapseInfoSide>
        {/* Storage */}
        {i.disks && (
          <div className="collapse collapse-arrow bg-base-200 rounded-none">
            <input type="checkbox" defaultChecked={true} />
            <div className="collapse-title text-xl font-medium">Lưu trữ</div>
            <div className="collapse-content">
              <div className="overflow-x-auto">
                <table className="table table-xs">
                  <thead>
                    <tr>
                      {[
                        "Tên",
                        "Boot",
                        "Interface Type",
                        "Kích thước (GB)",
                        "Khu vực",
                        "Kiểu",
                        "Kiến trúc",
                        "Chế độ",
                        "Khi xoá cùng instance",
                      ].map((x) => (
                        <th key={v4()}>{x}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {i.disks.map((x) => (
                      <RowDiskInfo
                        key={v4()}
                        instance={i}
                        disk={x}
                      ></RowDiskInfo>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Network config */}
        <CollapseInfoSide
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
        ></CollapseInfoSide>
        {/* Cloudflare */}
      </div>
    </div>
  );
}
