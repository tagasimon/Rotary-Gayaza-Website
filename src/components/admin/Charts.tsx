"use client";
import { useEffect, useState } from "react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

// Single-series charts use Rotary Royal Blue. The stacked chart uses a validated categorical
// order (azure / green / dark gold — CVD-checked) with a legend + 2px gaps + table view as relief.
const ROYAL = "#17458F";
const SERIES = { present: "#0067C8", guests: "#2F8F5B", excused: "#C98A0E" };
const AXIS = { stroke: "#9aa1ad", fontSize: 11, tickLine: false, axisLine: false } as const;
const GRID = <CartesianGrid stroke="#e7e2d8" vertical={false} />;
const tip = { contentStyle: { borderRadius: 6, border: "1px solid #ddd3c0", fontSize: 12, color: "#0f1b2d" }, cursor: { fill: "rgba(23,69,143,.06)" } };

function Frame({ title, desc, children, h = 260 }: { title: string; desc?: string; children: React.ReactElement; h?: number }) {
  // Charts measure the DOM, so render them only on the client (avoids hydration mismatches).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <figure className="card p-4">
      <figcaption className="mb-3"><p className="text-sm font-semibold">{title}</p>{desc && <p className="text-xs text-muted">{desc}</p>}</figcaption>
      <div style={{ height: h }}>{mounted ? <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer> : <div className="h-full animate-pulse rounded bg-paper" aria-hidden />}</div>
    </figure>
  );
}

export function AttendanceOverTime({ data }: { data: { label: string; pct: number; present: number }[] }) {
  return (
    <Frame title="Attendance over time" desc="% of available members present at each meeting">
      <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        {GRID}<XAxis dataKey="label" {...AXIS} minTickGap={24} /><YAxis {...AXIS} domain={[0, 100]} unit="%" />
        <Tooltip {...tip} formatter={(v, n) => (n === "pct" ? [`${v}%`, "Attendance"] : [String(v), String(n)])} />
        <Line type="monotone" dataKey="pct" stroke={ROYAL} strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: ROYAL }} activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }} />
      </LineChart>
    </Frame>
  );
}

export function AttendanceByMeeting({ data }: { data: { label: string; present: number; guests: number; excused: number }[] }) {
  const showExcused = data.some((d) => d.excused > 0);
  return (
    <Frame title="Attendance by fellowship" desc="Members and guests who signed in (most recent fellowships)">
      <BarChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }} barCategoryGap="18%">
        {GRID}<XAxis dataKey="label" {...AXIS} minTickGap={16} /><YAxis {...AXIS} allowDecimals={false} />
        <Tooltip {...tip} /><Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
        <Bar dataKey="present" name="Members" stackId="a" fill={SERIES.present} stroke="#fff" strokeWidth={2} />
        <Bar dataKey="guests" name="Guests" stackId="a" fill={SERIES.guests} stroke="#fff" strokeWidth={2} radius={showExcused ? 0 : [4, 4, 0, 0]} />
        {showExcused && <Bar dataKey="excused" name="Excused" stackId="a" fill={SERIES.excused} stroke="#fff" strokeWidth={2} radius={[4, 4, 0, 0]} />}
      </BarChart>
    </Frame>
  );
}

export function MemberRates({ data }: { data: { name: string; pct: number }[] }) {
  const h = Math.max(220, data.length * 24 + 30);
  return (
    <Frame title="Member attendance rate" desc="Share of available meetings each member attended" h={h}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }} barCategoryGap="22%">
        <CartesianGrid stroke="#e7e2d8" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} unit="%" {...AXIS} /><YAxis type="category" dataKey="name" width={150} {...AXIS} tick={{ fontSize: 11, fill: "#2b3648" }} />
        <Tooltip {...tip} formatter={(v) => [`${v}%`, "Attendance"]} />
        <Bar dataKey="pct" fill={ROYAL} radius={[0, 4, 4, 0]} />
      </BarChart>
    </Frame>
  );
}

export function Monthly({ data }: { data: { month: string; pct: number }[] }) {
  return (
    <Frame title="Monthly attendance" desc="Average % present per month">
      <BarChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }} barCategoryGap="24%">
        {GRID}<XAxis dataKey="month" {...AXIS} /><YAxis {...AXIS} domain={[0, 100]} unit="%" />
        <Tooltip {...tip} formatter={(v) => [`${v}%`, "Attendance"]} />
        <Bar dataKey="pct" fill={ROYAL} radius={[4, 4, 0, 0]} />
      </BarChart>
    </Frame>
  );
}

export function ByRotaryYear({ data }: { data: { ry: string; pct: number; meetings: number }[] }) {
  return (
    <Frame title="Attendance by Rotary year" desc="1 July – 30 June">
      <BarChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }} barCategoryGap="35%">
        {GRID}<XAxis dataKey="ry" {...AXIS} /><YAxis {...AXIS} domain={[0, 100]} unit="%" />
        <Tooltip {...tip} formatter={(v, n) => (n === "pct" ? [`${v}%`, "Attendance"] : [String(v), String(n)])} />
        <Bar dataKey="pct" fill={ROYAL} radius={[4, 4, 0, 0]} label={{ position: "top", fontSize: 11, fill: "#2b3648", formatter: (v: unknown) => `${v}%` }} />
      </BarChart>
    </Frame>
  );
}
