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
};
export default util;
