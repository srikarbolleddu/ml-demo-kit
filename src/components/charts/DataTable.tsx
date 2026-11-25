import { formatValue } from "../../format";
import type { TableChartSpec } from "../../types";

export function DataTable({ spec }: { spec: TableChartSpec }) {
  return (
    <div className="mdk-chart mdk-table-wrap">
      <table className="mdk-table">
        <thead>
          <tr>
            {spec.columns.map((c) => (
              <th key={c.key} scope="col">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {spec.rows.map((row, i) => {
            const highlighted = spec.highlight && row[spec.highlight.key] === spec.highlight.value;
            return (
              <tr key={i} className={highlighted ? "mdk-row--highlight" : undefined}>
                {spec.columns.map((c) => {
                  const v = row[c.key];
                  return (
                    <td key={c.key}>
                      {typeof v === "number" ? formatValue(v, c.format) : (v ?? "")}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
