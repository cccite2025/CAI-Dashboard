// src/pages/OverviewPage.jsx
import React from 'react';
import { 
  LayoutDashboard, TrendingUp, AlertTriangle, CheckCircle, 
  Clock, ArrowRight, Activity, PieChart, Wallet
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Pie, PieChart as RechartsPie 
} from 'recharts';

const StatCard = ({ title, value, subtext, icon: Icon, color }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-extrabold text-gray-800 dark:text-white mt-1">{value}</h3>
        <p className={`text-xs mt-1 font-medium ${subtext.includes('+') ? 'text-emerald-500' : 'text-gray-400'}`}>{subtext}</p>
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </div>
);

const ActivityItem = ({ title, time, type }) => {
    let icon = <Activity size={16}/>;
    let color = "bg-gray-100 text-gray-500";
    if (type === 'delay') { icon = <AlertTriangle size={16}/>; color = "bg-red-100 text-red-600"; }
    if (type === 'success') { icon = <CheckCircle size={16}/>; color = "bg-emerald-100 text-emerald-600"; }
    if (type === 'info') { icon = <Clock size={16}/>; color = "bg-blue-100 text-blue-600"; }

    return (
        <div className="flex items-start gap-3 pb-4 border-b border-gray-50 dark:border-slate-700 last:border-0 last:pb-0">
            <div className={`mt-1 p-2 rounded-full shrink-0 ${color}`}>{icon}</div>
            <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</p>
                <p className="text-xs text-gray-400">{time}</p>
            </div>
        </div>
    );
};

export const OverviewPage = ({ projects }) => {
  // --- Calculate Stats ---
  const totalProjects = projects.length;
  const delayedProjects = projects.filter(p => p.status === 'Delay').length;
  const completedDesign = projects.filter(p => p.actualPercent >= 100).length;
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  
  // Mock Data สำหรับ Bidding & Construction (เพื่อให้เห็นภาพรวม)
  const biddingCount = 5; // สมมติว่ามี 5 งานกำลังประมูล
  const constructionCount = 2; // สมมติว่ามี 2 งานกำลังก่อสร้าง

  const phaseData = [
    { name: 'Design', value: totalProjects - completedDesign, color: '#3B82F6' }, // Blue
    { name: 'Bidding', value: biddingCount, color: '#F59E0B' }, // Yellow
    { name: 'Construction', value: constructionCount, color: '#10B981' }, // Green
    { name: 'Completed', value: 12, color: '#8B5CF6' } // Purple (สมมติ)
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. Welcome Section */}
      <div className="flex justify-between items-end">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Overview Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">ภาพรวมโครงการทั้งหมดในระบบ (Design • Bidding • Construction)</p>
        </div>
        <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-gray-400 uppercase">Current Date</p>
            <p className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
        </div>
      </div>

      {/* 2. Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="Total Projects" 
            value={totalProjects + 15} // รวม Mock เก่าๆ
            subtext="Active Projects" 
            icon={LayoutDashboard} 
            color="bg-blue-500" 
        />
        <StatCard 
            title="Total Budget" 
            value={`฿${(totalBudget/1000000).toFixed(1)}M`} 
            subtext="+2.5% from last month" 
            icon={Wallet} 
            color="bg-purple-500" 
        />
        <StatCard 
            title="Critical Delays" 
            value={delayedProjects} 
            subtext="Needs Attention" 
            icon={AlertTriangle} 
            color="bg-red-500" 
        />
        <StatCard 
            title="Completed (YTD)" 
            value="12" 
            subtext="Projects finished" 
            icon={CheckCircle} 
            color="bg-emerald-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        
        {/* 3. Project Phase Distribution (Chart) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
            <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <PieChart size={20} className="text-blue-500"/> Project Phase Distribution
            </h3>
            <div className="flex flex-col sm:flex-row items-center gap-8 h-[300px]">
                <div className="w-full sm:w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                            <Pie 
                                data={phaseData} 
                                innerRadius={60} 
                                outerRadius={80} 
                                paddingAngle={5} 
                                dataKey="value"
                                cornerRadius={5}
                            >
                                {phaseData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                            />
                        </RechartsPie>
                    </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 space-y-4">
                    {phaseData.map((item, i) => (
                        <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.name} Phase</span>
                            </div>
                            <span className="text-lg font-bold text-gray-800 dark:text-white">{item.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* 4. Recent Activities / Alerts */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Activity size={20} className="text-orange-500"/> Recent Updates
                </h3>
                <button className="text-xs text-blue-500 hover:underline">View All</button>
            </div>
            
            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
                <ActivityItem 
                    title="โครงการโรงงานแปรรูปไก่ (สระบุรี)" 
                    time="2 hours ago" 
                    type="delay" 
                />
                <ActivityItem 
                    title="อนุมัติซองประมูล: งานระบบไฟฟ้า" 
                    time="5 hours ago" 
                    type="success" 
                />
                <ActivityItem 
                    title="เริ่มขั้นตอนออกแบบ: ฟาร์มสุกร 2" 
                    time="1 day ago" 
                    type="info" 
                />
                <ActivityItem 
                    title="Site Visit: งานปรับปรุงไลน์ผลิต" 
                    time="1 day ago" 
                    type="info" 
                />
                 <ActivityItem 
                    title="ส่งมอบงานงวดสุดท้าย: คลังสินค้า" 
                    time="2 days ago" 
                    type="success" 
                />
            </div>

            <button className="mt-4 w-full py-2 bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2">
                Go to Notifications <ArrowRight size={14}/>
            </button>
        </div>

      </div>
    </div>
  );
};