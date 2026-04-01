import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Activity, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  Terminal, 
  Settings, 
  Shield, 
  Wifi, 
  Database,
  ChevronRight,
  Monitor
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as d3 from 'd3-geo';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- CONSTANTS ---
const TARGET_FREQ = "146.520 MHz";
const LOGO_RACAM = `
          _______  _______  _______  _______  _______ 
         (  ____ )(  ___  )(  ____ \\(  ___  )(       )
         | (    )|| (   ) || (    \\/| (   ) || () () |
         | (____)|| (___) || |      | (___) || || || |
         |     __)|  ___  || |      |  ___  || |(_)| |
         | (\\ (   | (   ) || |      | (   ) || |   | |
         | ) \\ \\__| )   ( || (____/\\| )   ( || )   ( |
         |/   \\__/|/     \\|(_______/|/     \\||/     \\|
                   [ CLOUD - MÓDULO DECISOR ]
`;

interface LogEntry {
  id: string;
  timestampLocal: string;
  timestampUtc: string;
  freq: string;
  grid: string;
  coords: string;
  lat: number;
  lon: number;
  accuracy: string;
  status: 'ACTIVA' | 'IDLE';
  expiresAt: number;
}

// --- HELPERS ---
function latLonToGrid(lat: number, lon: number): string {
  const lon_adj = lon + 180;
  const lat_adj = lat + 90;

  const f1 = String.fromCharCode(65 + Math.floor(lon_adj / 20));
  const f2 = String.fromCharCode(65 + Math.floor(lat_adj / 10));

  const s1 = Math.floor((lon_adj % 20) / 2);
  const s2 = Math.floor(lat_adj % 10);

  const ss1 = String.fromCharCode(97 + Math.floor((lon_adj % 2) * 12));
  const ss2 = String.fromCharCode(97 + Math.floor((lat_adj % 1) * 24));

  return `${f1}${f2}${s1}${s2}${ss1}${ss2}`;
}

// --- COMPONENTS ---

const WorldMap = ({ activeDetections }: { activeDetections: LogEntry[] }) => {
  const width = 800;
  const height = 400;
  
  // Equirectangular projection for "planisphere" scale
  const projection = d3.geoEquirectangular()
    .scale(width / (2 * Math.PI))
    .translate([width / 2, height / 2]);

  // Grid lines (Maidenhead Fields are 20deg lon x 10deg lat)
  const lonLines = Array.from({ length: 19 }, (_, i) => -180 + i * 20);
  const latLines = Array.from({ length: 19 }, (_, i) => -90 + i * 10);

  return (
    <div className="relative bg-zinc-950 border border-zinc-800 rounded-sm overflow-hidden aspect-[2/1] w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full opacity-80">
        {/* Background Grid */}
        <g stroke="#18181b" strokeWidth="0.5">
          {lonLines.map(lon => {
            const [x] = projection([lon, 0]) || [0];
            return <line key={`lon-${lon}`} x1={x} y1={0} x2={x} y2={height} />;
          })}
          {latLines.map(lat => {
            const [, y] = projection([0, lat]) || [0];
            return <line key={`lat-${lat}`} x1={0} y1={y} x2={width} y2={y} />;
          })}
        </g>

        {/* World Outlines (Simplified) */}
        <path
          d="M0,0 L800,0 L800,400 L0,400 Z"
          fill="transparent"
          stroke="#27272a"
          strokeWidth="1"
        />
        
        {/* Active Detections */}
        {activeDetections.map(det => {
          const [x, y] = projection([det.lon, det.lat]) || [0, 0];
          return (
            <g key={det.id}>
              <circle
                cx={x}
                cy={y}
                r="4"
                fill="#ef4444"
                className="animate-pulse"
              />
              <circle
                cx={x}
                cy={y}
                r="12"
                fill="transparent"
                stroke="#ef4444"
                strokeWidth="1"
                className="animate-ping opacity-20"
              />
            </g>
          );
        })}
      </svg>
      
      {/* Overlay Labels */}
      <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
        <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest bg-black/50 px-1">Planisphere Grid Overlay</span>
        <span className="text-[8px] font-mono text-red-500 uppercase tracking-widest bg-black/50 px-1">Active Nodes (10m Persistence)</span>
      </div>
    </div>
  );
};

const Header = () => (
  <div className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md p-4 flex items-center justify-between sticky top-0 z-50">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 flex items-center justify-center rounded-sm overflow-hidden">
        <img 
          src="https://storage.googleapis.com/ai-studio-static-assets/input_file_0.png" 
          alt="RACAM Logo" 
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
        />
      </div>
      <div>
        <h1 className="text-zinc-100 font-bold tracking-tighter text-lg leading-none">Monitoreo Mundial 146.520 MHz</h1>
        <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-mono mt-1">Frecuencia Internacional de Encuentro</p>
      </div>
    </div>
    <div className="flex items-center gap-6 font-mono text-[11px]">
      <div className="flex flex-col items-end">
        <span className="text-zinc-500 uppercase">Local Time</span>
        <span className="text-zinc-200">{format(new Date(), 'HH:mm:ss')}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-zinc-500 uppercase">UTC Offset</span>
        <span className="text-zinc-200">Z+00:00</span>
      </div>
      <div className="h-8 w-[1px] bg-zinc-800 mx-2" />
      <div className="flex items-center gap-2 text-emerald-500">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="uppercase tracking-widest">System Online</span>
      </div>
    </div>
  </div>
);

const StatCard = ({ label, value, icon: Icon, color = "zinc" }: { label: string, value: string, icon: any, color?: string }) => (
  <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-sm hover:border-zinc-700 transition-colors group">
    <div className="flex items-start justify-between mb-3">
      <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-mono">{label}</span>
      <Icon className={cn("w-4 h-4", {
        "text-red-500": color === "red",
        "text-emerald-500": color === "emerald",
        "text-blue-500": color === "blue",
        "text-zinc-500": color === "zinc",
      })} />
    </div>
    <div className="text-2xl font-mono font-bold text-zinc-100 tracking-tight group-hover:text-white transition-colors">
      {value}
    </div>
  </div>
);

const SignalChart = () => {
  const [data, setData] = useState<{ time: string, val: number }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const newData = [...prev, { 
          time: format(new Date(), 'HH:mm:ss'), 
          val: Math.floor(Math.random() * 40) + 20 
        }].slice(-20);
        return newData;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-[200px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis dataKey="time" hide />
          <YAxis hide domain={[0, 100]} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', fontSize: '10px', fontFamily: 'monospace' }}
            itemStyle={{ color: '#ef4444' }}
          />
          <Area type="monotone" dataKey="val" stroke="#dc2626" fillOpacity={1} fill="url(#colorVal)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeDetections, setActiveDetections] = useState<LogEntry[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastDetection, setLastDetection] = useState<LogEntry | null>(null);
  const [currentCoords, setCurrentCoords] = useState("-26.8241, -65.2226");
  const [currentLat, setCurrentLat] = useState(-26.8241);
  const [currentLon, setCurrentLon] = useState(-65.2226);
  const [currentGrid, setCurrentGrid] = useState("FE43ub");
  const [currentAccuracy, setCurrentAccuracy] = useState<string>("N/A");
  const [isFetchingGeo, setIsFetchingGeo] = useState(false);
  const [customAudioBuffer, setCustomAudioBuffer] = useState<AudioBuffer | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFileName(file.name);
    const ctx = initAudioContext();
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      setCustomAudioBuffer(audioBuffer);
    } catch (error) {
      console.error("Error decoding audio file:", error);
      alert("Error decoding audio file. Please ensure it is a valid audio format.");
    }
  };

  const fetchGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsFetchingGeo(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const coords = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        const grid = latLonToGrid(lat, lon);
        
        setCurrentLat(lat);
        setCurrentLon(lon);
        setCurrentCoords(coords);
        setCurrentGrid(grid);
        setCurrentAccuracy(position.coords.accuracy ? `${position.coords.accuracy.toFixed(1)}m` : "N/A");
        setIsFetchingGeo(false);
      },
      (error) => {
        console.error("Error fetching geolocation:", error);
        // Don't alert on auto-fetch to avoid annoying user if blocked
        setIsFetchingGeo(false);
      }
    );
  };

  // Auto-fetch on load
  useEffect(() => {
    fetchGeolocation();
  }, []);

  // Cleanup active detections every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setActiveDetections(prev => prev.filter(d => d.expiresAt > now));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const playAlertSound = () => {
    const ctx = initAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    if (customAudioBuffer) {
      const source = ctx.createBufferSource();
      source.buffer = customAudioBuffer;
      source.connect(ctx.destination);
      source.start(0);
      return;
    }

    const playBeep = (freq: number, duration: number, delay: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    };

    playBeep(1200, 0.2, 0);
    playBeep(1200, 0.2, 0.3);
  };

  const triggerAlert = () => {
    const now = new Date();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    const newEntry: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestampLocal: format(now, 'yyyy-MM-dd HH:mm:ss'),
      timestampUtc: format(now, 'yyyy-MM-dd HH:mm:ss'), // Simplified for demo
      freq: TARGET_FREQ,
      grid: currentGrid,
      coords: currentCoords,
      lat: currentLat,
      lon: currentLon,
      accuracy: currentAccuracy,
      status: 'ACTIVA',
      expiresAt
    };

    setLogs(prev => [newEntry, ...prev].slice(0, 50));
    setActiveDetections(prev => [...prev, newEntry]);
    setLastDetection(newEntry);
    playAlertSound();
  };

  useEffect(() => {
    let interval: any;
    if (isMonitoring) {
      interval = setInterval(() => {
        // Randomly trigger alert to simulate detection
        if (Math.random() > 0.7) {
          triggerAlert();
        }
      }, 10000); // Check every 10s for simulation
    }
    return () => clearInterval(interval);
  }, [isMonitoring]);

  return (
    <div className="min-h-screen bg-black text-zinc-400 font-sans selection:bg-red-600/30">
      <Header />

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column - Controls & Stats */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Logo & Identity */}
          <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-sm overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Terminal className="w-20 h-20 text-red-600" />
            </div>
            <pre className="text-[7px] leading-[1.1] font-mono text-red-600 whitespace-pre mb-4 select-none">
              {LOGO_RACAM}
            </pre>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest font-mono text-zinc-500">Monitoring Status</span>
                <button 
                  onClick={() => setIsMonitoring(!isMonitoring)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter transition-all",
                    isMonitoring ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/50" : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                  )}
                >
                  {isMonitoring ? "Active" : "Paused"}
                </button>
              </div>
              <div className="h-[1px] bg-zinc-800 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase text-zinc-600 font-mono">Target Freq</span>
                  <p className="text-zinc-200 font-mono text-sm">{TARGET_FREQ}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase text-zinc-600 font-mono">Interval</span>
                  <p className="text-zinc-200 font-mono text-sm">60s (Nominal)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4">
            <StatCard label="Total Detections" value={logs.length.toString()} icon={Activity} color="blue" />
            <StatCard label="Signal Strength" value="-84 dBm" icon={Wifi} color="emerald" />
            <StatCard label="Last Grid" value={lastDetection?.grid || "---"} icon={MapPin} color="red" />
          </div>

          {/* Sound Configuration */}
          <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-sm space-y-4">
            <h3 className="text-[10px] uppercase tracking-widest font-mono text-zinc-500 flex items-center gap-2">
              <Database className="w-3 h-3" /> Alert Sound Config
            </h3>
            <div className="space-y-3">
              <div className="relative group cursor-pointer">
                <input 
                  type="file" 
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="bg-zinc-900 border border-dashed border-zinc-800 group-hover:border-red-600/50 p-4 rounded-sm text-center transition-colors">
                  <Database className="w-5 h-5 text-zinc-600 mx-auto mb-2 group-hover:text-red-500 transition-colors" />
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    {audioFileName || "Upload Custom Alert Sound"}
                  </p>
                  <p className="text-[8px] font-mono text-zinc-700 mt-1">MP3, WAV, OGG supported</p>
                </div>
              </div>
              {customAudioBuffer && (
                <button 
                  onClick={() => {
                    setCustomAudioBuffer(null);
                    setAudioFileName(null);
                  }}
                  className="w-full text-[9px] font-mono text-zinc-600 hover:text-red-500 transition-colors uppercase tracking-widest"
                >
                  Reset to Default Beep
                </button>
              )}
            </div>
          </div>

          {/* GPS Configuration */}
          <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-sm space-y-4">
            <h3 className="text-[10px] uppercase tracking-widest font-mono text-zinc-500 flex items-center gap-2">
              <MapPin className="w-3 h-3" /> GPS Configuration
            </h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] uppercase text-zinc-600 font-mono">Current Coordinates</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={currentCoords}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCurrentCoords(val);
                      const parts = val.split(',').map(p => parseFloat(p.trim()));
                      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                        setCurrentLat(parts[0]);
                        setCurrentLon(parts[1]);
                        setCurrentGrid(latLonToGrid(parts[0], parts[1]));
                      }
                    }}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono text-xs p-2 rounded-sm flex-1 focus:outline-none focus:border-red-600 transition-colors"
                    placeholder="Lat, Lon"
                  />
                  <button 
                    onClick={fetchGeolocation}
                    disabled={isFetchingGeo}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-2 rounded-sm transition-colors disabled:opacity-50"
                    title="Fetch GPS"
                  >
                    <Activity className={cn("w-4 h-4", isFetchingGeo && "animate-spin")} />
                  </button>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[9px] uppercase text-zinc-600 font-mono">Accuracy</span>
                  <span className="text-[10px] font-mono text-zinc-400">{currentAccuracy}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase text-zinc-600 font-mono">QTH Grid Square</label>
                <input 
                  type="text" 
                  value={currentGrid}
                  onChange={(e) => setCurrentGrid(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono text-xs p-2 rounded-sm w-full focus:outline-none focus:border-red-600 transition-colors"
                  placeholder="e.g. FE43ub"
                />
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-sm space-y-3">
            <h3 className="text-[10px] uppercase tracking-widest font-mono text-zinc-500 flex items-center gap-2">
              <Settings className="w-3 h-3" /> System Diagnostics
            </h3>
            <div className="space-y-2">
              {[
                { label: "SDR Interface", status: "OK", color: "text-emerald-500" },
                { label: "Decisor Engine", status: "OK", color: "text-emerald-500" },
                { label: "Cloud Sync", status: "ACTIVE", color: "text-blue-500" },
                { label: "Log Buffer", status: `${(logs.length / 50 * 100).toFixed(0)}%`, color: "text-zinc-400" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-600">{item.label}</span>
                  <span className={item.color}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Activity & Logs */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* World Map Overlay */}
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-sm overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-500" />
                <h2 className="text-[11px] uppercase tracking-widest font-mono text-zinc-200">Planisferio Grid Square Overlay</h2>
              </div>
            </div>
            <div className="p-4">
              <WorldMap activeDetections={activeDetections} />
            </div>
          </div>

          {/* Live Monitor */}
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-sm overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-red-500" />
                <h2 className="text-[11px] uppercase tracking-widest font-mono text-zinc-200">Live Signal Monitor</h2>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-500">
                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full" /> RF Activity</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-zinc-700 rounded-full" /> Noise Floor</span>
              </div>
            </div>
            <div className="p-6">
              <SignalChart />
              <div className="mt-6 grid grid-cols-3 gap-4 border-t border-zinc-800 pt-6">
                <div className="text-center space-y-1">
                  <span className="text-[9px] uppercase text-zinc-600 font-mono">Center Freq</span>
                  <p className="text-zinc-300 font-mono text-xs">146.520.000</p>
                </div>
                <div className="text-center space-y-1 border-x border-zinc-800">
                  <span className="text-[9px] uppercase text-zinc-600 font-mono">Bandwidth</span>
                  <p className="text-zinc-300 font-mono text-xs">12.5 kHz</p>
                </div>
                <div className="text-center space-y-1">
                  <span className="text-[9px] uppercase text-zinc-600 font-mono">Gain</span>
                  <p className="text-zinc-300 font-mono text-xs">42.0 dB</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Logs */}
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-sm overflow-hidden flex flex-col h-[400px]">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 flex items-center justify-center">
                  <img 
                    src="https://storage.googleapis.com/ai-studio-static-assets/input_file_0.png" 
                    alt="RACAM Logo" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h2 className="text-[11px] uppercase tracking-widest font-mono text-zinc-200">Logs Mundial - Frecuencia de Encuentro</h2>
              </div>
              <button 
                onClick={() => setLogs([])}
                className="text-[10px] font-mono text-zinc-500 hover:text-red-500 transition-colors"
              >
                CLEAR_BUFFER
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-0 font-mono text-[11px]">
              {logs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-600 italic">
                  No activity recorded in current session.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-zinc-950 text-zinc-500 uppercase text-[9px] tracking-wider border-b border-zinc-800">
                    <tr>
                      <th className="p-3 font-medium">Timestamp (L/U)</th>
                      <th className="p-3 font-medium">Freq</th>
                      <th className="p-3 font-medium">Grid</th>
                      <th className="p-3 font-medium">Coordinates / Accuracy</th>
                      <th className="p-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors group">
                        <td className="p-3 text-zinc-400">
                          <div className="flex flex-col">
                            <span>{log.timestampLocal} L</span>
                            <span className="text-[9px] text-zinc-600">{log.timestampUtc} U</span>
                          </div>
                        </td>
                        <td className="p-3 text-zinc-300 font-bold">{log.freq}</td>
                        <td className="p-3 text-red-500">{log.grid}</td>
                        <td className="p-3 text-zinc-500">
                          <div className="flex flex-col">
                            <span>{log.coords}</span>
                            <span className="text-[9px] text-zinc-600">Accuracy: {log.accuracy}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/30 rounded-sm text-[9px] font-bold">
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Last Detection Alert */}
          {lastDetection && (
            <div className="bg-red-950/20 border border-red-900/50 p-4 rounded-sm flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-10 h-10 bg-red-600 flex items-center justify-center rounded-full animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                <AlertTriangle className="text-white w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-red-500 font-bold text-sm uppercase tracking-tight">Actividad Crítica Detectada</h4>
                <p className="text-zinc-400 text-xs mt-1">
                  Señal interceptada en <span className="text-zinc-100">{lastDetection.freq}</span> desde el grid <span className="text-zinc-100">{lastDetection.grid}</span>.
                </p>
                <p className="text-zinc-500 text-[10px] mt-1 font-mono">
                  COORD: {lastDetection.coords} | Accuracy: {lastDetection.accuracy}
                </p>
              </div>
              <div className="text-right font-mono text-[10px] text-zinc-500">
                {lastDetection.timestampLocal}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer / Terminal Bar */}
      <footer className="border-t border-zinc-800 bg-zinc-950 p-2 fixed bottom-0 w-full z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[10px] font-mono text-zinc-600">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><ChevronRight className="w-3 h-3" /> RACAM_SDR_DAEMON: RUNNING</span>
            <span className="flex items-center gap-1"><ChevronRight className="w-3 h-3" /> CPU_LOAD: 12%</span>
            <span className="flex items-center gap-1"><ChevronRight className="w-3 h-3" /> MEM_USAGE: 244MB</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-emerald-500">ENCRYPTED_LINK: ESTABLISHED</span>
            <span>SECURE_NODE: 0xFA23...99B</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
