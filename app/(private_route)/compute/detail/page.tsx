"use client";
import * as React from "react";
import { useSession, signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { InstanceInfo } from "@/lib/gComputeInterface";
export interface IPageProps {}

function Control() {
  return <div></div>;
}

export default function Page(props: IPageProps) {
  const sp = useSearchParams();
  const [instance, setInstance] = React.useState<InstanceInfo>();
  React.useEffect(() => {
    axios
      .get(
        `/api/instance/detail?zone=${sp.get("zone")}&instanceName=${sp.get(
          "instanceName"
        )}`
      )
      .then(({ data }) => {
        setInstance(data);
      });
  }, [sp]);
  if (!instance) return <div>Loading...</div>;

  return <div></div>;
}
