'use client';
import presentation from './charts-presentation.module.css';

import Link from '@/components/app-link';
import { formatDate } from '@/lib/format-date';
import { showAxisLabel } from '@/lib/analytics-derive';
import {
  chartFillForTone,
  chartFillMap,
  colorVarForTone,
} from '@/lib/status-tone';
import { PageFrame, EmptyState, SectionHeader } from '@/components/atoms';
import { BarChart3 } from 'lucide-react';

interface AnalyticsChartsProps {
  contractsByStatus: Record<string, number>;
  dayLabels: string[];
  dayCounts: number[];
  agentStats: { name: string; count: number }[];
  avgTurns: number;
  totalContracts: number;
  totalMessages: number;
  days: number;
  // New props
  activeProjects: number;
  tasksDone: number;
  avgResponseTimeHours: number | null;
  webhooksFired: number;
  contractDayCounts: number[];
  tasksByStatus: Record<string, number>;
  topContractsByMessages: { title: string; count: number }[];
  hourlyMessageCounts: number[];
  allTimeTasks: number;
  allTimeContracts: number;
}

// The donuts used to carry their own status→colour maps, and they disagreed
// with every pill in the product: `active` was mint here and amber everywhere
// else, `expired` was amber here and rose everywhere else. Both now come from
// status-tone.ts. Where two statuses legitimately share a tone under the rule
// (`proposed`/`active` are both amber, `rejected`/`expired` both rose),
// chartFillMap shades the second so the slices stay tellable apart without the
// hue lying about what the state means.
const contractStatusFills = chartFillMap('contract');
const taskStatusFills = chartFillMap('task');
const unknownStatusFill = chartFillForTone('neutral');

// Agent/contract rankings are not statuses — the colour only separates
// neighbouring bars — so this stays a plain rotation.
const barColorVars = [
  colorVarForTone('mint'),
  colorVarForTone('peri'),
  colorVarForTone('amber'),
  colorVarForTone('rose'),
  chartFillForTone('mint', 1),
  chartFillForTone('amber', 1),
];

function buildConicGradient(
  data: Record<string, number>,
  colorMap: Record<string, string>,
): string {
  const total = Object.values(data).reduce((s, v) => s + v, 0);
  if (total === 0) return `conic-gradient(var(--line-1) 0deg 360deg)`;

  const segments: string[] = [];
  let currentDeg = 0;

  for (const [status, count] of Object.entries(data)) {
    const deg = (count / total) * 360;
    const color = colorMap[status] || unknownStatusFill;
    segments.push(`${color} ${currentDeg}deg ${currentDeg + deg}deg`);
    currentDeg += deg;
  }

  return `conic-gradient(${segments.join(', ')})`;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return formatDate(d);
}

// Axis labels drop the year that formatDate() includes: the window is 90 days at
// most, so the year is never in question and costs roughly half the label width.
function formatAxisDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function AnalyticsCharts({
  contractsByStatus,
  dayLabels,
  dayCounts,
  agentStats,
  avgTurns,
  totalContracts,
  totalMessages,
  days,
  activeProjects,
  tasksDone,
  avgResponseTimeHours,
  webhooksFired,
  contractDayCounts,
  tasksByStatus,
  topContractsByMessages,
  hourlyMessageCounts,
  allTimeTasks,
  allTimeContracts,
}: AnalyticsChartsProps) {
  const maxDayCount = Math.max(...dayCounts, 1);
  const maxAgentCount =
    agentStats.length > 0 ? Math.max(...agentStats.map((a) => a.count), 1) : 1;
  const totalStatusCount = Object.values(contractsByStatus).reduce(
    (s, v) => s + v,
    0,
  );
  const totalTaskStatusCount = Object.values(tasksByStatus).reduce(
    (s, v) => s + v,
    0,
  );
  const maxContractDayCount = Math.max(...contractDayCounts, 1);
  const maxTopContractMessages =
    topContractsByMessages.length > 0
      ? Math.max(...topContractsByMessages.map((c) => c.count), 1)
      : 1;
  const maxHourlyCount = Math.max(...hourlyMessageCounts, 1);
  const dayTabs = [7, 14, 30, 90];

  return (
    <PageFrame>
      {/* Header */}
      <SectionHeader
        title={<>Analytics</>}
        eyebrow={<>Insights</>}
        sub={
          <>
            <p
              className={['dim text-sm', presentation.copy2]
                .filter(Boolean)
                .join(' ')}
            >
              Platform activity overview
            </p>
          </>
        }
        right={
          <>
            <div className="seg">
              {dayTabs.map((d) => (
                <Link
                  key={d}
                  href={`/analytics?days=${d}`}
                  className={days === d ? 'active' : ''}
                  aria-current={days === d ? 'page' : undefined}
                >
                  {d}d
                </Link>
              ))}
            </div>
          </>
        }
      />

      {/* Summary Cards — Row 1 */}
      <div className={presentation.grid1}>
        {[
          {
            label: 'Contracts Created',
            value: totalContracts,
            suffix: ` (${days}d)`,
            accentVar: '--peri',
          },
          {
            label: 'Messages',
            value: totalMessages,
            suffix: ` (${days}d)`,
            accentVar: '--mint',
          },
          {
            label: 'Avg Turns',
            value: avgTurns,
            suffix: ` (${days}d)`,
            accentVar: '--mint',
          },
          {
            label: 'Active Agents',
            value: agentStats.length,
            suffix: ` (${days}d)`,
            accentVar: '--amber',
          },
        ].map((card) => (
          <div
            key={card.label}
            className={['card', presentation.detail2].filter(Boolean).join(' ')}
          >
            <p
              className={['upper dim', presentation.copy3]
                .filter(Boolean)
                .join(' ')}
            >
              {card.label}
            </p>
            <p
              className="mono num text-xl"
              style={{ fontWeight: 700, color: `var(${card.accentVar})` }}
            >
              {card.value}
              {card.suffix && (
                <span
                  className={['dim text-2xs', presentation.detail3]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {card.suffix}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Summary Cards — Row 2 */}
      <div className={presentation.grid2}>
        {[
          {
            label: 'Active Projects',
            value: activeProjects,
            suffix: ` (${days}d)`,
            accentVar: '--mint',
          },
          {
            label: 'Tasks Done',
            value: tasksDone,
            suffix: ` (${days}d)`,
            accentVar: '--mint',
          },
          {
            label: 'Avg Response Time',
            value:
              avgResponseTimeHours !== null ? `${avgResponseTimeHours}h` : '—',
            suffix: ` (${days}d)`,
            accentVar: '--peri',
          },
          {
            label: 'Webhooks Fired',
            value: webhooksFired,
            suffix: ` (${days}d)`,
            accentVar: '--rose',
          },
        ].map((card) => (
          <div
            key={card.label}
            className={['card', presentation.detail2].filter(Boolean).join(' ')}
          >
            <p
              className={['upper dim', presentation.copy3]
                .filter(Boolean)
                .join(' ')}
            >
              {card.label}
            </p>
            <p
              className="mono num text-xl"
              style={{ fontWeight: 700, color: `var(${card.accentVar})` }}
            >
              {card.value}
              {card.suffix && (
                <span
                  className={['dim text-2xs', presentation.detail3]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {card.suffix}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>

      <div className={presentation.grid3}>
        {/* Donut Chart — Contracts by Status */}
        <div
          className={['card', presentation.detail4].filter(Boolean).join(' ')}
        >
          <h2
            className={['h3', presentation.section2].filter(Boolean).join(' ')}
          >
            Contracts by Status
          </h2>
          <p
            className={['dim text-2xs', presentation.copy4]
              .filter(Boolean)
              .join(' ')}
          >
            Created in last {days} days
          </p>

          {totalStatusCount === 0 ? (
            <div className={presentation.detail5}>
              <p className="dim text-sm">No contracts created in this period</p>
              {allTimeContracts > 0 && (
                <p
                  className={['dim text-2xs', presentation.copy5]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {allTimeContracts} all time
                </p>
              )}
            </div>
          ) : (
            <div className="row gap-6">
              {/* Donut */}
              <div className={presentation.detail6}>
                <div
                  style={{
                    width: '144px',
                    height: '144px',
                    borderRadius: '50%',
                    background: buildConicGradient(
                      contractsByStatus,
                      contractStatusFills,
                    ),
                    mask: 'radial-gradient(circle at center, transparent 42px, black 43px)',
                    WebkitMask:
                      'radial-gradient(circle at center, transparent 42px, black 43px)',
                  }}
                />
                <div className={presentation.row1}>
                  <div className={presentation.detail7}>
                    <span
                      className={['mono num text-lg', presentation.ink1]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {totalStatusCount}
                    </span>
                    <p
                      className={['upper dim', presentation.copy6]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      Total
                    </p>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div
                className={['col gap-2', presentation.detail8]
                  .filter(Boolean)
                  .join(' ')}
              >
                {Object.entries(contractsByStatus).map(([status, count]) => (
                  <div key={status} className="row gap-2">
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '2px',
                        flexShrink: 0,
                        background:
                          contractStatusFills[status] || unknownStatusFill,
                      }}
                    />
                    <span
                      className={['text-2xs', presentation.ink2]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {status}
                    </span>
                    <span className="mono num dim text-2xs">{count}</span>
                    <span
                      className={['mono num text-2xs', presentation.ink3]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {totalStatusCount > 0
                        ? Math.round((count / totalStatusCount) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bar Chart — Per Agent Messages */}
        <div
          className={['card', presentation.detail4].filter(Boolean).join(' ')}
        >
          <h2
            className={['h3', presentation.section2].filter(Boolean).join(' ')}
          >
            Messages per Agent
          </h2>
          <p
            className={['dim text-2xs', presentation.copy4]
              .filter(Boolean)
              .join(' ')}
          >
            Last {days} days
          </p>

          {agentStats.length === 0 ? (
            <EmptyState
              icon={<BarChart3 size={20} />}
              title="No messages in this period"
              hint="Widen the window above to cover a period that has traffic."
            />
          ) : (
            <div className="col gap-2">
              {agentStats.map((agent, idx) => (
                <div key={agent.name}>
                  <div
                    className={['row gap-2', presentation.section3]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <span
                      className={['text-2xs', presentation.ink4]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {agent.name}
                    </span>
                    <div className={presentation.detail9}>
                      <div
                        style={{
                          height: '100%',
                          borderRadius: 'var(--radius-1)',
                          transition: 'width 0.7s ease-out',
                          width: `${Math.max(4, (agent.count / maxAgentCount) * 100)}%`,
                          background: barColorVars[idx % barColorVars.length],
                          opacity: 0.6,
                        }}
                      />
                    </div>
                    <span
                      className={[
                        'mono num dim text-2xs',
                        presentation.detail10,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {agent.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bar Chart — Messages per Day */}
        <div
          className={['card md:col-span-2', presentation.detail4]
            .filter(Boolean)
            .join(' ')}
        >
          <h2
            className={['h3', presentation.section2].filter(Boolean).join(' ')}
          >
            Messages per Day
          </h2>
          <p
            className={['dim text-2xs', presentation.copy4]
              .filter(Boolean)
              .join(' ')}
          >
            Last {days} days
          </p>

          <div className={presentation.row2}>
            {dayLabels.map((label, idx) => {
              const count = dayCounts[idx];
              const heightPct =
                maxDayCount > 0 ? (count / maxDayCount) * 100 : 0;
              const showLabel = showAxisLabel(idx, dayLabels.length, days);
              return (
                <div
                  key={label}
                  className={['group', presentation.stack1]
                    .filter(Boolean)
                    .join(' ')}
                  title={`${formatShortDate(label)}: ${count}`}
                >
                  <span
                    className={['mono num text-2xs', presentation.ink5]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {count}
                  </span>
                  <div className={presentation.detail11}>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        width: '100%',
                        borderRadius: '2px 2px 0 0',
                        transition: 'height 0.5s ease-out',
                        height: `${Math.max(heightPct > 0 ? 2 : 0, heightPct)}%`,
                        background: 'var(--mint)',
                        opacity: 0.55,
                      }}
                    />
                  </div>
                  <div
                    className={['mono num text-2xs', presentation.ink6]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {showLabel ? formatAxisDate(label) : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bar Chart — Contracts Created per Day */}
        <div
          className={['card md:col-span-2', presentation.detail4]
            .filter(Boolean)
            .join(' ')}
        >
          <h2
            className={['h3', presentation.section2].filter(Boolean).join(' ')}
          >
            Contracts Created per Day
          </h2>
          <p
            className={['dim text-2xs', presentation.copy4]
              .filter(Boolean)
              .join(' ')}
          >
            Last {days} days
          </p>

          <div className={presentation.row2}>
            {dayLabels.map((label, idx) => {
              const count = contractDayCounts[idx];
              const heightPct =
                maxContractDayCount > 0
                  ? (count / maxContractDayCount) * 100
                  : 0;
              const showLabel = showAxisLabel(idx, dayLabels.length, days);
              return (
                <div
                  key={label}
                  className={['group', presentation.stack1]
                    .filter(Boolean)
                    .join(' ')}
                  title={`${formatShortDate(label)}: ${count}`}
                >
                  <span
                    className={['mono num text-2xs', presentation.ink5]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {count}
                  </span>
                  <div className={presentation.detail11}>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        width: '100%',
                        borderRadius: '2px 2px 0 0',
                        transition: 'height 0.5s ease-out',
                        height: `${Math.max(heightPct > 0 ? 2 : 0, heightPct)}%`,
                        background: 'var(--peri)',
                        opacity: 0.55,
                      }}
                    />
                  </div>
                  <div
                    className={['mono num text-2xs', presentation.ink6]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {showLabel ? formatAxisDate(label) : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Donut Chart — Task Status Distribution */}
        <div
          className={['card', presentation.detail4].filter(Boolean).join(' ')}
        >
          <h2
            className={['h3', presentation.section2].filter(Boolean).join(' ')}
          >
            Task Status Distribution
          </h2>
          <p
            className={['dim text-2xs', presentation.copy4]
              .filter(Boolean)
              .join(' ')}
          >
            Updated in last {days} days
          </p>

          {totalTaskStatusCount === 0 ? (
            <div className={presentation.detail5}>
              <p className="dim text-sm">No task activity in this period</p>
              {allTimeTasks > 0 && (
                <p
                  className={['dim text-2xs', presentation.copy5]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {allTimeTasks} tasks all time
                </p>
              )}
            </div>
          ) : (
            <div className="row gap-6">
              <div className={presentation.detail6}>
                <div
                  style={{
                    width: '144px',
                    height: '144px',
                    borderRadius: '50%',
                    background: buildConicGradient(
                      tasksByStatus,
                      taskStatusFills,
                    ),
                    mask: 'radial-gradient(circle at center, transparent 42px, black 43px)',
                    WebkitMask:
                      'radial-gradient(circle at center, transparent 42px, black 43px)',
                  }}
                />
                <div className={presentation.row1}>
                  <div className={presentation.detail7}>
                    <span
                      className={['mono num text-lg', presentation.ink1]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {totalTaskStatusCount}
                    </span>
                    <p
                      className={['upper dim', presentation.copy6]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      Total
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={['col gap-2', presentation.detail8]
                  .filter(Boolean)
                  .join(' ')}
              >
                {Object.entries(tasksByStatus).map(([status, count]) => (
                  <div key={status} className="row gap-2">
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '2px',
                        flexShrink: 0,
                        background:
                          taskStatusFills[status] || unknownStatusFill,
                      }}
                    />
                    <span
                      className={['text-2xs', presentation.ink2]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {status}
                    </span>
                    <span className="mono num dim text-2xs">{count}</span>
                    <span
                      className={['mono num text-2xs', presentation.ink3]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {totalTaskStatusCount > 0
                        ? Math.round((count / totalTaskStatusCount) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Horizontal Bar Chart — Top Contracts by Messages */}
        <div
          className={['card md:col-span-2', presentation.detail4]
            .filter(Boolean)
            .join(' ')}
        >
          <h2
            className={['h3', presentation.section2].filter(Boolean).join(' ')}
          >
            Top Contracts by Messages
          </h2>
          <p
            className={['dim text-2xs', presentation.copy4]
              .filter(Boolean)
              .join(' ')}
          >
            Top 5 in last {days} days
          </p>

          {topContractsByMessages.length === 0 ? (
            <EmptyState
              icon={<BarChart3 size={20} />}
              title="No messages in this period"
              hint="Widen the window above to cover a period that has traffic."
            />
          ) : (
            <div className="col gap-2">
              {topContractsByMessages.map((contract, idx) => (
                <div key={contract.title}>
                  <div className="row gap-2">
                    <span
                      className={['text-2xs', presentation.ink7]
                        .filter(Boolean)
                        .join(' ')}
                      title={contract.title}
                    >
                      {contract.title}
                    </span>
                    <div className={presentation.detail9}>
                      <div
                        style={{
                          height: '100%',
                          borderRadius: 'var(--radius-1)',
                          transition: 'width 0.7s ease-out',
                          width: `${Math.max(4, (contract.count / maxTopContractMessages) * 100)}%`,
                          background: barColorVars[idx % barColorVars.length],
                          opacity: 0.6,
                        }}
                      />
                    </div>
                    <span
                      className={[
                        'mono num dim text-2xs',
                        presentation.detail10,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {contract.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hourly Activity Heatmap */}
        <div
          className={['card md:col-span-2', presentation.detail4]
            .filter(Boolean)
            .join(' ')}
        >
          <h2
            className={['h3', presentation.section2].filter(Boolean).join(' ')}
          >
            Hourly Activity Heatmap
          </h2>
          <p
            className={['dim text-2xs', presentation.copy4]
              .filter(Boolean)
              .join(' ')}
          >
            Message distribution by hour (UTC) — last {days} days
          </p>

          <div className={presentation.row3}>
            {hourlyMessageCounts.map((count, hour) => {
              const intensity = maxHourlyCount > 0 ? count / maxHourlyCount : 0;
              return (
                <div
                  key={hour}
                  className={['group', presentation.stack2]
                    .filter(Boolean)
                    .join(' ')}
                  title={`${hour}:00 UTC — ${count} messages`}
                >
                  <span
                    className={['mono num text-2xs', presentation.ink5]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {count}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      height: '40px',
                      borderRadius: '3px',
                      transition: 'background 0.3s',
                      background:
                        count === 0
                          ? 'var(--bg-2)'
                          : `color-mix(in oklch, var(--mint) ${(0.12 + intensity * 0.65) * 100}%, transparent)`,
                    }}
                  />
                  <span
                    className={['mono num text-2xs', presentation.ink8]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {hour.toString().padStart(2, '0')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageFrame>
  );
}
