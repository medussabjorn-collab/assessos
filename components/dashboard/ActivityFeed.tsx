import { Timeline } from "antd";

const EVENTS = [
  { text: "Ava Meridian scored 88.9 on Staff Engineer", time: "2m ago" },
  { text: "Jordan Blake advanced to Decide", time: "14m ago" },
  { text: "New assessment built for VP of Sales", time: "41m ago" },
  { text: "Sam Rivera flagged for panel review", time: "1h ago" },
];

export function ActivityFeed() {
  return (
    <Timeline
      items={EVENTS.map((e) => ({
        children: (
          <span className="da-row">
            <span className="da-text">{e.text}</span>
            <span className="da-time">{e.time}</span>
          </span>
        ),
      }))}
    />
  );
}
