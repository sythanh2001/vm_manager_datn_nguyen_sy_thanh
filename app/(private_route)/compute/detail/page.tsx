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
import {
  Delete,
  PauseCircleOutline,
  PlayCircle,
  Refresh,
  RestartAlt,
  Save,
  Settings,
  StopCircle,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { AlertRule as AlertRule, Contact } from "@/lib/grafana";
import { CollapseTable } from "@/components/Collapse/CollapseTable";
import { MachineTypeGroup } from "@/app/(admin_route)/compute/create/page";
import { protos } from "@google-cloud/compute";
import { Dictionary } from "lodash";
import _ from "lodash";
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
              if (newDiskSizeGb < Number(disk.diskSizeGb)) {
                toast.error("Chỉ có thể tăng bộ nhớ");
                return;
              }
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
function RowAlertRule({
  alertRule,
  externalIP,
}: {
  alertRule: AlertRule;
  externalIP: string;
}) {
  const [alertInfo, setAlertInfo] = React.useState(alertRule);
  const [limit, setLimit] = React.useState(() => {
    // @ts-ignore
    return alertRule?.data
      ?.find((x) => x.refId == "C")
      ?.model?.conditions.at(0)
      .evaluator.params.at(0);
  });
  const [isFocusLimit, setIsFocusLimit] = React.useState(false);
  const updateRule = (action: "isPaused" | "limit", value: any) => {
    let params = {
      baseUrl: externalIP,
      uid: alertInfo.uid,
      limit,
      isPaused: alertInfo.isPaused,
    };
    params = { ...params, [action]: value };
    if (action == "isPaused") {
      setAlertInfo({ ...alertInfo, isPaused: value });
    }

    const res = axios
      .get("/api/grafana/alert/update", {
        params: params,
      })
      .then(({ data }) => {
        setAlertInfo(data);
      });
    toast.promise(res, {
      pending: `Đang cập nhật ${alertInfo.title}`,
      success: `Cập nhật  ${alertInfo.title} thành công`,
      error: `Cập nhật  ${alertInfo.title} thất bại`,
    });
  };

  return (
    <tr className="hover">
      <td>{alertInfo.title}</td>
      <td>
        {isFocusLimit && (
          <div className="text-red-500">Tự động lưu khi dừng chỉnh sửa</div>
        )}
        {
          <input
            type="number"
            defaultValue={limit}
            onFocus={(e) => setIsFocusLimit(true)}
            onBlur={(e) => {
              setIsFocusLimit(false);
              if (Number(e.target.value) != limit)
                updateRule("limit", e.target.value);
            }}
            className="input input-bordered input-xs"
          />
        }
      </td>
      <td>
        {
          <input
            type="checkbox"
            defaultChecked={!alertInfo.isPaused}
            onChange={(e) => updateRule("isPaused", !e.target.checked)}
            className="toggle toggle-primary"
          />
        }
      </td>
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

function ChangeMachineType({
  zone,
  onMachineTypeChange,
}: {
  zone: string;
  onMachineTypeChange?: (value: any) => any;
}) {
  const [machineListCol] = React.useState([
    "Dòng",
    "Mô tả",
    "vCPUs",
    "RAM",
    "Nền tảng",
  ]);
  const [machineTypeGroupsDisplay, setMachineTypeGroupsDisplay] =
    React.useState<MachineTypeGroup[]>();
  const [machineImageList, setMachineImageList] =
    React.useState<google.cloud.compute.v1.IMachineImage[]>();
  const [machineTypeListGroups, setMachineTypeListGroups] =
    React.useState<Dictionary<protos.google.cloud.compute.v1.IMachineType[]>>();
  // input
  const [machineGroupSelected, setMachineGroupSelected] =
    React.useState<string>();
  const [machineTypeSelected, setMachineTypeSelected] = React.useState();
  const [regionSelected, setRegionSelected] = React.useState<string>();
  //handler
  const onMachineTypeGroupChange = React.useCallback((groupName: string) => {
    setMachineGroupSelected(groupName);
  }, []);
  const clearAllMachineData = () => {
    setMachineGroupSelected(undefined);
    setMachineTypeGroupsDisplay(undefined);
    setMachineTypeSelected(undefined);
    return true;
  };
  const onZoneChange = (zoneName: string) => {
    clearAllMachineData();

    axios
      .get(`/api/instance/machine-type?zone=${zoneName}`)
      .then(
        ({ data }: { data: protos.google.cloud.compute.v1.IMachineType[] }) => {
          const machineGroupsData = _.groupBy(data, (x) => {
            return x.name?.split("-").at(0);
          });
          setMachineTypeListGroups(machineGroupsData);
          const machineGroupsDisplayData: MachineTypeGroup[] = [];
          for (let key in machineGroupsData) {
            let value = machineGroupsData[key];
            machineGroupsDisplayData.push({
              series: key,
              description: "",
              vCPUs: `${_.minBy(value, "guestCpus")?.guestCpus} - ${
                _.maxBy(value, "guestCpus")?.guestCpus
              }`,
              memory: `${(
                (_.minBy(value, "memoryMb")?.memoryMb as number) / 1024
              ).toFixed(1)} - ${(
                (_.maxBy(value, "memoryMb")?.memoryMb as number) / 1024
              ).toFixed(1)} GB`,
            });
          }
          setMachineTypeGroupsDisplay(machineGroupsDisplayData);
        }
      );
  };
  React.useEffect(() => {
    onZoneChange(zone);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone]);
  return (
    <div className="space-y-3">
      {/* Machine type groups */}
      <CollapseTable
        title="Các nhóm máy"
        cols={["Nhóm", "vCPUs", "RAM"]}
        data={machineTypeGroupsDisplay}
        radioName="radio-machine-group"
        rowkeys={[
          { key: "series", render: (e) => e.toUpperCase() },
          { key: "vCPUs" },
          { key: "memory" },
        ]}
        noDataText={!zone ? "Vui lòng chọn vùng trước" : "Loading..."}
        onRadioCheckedChange={(x) => onMachineTypeGroupChange(x.series)}
      ></CollapseTable>
      {/* Machine list */}
      <CollapseTable
        title="Cấu hình máy"
        cols={machineListCol}
        radioName="radio-machine-list"
        noDataText="Vui lòng chọn nhóm máy trước"
        data={
          machineTypeListGroups && machineGroupSelected
            ? machineTypeListGroups[machineGroupSelected]
            : undefined
        }
        rowkeys={[
          {
            key: "name",
            render: (x: string) =>
              x.substring(
                (machineGroupSelected?.length as number) + 1,
                x.length
              ),
          },
          { key: "description" },
          { key: "guestCpus" },
          {
            key: "memoryMb",
            render(x) {
              return (x / 1027).toFixed(1) + " GB";
            },
          },
        ]}
        onRadioCheckedChange={(x) =>
          onMachineTypeChange && onMachineTypeChange(x.name)
        }
      ></CollapseTable>
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
  const [alertRules, setAlertRules] = React.useState<AlertRule[]>();
  const [alertContact, setAlertContact] = React.useState<Contact>();
  const [isEditingContact, setIsEditingContact] =
    React.useState<boolean>(false);

  const [cloudflareDNS, setCloudflareDNS] = React.useState<DNSRecord>();
  const [loadingSyncDNS, setLoadingSyncDNS] = React.useState(false);
  const [newMachineType, setNewMachineType] = React.useState<string>();
  const onUpdateContact = (addresses: string) => {
    if (addresses == alertContact?.settings.addresses) {
      return;
    }
    const res = axios.get("/api/grafana/contact/update", {
      params: { baseUrl: externalIP, uid: alertContact?.uid, addresses },
    });
    toast.promise(res, {
      pending: "Đang cập nhật địa chỉ cảnh báo",
      success: "Cập nhật địa chỉ cảnh báo thành công",
      error: "Cập nhật địa chỉ cảnh báo thất bại",
    });
  };
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
  const actionHandler = (e: any) => {
    const actionName = e.target.value;
    const res = util.InstanceActionHandler(
      actionName,
      i?.name as string,
      zone as string
    );

    toast.promise(res, {
      pending: `Đang ${actionName}`,
      success: `${actionName} thành công`,
      error: `${actionName} thất bại`,
    });
  };
  const updateData = (isRefresh?: boolean) => {
    const res = axios
      .get(
        `/api/instance/detail?zone=${sp.get("zone")}&instanceName=${sp.get(
          "instanceName"
        )}`
      )
      .then(({ data }) => {
        if (!data.name) {
          console.log("request fail");
        }
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
        if (data.grafana) {
          setAlertRules(data.grafana.alertRules);
          setAlertContact(data.grafana.defaultContact);
        }
      });

    isRefresh &&
      toast.promise(res, {
        pending: "Đang làm mới...",
        success: "Làm mới thành công",
      });
  };
  React.useEffect(() => {
    updateData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!i) return <DefaultLoading></DefaultLoading>;
  return (
    <div className="">
      <dialog id="modal_change_machine_type" className="modal">
        <div className="modal-box w-11/12 max-w-5xl">
          <h3 className="font-bold text-lg text-red-500">
            Khi thay đổi cấu hình máy sẽ tự động khởi dộng lại VM
          </h3>

          <ChangeMachineType
            zone={zone as string}
            onMachineTypeChange={(e) => {
              setNewMachineType(e);
            }}
          ></ChangeMachineType>
          <div className="modal-action">
            <form method="dialog" className="space-x-5">
              {/* if there is a button, it will close the modal */}
              <button
                className="btn btn-success"
                onClick={(e) => {
                  const res = axios.get("/api/instance/edit/machine-type", {
                    params: {
                      zone,
                      instanceName: i.name,
                      machineType: newMachineType,
                    },
                  });
                  toast.promise(res, {
                    pending: "Đang thay đổi cấu hình",
                    success: "Thay đổi cấu hình thành công",
                    error: "Thay đổi cấu hình thất bại",
                  });
                }}
              >
                Xác nhận
              </button>
              <button className="btn btn-error">Huỷ</button>
            </form>
          </div>
        </div>
      </dialog>
      {/* Controller */}
      <div className="flex space-x-3">
        <button className="btn btn-primary" onClick={(e) => updateData(true)}>
          <Refresh></Refresh>Làm mới
        </button>
        <button className="btn" onClick={actionHandler} value="resetInstance">
          <RestartAlt></RestartAlt>Khởi dộng lại
        </button>
        <button
          className="btn"
          onClick={actionHandler}
          value={i.status == "SUSPENDED" ? "resumeInstance" : "startInstance"}
        >
          <PlayCircle></PlayCircle>Khởi dộng
        </button>
        <button className="btn" onClick={actionHandler} value="stopInstance">
          <StopCircle></StopCircle>Dừng
        </button>
        <button className="btn" onClick={actionHandler} value="suspendInstance">
          <PauseCircleOutline></PauseCircleOutline>Tạm Dừng
        </button>
        <button className="btn" onClick={actionHandler} value="deleteInstance">
          <Delete className="text-red-500"></Delete>Xoá
        </button>
      </div>
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
        {externalIP && alertRules && (
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
        {/* Alert Rules */}
        {alertRules && externalIP && (
          <div className="collapse collapse-arrow bg-base-200">
            <input type="checkbox" defaultChecked={true} />
            <div className="collapse-title text-xl font-medium">
              Cấu hình cảnh báo
            </div>
            <div className="collapse-content">
              {/* Contact */}

              {alertContact && (
                <div>
                  <div>
                    {`Danh sách dịa chỉ email được nhận cảnh báo phân cách bằng
                    ký tự ";"`}{" "}
                    {isEditingContact && (
                      <span className="text-red-500">
                        Ngừng chỉnh sửa để lưu
                      </span>
                    )}
                  </div>
                  <textarea
                    className="textarea textarea-primary w-full"
                    onFocus={(e) => setIsEditingContact(true)}
                    onBlur={(e) => {
                      onUpdateContact(e.target.value.trim());
                      setIsEditingContact(false);
                    }}
                    defaultValue={alertContact.settings.addresses}
                  ></textarea>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="table">
                  {/* Rule */}
                  <thead>
                    <tr>
                      <th>Tên</th>
                      <th>Giới hạn cảnh báo %</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertRules.map((x) => (
                      <RowAlertRule
                        key={x.uid}
                        alertRule={x}
                        externalIP={externalIP}
                      ></RowAlertRule>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {/* Machine config */}
        <CollapseInfoSide
          title="Cấu hình máy"
          data={[
            {
              label: "Kiểu máy",
              value: (
                <div>
                  {i.machineType?.split("/").pop()}
                  <Settings
                    className="cursor-pointer"
                    onClick={(e) => {
                      // @ts-ignore
                      document
                        .getElementById("modal_change_machine_type")
                        // @ts-ignore
                        .showModal();
                    }}
                  ></Settings>
                </div>
              ),
            },
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
          <div className="collapse collapse-arrow bg-base-200">
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
