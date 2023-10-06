"use client";
import * as React from "react";
import { useSession, signOut } from "next-auth/react";
import { google } from "@google-cloud/compute/build/protos/protos";
import axios from "axios";
import { protos } from "@google-cloud/compute";
import { v4 } from "uuid";
import _, { Dictionary } from "lodash";
import { useRouter } from "next/navigation";
export interface ICreateProps {}

export interface MachineTypeGroup {
  series: string;
  description: string;
  vCPUs: string;
  memory: string;
}

function CollapseTable({
  title,
  cols,
  data,
  rowkeys: rowKeys,
  radioName,
  onRadioCheckedChange,
  defaultChecked = true,
  noDataText = "Loading...",
}: {
  title: string;
  cols: string[];
  data?: any[];
  rowkeys: { key: string; render?: (value: any) => string }[];
  radioName: string;
  onRadioCheckedChange?: (value: any) => void;
  defaultChecked?: boolean;
  noDataText?: string;
}) {
  const [radioSelected, setRadioSelected] = React.useState<any>();
  return (
    <div className="collapse collapse-plus bg-base-100">
      <input type="checkbox" defaultChecked />
      <div className="collapse-title text-xl font-medium">{title}</div>
      {!data && (
        <div className="alert">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-info shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>{noDataText}</span>
        </div>
      )}
      {data && (
        <div className="collapse-content">
          <div className="overflow-x-auto">
            <table className="table table-xs">
              <thead>
                <tr>
                  <th></th>
                  {cols.map((x) => (
                    <th key={v4()}>{x}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Row */}
                {data &&
                  data.map((x) => {
                    return (
                      <tr key={v4()}>
                        <th>
                          <input
                            type="radio"
                            name={radioName}
                            checked={radioSelected == x}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setRadioSelected(x);
                                onRadioCheckedChange && onRadioCheckedChange(x);
                              }
                            }}
                            value={x}
                            className="checkbox checkbox-primary checkbox-xs"
                          />
                        </th>
                        {rowKeys.map((k) => {
                          return (
                            <td key={v4()}>
                              {!k.render ? x[k.key] : k.render(x[k.key])}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Create(props: ICreateProps) {
  const { data, status } = useSession();
  const isAuth = status == "authenticated";
  const router = useRouter();
  //Data
  const [machineListCol] = React.useState([
    "Dòng",
    "Mô tả",
    "vCPUs",
    "RAM",
    "Nền tảng",
  ]);
  const [regionsList, setRegionsList] =
    React.useState<google.cloud.compute.v1.IRegion[]>();
  const [zoneList, setZoneList] = React.useState<string[]>();

  const [machineTypeListGroups, setMachineTypeListGroups] =
    React.useState<Dictionary<protos.google.cloud.compute.v1.IMachineType[]>>();

  const [machineTypeGroupsDisplay, setMachineTypeGroupsDisplay] =
    React.useState<MachineTypeGroup[]>();

  //Input
  const [machineGroupSelected, setMachineGroupSelected] =
    React.useState<string>();
  const [machineTypeSelected, setMachineTypeSelected] = React.useState();
  const [regionSelected, setRegionSelected] = React.useState<string>();
  const [zoneSelected, setZoneSelected] = React.useState<string>();
  const clearAllMachineData = () => {
    setMachineGroupSelected(undefined);
    setMachineTypeGroupsDisplay(undefined);
    setMachineTypeSelected(undefined);
    return true;
  };
  //Handler
  const onZoneChange = (zoneName: string) => {
    clearAllMachineData();

    setZoneSelected(zoneName);
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

  const onRegionChange = (regionName: string) => {
    clearAllMachineData();

    const zoneList = regionsList
      ?.find((x) => x.name == regionName)
      ?.zones?.map((z) => z.split("/").pop() as string);

    setRegionSelected(regionName);
    setZoneList(zoneList);
    zoneList?.at(0) && onZoneChange(zoneList?.at(0) as string);
  };

  const onMachineTypeGroupChange = React.useCallback((groupName: string) => {
    console.log(
      "🚀 ~ file: page.tsx:194 ~ onMachineTypeGroupChange ~ groupName:",
      groupName
    );
    setMachineGroupSelected(groupName);
  }, []);

  const createVM = () => {};
  React.useEffect(() => {
    axios.get("/api/instance/regions").then(({ data }) => setRegionsList(data));
  }, []);

  return (
    <div className="content-center">
      <div className="form-control ml-52 mr-52 space-y-5">
        {/* Name */}
        <div>
          <label className="label">
            <span className="label-text">Tên</span>
          </label>
          <input type="text" className="input input-bordered w-full" />
        </div>

        {/* Region & Zone */}
        <div className="flex space-x-5">
          <div className="flex-1">
            <label className="label">
              <span className="label-text">Khu vực</span>
            </label>
            <select
              defaultValue={"default"}
              onChange={(e) => onRegionChange(e.target.value)}
              className="select select-bordered w-full"
            >
              <option value={"default"} disabled>
                {regionsList ? "Chưa chọn" : "Loading..."}
              </option>

              {regionsList &&
                regionsList.map((x) => {
                  return (
                    <option key={x.id as string} value={x.name as string}>
                      {x.name}
                    </option>
                  );
                })}
            </select>
          </div>

          <div className="flex-1">
            <label className="label">
              <span className="label-text">Vùng</span>
            </label>
            <select
              defaultValue={"default"}
              className="select select-bordered w-full"
              onChange={(e) => onZoneChange(e.target.value)}
            >
              {!zoneList ? (
                <option value={"default"} disabled>
                  Vui lòng chọn khu vực trước
                </option>
              ) : (
                zoneList.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

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
          noDataText={!zoneSelected ? "Vui lòng chọn vùng trước" : "Loading..."}
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
              render: (x) => x.split("-").at(0)?.toUpperCase() as string,
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
          onRadioCheckedChange={(x) => console.log(x)}
        ></CollapseTable>
        {/* Disk size */}
        <div>
          <label className="label">
            <span className="label-text">
              Kích thước ổ đĩa (Chưa bao gồm kích thước gốc cùa máy ảo )
            </span>
          </label>
          <label className="input-group">
            <input
              type="number"
              min={10}
              max={254}
              defaultValue={50}
              className="input input-bordered"
            />
            <span>GB</span>
          </label>
        </div>
        {/* Confirm */}
        <div className="space-x-4">
          <button className="btn btn-success">Khởi tạo</button>
          <button
            className="btn btn-error"
            onClick={() => router.push("/compute")}
          >
            Huỷ
          </button>
        </div>
      </div>
    </div>
  );
}
