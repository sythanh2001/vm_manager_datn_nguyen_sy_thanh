import axios from "axios";

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
};
export default util;
