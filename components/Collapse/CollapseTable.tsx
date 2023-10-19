import * as React from "react";
import { v4 } from "uuid";

export interface ICollapseTableProps {}

export function CollapseTable({
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
