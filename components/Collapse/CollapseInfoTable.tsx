import { v4 } from "uuid";

export default function CollapseInfoSide({
  title,
  data,
}: {
  title: string;
  data: { label: string; value: any }[];
}) {
  return (
    <div className="collapse collapse-arrow bg-base-200 rounded-none">
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
