import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { KPICards } from './components/KPICards';
import { ReserveMap } from './components/ReserveMap';
import { SimulatorPanel } from './components/SimulatorPanel';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { PrescriptiveAlerts } from './components/PrescriptiveAlerts';
import { CompliancePanel } from './components/CompliancePanel';

import {
  ProspectivityResponse,
  SimulationResponse,
  SimulatorParams,
  TelemetryHistoryItem,
  MineSiteInfo,
  ComplianceEvaluation,
  ShiftPlan,
  SatelliteCatalog
} from './types';

export const App: React.FC = () => {
  // Navigation State: 'home' | 'map' | 'analytics' | 'compliance'
  const [activeTab, setActiveTab] = useState<'home' | 'map' | 'analytics' | 'compliance'>('home');

  // Operational State
  const [selectedSite, setSelectedSite] = useState<string>('Balaghat');
  const [selectedShift, setSelectedShift] = useState<string>('Shift A (06:00-14:00)');
  const [prospectivityData, setProspectivityData] = useState<ProspectivityResponse | null>(null);
  const [simulationData, setSimulationData] = useState<SimulationResponse | null>(null);
  const [telemetryData, setTelemetryData] = useState<TelemetryHistoryItem[]>([]);
  const [mineSites, setMineSites] = useState<MineSiteInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [minConfidence, setMinConfidence] = useState<number>(0.5);
  const [satellite, setSatellite] = useState<SatelliteCatalog | null>(null);
  const [compliance, setCompliance] = useState<ComplianceEvaluation | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [plans, setPlans] = useState<ShiftPlan[]>([]);
  const [actualDraft, setActualDraft] = useState<Record<number, string>>({});
  const [apiError, setApiError] = useState<string>('');

  // Digital Twin Simulator Parameters
  const [params, setParams] = useState<SimulatorParams>({
    mine_site: 'Balaghat',
    shift_name: 'Shift A (06:00-14:00)',
    shift_target_tonnes: 1200,
    active_excavators: 8,
    active_dumpers: 22,
    blasting_scheduled_today: 1,
    rainfall_forecast_mm: 12,
    machinery_breakdown_hours: 1.5,
    bench_moisture_level: 18,
    haul_distance_km: 3.5
  });

  // Sync site/shift into simulator params
  useEffect(() => {
    setParams(prev => ({
      ...prev,
      mine_site: selectedSite,
      shift_name: selectedShift
    }));
  }, [selectedSite, selectedShift]);

  // Initial Data Fetch
  useEffect(() => {
    fetchMinesSummary();
    fetchProspectivityData(selectedSite, minConfidence);
    fetchHistoricalTelemetry();
    fetchWeather(selectedSite);
    fetchSatellite();
    fetchPlans();
  }, [selectedSite, selectedShift, minConfidence]);

  // Run simulation when parameters or mine site change
  useEffect(() => {
    runSimulation();
  }, [params.mine_site, params.shift_name]);

  const fetchMinesSummary = async () => {
    try {
      const res = await fetch('/api/v1/mines/summary');
      if (res.ok) {
        const json = await res.json();
        setMineSites(json.sites || []);
      }
    } catch (err) {
      console.error('Failed to fetch mine summary:', err);
    }
  };

  const fetchProspectivityData = async (site: string, confidence = minConfidence) => {
    try {
      const res = await fetch(`/api/v1/prospectivity?mine_site=${encodeURIComponent(site)}&min_confidence=${confidence}`);
      if (res.ok) {
        const json = await res.json();
        setProspectivityData(json);
        setApiError('');
      }
    } catch (err) {
      setApiError('Prospectivity API is unreachable.');
    }
  };

  const fetchHistoricalTelemetry = async () => {
    try {
      const params = new URLSearchParams({ days: '14', mine_site: selectedSite, shift: selectedShift });
      const res = await fetch(`/api/v1/telemetry/historical?${params.toString()}`);
      if (res.ok) setTelemetryData(await res.json());
    } catch (err) {
      setApiError('Telemetry API is unreachable.');
    }
  };

  const fetchWeather = async (site: string) => {
    try {
      const res = await fetch(`/api/v1/online/weather?mine_site=${encodeURIComponent(site)}`);
      if (!res.ok) return;
      const weather = await res.json();
      setParams(prev => ({
        ...prev,
        rainfall_forecast_mm: Number(weather.rainfall_forecast_mm ?? prev.rainfall_forecast_mm),
        bench_moisture_level: Number(weather.bench_moisture_level ?? prev.bench_moisture_level)
      }));
    } catch {
      setApiError('Live weather is unreachable. Simulator keeps the last rainfall values.');
    }
  };

  const fetchSatellite = async () => {
    try {
      const res = await fetch('/api/v1/online/satellite-catalog');
      if (res.ok) setSatellite(await res.json());
    } catch {
      setSatellite(null);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch(`/api/v1/shift-plans?mine_site=${encodeURIComponent(selectedSite)}`);
      if (res.ok) setPlans(await res.json());
    } catch {
      setPlans([]);
    }
  };

  const refreshCompliance = async (rainfall: number, moisture: number) => {
    const q = new URLSearchParams({
      mine_site: selectedSite,
      shift_name: selectedShift,
      rainfall_mm: String(rainfall),
      bench_moisture: String(moisture)
    });
    const res = await fetch(`/api/v1/compliance/evaluate?${q.toString()}`);
    if (res.ok) setCompliance(await res.json());
    const history = await fetch(`/api/v1/compliance/alerts?mine_site=${encodeURIComponent(selectedSite)}`);
    if (history.ok) setAlerts(await history.json());
  };

  const uploadBands = async (file: File) => {
    const body = new FormData();
    body.append('file', file);
    const res = await fetch(`/api/v1/prospectivity/upload?mine_site=${encodeURIComponent(selectedSite)}&min_confidence=${minConfidence}`, {
      method: 'POST',
      body
    });
    if (res.ok) setProspectivityData(await res.json());
  };

  const recordActual = async (planId: number) => {
    const tonnes = Number(actualDraft[planId]);
    if (!Number.isFinite(tonnes)) return;
    await fetch(`/api/v1/shift-plans/${planId}/actual?actual_extraction_tonnes=${tonnes}`, { method: 'POST' });
    await fetch('/api/v1/model/retrain', { method: 'POST' });
    fetchPlans();
    fetchHistoricalTelemetry();
  };

  const runSimulation = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prediction_input: params })
      });
      if (res.ok) {
        const json: SimulationResponse = await res.json();
        setSimulationData(json);
        await refreshCompliance(params.rainfall_forecast_mm, params.bench_moisture_level);
        await fetch('/api/v1/shift-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mine_site: json.prediction.mine_site,
            shift_name: json.prediction.shift_name,
            shift_target_tonnes: json.prediction.shift_target_tonnes,
            predicted_extraction_tonnes: json.prediction.predicted_extraction_tonnes,
            shortfall_tonnes: json.prediction.shortfall_tonnes,
            tonnage_recovered: json.optimization.metrics.tonnage_recovered,
            net_financial_value_inr: json.optimization.metrics.net_financial_value_inr,
            dgms_safety_status: json.prediction.dgms_safety_status,
            directives: json.optimization.directives,
            rainfall_forecast_mm: params.rainfall_forecast_mm,
            machinery_breakdown_hours: params.machinery_breakdown_hours,
            bench_moisture_level: params.bench_moisture_level,
            haul_distance_km: params.haul_distance_km,
            active_excavators: params.active_excavators,
            active_dumpers: params.active_dumpers,
            blasting_scheduled_today: params.blasting_scheduled_today
          })
        });
        fetchPlans();
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Generates dedicated official MOIL / DGMS shift audit report document PDF
  const exportPDFSOP = async () => {
    setIsExporting(true);
    try {
      const docElement = document.getElementById('official-shift-sop-document');
      if (!docElement) return;

      // Temporarily reveal document element for high-res canvas rendering
      docElement.parentElement?.classList.remove('hidden');

      const canvas = await html2canvas(docElement, {
        scale: 2.0,
        backgroundColor: '#ffffff',
        useCORS: true
      });

      docElement.parentElement?.classList.add('hidden');

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`MOIL-Official-Shift-Audit-SOP-${selectedSite}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF Export Error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedSite={selectedSite}
        setSelectedSite={setSelectedSite}
        selectedShift={selectedShift}
        setSelectedShift={setSelectedShift}
        simulationData={simulationData}
        onRefresh={runSimulation}
        onExportPDF={exportPDFSOP}
        isExporting={isExporting}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4" id="dashboard-main-container">
        
        {/* Render Tab Views */}
        {activeTab === 'home' && (
          <LandingPage
            onNavigate={setActiveTab}
            onSelectSite={setSelectedSite}
            mineSites={mineSites}
          />
        )}

        {apiError && (
          <div className="mb-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800 rounded-lg px-3 py-2">{apiError}</div>
        )}

        {activeTab === 'compliance' && (
          <CompliancePanel
            evaluation={compliance}
            alerts={alerts}
            mineSite={selectedSite}
            shiftName={selectedShift}
          />
        )}

        {activeTab === 'map' && (
          <>
            {/* KPI Summary Ribbon */}
            <KPICards simulationData={simulationData} params={params} />

            {/* Closed-Loop Split View: Reserve Map (Left) + What-If Digital Twin Studio (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
              <div className="lg:col-span-7">
                <ReserveMap
                  prospectivityData={prospectivityData}
                  selectedSite={selectedSite}
                  onSelectSite={setSelectedSite}
                  minConfidence={minConfidence}
                  onConfidenceChange={setMinConfidence}
                  satellite={satellite}
                  directives={simulationData?.optimization.directives || []}
                  onUploadBands={uploadBands}
                />
              </div>
              <div className="lg:col-span-5">
                <SimulatorPanel
                  params={params}
                  setParams={setParams}
                  onSimulate={runSimulation}
                  isLoading={isLoading}
                />
              </div>
            </div>

            {/* Analytics Section */}
            <AnalyticsCharts telemetryData={telemetryData} simulationData={simulationData} />

            {/* Prescriptive Directives & ESG Tradeoffs */}
            <PrescriptiveAlerts
              simulationData={simulationData}
              onExportPDF={exportPDFSOP}
              isExporting={isExporting}
            />
          </>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <KPICards simulationData={simulationData} params={params} />
            <AnalyticsCharts telemetryData={telemetryData} simulationData={simulationData} />
            <PrescriptiveAlerts
              simulationData={simulationData}
              onExportPDF={exportPDFSOP}
              isExporting={isExporting}
            />
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-sm font-bold text-slate-100 mb-2">Shift plans vs actual extraction · {selectedSite}</div>
              <div className="space-y-2">
                {plans.length === 0 && <div className="text-xs text-slate-500">Run a simulation to store a shift plan.</div>}
                {plans.slice(0, 8).map(plan => (
                  <div key={plan.id} className="flex flex-wrap items-center gap-2 text-xs border border-slate-800 rounded-lg p-2">
                    <span className="font-mono text-slate-400">#{plan.id}</span>
                    <span>{plan.shift_name}</span>
                    <span>Predicted {plan.predicted_extraction_tonnes} t</span>
                    <span>Shortfall {plan.shortfall_tonnes} t</span>
                    <span className="text-amber-400">₹{Math.round(plan.net_financial_value_inr).toLocaleString('en-IN')}</span>
                    <span>{plan.actual_extraction_tonnes == null ? 'Actual pending' : `Actual ${plan.actual_extraction_tonnes} t`}</span>
                    {plan.actual_extraction_tonnes == null && (
                      <>
                        <input
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 w-24"
                          placeholder="Actual t"
                          value={actualDraft[plan.id] || ''}
                          onChange={e => setActualDraft(prev => ({ ...prev, [plan.id]: e.target.value }))}
                        />
                        <button className="bg-emerald-600 text-white px-2 py-1 rounded" onClick={() => recordActual(plan.id)}>Record actual</button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900/90 border-t border-slate-800 py-3 text-center text-xs text-slate-500 font-medium">
        MOIL Limited Enterprise Industrial Platform • SIH26009 • Local Database (`manganese_operations.db`) & ISRO/Sentinel Remote Sensing Linked
      </footer>

    </div>
  );
};

export default App;
