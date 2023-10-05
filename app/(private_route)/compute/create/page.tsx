"use client";
import * as React from "react";
import { useSession, signOut } from "next-auth/react";
import { google } from "@google-cloud/compute/build/protos/protos";
import axios from "axios";
import { protos } from "@google-cloud/compute";
import { v4 } from "uuid";
import _, { Dictionary } from "lodash";
export interface ICreateProps {}

export interface MachineTypeGroup {
  series: string;
  description: string;
  vCPUs: string;
  memory: string;
}

function CollapseTable(
  title: string,
  cols: string[],
  data: any[],
  rowkeys: string[],
  radioName: string,
  onRadioCheckedChange: (value: string) => {},
  defaultChecked?: boolean
) {
  const [radioSelected, setRadioSelected] = React.useState<string>();
  return (
    <div className="collapse bg-base-100">
      <input type="checkbox" defaultChecked />
      <div className="collapse-title text-xl font-medium">{title}</div>
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
                          checked={radioSelected == x.series}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRadioSelected(e.target.value);
                              onRadioCheckedChange(e.target.value);
                            }
                          }}
                          value={x.series}
                          className="checkbox checkbox-primary checkbox-xs"
                        />
                      </th>
                      {rowkeys.map((k) => {
                        return <td key={v4()}>{x[k]}</td>;
                      })}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Create(props: ICreateProps) {
  const { data, status } = useSession();
  const isAuth = status == "authenticated";

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
    setMachineTypeGroupsDisplay(undefined);
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
  const onMachineTypeGroupChange = (groupName: string) => {
    setMachineGroupSelected(groupName);
  };

  React.useEffect(() => {
    axios.get("/api/instance/regions").then(({ data }) => setRegionsList(data));
  }, []);

  return (
    <div className="content-center">
      <div className="form-control ml-52 mr-52 space-y-5">
        <label className="input-group input-group-vertical">
          <span>Tên</span>
          <input type="text" className="input input-bordered" />
        </label>
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
        <div className="collapse bg-base-100">
          <input type="checkbox" defaultChecked={true} />
          <div className="collapse-title text-xl font-medium">Các nhóm máy</div>
          <div className="collapse-content">
            <div className="overflow-x-auto">
              <table className="table table-xs">
                <thead>
                  <tr>
                    <th></th>
                    <th>Nhóm</th>
                    <th>vCPUs</th>
                    <th>RAM</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Row */}
                  {machineTypeGroupsDisplay &&
                    machineTypeGroupsDisplay.map((x) => {
                      return (
                        <tr key={v4()}>
                          <th>
                            <input
                              type="radio"
                              name="radio-machine-group"
                              checked={machineGroupSelected == x.series}
                              onChange={(e) =>
                                e.target.checked == true &&
                                onMachineTypeGroupChange(e.target.value)
                              }
                              value={x.series}
                              className="checkbox checkbox-primary checkbox-xs"
                            />
                          </th>
                          <td>{x.series.toUpperCase()}</td>
                          <td>{x.vCPUs}</td>
                          <td>{x.memory}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* Machine list */}
        <div className="collapse bg-base-100">
          <input type="checkbox" defaultChecked={true} />
          <div className="collapse-title text-xl font-medium">Cấu hình máy</div>
          <div className="collapse-content">
            {!machineGroupSelected && (
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
                <span>Vui lòng chọn nhóm máy trước</span>
              </div>
            )}
            {machineGroupSelected && (
              <div className="overflow-x-auto">
                <table className="table table-xs">
                  <thead>
                    <tr>
                      <th></th>
                      {machineListCol.map((x) => (
                        <th key={v4()}>{x}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Row */}

                    {machineTypeListGroups &&
                      machineTypeListGroups[machineGroupSelected].map((x) => {
                        return (
                          <tr key={x.id as string}>
                            <th>
                              <input
                                type="radio"
                                name="radio-machine-list"
                                className="checkbox checkbox-primary checkbox-xs"
                              />
                            </th>
                            <td>{x.name?.split("-").at(0)?.toUpperCase()}</td>
                            <td>{x.description}</td>
                            <td>{x.guestCpus}</td>
                            <td>
                              {x.memoryMb
                                ? (x.memoryMb / 1024).toFixed(1) + " GB"
                                : "none"}
                            </td>
                            <td>12/16/2020</td>
                          </tr>
                        );
                      })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th></th>
                      {machineListCol.map((x) => (
                        <th key={v4()}>{x}</th>
                      ))}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Confirm */}
        <div className="space-x-4">
          <button className="btn btn-success">Khởi tạo</button>
          <button className="btn btn-error">Huỷ</button>
        </div>
      </div>
    </div>
  );
}
