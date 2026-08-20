import { Card, Statistic } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";

export function StatTile({
  label,
  value,
  suffix = "",
  delta,
  deltaDir = "up",
}: {
  label: string;
  value: number;
  suffix?: string;
  delta?: string;
  deltaDir?: "up" | "down";
}) {
  return (
    <Card size="small" variant="borderless" className="dash-tile">
      <Statistic
        title={label}
        value={value}
        precision={value % 1 !== 0 ? 1 : 0}
        suffix={suffix}
      />
      {delta && (
        <div style={{ marginTop: 4, fontSize: 13, color: deltaDir === "up" ? "#5FA234" : "#C0392B" }}>
          {deltaDir === "up" ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {delta}
        </div>
      )}
    </Card>
  );
}
