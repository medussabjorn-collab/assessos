"use client";

import { Tabs } from "antd";
import { AntdShell } from "./AntdShell";
import { CandidateTable } from "./CandidateTable";
import { BarChart } from "./BarChart";
import { FunnelChart } from "./FunnelChart";
import { StatTile } from "./StatTile";
import { ActivityFeed } from "./ActivityFeed";

const PATHS: Record<string, string> = {
  pipeline: "prelim / candidates",
  scorecard: "prelim / candidates / ava / scorecard",
  analytics: "prelim / reports / overview",
};

function PipelinePanel() {
  return (
    <>
      <div className="dash-chrome">
        <div className="dash-bar">
          <div className="dots"><i /><i /><i /></div>
          <span className="path">{PATHS.pipeline}</span>
        </div>
        <div className="dash-body">
          <div className="tour-stats">
            <StatTile label="Open requisitions" value={24} />
            <StatTile label="In assessment" value={312} />
            <StatTile label="Avg. score" value={76.8} />
          </div>
          <CandidateTable />
        </div>
      </div>
      <div className="dash-chrome" style={{ marginTop: "1rem" }}>
        <div className="dash-bar">
          <div className="dots"><i /><i /><i /></div>
          <span className="path">prelim / activity</span>
        </div>
        <div className="dash-body">
          <ActivityFeed />
        </div>
      </div>
    </>
  );
}

function ScorecardPanel() {
  return (
    <div className="dash-chrome">
      <div className="dash-bar">
        <div className="dots"><i /><i /><i /></div>
        <span className="path">{PATHS.scorecard}</span>
      </div>
      <div className="dash-body">
        <div className="tour-scorecard">
          <div className="cand" style={{ marginBottom: "1.1rem" }}>
            <div className="who">
              <div className="av">AM</div>
              <div>
                <div className="nm">Ava Meridian</div>
                <div className="role">STAFF ENGINEER · REQ-4471</div>
              </div>
            </div>
            <span className="verdict">STRONG HIRE</span>
          </div>
          <div className="meters" id="tour-meters">
            <div className="meter"><span className="mlbl">System Design</span><div className="track"><div className="fill" style={{ transform: "scaleX(0.91)" }} /></div><span className="val tnum">91</span></div>
            <div className="meter"><span className="mlbl">Coding</span><div className="track"><div className="fill" style={{ transform: "scaleX(0.88)" }} /></div><span className="val tnum">88</span></div>
            <div className="meter"><span className="mlbl">Leadership</span><div className="track"><div className="fill" style={{ transform: "scaleX(0.76)" }} /></div><span className="val tnum">76</span></div>
            <div className="meter"><span className="mlbl">Communication</span><div className="track"><div className="fill" style={{ transform: "scaleX(0.82)" }} /></div><span className="val tnum">82</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsPanel() {
  return (
    <div className="dash-chrome">
      <div className="dash-bar">
        <div className="dots"><i /><i /><i /></div>
        <span className="path">{PATHS.analytics}</span>
      </div>
      <div className="dash-body">
        <div className="analytics-grid">
          <BarChart
            data={[
              { label: "Mar", value: 82 },
              { label: "Apr", value: 94 },
              { label: "May", value: 88 },
              { label: "Jun", value: 121 },
              { label: "Jul", value: 134 },
            ]}
            unit="K"
          />
          <FunnelChart
            stages={[
              { label: "Applied", value: 4200, display: "4,200" },
              { label: "Assessed", value: 2850, display: "2,850" },
              { label: "Shortlisted", value: 640, display: "640" },
              { label: "Hired", value: 118, display: "118" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

export function ProductTourViewer() {
  return (
    <AntdShell>
      <Tabs
        defaultActiveKey="pipeline"
        items={[
          { key: "pipeline", label: "Candidate Pipeline", children: <PipelinePanel /> },
          { key: "scorecard", label: "Scorecard", children: <ScorecardPanel /> },
          { key: "analytics", label: "Analytics", children: <AnalyticsPanel /> },
        ]}
      />
    </AntdShell>
  );
}
