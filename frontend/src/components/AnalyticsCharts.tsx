import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend, ComposedChart, Line
} from 'recharts';
import { TrendingUp, BarChart2, PieChart as PieIcon, CloudRain, Truck } from 'lucide-react';
import { TelemetryHistoryItem, SimulationResponse } from '../types';

interface AnalyticsChartsProps {
  telemetryData: TelemetryHistoryItem[];
  simulationData: SimulationResponse | null;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ telemetryData, simulationData }) => {
  
  const factors = simulationData?.prediction.shortfall_factors;
  const factorBarData = [
    { name: 'Rainfall & Monsoon Impact', value: factors?.rain_impact_pct ?? 40.0, color: '#3b82f6' },
    { name: 'HEMM Breakdown Hours', value: factors?.breakdown_impact_pct ?? 30.0, color: '#f59e0b' },
    { name: 'Bench Slope Slippage', value: factors?.bench_slippage_impact_pct ?? 18.0, color: '#06b6d4' },
    { name: 'Blasting Clearance Delay', value: factors?.blasting_delay_impact_pct ?? 12.0, color: '#f43f5e' }
  ];

  // Grade Distribution Pie Data
  const gradeDistributionData = [
    { name: 'High Grade Pyrolusite (>42% Mn)', value: 48, color: '#f59e0b' },
    { name: 'Medium Grade Psilomelane (35-42% Mn)', value: 32, color: '#8b5cf6' },
    { name: 'Low Grade Silicate (<35% Mn)', value: 20, color: '#64748b' }
  ];

  return (
    <div className="space-y-4 mb-4">
      
      {/* Row 1: Production Trajectory & Bottleneck Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Chart 1: 14-Shift Production vs Target vs Shortfall Curve */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 shadow-lg flex flex-col justify-between backdrop-blur-md">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">14-Shift Ore Dispatch Trajectory</h3>
                <p className="text-[11px] text-slate-400 font-medium">Shift-by-shift historical extraction vs statutory targets</p>
              </div>
            </div>
            <span className="text-[10px] bg-slate-950 text-slate-400 border border-slate-800 font-mono px-2 py-0.5 rounded-md font-semibold">
              Tonnes / Shift
            </span>
          </div>

          <div className="h-64 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="shortfallGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Area type="monotone" dataKey="target_tonnes" name="Target Quota" stroke="#f59e0b" fillOpacity={1} fill="url(#targetGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="actual_tonnes" name="Actual Extraction" stroke="#10b981" fillOpacity={1} fill="url(#actualGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="shortfall_tonnes" name="Net Shortfall" stroke="#f43f5e" fillOpacity={1} fill="url(#shortfallGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Bottleneck Attribution Breakdown */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 shadow-lg flex flex-col justify-between backdrop-blur-md">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Shortfall Cause Attribution</h3>
                <p className="text-[11px] text-slate-400 font-medium">Quantified percentage share of extraction delay factors</p>
              </div>
            </div>
            <span className="text-[10px] bg-slate-950 text-slate-400 border border-slate-800 font-mono px-2 py-0.5 rounded-md font-semibold">
              Shortfall % Share
            </span>
          </div>

          <div className="h-64 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={factorBarData} layout="vertical" margin={{ top: 10, right: 20, left: 45, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 100]} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} width={125} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  formatter={(val: any) => [`${val}%`, 'Contribution Share']}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {factorBarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 2: Mineral Grade Distribution (Pie) & Monsoon Rainfall Correlation (Composed) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Chart 3: Manganese Mineral Grade Reserve Distribution */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 shadow-lg flex flex-col justify-between backdrop-blur-md">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <PieIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Manganese Ore Reserve Grade Share</h3>
                <p className="text-[11px] text-slate-400 font-medium">Multispectral band classification breakdown (% Mn)</p>
              </div>
            </div>
            <span className="text-[10px] bg-slate-950 text-slate-400 border border-slate-800 font-mono px-2 py-0.5 rounded-md font-semibold">
              Share %
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradeDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {gradeDistributionData.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  formatter={(val: any) => [`${val}%`, 'Reserve Share']}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Monsoon Rainfall vs Extraction Loss Correlation */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 shadow-lg flex flex-col justify-between backdrop-blur-md">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <CloudRain className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Monsoon Rainfall vs Tonnage Shortfall</h3>
                <p className="text-[11px] text-slate-400 font-medium">Shift rainfall impact on open-cast bench extraction</p>
              </div>
            </div>
            <span className="text-[10px] bg-slate-950 text-slate-400 border border-slate-800 font-mono px-2 py-0.5 rounded-md font-semibold">
              Dual Axis
            </span>
          </div>

          <div className="h-64 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={telemetryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" stroke="#38bdf8" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#f43f5e" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Bar yAxisId="left" dataKey="rainfall_mm" name="Rainfall (mm)" fill="#38bdf8" radius={[4, 4, 0, 0]} barSize={16} />
                <Line yAxisId="right" type="monotone" dataKey="shortfall_tonnes" name="Shortfall (Tonnes)" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
