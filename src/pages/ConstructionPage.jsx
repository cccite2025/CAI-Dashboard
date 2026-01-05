import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  HardHat, MapPin, Calendar, Activity, AlertTriangle, 
  ArrowRight, Hammer, Truck, X, Save, Plus, User, Camera, 
  TrendingUp, TrendingDown, Clock, CheckCircle2, Building2,
  Eye, Layers, ScanLine, PackageMinus, Video, ArrowLeft
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, CartesianGrid, ReferenceLine, LineChart, Line
} from 'recharts';

// Import AI Camera / Leaflet
import AICameraModal from '../components/AICameraModal';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Setup Leaflet Icon
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// ==========================================
// 1. SUB-PAGE: PROJECT DETAIL VIEW (หน้าย่อย)
// ==========================================
const ProjectDetailView = ({ project, onBack }) => {
    // --- State & Mock Data ---
    const [currentTime, setCurrentTime] = useState(new Date());
    
    // Mock Data สำหรับ S-Curve รายโครงการ (อนาคตดึงจาก project.progress_history ได้)
    const projectSCurveData = [
        { month: 'Jan', plan: 5, actual: 5 },
        { month: 'Feb', plan: 15, actual: 12 },
        { month: 'Mar', plan: 30, actual: 28 },
        { month: 'Apr', plan: 45, actual: 40 },
        { month: 'May', plan: 60, actual: project.actualPercent || 50 },
        { month: 'Jun', plan: 75, actual: null },
        { month: 'Jul', plan: 90, actual: null },
        { month: 'Aug', plan: 100, actual: null },
    ];

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const cardClass = "bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5";

    return (
        <div className="font-sans text-slate-800 dark:text-slate-200 pb-10 animate-fade-in space-y-6">
            
            {/* Header / Back Button */}
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Building2 size={24} className="text-blue-600" />
                        {project.name}
                    </h1>
                    <p className="text-xs text-slate-400 flex items-center gap-2">
                        <MapPin size={12}/> {project.location || 'Unknown Location'} | Code: {project.project_code}
                    </p>
                </div>
                <div className="ml-auto text-right hidden md:block">
                    <p className="text-xl font-bold font-mono tracking-widest">{currentTime.toLocaleTimeString('th-TH')}</p>
                    <p className="text-xs text-slate-400">{currentTime.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-12 gap-6">

                {/* Left Column: Visual Monitoring (8 Cols) */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                    
                    {/* Visual Comparison Section */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600 px-5 py-3 flex justify-between items-center">
                            <h2 className="font-bold text-slate-700 dark:text-white flex items-center gap-2">
                                <Eye size={20} className="text-blue-600 dark:text-blue-400" />
                                AI Visual Inspection (เปรียบเทียบหน้างาน)
                            </h2>
                            <div className="flex gap-2">
                                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded flex items-center gap-1 font-bold">
                                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span> Live
                                </span>
                                <select className="text-xs border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-700 outline-none">
                                    <option>Cam 01: Zone A (North)</option>
                                    <option>Cam 02: Zone B (South)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 h-[400px] relative">
                            {/* BIM Model View */}
                            <div className="bg-slate-200 dark:bg-slate-900 relative group border-r border-slate-300 dark:border-slate-600 overflow-hidden">
                                {project.model_url ? (
                                    <iframe src={project.model_url} className="w-full h-full border-none" title="BIM Model"/>
                                ) : (
                                    <img src="https://placehold.co/800x600/e2e8f0/94a3b8?text=3D+BIM+Model+View" className="w-full h-full object-cover opacity-80 hover:scale-105 transition-transform duration-700" alt="BIM Model" />
                                )}
                                <div className="absolute top-4 left-4 bg-black/60 text-white text-xs px-3 py-1 rounded backdrop-blur-sm">Planned State (BIM)</div>
                            </div>

                            {/* Real Site View */}
                            <div className="bg-slate-800 relative group overflow-hidden">
                                <img src="https://placehold.co/800x600/334155/cbd5e1?text=Real-time+Site+Camera" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="Site Camera" />
                                <div className="absolute top-4 left-4 bg-red-600/80 text-white text-xs px-3 py-1 rounded backdrop-blur-sm flex items-center gap-1 shadow-sm">
                                    <Video size={12} /> Actual Site (RPi-4)
                                </div>
                                <div className="absolute top-[42%] left-[32%] w-20 h-36 border-2 border-yellow-400 border-dashed flex items-end justify-center pb-1 shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                                    <span className="bg-yellow-400 text-black text-[10px] font-bold px-1">Column C4</span>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-slate-200 dark:border-slate-600 rounded-full px-4 py-2 shadow-xl flex gap-4 z-10">
                                <button className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"><Layers size={16} /> Overlay Mode</button>
                                <div className="w-px bg-slate-300 h-4 my-auto"></div>
                                <button className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors"><ScanLine size={16} /> AI Analysis</button>
                            </div>
                        </div>
                    </div>

                    {/* S-Curve Chart (Recharts) */}
                    <div className={cardClass}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-700 dark:text-white flex items-center gap-2">
                                <TrendingUp size={20} className="text-blue-600 dark:text-blue-400" />
                                Project S-Curve (เฉพาะโครงการนี้)
                            </h3>
                            <div className="flex gap-4 text-xs font-medium">
                                <div className="flex items-center gap-2 text-slate-500"><span className="w-3 h-3 rounded-full bg-slate-300 border border-slate-400"></span> Planned</div>
                                <div className="flex items-center gap-2 text-blue-600"><span className="w-3 h-3 rounded-full bg-blue-600"></span> Actual</div>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={projectSCurveData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} unit="%" domain={[0, 100]} />
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Line type="monotone" dataKey="plan" stroke="#cbd5e1" strokeWidth={3} strokeDasharray="5 5" dot={false} activeDot={{ r: 6 }} name="Planned" />
                                    <Line type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 7 }} name="Actual" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Right Column: Stats & Alerts (4 Cols) */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                    
                    {/* Progress Widget */}
                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-xl p-5 shadow-lg relative overflow-hidden border border-blue-500/30">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                        <h3 className="text-blue-100 text-sm font-medium mb-1">ความคืบหน้าโครงการ</h3>
                        <div className="flex items-end gap-3 mb-4">
                            <span className="text-5xl font-bold tracking-tight">{project.actualPercent || 0}%</span>
                            <span className="text-xs text-blue-200 mb-2 font-medium bg-blue-500/30 px-2 py-0.5 rounded">Plan: {project.planPercent || 0}%</span>
                        </div>
                        <div className="w-full bg-blue-900/50 rounded-full h-2.5 mb-2 overflow-hidden border border-blue-500/30">
                            <div className="bg-yellow-400 h-full rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)] transition-all duration-1000" style={{ width: `${project.actualPercent || 0}%` }}></div>
                        </div>
                    </div>

                    {/* Resource Counter (Mockup) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`${cardClass} flex flex-col items-center justify-center hover:shadow-md transition-shadow cursor-default group`}>
                            <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                                <HardHat className="w-6 h-6 text-orange-600" />
                            </div>
                            <span className="text-2xl font-bold text-slate-700 dark:text-white">45</span>
                            <span className="text-xs text-slate-500 font-medium">Workers</span>
                        </div>
                        <div className={`${cardClass} flex flex-col items-center justify-center hover:shadow-md transition-shadow cursor-default group`}>
                            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                                <Truck className="w-6 h-6 text-yellow-600" />
                            </div>
                            <span className="text-2xl font-bold text-slate-700 dark:text-white">3</span>
                            <span className="text-xs text-slate-500 font-medium">Machines</span>
                        </div>
                    </div>

                    {/* Alerts Section */}
                    <div className={`${cardClass} flex-1`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-700 dark:text-white flex items-center gap-2">
                                <AlertTriangle size={20} className="text-red-500" /> Alerts
                            </h3>
                            <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">3 New</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex gap-3 items-start p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 cursor-pointer">
                                <Clock size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">งานโครงสร้างล่าช้า</h4>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Zone A: เสาต้นที่ 4 ยังไม่เริ่ม</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 cursor-pointer">
                                <PackageMinus size={18} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">วัสดุใกล้หมด</h4>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">เหล็กเส้น 12mm เหลือต่ำกว่า 10%</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

// ==========================================
// 2. DASHBOARD COMPONENTS (หน้าหลัก)
// ==========================================

const RealMap = ({ projects }) => {
    const defaultCenter = [13.7563, 100.5018]; 
    const firstProjectWithLocation = projects.find(p => p.lat && p.lng);
    const center = firstProjectWithLocation ? [firstProjectWithLocation.lat, firstProjectWithLocation.lng] : defaultCenter;
    const locationCount = projects.filter(p => p.lat && p.lng).length;

    return (
        <div className="h-[320px] w-full rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-700 z-0 relative group">
            <MapContainer center={center} zoom={10} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {projects.map((proj) => (
                    (proj.lat && proj.lng) && (
                        <Marker key={proj.id} position={[proj.lat, proj.lng]}>
                            <Popup>
                                <div className="text-xs">
                                    <strong className="block text-sm mb-1">{proj.name}</strong>
                                    <p>Progress: <span className={proj.actualPercent < proj.planPercent - 5 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>{proj.actualPercent}%</span></p>
                                </div>
                            </Popup>
                        </Marker>
                    )
                ))}
            </MapContainer>
            <div className="absolute top-4 right-4 z-[1000] bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 flex flex-col items-end">
                <div className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                    <MapPin size={10}/> Site Locations
                </div>
                <div className="text-xl font-black text-slate-800 dark:text-white leading-none">
                    {locationCount} <span className="text-[10px] font-normal text-gray-500">Points</span>
                </div>
            </div>
        </div>
    );
};

const ConstructionSCurve = ({ projects }) => {
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.actualPercent >= 100).length;
    const ongoingProjects = totalProjects - completedProjects;
    const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

    const chartData = useMemo(() => {
        const months = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8'];
        return months.map((m, i) => {
            const t = (i + 1) / months.length;
            const planVal = Math.round((1 / (1 + Math.exp(-6 * (t - 0.5)))) * 100);
            let actualVal = null;
            if (i < 5) { 
                const noise = (Math.random() * 10) - 5;
                actualVal = Math.max(0, Math.min(100, planVal + noise - 2)); 
            }
            return { name: m, Plan: planVal, Actual: actualVal };
        });
    }, [projects]);

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm h-[320px] flex flex-col">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm">
                        <Activity size={18} className="text-orange-500"/> ภาพรวมความก้าวหน้า (Overall Progress)
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-1">Physical S-Curve & Completion Status</p>
                </div>
            </div>
            <div className="flex flex-1 gap-6 mt-2">
                <div className="w-1/3 flex flex-col justify-center gap-4 pr-4 border-r border-gray-100 dark:border-slate-700">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Building2 size={12}/> Total Projects</p>
                        <p className="text-3xl font-black text-slate-800 dark:text-white">{totalProjects}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1 flex items-center gap-1"><CheckCircle2 size={12}/> Completed (100%)</p>
                        <div className="flex items-end gap-2">
                            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{completedProjects}</p>
                            <span className="text-xs text-gray-400 mb-1 font-medium">({completionRate.toFixed(0)}%)</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Hammer size={12}/> Ongoing</p>
                        <p className="text-3xl font-black text-orange-500">{ongoingProjects}</p>
                    </div>
                </div>
                <div className="flex-1 w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorPlan" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/><stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/></linearGradient>
                                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} unit="%" domain={[0, 100]}/>
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}/>
                            <Area type="monotone" dataKey="Plan" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" fill="url(#colorPlan)" />
                            <Area type="monotone" dataKey="Actual" stroke="#f97316" strokeWidth={3} fill="url(#colorActual)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const ConstructionCard = ({ project, contractor, contractCode, onViewDetail, onCameraClick }) => {
  const plan = project.planPercent || 0;
  const actual = project.actualPercent || 0;
  const isDelay = actual < (plan - 5);
  
  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group flex flex-col h-full">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 shrink-0 rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center shadow-sm">
            <HardHat size={20} strokeWidth={2.5}/>
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-gray-800 dark:text-white truncate" title={project.name}>{project.name}</h4>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
              <span className="bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono">{contractCode}</span>
              <span className="truncate flex items-center gap-1"><MapPin size={10}/> {project.location || 'Site Loc'}</span>
            </div>
          </div>
        </div>
        <span className={`shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${isDelay ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
            {isDelay ? <AlertTriangle size={10}/> : <Activity size={10}/>} {isDelay ? 'Delay' : 'On Plan'}
        </span>
      </div>
      <div className="mb-4 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/50 p-2.5 rounded-xl flex items-center gap-2">
        <Truck size={14} className="text-gray-400"/>
        <div className="truncate"><span className="font-semibold text-gray-700 dark:text-gray-300">ผรม: </span>{contractor || 'Waiting...'}</div>
      </div>
      <div className="mt-auto">
        <div className="flex justify-between text-xs mb-1.5 font-medium"><span className="text-gray-500">Progress</span><span className={`font-bold ${isDelay ? 'text-red-500' : 'text-orange-600'}`}>{actual}%</span></div>
        <div className="relative h-2.5 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 h-full bg-gray-300 dark:bg-slate-600 opacity-50" style={{ width: `${Math.min(plan, 100)}%` }}></div>
            <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 shadow-sm ${isDelay ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${Math.min(actual, 100)}%` }}></div>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
          <button onClick={() => onViewDetail(project)} className="flex-1 py-2 text-xs font-bold text-gray-500 hover:text-orange-600 border border-dashed border-gray-200 dark:border-slate-600 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors flex items-center justify-center gap-1">
            <ArrowRight size={12}/> Detail
          </button>
          <button onClick={() => onCameraClick(project)} className="flex-1 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-black dark:bg-slate-600 dark:hover:bg-slate-500 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-1">
            <Camera size={12}/> AI View
          </button>
      </div>
    </div>
  );
};

// ==========================================
// 3. MAIN PAGE COMPONENT
// ==========================================
const ConstructionPage = ({ biddingData = [], allProjects = [], onRefresh }) => {
  // viewMode: 'dashboard' | 'detail'
  const [viewMode, setViewMode] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState(null);
  const [cameraProject, setCameraProject] = useState(null);

  // เตรียมข้อมูล
  const constructionProjects = useMemo(() => {
      if (!allProjects.length) return [];
      const activePackageMap = {}; 
      biddingData.forEach(pkg => {
          if (pkg.currentStep >= 10) {
              activePackageMap[pkg.id] = { contractor: pkg.result?.winner || 'TBD', code: pkg.code };
          }
      });
      return allProjects
          .filter(p => p.bidding_package_id && activePackageMap[p.bidding_package_id])
          .map(p => ({
              ...p,
              contractor: activePackageMap[p.bidding_package_id].contractor,
              contractCode: activePackageMap[p.bidding_package_id].code,
              planPercent: p.planPercent || 0,
              actualPercent: p.actualPercent || 0,
              lat: p.lat ? parseFloat(p.lat) : null,
              lng: p.lng ? parseFloat(p.lng) : null
          }));
  }, [biddingData, allProjects]);

  // Handle การคลิกปุ่ม Detail
  const handleViewDetail = (project) => {
      setSelectedProject(project);
      setViewMode('detail');
  };

  // Handle การคลิกปุ่ม Back
  const handleBack = () => {
      setSelectedProject(null);
      setViewMode('dashboard');
  };

  // ------------------------------------
  // RENDER LOGIC: สลับหน้าตาม viewMode
  // ------------------------------------
  
  if (viewMode === 'detail' && selectedProject) {
      return <ProjectDetailView project={selectedProject} onBack={handleBack} />;
  }

  // Dashboard View (หน้าเดิม)
  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <div className="flex justify-between items-center">
        <div><h2 className="text-xl font-black text-gray-800 dark:text-white flex items-center gap-2"><HardHat className="text-orange-600"/> Construction Management</h2><p className="text-xs text-gray-400 mt-1">บริหารจัดการงานก่อสร้างและติดตามความก้าวหน้า</p></div>
        <div className="flex gap-2"><button className="bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 shadow-sm flex items-center gap-2"><Calendar size={14}/> Site Visit Schedule</button></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <ConstructionSCurve projects={constructionProjects} />
         <RealMap projects={constructionProjects} />
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Hammer size={16}/> โครงการที่กำลังก่อสร้าง ({constructionProjects.length})</h3>
        {constructionProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {constructionProjects.map((proj) => (
                    <ConstructionCard 
                        key={proj.id} project={proj} contractor={proj.contractor} contractCode={proj.contractCode}
                        onViewDetail={handleViewDetail} // ส่งฟังก์ชันไปเปิดหน้า Detail
                        onCameraClick={setCameraProject}
                    />
                ))}
            </div>
        ) : (
            <div className="p-12 text-center border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-3xl bg-gray-50 dark:bg-slate-800/50 text-gray-400"><HardHat size={48} className="mx-auto mb-3 opacity-20"/><p>ยังไม่มีโครงการเข้าสู่ระยะก่อสร้าง</p></div>
        )}
      </div>

      {cameraProject && <AICameraModal project={cameraProject} onClose={() => setCameraProject(null)} />}
    </div>
  );
};

export default ConstructionPage;