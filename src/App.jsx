import React, { useState, useEffect, useMemo } from 'react';

// ✅ 1. Import LoadingScreen (แก้ path ให้ถูกต้อง)
import { LoadingScreen } from './components/LoadingScreen';

// ✅ Import Utils & Config
import { supabase } from './supabaseClient'; 
import { REVENUE_FACTOR, calculateProjectStatus, BU_CONFIG } from './utils';

// ✅ Icons
import { 
  LayoutDashboard, PenTool, ShoppingCart, Moon, Sun, 
  Menu, LogOut, Package, FileSignature, FileText, Users, Settings, 
  Hammer 
} from 'lucide-react';

// ✅ Pages
import { DesignPage } from './pages/DesignPage';
import BiddingPage from './pages/BiddingPage';
import ContractPage from './pages/ContractPage';
import { OverviewPage } from './pages/OverviewPage'; 
import ConstructionPage from './pages/ConstructionPage';

export default function App() {
  // --- 1. STATE & CONFIG ---
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [page, setPage] = useState('design'); 
  
  const [projects, setProjects] = useState([]);
  const [biddingPackages, setBiddingPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState([]);

  // --- 2. THEME TOGGLE ---
  const toggleDarkMode = () => {
      setDarkMode(prev => {
          const newMode = !prev;
          localStorage.setItem('theme', newMode ? 'dark' : 'light');
          if (newMode) document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
          return newMode;
      });
  };

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // --- 3. DATA FETCHING ---
  useEffect(() => { fetchRealData(); }, []);

  async function fetchRealData() {
    try {
      setLoading(true);
      
      const { data: projData, error: projError } = await supabase.from('projects')
        .select(`*, project_progress(*), design_pipeline_steps(*)`);
      if (projError) throw projError;

      const { data: pkgData, error: pkgError } = await supabase.from('bidding_packages')
        .select(`*, projects(*)`)
        .order('created_at', { ascending: false });
      if (pkgError) throw pkgError;

      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (contractError) throw contractError;
      if (contractData) setContracts(contractData);
    
      if (projData) {
          setProjects(projData.map(p => {
             const progressObj = Array.isArray(p.project_progress) ? p.project_progress[0] : p.project_progress;
             
             // 1. ตรวจสอบข้อมูล Construction
             const hasConstructionData = progressObj && 
                                         progressObj.percent_actual !== null && 
                                         progressObj.percent_actual !== undefined;

             // 2. Logic เลือกค่า (Construction ชนะ Design)
             let finalPercent = 0;
             if (hasConstructionData) {
                 finalPercent = parseFloat(progressObj.percent_actual);
             } else {
                 finalPercent = p.project_status === 'Completed' ? 100 : 0;
             }

             // 3. คำนวณสถานะเดิม
             const statusData = calculateProjectStatus(progressObj, p.design_pipeline_steps, p.project_status);
             
             return { 
                 ...p, 
                 ...statusData, // ทับ status ที่คำนวณมา
                 owner: p.responsible_design || 'Unassigned', 
                 bu: p.bu || 'OT', 
                 pipeline_steps: p.design_pipeline_steps || [], 
                 actualPercent: finalPercent,
                 planPercent: progressObj ? (parseFloat(progressObj.percent_plan) || 0) : (parseFloat(p.plan_percent) || 0),
             };
          }));
      }
      if (pkgData) {
          setBiddingPackages(pkgData.map(pkg => ({
              ...pkg,
              totalBudget: pkg.total_budget,
              currentStep: pkg.current_step,
              completedSteps: pkg.completed_steps || {},
              planStart: pkg.plan_start,
              planEnd: pkg.plan_end,
              projectNames: pkg.projects ? pkg.projects.map(p => p.name) : []
          })));
      }

      // 🔥 เพิ่มความหน่วงนิดหน่อยเพื่อให้เห็นหน้าโหลดสวยๆ (Optional: ลบออกได้ถ้าต้องการความเร็วสูงสุด)
      await new Promise(resolve => setTimeout(resolve, 800));

    } catch (error) { console.error(error); } finally { setLoading(false); }
  }

  // --- 4. KPI CALCULATION ---
  const kpiData = useMemo(() => {
    let totalBudget = 0, totalForecastRevenue = 0, actualRevenue = 0;
    const buMap = {}, teamMap = {};
    projects.forEach(p => {
        totalBudget += p.budget;
        if (p.project_status === 'Cancelled') return;
        const totalProjRevenue = p.budget * (typeof REVENUE_FACTOR !== 'undefined' ? REVENUE_FACTOR : 0.025);
        totalForecastRevenue += totalProjRevenue;
        const earnedRevenue = totalProjRevenue * ((p.actualPercent || 0) / 100);
        actualRevenue += earnedRevenue;
        const buCode = p.bu || 'OT'; 
        buMap[buCode] = (buMap[buCode] || 0) + earnedRevenue;
        const owner = p.owner || 'Unassigned'; 
        teamMap[owner] = (teamMap[owner] || 0) + earnedRevenue;
    });
    
    const totalActualRevenue = Object.values(buMap).reduce((sum, val) => sum + val, 0);
    const getBuLabel = (code) => (BU_CONFIG && BU_CONFIG[code]) ? BU_CONFIG[code].label.split(' ')[0] : code;

    const buData = Object.entries(buMap).map(([code, revenue]) => ({ 
        name: getBuLabel(code), 
        value: revenue, 
        percent: totalActualRevenue > 0 ? (revenue / totalActualRevenue) * 100 : 0 
    })).sort((a, b) => b.value - a.value).slice(0, 7);
    
    const teamData = Object.entries(teamMap).map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue);
    
    return { totalBudget, totalForecastRevenue, actualRevenue, buData, teamData };
  }, [projects]);

  // --- 5. RENDER ---
  const SidebarItem = ({ id, icon, label }) => (
    <button 
        onClick={() => setPage(id)}
        className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group relative mb-1
            ${page === id 
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 font-semibold' 
                : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-slate-700'
            }
            ${!isSidebarOpen ? 'justify-center' : 'gap-3'}
        `}
    >
        {React.cloneElement(icon, { size: 20, strokeWidth: 2 })}
        {isSidebarOpen && <span className="text-sm truncate transition-all duration-200">{label}</span>}
        {!isSidebarOpen && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none">
                {label}
            </div>
        )}
    </button>
  );

  // 🟢 ถ้ากำลังโหลด ให้แสดง LoadingScreen ทันที (วางทับทั้งหน้า)
  if (loading) {
      return <LoadingScreen />;
  }

  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-slate-900 overflow-hidden font-sans text-sm transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
        {/* SIDEBAR */}
        <aside className={`${isSidebarOpen ? 'w-[260px]' : 'w-[80px]'} bg-white dark:bg-slate-800 border-r border-gray-100 dark:border-slate-700 transition-all duration-300 ease-in-out flex flex-col z-20 shadow-sm relative flex-shrink-0`}>
            <div className="h-16 flex items-center justify-center border-b border-gray-100 dark:border-slate-700 relative overflow-hidden">
                <div className="flex items-center gap-2 text-emerald-600 font-black text-xl tracking-tighter cursor-pointer" onClick={() => setPage('overview')}>
                    <Package size={24} />
                    <span className={`transition-opacity duration-200 whitespace-nowrap ${isSidebarOpen ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
                        CAI<span className="text-gray-400 font-light">DASH</span>
                    </span>
                </div>
            </div>
            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                <div className={`px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider ${!isSidebarOpen && 'text-center'}`}>
                    {isSidebarOpen ? 'Main Menu' : '•••'}
                </div>
                <SidebarItem id="overview" icon={<LayoutDashboard />} label="Overview" />
                <SidebarItem id="design" icon={<PenTool />} label="Design Monitoring" />
                <SidebarItem id="bidding" icon={<ShoppingCart />} label="Bidding Projects" />
                <SidebarItem id="contract" icon={<FileSignature />} label="Contract Mgt." />
                <SidebarItem id="construction" icon={<Hammer />} label="Construction" />
            </nav>
            <div className="p-3 border-t border-gray-100 dark:border-slate-700 space-y-2">
                 <button onClick={toggleDarkMode} className={`w-full flex items-center p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-300 transition-all ${!isSidebarOpen ? 'justify-center' : 'gap-3'}`}>
                    {darkMode ? <Sun size={18} className="text-yellow-400"/> : <Moon size={18} />}
                    {isSidebarOpen && <span className="text-xs font-bold">{darkMode ? 'Light' : 'Dark'}</span>}
                </button>
                 <button className={`w-full flex items-center p-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all ${!isSidebarOpen ? 'justify-center' : 'gap-3'}`}>
                    <LogOut size={18} />
                    {isSidebarOpen && <span className="text-xs font-bold">Logout</span>}
                </button>
            </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <header className="h-16 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 transition-colors">
                        <Menu size={20} />
                    </button>
                    <h1 className="text-lg font-bold text-gray-800 dark:text-white hidden sm:block">
                        {page === 'overview' && 'Project Overview'}
                        {page === 'design' && 'Design Monitoring'}
                        {page === 'bidding' && 'Bidding Management'}
                        {page === 'contract' && 'Contract Dashboard'}
                        {page === 'construction' && 'Construction Management'}
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 pl-4 border-l border-gray-100 dark:border-slate-700">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-200">Admin User</p>
                            <p className="text-[10px] text-gray-400">Project Manager</p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold border-2 border-white shadow-sm">A</div>
                    </div>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-gray-50/50 dark:bg-slate-900">
                <div className="max-w-[1600px] mx-auto min-h-full">
                    {/* เนื้อหาหน้าต่างๆ */}
                    {page === 'overview' && <OverviewPage projects={projects} />}
                    {page === 'design' && <DesignPage projects={projects} onRefresh={fetchRealData} kpiData={kpiData} />}
                    {page === 'bidding' && <BiddingPage projects={projects} packages={biddingPackages} onRefresh={fetchRealData} />}
                    {page === 'contract' && <ContractPage biddingData={biddingPackages} />}
                    {page === 'construction' && (
                        <ConstructionPage 
                            biddingData={biddingPackages} 
                            allProjects={projects}
                            onRefresh={fetchRealData}
                        />
                    )}
                </div>
            </div>
        </main>
    </div>
  );
}