import axios from "axios";
import { NextResponse } from "next/server";

const util = {
  timeFormat: (time: Date | any) => {
    if (!time) return "Chưa xác định";
    let date: any = time;
    if (typeof time == "string") {
      date = new Date(time);
    }
    if (String(date) == "Invalid Date") {
      return "Không xác định";
    }
    return date.toLocaleTimeString() + " " + date.toLocaleDateString();
  },
  InstanceActionHandler: async (
    action:
      | "resumeInstance"
      | "startInstance"
      | "stopInstance"
      | "suspendInstance"
      | "resetInstance"
      | "deleteInstance",
    instanceName: string,
    zone: string
  ) => {
    return await axios.get("/api/instance/control", {
      params: { action, instanceName, zone },
    });
  },
  ResponseErrorAuth: () => {
    return NextResponse.json({
      errorID: 0,
      error: "Auth error!",
    });
  },
  ResponseErrorBadRequest: () => {
    return NextResponse.json({ errorID: 1, error: "Bad request!" });
  },
  ResponseErrorAdminRole: () => {
    return NextResponse.json({ errorID: 2, error: "Admin permission!" });
  },
};
export default util;
