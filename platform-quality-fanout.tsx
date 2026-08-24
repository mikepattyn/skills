import { useMemo, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Standalone diagram of `/platform-quality`.
 * No Cursor canvas runtime — drop this file into any React tree.
 */

type WaveId = 0 | 1 | 2 | 3;
type AgentKind = "owned" | "gitlink" | "stem";

type Wave = {
  id: WaveId;
  step: string;
  label: string;
  short: string;
  skills: string[];
  why: string;
  agents: Array<{ id: string; kind: AgentKind }>;
  more: number;
  skip: string;
};

const WAVES: Wave[] = [
  {
    id: 0,
    step: "page-accessibility",
    label: "Page accessibility",
    short: "A11y",
    skills: ["frontend-page-accessibility"],
    why: "Audit markup first, while it is still the markup you wrote.",
    agents: [
      { id: "kapsalon", kind: "owned" },
      { id: "lumen", kind: "owned" },
      { id: "canvas", kind: "gitlink" },
    ],
    more: 9,
    skip: "theming",
  },
  {
    id: 1,
    step: "convert",
    label: "Scripts to Node",
    short: "Convert",
    skills: ["scripts-to-node"],
    why: "New .mjs files must exist before later waves can lint and format them. Shells stay wrappers.",
    agents: [
      { id: "build-lambda", kind: "stem" },
      { id: "app-fanout", kind: "stem" },
      { id: "sync-fish-backend", kind: "stem" },
    ],
    more: 20,
    skip: "already-node",
  },
  {
    id: 2,
    step: "lint",
    label: "Lint",
    short: "Lint",
    skills: ["frontend-lint", "backend-lint", "platform-lint"],
    why: "After convert, and never in the same launch as format — they would fight over the same files.",
    agents: [
      { id: "mikepattyn", kind: "owned" },
      { id: "kapsalon-api", kind: "owned" },
      { id: "cdk", kind: "owned" },
    ],
    more: 20,
    skip: "email",
  },
  {
    id: 3,
    step: "format",
    label: "Format",
    short: "Format",
    skills: ["frontend-format", "backend-format", "platform-format"],
    why: "Last, so lint is not rewriting what format just cleaned. Same 40-agent cap, shared across nested skills.",
    agents: [
      { id: "lumen", kind: "owned" },
      { id: "themes", kind: "owned" },
      { id: "authress-flutter", kind: "gitlink" },
    ],
    more: 20,
    skip: "e2e",
  },
];

type Theme = {
  text: string;
  muted: string;
  faint: string;
  surface: string;
  elevated: string;
  stroke: string;
  accent: string;
  onAccent: string;
};

function useTheme(): Theme {
  return {
    text: "CanvasText",
    muted: "color-mix(in srgb, CanvasText 62%, Canvas)",
    faint: "color-mix(in srgb, CanvasText 42%, Canvas)",
    surface: "Canvas",
    elevated: "color-mix(in srgb, CanvasText 6%, Canvas)",
    stroke: "color-mix(in srgb, CanvasText 18%, Canvas)",
    accent: "LinkText",
    onAccent: "Canvas",
  };
}

type LaidNode = { id: string; x: number; y: number; title: string; subtitle: string; role: "accent" | "plain" | "muted" | "agent" };
type LaidEdge = { from: string; to: string; x1: number; y1: number; x2: number; y2: number; dashed?: boolean };

function nodeCopy(id: string, wave: Wave): Pick<LaidNode, "title" | "subtitle" | "role"> {
  const agent = wave.agents.find((item) => item.id === id);
  if (id === "parent") return { title: "Parent", subtitle: "stays on baseBranch", role: "accent" };
  if (id === "plan") return { title: `Plan wave ${wave.id}`, subtitle: "diff last-run → tip", role: "plain" };
  if (id === "skip") return { title: "Skip", subtitle: wave.skip, role: "muted" };
  if (id === "merge") return { title: "Merge · close · record", subtitle: "back to baseBranch", role: "plain" };
  if (id === "next") {
    return { title: "Re-plan", subtitle: wave.id < 3 ? `wave ${wave.id + 1}` : "summarize", role: "accent" };
  }
  if (agent) {
    const kind =
      agent.kind === "gitlink" ? "gitlink clone" : agent.kind === "stem" ? "script stem" : "owned tree";
    return { title: agent.id, subtitle: kind, role: "agent" };
  }
  return { title: id, subtitle: "", role: "plain" };
}

function layoutFanout(wave: Wave, nodeW: number, nodeH: number) {
  const rankGap = 56;
  const nodeGap = 18;
  const pad = 16;
  const agentIds = wave.agents.map((agent) => agent.id);
  const midIds = ["skip", ...agentIds];
  const midWidth = midIds.length * nodeW + (midIds.length - 1) * nodeGap;
  const width = pad * 2 + Math.max(nodeW, midWidth);
  const ranks: string[][] = [["parent"], ["plan"], midIds, ["merge"], ["next"]];
  const nodes: LaidNode[] = [];
  const byId = new Map<string, LaidNode>();

  ranks.forEach((ids, rank) => {
    const rowWidth = ids.length * nodeW + (ids.length - 1) * nodeGap;
    let x = (width - rowWidth) / 2;
    const y = pad + rank * (nodeH + rankGap);
    for (const id of ids) {
      const node: LaidNode = { id, x, y, ...nodeCopy(id, wave) };
      nodes.push(node);
      byId.set(id, node);
      x += nodeW + nodeGap;
    }
  });

  const edges: LaidEdge[] = [];
  const link = (from: string, to: string, dashed = false) => {
    const a = byId.get(from);
    const b = byId.get(to);
    if (!a || !b) return;
    edges.push({
      from,
      to,
      x1: a.x + nodeW / 2,
      y1: a.y + nodeH,
      x2: b.x + nodeW / 2,
      y2: b.y,
      dashed,
    });
  };
  link("parent", "plan");
  link("plan", "skip", true);
  for (const id of agentIds) {
    link("plan", id);
    link(id, "merge");
  }
  link("merge", "next");

  const height = pad * 2 + ranks.length * nodeH + (ranks.length - 1) * rankGap;
  return { nodes, edges, width, height };
}

function fillFor(role: LaidNode["role"], theme: Theme) {
  if (role === "accent") return theme.accent;
  if (role === "muted") return "color-mix(in srgb, CanvasText 8%, Canvas)";
  if (role === "agent") return theme.elevated;
  return "color-mix(in srgb, CanvasText 10%, Canvas)";
}

function textFor(role: LaidNode["role"], theme: Theme, subtitle = false) {
  if (role === "accent") return theme.onAccent;
  if (role === "muted") return theme.faint;
  return subtitle ? theme.muted : theme.text;
}

const page: CSSProperties = {
  fontFamily: "system-ui, sans-serif",
  color: "CanvasText",
  background: "Canvas",
  padding: 24,
  maxWidth: 960,
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: 20,
};
const row: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" };
const muted: CSSProperties = { color: "color-mix(in srgb, CanvasText 62%, Canvas)", fontSize: 13, margin: 0, lineHeight: 1.45 };
const body: CSSProperties = { margin: 0, lineHeight: 1.5, fontSize: 15 };
const h1: CSSProperties = { fontSize: 24, fontWeight: 650, margin: 0 };
const h2: CSSProperties = { fontSize: 18, fontWeight: 650, margin: 0 };
const h3: CSSProperties = { fontSize: 16, fontWeight: 650, margin: 0 };
const tableStyle: CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 13 };
const thtd: CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: "1px solid color-mix(in srgb, CanvasText 14%, Canvas)",
  verticalAlign: "top",
};

function Pill({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        fontSize: 12,
        padding: "2px 8px",
        border: "1px solid color-mix(in srgb, CanvasText 18%, Canvas)",
        borderRadius: 999,
      }}
    >
      {children}
    </span>
  );
}

function WavePipeline({
  selected,
  onSelect,
  theme,
}: {
  selected: WaveId;
  onSelect: (id: WaveId) => void;
  theme: Theme;
}) {
  const boxW = 168;
  const boxH = 56;
  const gap = 36;
  const pad = 8;
  const width = pad * 2 + WAVES.length * boxW + (WAVES.length - 1) * gap;
  const height = boxH + 16;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Four sequential waves">
      <title>platform-quality runs four waves in order</title>
      {WAVES.map((wave, i) => {
        const x = pad + i * (boxW + gap);
        const y = 4;
        const active = wave.id === selected;
        return (
          <g key={wave.id}>
            {i < WAVES.length - 1 ? (
              <line
                x1={x + boxW + 4}
                y1={y + boxH / 2}
                x2={x + boxW + gap - 4}
                y2={y + boxH / 2}
                stroke={theme.stroke}
                strokeWidth={1.5}
              />
            ) : null}
            <rect
              x={x}
              y={y}
              width={boxW}
              height={boxH}
              rx={6}
              fill={active ? theme.accent : theme.elevated}
              stroke={active ? theme.accent : theme.stroke}
              style={{ cursor: "pointer" }}
              onClick={() => onSelect(wave.id)}
            />
            <text
              x={x + 14}
              y={y + 22}
              fill={active ? theme.onAccent : theme.text}
              fontSize={13}
              fontWeight={650}
              style={{ cursor: "pointer" }}
              onClick={() => onSelect(wave.id)}
            >
              {wave.id} · {wave.short}
            </text>
            <text
              x={x + 14}
              y={y + 40}
              fill={active ? theme.onAccent : theme.muted}
              fontSize={11}
              style={{ cursor: "pointer" }}
              onClick={() => onSelect(wave.id)}
            >
              then merge, re-plan
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function FanoutDag({ wave, theme }: { wave: Wave; theme: Theme }) {
  const nodeW = 168;
  const nodeH = 48;
  const layout = useMemo(() => layoutFanout(wave, nodeW, nodeH), [wave, nodeW, nodeH]);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      role="img"
      aria-label={`Fan-out for wave ${wave.id}: ${wave.label}`}
    >
      <title>
        Wave {wave.id} fan-out for {wave.label}
      </title>
      {layout.edges.map((edge) => {
        const midY = (edge.y1 + edge.y2) / 2;
        return (
          <path
            key={`${edge.from}-${edge.to}`}
            d={`M ${edge.x1} ${edge.y1} C ${edge.x1} ${midY}, ${edge.x2} ${midY}, ${edge.x2} ${edge.y2}`}
            fill="none"
            stroke={edge.dashed ? theme.faint : theme.stroke}
            strokeWidth={1.25}
            strokeDasharray={edge.dashed ? "4 3" : undefined}
          />
        );
      })}
      {layout.nodes.map((node) => (
        <g key={node.id}>
          <rect
            x={node.x}
            y={node.y}
            width={nodeW}
            height={nodeH}
            rx={6}
            fill={fillFor(node.role, theme)}
            stroke={theme.stroke}
          />
          <text
            x={node.x + nodeW / 2}
            y={node.y + 20}
            textAnchor="middle"
            fill={textFor(node.role, theme)}
            fontSize={12}
            fontWeight={650}
          >
            {node.title}
          </text>
          <text
            x={node.x + nodeW / 2}
            y={node.y + 36}
            textAnchor="middle"
            fill={textFor(node.role, theme, true)}
            fontSize={10}
          >
            {node.subtitle}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function PlatformQualityFanout() {
  const theme = useTheme();
  const [waveId, setWaveId] = useState<WaveId>(0);
  const wave = WAVES[waveId] ?? WAVES[0];
  const nextWave = wave.id < 3 ? wave.id + 1 : 0;

  return (
    <div style={page}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1 style={h1}>/platform-quality fan-out</h1>
        <p style={body}>
          One parent skill. It does not audit, convert, lint, or format a tree itself. It plans a wave,
          launches one child agent per dirty tree (cap 40), merges those branches back into the current
          local branch, closes the worktrees, records last-runs, then plans the next wave.
        </p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
        {[
          ["4", "Sequential waves"],
          ["40", "Agents max per wave"],
          ["1", "Step per child"],
          ["0", "Pushes from the parent"],
        ].map(([value, label]) => (
          <div key={label}>
            <div style={{ fontSize: 22, fontWeight: 650 }}>{value}</div>
            <div style={muted}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2 style={h2}>Waves never share a launch</h2>
        <p style={muted}>Click a wave to see how that step fans out. Engine: scripts/app-fanout.mjs</p>
        <WavePipeline selected={wave.id} onSelect={setWaveId} theme={theme} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={row}>
          <h2 style={h2}>
            Wave {wave.id} · {wave.label}
          </h2>
          {wave.skills.map((skill) => (
            <Pill key={skill}>{skill}</Pill>
          ))}
        </div>
        <p style={body}>{wave.why}</p>
        <p style={muted}>
          Example agents below. A real plan only launches trees with a diff since last-run; empty
          launchNow skips the wave. Plus {wave.more} more enrolled trees in this cohort, still under
          the shared 40 cap.
        </p>
        <FanoutDag wave={wave} theme={theme} />
        <p style={muted}>
          Solid arrows are the happy path. The dashed Skip node is a no-diff tree — it is not launched.
          Children work in isolated git worktrees. The parent never checks out a child branch.
        </p>
      </div>

      <hr style={{ border: 0, borderTop: "1px solid color-mix(in srgb, CanvasText 14%, Canvas)", margin: 0 }} />

      <h2 style={h2}>After the children return</h2>
      <p style={body}>
        Owned trees merge worktreeBranch into baseBranch. Gitlink rows only bump the pointer to the
        clone’s new SHA. Then the parent closes leftover checkouts and records that nested skill’s
        last-runs.json. Failures are not recorded. Then plan --skill platform-quality --wave {nextWave}{" "}
        so the next wave diffs against the new tip.
      </p>

      <h3 style={h3}>Why this order</h3>
      <table style={tableStyle}>
        <thead>
          <tr>
            {["Wave", "Runs", "Why"].map((h) => (
              <th key={h} style={thtd}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {WAVES.map((item) => (
            <tr key={item.id}>
              <td style={thtd}>{item.id}</td>
              <td style={thtd}>{item.skills.join(", ")}</td>
              <td style={thtd}>{item.why}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={h3}>Discovered GitHub workflows</h3>
      <p style={muted}>
        Only root .github/workflows files matching deploy-&lt;id&gt;-frontend.yml,
        deploy-&lt;id&gt;-content.yml, or deploy-&lt;id&gt;-backend.yml, with an apps/ path filter.
      </p>
      <table style={tableStyle}>
        <thead>
          <tr>
            {["Cohort", "Workflow", "Id"].map((h) => (
              <th key={h} style={thtd}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            ["Frontend", "deploy-alienbutnice-content.yml", "alienbutnice"],
            ["Frontend", "deploy-commerce-frontend.yml", "commerce"],
            ["Frontend", "deploy-dashboard-content.yml", "dashboard"],
            ["Frontend", "deploy-fish-frontend.yml", "fish"],
            ["Frontend", "deploy-kapsalon-frontend.yml", "kapsalon"],
            ["Frontend", "deploy-lumen-content.yml", "lumen"],
            ["Frontend", "deploy-mikepattyn-content.yml", "mikepattyn"],
            ["Frontend", "deploy-pattynologies-content.yml", "pattynologies"],
            ["Frontend", "deploy-theming-content.yml", "theming"],
            ["Frontend", "deploy-viewports-content.yml", "viewports"],
            ["Backend", "deploy-commerce-backend.yml", "commerce"],
            ["Backend", "deploy-fish-backend.yml", "fish"],
            ["Backend", "deploy-kapsalon-backend.yml", "kapsalon"],
            ["Backend", "deploy-mikepattyn-backend.yml", "mikepattyn"],
          ].map((rowCells) => (
            <tr key={rowCells[1]}>
              {rowCells.map((cell) => (
                <td key={cell} style={thtd}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p style={muted}>
        Gitlinks (not workflows): canvas, ondernemings-plan. Platform trees and script stems are not
        discovered from YAML. deploy-dashboard-backend.yml matches the backend name pattern but is
        skipped (no apps/ path); that lambda lives in the platform cdk tree.
      </p>

      <aside
        style={{
          padding: 12,
          border: "1px solid color-mix(in srgb, CanvasText 18%, Canvas)",
          borderRadius: 8,
          fontSize: 14,
          lineHeight: 1.45,
        }}
      >
        <strong>Same-tree lint and format must not run in parallel.</strong> Convert before lint/format
        so new .mjs files get both. Shared files race if every child edits the same package.json. Mapbox
        and Flyingdarts stay out. The parent never pushes.
      </aside>
    </div>
  );
}
