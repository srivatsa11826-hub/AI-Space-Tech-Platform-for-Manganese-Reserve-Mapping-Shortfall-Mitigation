import React from 'react';
import { Target, TrendingDown, AlertTriangle, Truck, IndianRupee, Activity } from 'lucide-react';
import { SimulationResponse, SimulatorParams } from '../types';

interface KPICardsProps {
  simulationData: SimulationResponse | null;
  params: SimulatorParams;
}

export const KPICards: React.FC<KPICardsProps> = ({ simulationData, params }) => {
  const targetTonnes = params.shift_target_tonnes;
  const predictedTonnes = simulationData?.prediction.predicted_extraction_tonnes ?? targetTonnes * 0.75;
  const shortfallTonnes = simulationData?.prediction.shortfall_tonnes ?? targetTonnes * 0.25;
  const shortfallPct = simulationData?.prediction.shortfall_percentage ?? 25.0;
  const riskLevel = simulationData?.prediction.risk_level ?? 'MODERATE';

  const tonnageRecovered = simulationData?.optimization.metrics.tonnage_recovered ?? 0;
  const netValueInr = simulationData?.optimization.metrics.net_financial_value_inr ?? 0;
  const netValueLakhs = (netValueInr / 100000).toFixed(2);

  const riskBadgeClasses = {
    OPTIMAL: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 pulse-emerald',
    MODERATE: 'bg-amber-500/15 border-amber-500/40 text-amber-400',
    CRITICAL: 'bg-rose-500/15 border-rose-500/40 text-rose-400 pulse-rose'
  }[riskLevel];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
      
      {/* KPI 1: Statutory Shift Target */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Statutory Target</span>
          <div className="p-1.5 rounded-lg bg-slate-800/80 text-amber-400">
            <Target className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-xl font-black text-slate-100 font-mono tracking-tight">
            {targetTonnes.toLocaleString('en-IN')} <span className="text-[11px] text-slate-400 font-sans font-normal">T</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-medium truncate">Ministry Shift Quota</div>
        </div>
        <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/5 rounded-full blur-lg pointer-events-none" />
      </div>

      {/* KPI 2: XGBoost Forecast */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">XGBoost Forecast</span>
          <div className="p-1.5 rounded-lg bg-slate-800/80 text-blue-400">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-xl font-black text-blue-400 font-mono tracking-tight">
            {predictedTonnes.toLocaleString('en-IN')} <span className="text-[11px] text-slate-400 font-sans font-normal">T</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-medium truncate">
            {((predictedTonnes / Math.max(targetTonnes, 1)) * 100).toFixed(1)}% Target Met
          </div>
        </div>
      </div>

      {/* KPI 3: Net Shortfall */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Predicted Deficit</span>
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-xl font-black text-rose-400 font-mono tracking-tight">
            -{shortfallTonnes.toLocaleString('en-IN')} <span className="text-[11px] text-slate-400 font-sans font-normal">T</span>
          </div>
          <div className="text-[11px] text-rose-400/90 font-bold mt-0.5 truncate">
            Shortfall: {shortfallPct}%
          </div>
        </div>
      </div>

      {/* KPI 4: Risk Level */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shift Risk Level</span>
          <div className="p-1.5 rounded-lg bg-slate-800/80 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md border text-xs font-black tracking-wide ${riskBadgeClasses}`}>
              {riskLevel}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            {simulationData?.prediction.dgms_safety_status ?? 'Compliant'}
          </div>
        </div>
      </div>

      {/* KPI 5: Active HEMM Fleet */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Fleet</span>
          <div className="p-1.5 rounded-lg bg-slate-800/80 text-emerald-400">
            <Truck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-sm font-bold text-slate-100 font-mono">
            {params.active_excavators} <span className="text-[10px] text-slate-400 font-sans">Excavators</span>
          </div>
          <div className="text-sm font-bold text-slate-300 font-mono">
            {params.active_dumpers} <span className="text-[10px] text-slate-400 font-sans">Dumpers</span>
          </div>
        </div>
      </div>

      {/* KPI 6: Prescriptive Value Recovered */}
      <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-3.5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all bg-gradient-to-br from-slate-900 to-emerald-950/30">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Optimization SOP</span>
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <IndianRupee className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-lg font-black text-emerald-400 font-mono tracking-tight">
            +₹{netValueLakhs} <span className="text-[10px] font-sans font-bold">Lakhs</span>
          </div>
          <div className="text-[11px] text-emerald-300 font-bold mt-0.5 truncate">
            +{tonnageRecovered} T Ore Recovered
          </div>
        </div>
      </div>

    </div>
  );
};
