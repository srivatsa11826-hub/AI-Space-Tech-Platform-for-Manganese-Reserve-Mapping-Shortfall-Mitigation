import React from 'react';
import { Pickaxe, Map, Sliders, TrendingUp, ShieldAlert, ArrowRight, Layers, Activity, Sparkles, Database, Globe, CheckCircle2 } from 'lucide-react';
import { MineSiteInfo } from '../types';

interface LandingPageProps {
  onNavigate: (tab: 'map' | 'analytics' | 'compliance') => void;
  onSelectSite: (siteName: string) => void;
  mineSites: MineSiteInfo[];
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onSelectSite, mineSites }) => {

  const handleLaunchMine = (siteName: string) => {
    onSelectSite(siteName);
    onNavigate('map');
  };

  return (
    <div className="space-y-6 pb-8">
      
      {/* Hero Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="max-w-3xl space-y-4 z-10 relative">
          
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MOIL Limited • SIH26009 Hackathon Solution</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight leading-tight uppercase">
            AI & Space-Tech Platform for <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-amber-300">Manganese Reserve Mapping</span> & Shortfall Mitigation
          </h1>

          <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
            Tailored specifically for MOIL mining operations in Balaghat (MP) and Bhandara/Dongri Buzurg (MH). Ingests multispectral remote sensing bands to map high-grade $MnO_2$ deposits and pairs an XGBoost shortfall predictor with a SciPy fleet optimizer to neutralize daily shift deficits.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('map')}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider flex items-center space-x-2 transition-all shadow-xl shadow-amber-500/20 active:scale-95"
            >
              <span>Launch Live Digital Twin Command Center</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              onClick={() => onNavigate('analytics')}
              className="bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-5 py-3 rounded-xl text-xs uppercase tracking-wider flex items-center space-x-2 transition-all active:scale-95"
            >
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Production Analytics</span>
            </button>
          </div>

        </div>

        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Top Enterprise Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 shadow-lg backdrop-blur-md">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Annual Production Capacity</div>
          <div className="text-2xl font-black text-slate-100 font-mono mt-1">1.55 MT <span className="text-xs text-slate-400 font-sans font-normal">/ Year</span></div>
          <div className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 79.4% YTD Quota Achieved
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 shadow-lg backdrop-blur-md">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Mining Assets</div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">3 Mines <span className="text-xs text-slate-400 font-sans font-normal">(MP / MH)</span></div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">Balaghat, Dongri Buzurg, Chikla</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 shadow-lg backdrop-blur-md">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Deployed HEMM Fleet</div>
          <div className="text-2xl font-black text-slate-100 font-mono mt-1">100 Units</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">26 Excavators • 74 Haul Trucks</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 shadow-lg backdrop-blur-md">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">DGMS Safety Status</div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">COMPLIANT</div>
          <div className="text-[11px] text-emerald-400 font-semibold mt-1">0 Active Statutory Hazards</div>
        </div>

      </div>

      {/* All 5 Indian Manganese Reserve States Cards Grid */}
      <div>
        <h2 className="text-lg font-bold text-slate-100 mb-3 flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-400" />
          5 Major Manganese Reserve States of India (Geological GIS Hub)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Card 1: Odisha */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-5 shadow-lg flex flex-col justify-between hover:border-amber-500/40 transition-all group backdrop-blur-md">
            <div>
              <div className="flex items-center justify-between">
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                  #1 Reserves in India
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">44% Share • 96.4 MT</span>
              </div>
              
              <h3 className="text-lg font-bold text-slate-100 mt-3 group-hover:text-amber-400 transition-colors">
                Odisha Manganese Belt
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
                India's largest manganese reserve hub spanning Sundargarh, Keonjhar, Kalahandi, and Koraput. High grade pyrolusite & iron-manganese complex.
              </p>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-sans font-bold">Key Districts</span>
                  <span className="text-slate-100 font-bold">Sundargarh, Keonjhar</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-sans font-bold">Base Grade</span>
                  <span className="text-emerald-400 font-bold">42.5% Mn</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleLaunchMine('Odisha')}
              className="w-full mt-4 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-bold py-2 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-all"
            >
              <span>Explore Odisha GIS Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Karnataka */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-5 shadow-lg flex flex-col justify-between hover:border-amber-500/40 transition-all group backdrop-blur-md">
            <div>
              <div className="flex items-center justify-between">
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                  #2 Reserves in India
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">22% Share • 48.2 MT</span>
              </div>
              
              <h3 className="text-lg font-bold text-slate-100 mt-3 group-hover:text-amber-400 transition-colors">
                Karnataka Manganese Belt
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
                Famous Sandur Syncline & Uttara Kannada manganese belt. High grade ferromanganese silicates and oxide ore deposits.
              </p>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-sans font-bold">Key Districts</span>
                  <span className="text-slate-100 font-bold">Ballari, Supa</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-sans font-bold">Base Grade</span>
                  <span className="text-emerald-400 font-bold">38.6% Mn</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleLaunchMine('Karnataka')}
              className="w-full mt-4 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-bold py-2 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-all"
            >
              <span>Explore Karnataka GIS Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: Madhya Pradesh */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-5 shadow-lg flex flex-col justify-between hover:border-amber-500/40 transition-all group backdrop-blur-md">
            <div>
              <div className="flex items-center justify-between">
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                  Top Producer State
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">13% Share • 28.5 MT</span>
              </div>
              
              <h3 className="text-lg font-bold text-slate-100 mt-3 group-hover:text-amber-400 transition-colors">
                Madhya Pradesh (Balaghat & Chhindwara)
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
                Home to MOIL's flagship Bharweli underground & pit complex in Balaghat. Highest grade Pyrolusite deposit in Asia (45.8% Mn).
              </p>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-sans font-bold">Key Districts</span>
                  <span className="text-slate-100 font-bold">Balaghat, Chhindwara</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-sans font-bold">Base Grade</span>
                  <span className="text-emerald-400 font-bold">45.8% Mn</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleLaunchMine('Madhya Pradesh')}
              className="w-full mt-4 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-bold py-2 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-all"
            >
              <span>Explore Madhya Pradesh GIS Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 4: Maharashtra */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-5 shadow-lg flex flex-col justify-between hover:border-amber-500/40 transition-all group backdrop-blur-md">
            <div>
              <div className="flex items-center justify-between">
                <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                  MOIL Flagship Operations
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">8% Share • 18.2 MT</span>
              </div>
              
              <h3 className="text-lg font-bold text-slate-100 mt-3 group-hover:text-amber-400 transition-colors">
                Maharashtra (Bhandara & Nagpur)
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
                Strategic MOIL open-cast mines Dongri Buzurg, Chikla, Mansar, and Kandri. High battery-grade dioxide manganese ore.
              </p>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-sans font-bold">Key Districts</span>
                  <span className="text-slate-100 font-bold">Bhandara, Nagpur</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-sans font-bold">Base Grade</span>
                  <span className="text-emerald-400 font-bold">41.2% Mn</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleLaunchMine('Maharashtra')}
              className="w-full mt-4 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-bold py-2 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-all"
            >
              <span>Explore Maharashtra GIS Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 5: Andhra Pradesh */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-5 shadow-lg flex flex-col justify-between hover:border-amber-500/40 transition-all group backdrop-blur-md">
            <div>
              <div className="flex items-center justify-between">
                <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                  Eastern Coastal Belt
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">4% Share • 8.8 MT</span>
              </div>
              
              <h3 className="text-lg font-bold text-slate-100 mt-3 group-hover:text-amber-400 transition-colors">
                Andhra Pradesh (Srikakulam & Vizag)
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
                Garividi ore complex & Cheepurupalli belt. Vital eastern coastal supply zone for regional ferro-alloy processing plants.
              </p>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-sans font-bold">Key Districts</span>
                  <span className="text-slate-100 font-bold">Srikakulam, Vizag</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-sans font-bold">Base Grade</span>
                  <span className="text-emerald-400 font-bold">36.8% Mn</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleLaunchMine('Andhra Pradesh')}
              className="w-full mt-4 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-bold py-2 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-all"
            >
              <span>Explore Andhra Pradesh GIS Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* Online External Resource Database Status Bar */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 shadow-lg backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
              Integrated Local & Online Resource Database
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                CONNECTED
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Local SQLite Engine (`manganese_operations.db`) + Online ISRO Bhuvan / Open-Meteo Weather API
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-slate-300">
          <Globe className="w-4 h-4 text-amber-400" />
          <span>ISRO Resourcesat-2A LISS-IV • Sentinel-2B Synced</span>
        </div>
      </div>

    </div>
  );
};
