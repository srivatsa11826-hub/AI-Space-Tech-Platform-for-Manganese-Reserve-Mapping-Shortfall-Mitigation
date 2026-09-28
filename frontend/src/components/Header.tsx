import React, { useState, useEffect } from 'react';
import { Pickaxe, ShieldAlert, FileText, RefreshCw, Layers, Calendar, Clock, Home, Map, TrendingUp, ShieldCheck } from 'lucide-react';
import { SimulationResponse } from '../types';

interface HeaderProps {
  activeTab: 'home' | 'map' | 'analytics' | 'compliance';
  setActiveTab: (tab: 'home' | 'map' | 'analytics' | 'compliance') => void;
  selectedSite: string;
  setSelectedSite: (site: string) => void;
  selectedShift: string;
  setSelectedShift: (shift: string) => void;
  simulationData: SimulationResponse | null;
  onRefresh: () => void;
  onExportPDF: () => void;
  isExporting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedSite,
  setSelectedSite,
  selectedShift,
  setSelectedShift,
  simulationData,
  onRefresh,
  onExportPDF,
  isExporting
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const dgmsViolation = simulationData?.prediction.dgms_safety_violation ?? false;
  const dgmsStatus = simulationData?.prediction.dgms_safety_status ?? 'COMPLIANT';

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-50 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3.5 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-2 rounded-xl text-slate-950 font-black shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <Pickaxe className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black tracking-tight text-slate-100 uppercase">
                MOIL <span className="text-amber-400">MANGANESE AI</span>
              </h1>
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                SIH26009
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Space-Tech Mineral Engine & Operational Dispatch • MOIL Limited
            </p>
          </div>
        </div>

        {/* Tab Navigation Links */}
        <div className="flex items-center space-x-1 bg-slate-950/80 border border-slate-800/80 p-1 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all ${
              activeTab === 'home'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all ${
              activeTab === 'map'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Map & Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all ${
              activeTab === 'analytics'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>
        </div>

        {/* Right Controls Ribbon */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* State / Mine Belt Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
            <Layers className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="bg-transparent text-slate-100 font-bold outline-none cursor-pointer text-xs"
            >
              <option value="Odisha" className="bg-slate-900 text-amber-300 font-bold">🏛️ Odisha (44% Share • #1 Reserves)</option>
              <option value="Karnataka" className="bg-slate-900 text-amber-300 font-bold">🏛️ Karnataka (22% Share • SMIORE Belt)</option>
              <option value="Madhya Pradesh" className="bg-slate-900 text-amber-300 font-bold">🏛️ Madhya Pradesh (13% Share • Top Producer)</option>
              <option value="Maharashtra" className="bg-slate-900 text-amber-300 font-bold">🏛️ Maharashtra (8% Share • MOIL HQ)</option>
              <option value="Andhra Pradesh" className="bg-slate-900 text-amber-300 font-bold">🏛️ Andhra Pradesh (4% Share • Coastal Complex)</option>
              <option value="Balaghat" className="bg-slate-900 text-slate-300">⛏️ Balaghat Mine (Bharweli, MP)</option>
              <option value="Dongri Buzurg" className="bg-slate-900 text-slate-300">⛏️ Dongri Buzurg Mine (MH)</option>
              <option value="Chikla" className="bg-slate-900 text-slate-300">⛏️ Chikla Mine (MH)</option>
            </select>
          </div>

          {/* Live DGMS Safety Status Indicator */}
          <div className={`flex items-center px-2.5 py-1.5 rounded-lg border text-xs font-bold tracking-wide transition-all ${
            dgmsViolation
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 pulse-rose'
              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
          }`}>
            <ShieldAlert className="w-3.5 h-3.5 mr-1" />
            <span>{dgmsStatus}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={onRefresh}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-2.5 py-1.5 rounded-lg text-xs flex items-center transition-all"
              title="Re-run Digital Twin Simulation"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-300" />
            </button>

            <button
              onClick={onExportPDF}
              disabled={isExporting}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-3 py-1.5 rounded-lg text-xs flex items-center transition-all shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />
              <span>{isExporting ? 'Exporting...' : 'PDF SOP'}</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
