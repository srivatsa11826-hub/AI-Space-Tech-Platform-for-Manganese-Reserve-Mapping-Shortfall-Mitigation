import React from 'react';
import { Sliders, CloudRain, Wrench, Truck, ShieldAlert, Zap, Flame, Compass, Layers } from 'lucide-react';
import { SimulatorParams } from '../types';

interface SimulatorPanelProps {
  params: SimulatorParams;
  setParams: React.Dispatch<React.SetStateAction<SimulatorParams>>;
  onSimulate: () => void;
  isLoading: boolean;
}

export const SimulatorPanel: React.FC<SimulatorPanelProps> = ({
  params,
  setParams,
  onSimulate,
  isLoading
}) => {

  const handleChange = (key: keyof SimulatorParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 flex flex-col h-[600px] shadow-lg justify-between backdrop-blur-md">
      
      {/* Studio Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                "What-If" Digital Twin Studio
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Real-time simulation of operational & monsoon shocks</p>
            </div>
          </div>

          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full">
            Digital Twin
          </span>
        </div>

        {/* Sliders Form Container */}
        <div className="space-y-4 mt-3.5 overflow-y-auto max-h-[440px] pr-1.5">

          {/* Section 1: Environmental Shocks */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CloudRain className="w-3.5 h-3.5 text-blue-400" />
              1. Environmental Risk Factors
            </div>

            {/* Slider 1: Rainfall Forecast */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Rainfall Forecast (mm/hr)</span>
                <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                  params.rainfall_forecast_mm >= 25 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-slate-900 text-blue-400 border border-slate-800'
                }`}>
                  {params.rainfall_forecast_mm} mm
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="1"
                value={params.rainfall_forecast_mm}
                onChange={(e) => handleChange('rainfall_forecast_mm', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              {params.rainfall_forecast_mm >= 25 && (
                <div className="flex items-center text-[10px] text-rose-400 font-bold gap-1 mt-1">
                  <ShieldAlert className="w-3 h-3" />
                  DGMS Mandate: Open-Cast Blasting Halts at 25 mm/hr Threshold
                </div>
              )}
            </div>

            {/* Slider 2: Bench Moisture Level */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Bench Slope Moisture Level (%)</span>
                <span className="font-mono text-cyan-400 font-bold bg-slate-900 px-2 py-0.5 rounded text-[11px] border border-slate-800">
                  {params.bench_moisture_level}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                step="1"
                value={params.bench_moisture_level}
                onChange={(e) => handleChange('bench_moisture_level', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </div>

          {/* Section 2: HEMM Fleet & Machinery Availability */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              2. Fleet & Machinery Capacity
            </div>

            {/* Breakdown Duration Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Fleet Breakdown Duration</span>
                <span className="font-mono text-amber-400 font-bold bg-slate-900 px-2 py-0.5 rounded text-[11px] border border-slate-800">
                  {params.machinery_breakdown_hours} hrs
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="0.5"
                value={params.machinery_breakdown_hours}
                onChange={(e) => handleChange('machinery_breakdown_hours', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Active Excavators & Dumpers Grid */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Excavators</span>
                  <span className="font-mono text-emerald-400 font-bold">{params.active_excavators}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="1"
                  value={params.active_excavators}
                  onChange={(e) => handleChange('active_excavators', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Dumpers</span>
                  <span className="font-mono text-emerald-400 font-bold">{params.active_dumpers}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="1"
                  value={params.active_dumpers}
                  onChange={(e) => handleChange('active_dumpers', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Shift Target & Blasting Schedule */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              3. Operational Shift Parameters
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Shift Target Tonnes</span>
                <span className="font-mono text-amber-400 font-bold bg-slate-900 px-2 py-0.5 rounded text-[11px] border border-slate-800">
                  {params.shift_target_tonnes} T
                </span>
              </div>
              <input
                type="range"
                min="300"
                max="3000"
                step="50"
                value={params.shift_target_tonnes}
                onChange={(e) => handleChange('shift_target_tonnes', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Toggle: Blasting Scheduled */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <div>
                  <div className="text-xs font-bold text-slate-200">Open-Pit Bench Blasting</div>
                  <div className="text-[10px] text-slate-400">Scheduled bench face fragmentation</div>
                </div>
              </div>

              <button
                onClick={() => handleChange('blasting_scheduled_today', params.blasting_scheduled_today === 1 ? 0 : 1)}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                  params.blasting_scheduled_today === 1
                    ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {params.blasting_scheduled_today === 1 ? 'SCHEDULED' : 'OFF'}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Trigger Button */}
      <button
        onClick={onSimulate}
        disabled={isLoading}
        className="w-full mt-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
      >
        <Zap className="w-4 h-4 fill-slate-950" />
        <span>{isLoading ? 'Running Digital Twin Simulation...' : 'Execute What-If Simulation'}</span>
      </button>

    </div>
  );
};
