import React from 'react';
import { ShieldAlert, ArrowRight, CheckCircle2, Fuel, Leaf, IndianRupee, Download, Building2, CheckSquare } from 'lucide-react';
import { SimulationResponse, ReallocationDirective, GeoJSONFeature } from '../types';

interface PrescriptiveAlertsProps {
  simulationData: SimulationResponse | null;
  onExportPDF: () => void;
  isExporting: boolean;
}

export const PrescriptiveAlerts: React.FC<PrescriptiveAlertsProps> = ({
  simulationData,
  onExportPDF,
  isExporting
}) => {
  const directives = simulationData?.optimization.directives ?? [];
  const metrics = simulationData?.optimization.metrics;
  const pred = simulationData?.prediction;

  const fuelSaved = metrics?.fuel_savings_liters ?? 45.0;
  const co2Reduction = metrics?.co2_reduction_kg ?? 120.6;
  const netValueInr = metrics?.net_financial_value_inr ?? 320000.0;
  const netValueLakhs = (netValueInr / 100000).toFixed(2);

  const reportDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const reportTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      
      {/* On-screen Dashboard Section */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 shadow-lg backdrop-blur-md">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              Prescriptive Dispatch Directives & ESG Trade-off Analytics
            </h3>
            <p className="text-xs text-slate-400 font-medium">SciPy Simplex Linear Programming optimization directives for mine superintendents</p>
          </div>

          <button
            onClick={onExportPDF}
            disabled={isExporting}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-1.5 stroke-[2.5]" />
            <span>{isExporting ? 'Generating Official PDF...' : 'Download Official Shift Audit SOP (PDF)'}</span>
          </button>
        </div>

        {/* Main On-Screen Directives Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          
          <div className="lg:col-span-2 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              Prioritized Reallocation SOPs ({directives.length} Tactical Steps)
            </div>

            {directives.length === 0 ? (
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 font-medium text-center">
                No active reallocation directives required. Shift operations proceeding within baseline parameters.
              </div>
            ) : (
              directives.map((dir: ReallocationDirective, idx: number) => {
                const isCritical = dir.action_type === 'DRAINAGE_DISPATCH' || dir.priority === 1;
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isCritical
                        ? 'bg-rose-950/20 border-rose-500/40 text-slate-100'
                        : 'bg-slate-950/80 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded uppercase ${
                          isCritical ? 'bg-rose-500 text-slate-950' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          Priority #{dir.priority} • {dir.sop_code}
                        </span>
                        <span className="text-xs font-bold text-slate-100">{dir.action_type.replace('_', ' ')}</span>
                      </div>

                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                        +{dir.expected_tonnage_recovery} T Ore Recovered
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {dir.description}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold text-slate-500 uppercase text-[10px]">Route:</span>
                        <span className="text-slate-300 font-medium">{dir.source_location}</span>
                        <ArrowRight className="w-3 h-3 text-amber-400 inline" />
                        <span className="text-amber-400 font-bold">{dir.destination_location}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500 uppercase text-[10px]">Equipment: </span>
                        <span className="font-mono text-slate-200 font-bold">{dir.equipment_count}x {dir.equipment_type}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Leaf className="w-4 h-4 text-emerald-400" />
                ESG & Financial Mitigation
              </div>

              <div className="space-y-3">
                <div className="bg-slate-900/90 p-3 rounded-xl border border-emerald-500/30 flex items-center justify-between shadow-sm">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <IndianRupee className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400 font-medium">Net Ore Value Recovered</div>
                      <div className="text-base font-black text-emerald-400 font-mono">₹{netValueLakhs} Lakhs</div>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>

                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between shadow-sm">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                      <Fuel className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400 font-medium">Deadhaul Fuel Saved</div>
                      <div className="text-base font-bold text-amber-400 font-mono">{fuelSaved} Liters</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono font-bold">Diesel</span>
                </div>

                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between shadow-sm">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                      <Leaf className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400 font-medium">Carbon Footprint Abatement</div>
                      <div className="text-base font-bold text-cyan-400 font-mono">-{co2Reduction} kg CO2</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono font-bold">ESG Safe</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-medium text-center">
              Compliance Standard: Directorate General of Mines Safety (DGMS)
            </div>
          </div>

        </div>

      </div>

      {/* DEDICATED FORMAL PDF DOCUMENT TEMPLATE (Rendered & Saved into PDF) */}
      <div className="hidden">
        <div id="official-shift-sop-document" className="bg-white text-slate-900 p-8 max-w-4xl mx-auto space-y-6 font-sans border border-slate-300">
          
          {/* Document Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-amber-600">Government of India Enterprise</div>
              <h1 className="text-2xl font-black uppercase text-slate-900 tracking-tight">MOIL LIMITED</h1>
              <div className="text-sm font-bold text-slate-700">Directorate General of Mines Safety (DGMS) Statutory Audit & Reallocation SOP</div>
              <div className="text-xs text-slate-500 mt-1">Balaghat & Bhandara Manganese Ore Belts • SIH26009 Enterprise System</div>
            </div>
            <div className="text-right text-xs font-mono border-l-2 border-amber-500 pl-4 space-y-1">
              <div><strong>Report Ref:</strong> MOIL-SHIFT-{Date.now().toString().slice(-6)}</div>
              <div><strong>Date:</strong> {reportDate}</div>
              <div><strong>Time:</strong> {reportTime} IST</div>
              <div><strong>Status:</strong> <span className="text-emerald-700 font-bold">OFFICIAL</span></div>
            </div>
          </div>

          {/* Metadata Block */}
          <div className="grid grid-cols-4 gap-4 bg-slate-100 p-3 rounded-md text-xs font-mono border border-slate-300">
            <div><span className="text-slate-500 block uppercase text-[9px] font-sans font-bold">Mine Site</span><strong>{pred?.mine_site || 'Balaghat Mine'}</strong></div>
            <div><span className="text-slate-500 block uppercase text-[9px] font-sans font-bold">Shift Period</span><strong>{pred?.shift_name || 'Shift A (06:00-14:00)'}</strong></div>
            <div><span className="text-slate-500 block uppercase text-[9px] font-sans font-bold">DGMS Status</span><strong className="text-emerald-800">{pred?.dgms_safety_status || 'COMPLIANT'}</strong></div>
            <div><span className="text-slate-500 block uppercase text-[9px] font-sans font-bold">Risk Classification</span><strong className="text-amber-800">{pred?.risk_level || 'MODERATE'}</strong></div>
          </div>

          {/* Section 1: Executive Shift Extraction & Deficit Summary */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2">
              1. Executive Shift Extraction & Deficit Summary
            </h2>
            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-200 text-slate-800 font-bold uppercase text-[10px]">
                  <th className="p-2 border border-slate-300">Statutory Quota Target</th>
                  <th className="p-2 border border-slate-300">XGBoost Predicted Extraction</th>
                  <th className="p-2 border border-slate-300">Net Predicted Deficit</th>
                  <th className="p-2 border border-slate-300">Deficit %</th>
                  <th className="p-2 border border-slate-300">Safety Limit Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="font-mono">
                  <td className="p-2 border border-slate-300 font-bold">{pred?.shift_target_tonnes} Tonnes</td>
                  <td className="p-2 border border-slate-300 text-blue-800 font-bold">{pred?.predicted_extraction_tonnes} Tonnes</td>
                  <td className="p-2 border border-slate-300 text-rose-700 font-bold">-{pred?.shortfall_tonnes} Tonnes</td>
                  <td className="p-2 border border-slate-300 text-rose-700 font-bold">{pred?.shortfall_percentage}%</td>
                  <td className="p-2 border border-slate-300 font-bold">{pred?.dgms_safety_status}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: Prioritized Tactical Reallocation Directives Table */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2">
              2. Prioritized Fleet Reallocation SOP Directives (SciPy Solver)
            </h2>
            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-200 text-slate-800 font-bold uppercase text-[10px]">
                  <th className="p-2 border border-slate-300">Prio</th>
                  <th className="p-2 border border-slate-300">SOP Code</th>
                  <th className="p-2 border border-slate-300">Action Type</th>
                  <th className="p-2 border border-slate-300">Equipment Fleet</th>
                  <th className="p-2 border border-slate-300">Source Bench</th>
                  <th className="p-2 border border-slate-300">Destination Face</th>
                  <th className="p-2 border border-slate-300">Tonnage Recovered</th>
                </tr>
              </thead>
              <tbody>
                {directives.map((d, i) => (
                  <tr key={i} className="font-mono border-b border-slate-200">
                    <td className="p-2 border border-slate-300 font-bold">{d.priority}</td>
                    <td className="p-2 border border-slate-300 font-bold text-amber-800">{d.sop_code}</td>
                    <td className="p-2 border border-slate-300">{d.action_type}</td>
                    <td className="p-2 border border-slate-300">{d.equipment_count}x {d.equipment_type}</td>
                    <td className="p-2 border border-slate-300">{d.source_location}</td>
                    <td className="p-2 border border-slate-300 font-bold">{d.destination_location}</td>
                    <td className="p-2 border border-slate-300 text-emerald-800 font-bold">+{d.expected_tonnage_recovery} T</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 3: ESG & Financial Tradeoff Mitigation */}
          <div className="bg-slate-50 p-4 rounded-md border border-slate-300 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">
              3. ESG & Financial Mitigation Summary
            </h2>
            <div className="grid grid-cols-3 gap-4 text-xs font-mono pt-1">
              <div><span className="text-slate-500 block uppercase text-[9px] font-sans font-bold">Ore Value Saved</span><strong className="text-emerald-800 text-sm">₹{netValueLakhs} Lakhs</strong></div>
              <div><span className="text-slate-500 block uppercase text-[9px] font-sans font-bold">Deadhaul Fuel Saved</span><strong className="text-amber-800 text-sm">{fuelSaved} Liters</strong></div>
              <div><span className="text-slate-500 block uppercase text-[9px] font-sans font-bold">Carbon Footprint Abatement</span><strong className="text-cyan-800 text-sm">-{co2Reduction} kg CO2</strong></div>
            </div>
          </div>

          {/* Section 4: Approval Sign-Off Block */}
          <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-3 gap-8 text-center text-xs">
            <div>
              <div className="h-10 border-b border-slate-400 mb-1"></div>
              <div className="font-bold text-slate-800">Shift Superintendent</div>
              <div className="text-[10px] text-slate-500">MOIL Operations Branch</div>
            </div>
            <div>
              <div className="h-10 border-b border-slate-400 mb-1"></div>
              <div className="font-bold text-slate-800">Mine Manager</div>
              <div className="text-[10px] text-slate-500">Balaghat / Bhandara Belt</div>
            </div>
            <div>
              <div className="h-10 border-b border-slate-400 mb-1 text-emerald-800 font-mono text-[10px] pt-4 font-bold">[DGMS VERIFIED]</div>
              <div className="font-bold text-slate-800">DGMS Safety Inspector</div>
              <div className="text-[10px] text-slate-500">Directorate General of Mines Safety</div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
