import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, Popup, Marker, ImageOverlay, Circle, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Sparkles, Info, Compass, Layers, MapPin, Radio, LocateFixed, Eye, EyeOff,
  Crosshair, ShieldCheck, Ruler, ChevronRight, Activity, Cpu, SlidersHorizontal, X,
  Grid, Map as MapIcon, Landmark, ArrowUpRight
} from 'lucide-react';
import { ProspectivityResponse, GeoJSONFeature, AnomalyPeak, GeologicalLineament } from '../types';

interface ReserveMapProps {
  prospectivityData: ProspectivityResponse | null;
  selectedSite: string;
  onSelectSite?: (siteName: string) => void;
  onSelectFeature?: (feature: GeoJSONFeature) => void;
  minConfidence?: number;
  onConfidenceChange?: (value: number) => void;
  satellite?: {
    satellite_constellation: string;
    last_pass_timestamp: string;
    cloud_cover_percent: number;
    status: string;
  } | null;
  directives?: {
    destination_location: string;
    source_location: string;
    equipment_count: number;
    bench_halted?: boolean;
    dest_lat?: number | null;
    dest_lng?: number | null;
    source_lat?: number | null;
    source_lng?: number | null;
    description: string;
  }[];
  onUploadBands?: (file: File) => void;
}

// 5 Major Manganese Reserve States of India Metadata
export const MANGANESE_STATES = [
  {
    key: 'Odisha',
    name: 'Odisha',
    share: '44% Share',
    sharePct: 44.0,
    rank: '#1 Largest National Reserves',
    flag: '🏛️',
    center: [22.1167, 85.3833] as [number, number],
    districts: ['Sundargarh', 'Keonjhar', 'Kalahandi', 'Koraput'],
    reservesMT: 96.4,
    baseGrade: 42.5,
    keyMines: ['Barbil Iron-Manganese Complex', 'Joda East', 'Koira Sector', 'Kasipur']
  },
  {
    key: 'Karnataka',
    name: 'Karnataka',
    share: '22% Share',
    sharePct: 22.0,
    rank: '#2 National Reserves',
    flag: '🏛️',
    center: [15.0833, 76.5500] as [number, number],
    districts: ['Ballari (Sandur)', 'Uttara Kannada', 'Chitradurga', 'Tumakuru'],
    reservesMT: 48.2,
    baseGrade: 38.6,
    keyMines: ['Sandur Manganese & Iron Ore (SMIORE)', 'Kumsi Mine', 'Supa']
  },
  {
    key: 'Madhya Pradesh',
    name: 'Madhya Pradesh',
    share: '13% Share',
    sharePct: 13.0,
    rank: 'Top Producer in India',
    flag: '🏛️',
    center: [21.8042, 80.1814] as [number, number],
    districts: ['Balaghat', 'Chhindwara'],
    reservesMT: 28.5,
    baseGrade: 45.8,
    keyMines: ['Balaghat Mine (Bharweli)', 'Ukwa Mine', 'Sitapatore']
  },
  {
    key: 'Maharashtra',
    name: 'Maharashtra',
    share: '8% Share',
    sharePct: 8.0,
    rank: 'MOIL Operations HQ',
    flag: '🏛️',
    center: [21.5453, 79.7021] as [number, number],
    districts: ['Bhandara', 'Nagpur'],
    reservesMT: 18.2,
    baseGrade: 41.2,
    keyMines: ['Dongri Buzurg Mine', 'Chikla Mine', 'Mansar', 'Kandri']
  },
  {
    key: 'Andhra Pradesh',
    name: 'Andhra Pradesh',
    share: '4% Share',
    sharePct: 4.0,
    rank: 'Key Eastern Coastal Belt',
    flag: '🏛️',
    center: [18.2833, 83.5333] as [number, number],
    districts: ['Srikakulam', 'Visakhapatnam'],
    reservesMT: 8.8,
    baseGrade: 36.8,
    keyMines: ['Garividi Ore Complex', 'Cheepurupalli', 'Kodur Sector']
  }
];

// Map center points for states & MOIL specific mines
const MINE_CENTERS: Record<string, [number, number]> = {
  'Madhya Pradesh': [21.8042, 80.1814],
  'Maharashtra': [21.5453, 79.7021],
  'Odisha': [22.1167, 85.3833],
  'Karnataka': [15.0833, 76.5500],
  'Andhra Pradesh': [18.2833, 83.5333],
  'Balaghat': [21.8042, 80.1814],
  'Dongri Buzurg': [21.5453, 79.7021],
  'Chikla': [21.5541, 79.7524]
};

// Component to dynamically re-center Leaflet map with smooth flyTo animation
const MapRecenter: React.FC<{ center: [number, number]; zoom?: number }> = ({ center, zoom = 13 }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { animate: true, duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};

// Custom SVG Icon creator for Anomaly Badges (H1..H4 in Red/Gold, L1..L2 in Blue)
const createAnomalyBadgeIcon = (tag: string, isHigh: boolean) => {
  const bgColor = isHigh ? '#dc2626' : '#2563eb';
  const borderColor = isHigh ? '#fbbf24' : '#60a5fa';
  const svgMarkup = `
    <div style="background-color: ${bgColor}; border: 2px solid ${borderColor}; color: white; font-weight: 900; font-size: 11px; width: 36px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 14px rgba(0,0,0,0.8); text-shadow: 0 1px 2px rgba(0,0,0,0.9); cursor: pointer; transition: transform 0.2s ease;">
      ${tag}
    </div>
  `;
  return L.divIcon({
    html: svgMarkup,
    className: 'custom-anomaly-badge',
    iconSize: [36, 28],
    iconAnchor: [18, 14]
  });
};

// Custom SVG Icon for User Precision Geolocation
const createCompassLocationIcon = () => {
  const svgMarkup = `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-9 h-9 rounded-full bg-cyan-500/40 animate-ping"></div>
      <div class="w-7 h-7 rounded-full bg-cyan-500 border-2 border-white shadow-2xl flex items-center justify-center text-slate-950 font-bold">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 8-8 8"/><path d="m8 8 8 8"/></svg>
      </div>
    </div>
  `;
  return L.divIcon({
    html: svgMarkup,
    className: 'custom-user-location-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
};

// Custom SVG Icon creator for HEMM equipment
const createHEMMIcon = (type: 'excavator' | 'dumper', status: 'active' | 'rerouted' | 'breakdown') => {
  const color = status === 'active' ? '#10b981' : status === 'rerouted' ? '#f59e0b' : '#f43f5e';
  const svgMarkup = type === 'excavator' 
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="bg-slate-950/95 p-1 rounded-full border border-slate-700 shadow-xl"><path d="M14 10l-2 1-3-3 2-2"/><path d="M10 17l-3.5-3.5"/><path d="m2 22 5-5"/><path d="M17 14l4-4"/><circle cx="17" cy="17" r="3"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="bg-slate-950/95 p-1 rounded-full border border-slate-700 shadow-xl"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M17 18h4a1 1 0 0 0 1-1v-5l-4-4h-3v10z"/></svg>`;

  return L.divIcon({
    html: svgMarkup,
    className: 'custom-hemm-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

/**
 * Generates an Anisotropic Geophysical Jet/Rainbow Spectral Heatmap Overlay.
 * Uses anisotropic distance transformation along Sausar Group Ore Strike angle (N60E / ~35 deg tilt).
 */
function createAnisotropicHeatmapUrl(centerLat: number, centerLng: number, features: GeoJSONFeature[], opacityScale: number = 0.75): { dataUrl: string; bounds: [[number, number], [number, number]] } {
  const canvas = document.createElement('canvas');
  const width = 600;
  const height = 600;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { dataUrl: '', bounds: [[0, 0], [0, 0]] };

  const latDelta = 0.028;
  const lngDelta = 0.038;

  const minLat = centerLat - latDelta;
  const maxLat = centerLat + latDelta;
  const minLng = centerLng - lngDelta;
  const maxLng = centerLng + lngDelta;

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  const zonePoints = features.map(f => {
    const coords = f.geometry.coordinates[0];
    let sumLat = 0, sumLng = 0;
    coords.forEach(c => { sumLng += c[0]; sumLat += c[1]; });
    return {
      lat: sumLat / coords.length,
      lng: sumLng / coords.length,
      mmpi: f.properties.mmpi_score,
      mn: f.properties.mn_content_percent
    };
  });

  const strikeAngle = -35 * (Math.PI / 180);
  const cosA = Math.cos(strikeAngle);
  const sinA = Math.sin(strikeAngle);

  for (let y = 0; y < height; y++) {
    const lat = maxLat - (y / height) * (maxLat - minLat);
    for (let x = 0; x < width; x++) {
      const lng = minLng + (x / width) * (maxLng - minLng);

      let weightedSum = 0;
      let totalWeight = 0;

      for (const pt of zonePoints) {
        const dLat = (lat - pt.lat) * 111.0;
        const dLng = (lng - pt.lng) * 111.0 * Math.cos(lat * Math.PI / 180);

        const rx = dLng * cosA - dLat * sinA;
        const ry = dLng * sinA + dLat * cosA;

        const distSq = (rx * rx / 3.2) + (ry * ry / 0.85) + 0.0001;
        const weight = 1.0 / Math.pow(distSq, 1.15);

        weightedSum += pt.mmpi * weight;
        totalWeight += weight;
      }

      const val = Math.min(1.0, Math.max(0.0, weightedSum / Math.max(totalWeight, 0.0001)));

      let r = 0, g = 0, b = 0;
      if (val < 0.20) {
        const t = val / 0.20;
        r = Math.round(90 * (1 - t));
        g = 0;
        b = Math.round(120 + 135 * t);
      } else if (val < 0.42) {
        const t = (val - 0.20) / 0.22;
        r = 0;
        g = Math.round(240 * t);
        b = Math.round(255 * (1 - t));
      } else if (val < 0.65) {
        const t = (val - 0.42) / 0.23;
        r = Math.round(255 * t);
        g = Math.round(240 + 15 * (1 - t));
        b = 0;
      } else if (val < 0.85) {
        const t = (val - 0.65) / 0.20;
        r = 255;
        g = Math.round(240 * (1 - t));
        b = 0;
      } else {
        const t = (val - 0.85) / 0.15;
        r = 255;
        g = 0;
        b = Math.round(255 * t);
      }

      const idx = (y * width + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = Math.round(200 * opacityScale);
    }
  }

  ctx.putImageData(imgData, 0, 0);

  return {
    dataUrl: canvas.toDataURL(),
    bounds: [[minLat, minLng], [maxLat, maxLng]]
  };
}

export const ReserveMap: React.FC<ReserveMapProps> = ({
  prospectivityData,
  selectedSite,
  onSelectSite,
  minConfidence = 0.5,
  onConfidenceChange,
  satellite,
  directives = [],
  onUploadBands
}) => {
  // Navigation / View mode: 'map' (interactive map) | 'grid' (all 5 state cards comparison)
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');

  // Layer Visibility Controls
  const [basemapStyle, setBasemapStyle] = useState<'satellite' | 'dark' | 'terrain'>('satellite');
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showContours, setShowContours] = useState<boolean>(true);
  const [showFaults, setShowFaults] = useState<boolean>(true);
  const [showAnomalies, setShowAnomalies] = useState<boolean>(true);
  const [showPolygons, setShowPolygons] = useState<boolean>(true);
  const [showHEMM, setShowHEMM] = useState<boolean>(true);
  const [showLayerPanel, setShowLayerPanel] = useState<boolean>(false);

  // Inspector Drawer State
  const [inspectedFeature, setInspectedFeature] = useState<GeoJSONFeature | null>(null);

  // Geolocation State
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [userAccuracy, setUserAccuracy] = useState<number>(100);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Active Map Center
  const activeCenter = MINE_CENTERS[selectedSite] || MINE_CENTERS['Odisha'];

  // Current active state info
  const activeStateInfo = useMemo(() => {
    return MANGANESE_STATES.find(s => 
      s.key.toLowerCase() === selectedSite.toLowerCase() ||
      selectedSite.toLowerCase().includes(s.key.toLowerCase()) ||
      s.key.toLowerCase().includes(selectedSite.toLowerCase())
    ) || MANGANESE_STATES[0];
  }, [selectedSite]);

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setUserAccuracy(pos.coords.accuracy || 50);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        alert(`Could not acquire GPS location: ${err.message}. Defaulting to state mine coordinates.`);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const heatmapOverlay = useMemo(() => {
    if (!prospectivityData?.features || prospectivityData.features.length === 0) return null;
    return createAnisotropicHeatmapUrl(activeCenter[0], activeCenter[1], prospectivityData.features);
  }, [prospectivityData, activeCenter]);

  const anomalyPeaks: AnomalyPeak[] = prospectivityData?.summary?.anomaly_peaks || [
    { tag: 'H1', lat: activeCenter[0] + 0.003, lng: activeCenter[1] + 0.002, type: 'HIGH', mmpi_score: 0.94, mn_content_percent: 45.8, name: `${activeStateInfo.name} Primary High-Grade Peak` },
    { tag: 'H2', lat: activeCenter[0] - 0.004, lng: activeCenter[1] + 0.005, type: 'HIGH', mmpi_score: 0.89, mn_content_percent: 43.2, name: `${activeStateInfo.name} Shaft Level 5 Ore Body` },
    { tag: 'H3', lat: activeCenter[0] + 0.007, lng: activeCenter[1] - 0.003, type: 'HIGH', mmpi_score: 0.82, mn_content_percent: 37.5, name: `${activeStateInfo.name} East Pit Psilomelane Anomaly` },
    { tag: 'L1', lat: activeCenter[0] - 0.005, lng: activeCenter[1] - 0.006, type: 'LOW', mmpi_score: 0.78, mn_content_percent: 35.8, name: `${activeStateInfo.name} South Footwall Contact` },
    { tag: 'L2', lat: activeCenter[0] + 0.008, lng: activeCenter[1] + 0.007, type: 'LOW', mmpi_score: 0.68, mn_content_percent: 29.4, name: `${activeStateInfo.name} Overburden Basin` }
  ];

  const lineaments: GeologicalLineament[] = prospectivityData?.summary?.geological_lineaments || [
    { id: 'LM-1', name: `${activeStateInfo.name} Regional Fault LM-1`, coords: [[activeCenter[0] + 0.016, activeCenter[1] - 0.014], [activeCenter[0] + 0.004, activeCenter[1] - 0.002], [activeCenter[0] - 0.010, activeCenter[1] + 0.012], [activeCenter[0] - 0.016, activeCenter[1] + 0.018]] },
    { id: 'LM-2', name: `${activeStateInfo.name} Main Ore Thrust LM-2`, coords: [[activeCenter[0] + 0.014, activeCenter[1] - 0.007], [activeCenter[0] + 0.001, activeCenter[1] + 0.002], [activeCenter[0] - 0.012, activeCenter[1] + 0.009]] },
    { id: 'LM-3', name: `${activeStateInfo.name} Transverse Lineament LM-3`, coords: [[activeCenter[0] + 0.009, activeCenter[1] - 0.020], [activeCenter[0] - 0.002, activeCenter[1] - 0.002], [activeCenter[0] - 0.011, activeCenter[1] + 0.016]] }
  ];

  const contourLines = [
    { level: 'MMPI 0.85 (High Peak)', coords: [[activeCenter[0] + 0.006, activeCenter[1] - 0.006], [activeCenter[0] + 0.004, activeCenter[1] + 0.004], [activeCenter[0] - 0.006, activeCenter[1] + 0.008]], color: '#fbbf24' },
    { level: 'MMPI 0.60 (Medium Horizon)', coords: [[activeCenter[0] + 0.010, activeCenter[1] - 0.010], [activeCenter[0] + 0.007, activeCenter[1] + 0.008], [activeCenter[0] - 0.009, activeCenter[1] + 0.012]], color: '#38bdf8' }
  ];

  const getPolygonStyle = (mnContent: number) => {
    if (mnContent >= 42.0) {
      return { fillColor: '#f59e0b', fillOpacity: 0.30, color: '#fbbf24', weight: 2.5, dashArray: '4, 4' };
    } else if (mnContent >= 35.0) {
      return { fillColor: '#8b5cf6', fillOpacity: 0.25, color: '#a78bfa', weight: 2 };
    } else {
      return { fillColor: '#64748b', fillOpacity: 0.20, color: '#94a3b8', weight: 1.5 };
    }
  };

  const sampleFleet = [
    { id: 'EX-01', type: 'excavator' as const, status: 'active' as const, lat: activeCenter[0] + 0.002, lng: activeCenter[1] + 0.003, label: 'Hitachi EX1200 - Main Pit Bench 4 (Active)' },
    { id: 'EX-03', type: 'excavator' as const, status: 'rerouted' as const, lat: activeCenter[0] - 0.003, lng: activeCenter[1] + 0.004, label: 'Komatsu PC800 - Rerouted to Access Ramp' },
    { id: 'DT-14', type: 'dumper' as const, status: 'active' as const, lat: activeCenter[0] + 0.001, lng: activeCenter[1] + 0.001, label: 'BEML 60T Dumper - High Grade Haulage' }
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3 flex flex-col min-h-[640px] relative shadow-2xl backdrop-blur-xl font-sans">
      
      {/* State Switcher Top Toolbar */}
      <div className="flex flex-col space-y-2 mb-3 border-b border-slate-800/80 pb-2.5">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm">
              <Landmark className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                Indian Manganese Reserve GIS Hub
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-mono px-2 py-0.5 rounded font-bold">
                  5 STATES ACTIVE
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                Switch state maps to inspect district boundaries, MMPI spectral heatmaps, and geological fault lines
              </p>
            </div>
          </div>

          {/* View Mode Toggle: Interactive Map vs 5-State Grid */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('map')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center space-x-1 transition-all ${
                viewMode === 'map' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map View</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center space-x-1 transition-all ${
                viewMode === 'grid' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>5-State Grid</span>
            </button>
          </div>
        </div>

        {/* 5-State Interactive Buttons */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pt-1 pb-1 custom-scrollbar">
          {MANGANESE_STATES.map((st) => {
            const isSelected = activeStateInfo.key === st.key;
            return (
              <button
                key={st.key}
                onClick={() => {
                  if (onSelectSite) onSelectSite(st.key);
                  setViewMode('map');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap border shrink-0 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 scale-105'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-amber-500/50 hover:text-slate-100'
                }`}
              >
                <span>{st.flag}</span>
                <span>{st.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-black ${
                  isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-900 text-amber-400 border border-slate-800'
                }`}>
                  {st.share}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* 5-State Comparison Grid Mode */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 flex-1 p-1">
          {MANGANESE_STATES.map((st) => {
            const isSelected = activeStateInfo.key === st.key;
            return (
              <div
                key={st.key}
                onClick={() => {
                  if (onSelectSite) onSelectSite(st.key);
                  setViewMode('map');
                }}
                className={`bg-slate-950/80 border rounded-xl p-4 shadow-lg flex flex-col justify-between hover:border-amber-500/50 transition-all cursor-pointer group ${
                  isSelected ? 'border-amber-500 bg-amber-950/10' : 'border-slate-800/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                      {st.rank}
                    </span>
                    <span className="text-sm font-black text-amber-400 font-mono">{st.share}</span>
                  </div>

                  <h4 className="text-base font-black text-slate-100 mt-2.5 group-hover:text-amber-400 transition-colors flex items-center justify-between">
                    <span>{st.name} Reserve Belt</span>
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
                  </h4>

                  <div className="text-[11px] text-slate-400 mt-1 space-y-1">
                    <div><span className="text-slate-500 font-semibold">Districts:</span> <span className="text-slate-200 font-medium">{st.districts.join(', ')}</span></div>
                    <div><span className="text-slate-500 font-semibold">Key Mines:</span> <span className="text-slate-300 font-medium">{st.keyMines.slice(0, 2).join(', ')}</span></div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3.5 pt-2.5 border-t border-slate-800/80 font-mono text-[11px]">
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase font-sans font-bold">Est Reserves</span>
                      <strong className="text-amber-400 font-bold">{st.reservesMT} MT</strong>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase font-sans font-bold">Avg Base Grade</span>
                      <strong className="text-emerald-400 font-bold">{st.baseGrade}% Mn</strong>
                    </div>
                  </div>
                </div>

                <button className="w-full mt-3.5 bg-slate-900 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-200 font-bold py-1.5 rounded-lg text-xs flex items-center justify-center space-x-1 transition-all">
                  <span>Explore {st.name} GIS Satellite Map</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* Interactive GIS Leaflet Map Mode */
        <div className="rounded-xl overflow-hidden relative border border-slate-800/80 shadow-inner flex flex-col min-h-[540px]">
          
          {/* State Geological Summary Ribbon inside Map */}
          <div className="bg-slate-950/90 border-b border-slate-800 px-3 py-1.5 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2 z-[400]">
            <div className="flex items-center space-x-2">
              <span className="font-black text-amber-400 uppercase tracking-tight">{activeStateInfo.name} Belt</span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] text-slate-300">
                Districts: <strong className="text-slate-100">{activeStateInfo.districts.join(', ')}</strong>
              </span>
            </div>
            <div className="flex items-center space-x-3 text-[11px]">
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono font-bold">
                {activeStateInfo.rank} ({activeStateInfo.share})
              </span>
              {satellite && (
                <span className="text-slate-400 font-mono">
                  {satellite.satellite_constellation} · pass {satellite.last_pass_timestamp.slice(0, 16)} · cloud {satellite.cloud_cover_percent}% · {satellite.status}
                </span>
              )}
              <span className="text-emerald-400 font-mono font-bold">
                Base Grade: {activeStateInfo.baseGrade}% Mn
              </span>
            </div>
          </div>

          <div className="w-full h-[500px] relative">
            <MapContainer
              center={activeCenter}
              zoom={13}
              scrollWheelZoom={true}
              style={{ width: '100%', height: '500px', minHeight: '500px' }}
            >
              <MapRecenter center={activeCenter} />
              {directives.filter(d => (d.bench_halted ? d.source_lat : d.dest_lat) != null).map((d, idx) => (
                <CircleMarker
                  key={`dir-${idx}`}
                  center={[
                    (d.bench_halted ? d.source_lat : d.dest_lat) as number,
                    (d.bench_halted ? d.source_lng : d.dest_lng) as number
                  ]}
                  radius={d.bench_halted ? 10 : 8}
                  pathOptions={{ color: d.bench_halted ? '#f43f5e' : '#34d399', fillOpacity: 0.85 }}
                >
                  <Popup>
                    <div className="text-xs">
                      <strong>{d.bench_halted ? 'Halted bench' : 'Fleet move'}</strong>
                      <div>{d.source_location} → {d.destination_location}</div>
                      <div>{d.bench_halted ? 'No extra trucks or blasting' : `${d.equipment_count} teams`}</div>
                      <div>{d.description}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

              {/* Basemap Selection */}
              {basemapStyle === 'satellite' ? (
                <TileLayer
                  key="esri-satellite"
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="&copy; Esri, Maxar, ISRO"
                />
              ) : basemapStyle === 'dark' ? (
                <TileLayer
                  key="carto-dark"
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution="&copy; OpenStreetMap, CartoDB"
                />
              ) : (
                <TileLayer
                  key="osm-terrain"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
              )}

              {/* Anisotropic MMPI Mineral Heatmap Overlay */}
              {showHeatmap && heatmapOverlay?.dataUrl && (
                <ImageOverlay
                  url={heatmapOverlay.dataUrl}
                  bounds={heatmapOverlay.bounds}
                  opacity={0.78}
                />
              )}

              {/* Iso-Prospectivity Contours */}
              {showContours && contourLines.map((ctl, idx) => (
                <Polyline
                  key={`contour-${idx}`}
                  positions={ctl.coords as [number, number][]}
                  pathOptions={{
                    color: ctl.color,
                    weight: 1.8,
                    dashArray: '4, 4',
                    opacity: 0.95
                  }}
                >
                  <Popup>
                    <div className="p-1.5 font-sans text-xs font-bold text-slate-100">
                      Iso-MMPI Level: <span className="font-mono text-amber-400">{ctl.level}</span>
                    </div>
                  </Popup>
                </Polyline>
              ))}

              {/* Geological Fault Lineaments (LM-1, LM-2, LM-3) */}
              {showFaults && lineaments.map(lm => (
                <Polyline
                  key={lm.id}
                  positions={lm.coords as [number, number][]}
                  pathOptions={{
                    color: '#ffffff',
                    weight: 3.2,
                    dashArray: '8, 6',
                    opacity: 0.95
                  }}
                >
                  <Popup>
                    <div className="p-1.5 font-sans text-xs font-bold text-slate-100">
                      <span className="text-amber-400 font-mono">{lm.id}:</span> {lm.name}
                      <div className="text-[10px] text-slate-300 font-normal mt-0.5">{activeStateInfo.name} Structural Lineament</div>
                    </div>
                  </Popup>
                </Polyline>
              ))}

              {/* Anomaly Badges (H1..H4, L1..L2) */}
              {showAnomalies && anomalyPeaks.map(pk => (
                <Marker
                  key={pk.tag}
                  position={[pk.lat, pk.lng]}
                  icon={createAnomalyBadgeIcon(pk.tag, pk.type === 'HIGH')}
                  eventHandlers={{
                    click: () => {
                      if (prospectivityData?.features) {
                        const match = prospectivityData.features.find(f => f.properties.anomaly_tag === pk.tag);
                        if (match) setInspectedFeature(match);
                      }
                    }
                  }}
                >
                  <Popup>
                    <div className="p-1.5 font-sans text-xs">
                      <div className="flex items-center justify-between border-b border-slate-700 pb-1 mb-1 font-bold">
                        <span className="text-amber-400">{pk.tag}: {pk.name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px] mt-1 text-slate-200">
                        <div>Mn Content: <strong className="text-emerald-400 font-mono">{pk.mn_content_percent}%</strong></div>
                        <div>MMPI Score: <strong className="text-amber-400 font-mono">{pk.mmpi_score}</strong></div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* User Precision GPS Geolocation Marker */}
              {userLocation && (
                <>
                  <Marker position={userLocation} icon={createCompassLocationIcon()}>
                    <Popup>
                      <div className="p-1.5 font-sans text-xs">
                        <div className="font-bold text-cyan-400 text-sm">Your WGS84 GPS Position</div>
                        <div className="text-slate-300 mt-1 font-mono">Lat: {userLocation[0].toFixed(5)}° N</div>
                        <div className="text-slate-300 font-mono">Lng: {userLocation[1].toFixed(5)}° E</div>
                        <div className="text-[10px] text-emerald-400 mt-1">Accuracy: ±{Math.round(userAccuracy)}m</div>
                      </div>
                    </Popup>
                  </Marker>
                  <Circle
                    center={userLocation}
                    radius={userAccuracy}
                    pathOptions={{ color: '#06b6d4', fillColor: '#06b6d4', fillOpacity: 0.15, weight: 1.5 }}
                  />
                </>
              )}

              {/* GeoJSON Irregular Polygon Overlays */}
              {showPolygons && prospectivityData?.features.map((feature, idx) => {
                const props = feature.properties;
                const coords = feature.geometry.coordinates[0].map(c => [c[1], c[0]] as [number, number]);
                const style = getPolygonStyle(props.mn_content_percent);

                return (
                  <Polygon
                    key={props.zone_id || idx}
                    positions={coords}
                    pathOptions={style}
                    eventHandlers={{
                      click: () => setInspectedFeature(feature)
                    }}
                  />
                );
              })}

              {/* Active HEMM Fleet Markers */}
              {showHEMM && sampleFleet.map(unit => (
                <Marker
                  key={unit.id}
                  position={[unit.lat, unit.lng]}
                  icon={createHEMMIcon(unit.type, unit.status)}
                >
                  <Popup>
                    <div className="p-1.5 font-sans text-xs">
                      <div className="font-bold text-slate-100">{unit.id} ({unit.type})</div>
                      <div className="text-slate-300 text-[11px] mt-0.5">{unit.label}</div>
                      <div className={`mt-1 font-bold text-[10px] uppercase ${
                        unit.status === 'active' ? 'text-emerald-400' : unit.status === 'rerouted' ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        Status: {unit.status}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Top Controls Overlay */}
            <div className="absolute top-3 right-3 z-[400] flex items-center space-x-2">
              <button
                onClick={() => setShowLayerPanel(!showLayerPanel)}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-all shadow-lg ${
                  showLayerPanel
                    ? 'bg-amber-500 text-slate-950 border border-amber-400'
                    : 'bg-slate-950/90 border border-slate-800 text-slate-300 hover:text-slate-100 backdrop-blur-md'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>GIS Layers</span>
              </button>

              <button
                onClick={handleLocateUser}
                disabled={isLocating}
                className="bg-slate-950/90 border border-slate-800 hover:border-cyan-500/50 text-cyan-400 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 shadow-lg backdrop-blur-md active:scale-95 disabled:opacity-50"
                title="Acquire Precision WGS84 GPS Location"
              >
                <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-cyan-400' : ''}`} />
                <span>{isLocating ? 'GPS...' : 'My Location'}</span>
              </button>
            </div>

            {/* Top-Left WGS84 Coordinate HUD Box */}
            <div className="absolute top-3 left-3 z-[400] bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-2 text-[10px] font-mono text-slate-300 shadow-xl flex items-center space-x-3">
              <div className="flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>WGS84: <strong>{activeCenter[0].toFixed(4)}° N, {activeCenter[1].toFixed(4)}° E</strong></span>
              </div>
              <div className="border-l border-slate-800 pl-3 flex items-center space-x-2">
                <span className="text-emerald-400 font-bold">0.5m Maxar</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">ELEV: 340m</span>
              </div>
            </div>

            {/* Collapsible GIS Layer Manager Sidebar Panel */}
            {showLayerPanel && (
              <div className="absolute top-14 right-3 z-[450] bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-xl p-3.5 shadow-2xl w-64 text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-100 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    GIS Layer Visibility Suite
                  </span>
                  <button onClick={() => setShowLayerPanel(false)} className="text-slate-400 hover:text-slate-100">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Basemap Switcher */}
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500 mb-1.5">Basemap Tile Source</div>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => setBasemapStyle('satellite')}
                      className={`py-1 rounded font-bold text-[10px] ${
                        basemapStyle === 'satellite' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      Satellite
                    </button>
                    <button
                      onClick={() => setBasemapStyle('dark')}
                      className={`py-1 rounded font-bold text-[10px] ${
                        basemapStyle === 'dark' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      Dark Canvas
                    </button>
                    <button
                      onClick={() => setBasemapStyle('terrain')}
                      className={`py-1 rounded font-bold text-[10px] ${
                        basemapStyle === 'terrain' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      OSM
                    </button>
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-1.5 pt-1">
                  <label className="flex items-center justify-between text-slate-300 cursor-pointer">
                    <span>MMPI Spectral Heatmap</span>
                    <input type="checkbox" checked={showHeatmap} onChange={e => setShowHeatmap(e.target.checked)} className="accent-amber-500 cursor-pointer" />
                  </label>

                  <label className="flex items-center justify-between text-slate-300 cursor-pointer">
                    <span>Iso-Prospectivity Contours</span>
                    <input type="checkbox" checked={showContours} onChange={e => setShowContours(e.target.checked)} className="accent-amber-500 cursor-pointer" />
                  </label>

                  <label className="flex items-center justify-between text-slate-300 cursor-pointer">
                    <span>Fault Lineaments (LM-1..3)</span>
                    <input type="checkbox" checked={showFaults} onChange={e => setShowFaults(e.target.checked)} className="accent-amber-500 cursor-pointer" />
                  </label>

                  <label className="flex items-center justify-between text-slate-300 cursor-pointer">
                    <span>Anomaly Peak Badges (H1..H4)</span>
                    <input type="checkbox" checked={showAnomalies} onChange={e => setShowAnomalies(e.target.checked)} className="accent-amber-500 cursor-pointer" />
                  </label>

                  <label className="flex items-center justify-between text-slate-300 cursor-pointer">
                    <span>Ore Body Polygons</span>
                    <input type="checkbox" checked={showPolygons} onChange={e => setShowPolygons(e.target.checked)} className="accent-amber-500 cursor-pointer" />
                  </label>

                  <label className="flex flex-col gap-1 text-slate-300">
                    <span>Min confidence {minConfidence.toFixed(2)}</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={minConfidence}
                      onChange={e => onConfidenceChange?.(Number(e.target.value))}
                      className="accent-amber-500"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-slate-300 cursor-pointer">
                    <span>Upload band CSV (fallback if empty)</span>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      className="text-[10px]"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) onUploadBands?.(file);
                      }}
                    />
                  </label>
                  <label className="flex items-center justify-between text-slate-300 cursor-pointer">
                    <span>Active HEMM Machinery</span>
                    <input type="checkbox" checked={showHEMM} onChange={e => setShowHEMM(e.target.checked)} className="accent-amber-500 cursor-pointer" />
                  </label>
                </div>
              </div>
            )}

            {/* Feature Detail Inspector Drawer */}
            {inspectedFeature && (
              <div className="absolute top-14 left-3 z-[450] bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-xl p-4 shadow-2xl w-80 text-xs space-y-3 font-sans">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="font-bold text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    Ore Zone Geotechnical Inspector
                  </div>
                  <button onClick={() => setInspectedFeature(null)} className="text-slate-400 hover:text-slate-100">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="font-bold text-slate-100 text-sm">{inspectedFeature.properties.grade_name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{inspectedFeature.properties.zone_id} • District: {inspectedFeature.properties.district}</div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 font-mono text-[11px]">
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase font-sans font-bold">Mn Content</span>
                      <strong className="text-emerald-400 text-sm">{inspectedFeature.properties.mn_content_percent}%</strong>
                    </div>

                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase font-sans font-bold">MMPI Score</span>
                      <strong className="text-amber-400 text-sm">{inspectedFeature.properties.mmpi_score}</strong>
                    </div>

                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase font-sans font-bold">Est Depth</span>
                      <span className="text-slate-200">{inspectedFeature.properties.depth_meters} m</span>
                    </div>

                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase font-sans font-bold">Stripping Ratio</span>
                      <span className="text-slate-200">{inspectedFeature.properties.stripping_ratio}:1</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-[11px] text-slate-300 font-medium space-y-1">
                    <div><span className="text-slate-500">Reserves:</span> <strong className="text-amber-300 font-mono">{(inspectedFeature.properties.estimated_reserve_tonnes / 1000000).toFixed(2)} MT</strong></div>
                    <div><span className="text-slate-500">Accessibility:</span> <span className="text-emerald-400 font-semibold">{inspectedFeature.properties.accessibility_rating}</span></div>
                    <div><span className="text-slate-500">Confidence:</span> <span className="font-mono">{inspectedFeature.properties.confidence}</span></div>
                    <div><span className="text-slate-500">SWIR/VNIR:</span> <span className="font-mono">{inspectedFeature.properties.spectral_ratio_swir_vnir}</span></div>
                    <div><span className="text-slate-500">NIR/Green:</span> <span className="font-mono">{inspectedFeature.properties.spectral_ratio_nir_green}</span></div>
                    <div className="text-[10px] text-slate-500">MMPI = 0.45*(SWIR/VNIR) + 0.35*(NIR/Green) + 0.20*Ferrous, clipped to 0.05–0.98.</div>
                  </div>
                </div>
              </div>
            )}

            {/* Continuous Geophysical Colorbar Legend */}
            <div className="absolute bottom-3 right-3 z-[400] bg-slate-950/95 backdrop-blur-md border border-slate-800/90 rounded-xl p-2.5 shadow-2xl text-xs text-slate-200 w-44">
              <div className="font-bold text-slate-100 text-[10px] uppercase tracking-wider mb-1.5 text-center border-b border-slate-800 pb-1 flex items-center justify-center gap-1">
                <Info className="w-3 h-3 text-amber-400" />
                MMPI Mineral Scale
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-3.5 h-32 rounded border border-slate-700 bg-gradient-to-t from-purple-800 via-blue-600 via-emerald-500 via-yellow-400 via-red-600 to-fuchsia-500 shadow-inner" />

                <div className="flex-1 text-[9px] font-mono space-y-2 font-bold text-slate-300">
                  <div className="flex items-center justify-between text-fuchsia-400">
                    <span>1.00</span> <span>&gt;44% Mn</span>
                  </div>
                  <div className="flex items-center justify-between text-rose-400">
                    <span>0.80</span> <span>42% Mn</span>
                  </div>
                  <div className="flex items-center justify-between text-yellow-400">
                    <span>0.60</span> <span>38% Mn</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-400">
                    <span>0.40</span> <span>35% Mn</span>
                  </div>
                  <div className="flex items-center justify-between text-blue-400">
                    <span>0.20</span> <span>30% Mn</span>
                  </div>
                  <div className="flex items-center justify-between text-purple-400">
                    <span>0.00</span> <span>&lt;25% Mn</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Left Scale */}
            <div className="absolute bottom-3 left-3 z-[400] bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-lg px-2 py-1 text-[9px] font-mono text-slate-300 shadow-md flex items-center gap-2">
              <div className="w-6 h-1 bg-amber-400 border border-slate-900 rounded-sm" />
              <span>Scale: 0 - 5 km</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ReserveMap;
