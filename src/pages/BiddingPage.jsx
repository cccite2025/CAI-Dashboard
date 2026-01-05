// src/pages/BiddingPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Briefcase, Package, CheckCircle, Clock, 
  Users, Plus, Trophy, Coins, AlertCircle, ArrowDown, ArrowUp,
  BarChart3, PieChart as PieChartIcon, Layout, Save, Edit, Calendar as CalendarIcon, FileText, ChevronLeft, ChevronRight, Check, BellRing, AlertTriangle, PenTool, Building2, Wallet, Sparkles
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, Pie, PieChart
} from 'recharts';

// --- 1. CONFIG: 10 Steps ---
const BIDDING_STEPS = [
  { id: 1, label: 'รับแบบ' },
  { id: 2, label: 'แจ้ง กก.' },
  { id: 3, label: 'แจกแบบ' },
  { id: 4, label: 'ชี้แจง', allowRevision: true },
  { id: 5, label: 'รับแบบแก้' },
  { id: 6, label: 'ยื่นซอง' },
  { id: 7, label: 'เปิดซอง' },
  { id: 8, label: 'ต่อรอง' },
  { id: 9, label: 'อนุมัติ' },
  { id: 10, label: 'ทำสัญญา' }
];

// --- 2. HELPER COMPONENTS ---

const TotalProjectsCard = ({ packages }) => {
    const stats = useMemo(() => {
        const total = packages.length;
        let done = 0, delay = 0, onPlan = 0, hold = 0;
        packages.forEach(pkg => {
            if (pkg.currentStep === 10) done++;
            else {
                let isDelayed = false;
                if (pkg.planStart && pkg.planEnd) {
                    const start = new Date(pkg.planStart).getTime();
                    const end = new Date(pkg.planEnd).getTime();
                    const now = new Date().getTime();
                    const totalDuration = end - start;
                    const elapsed = now - start;
                    const actualPercent = (pkg.currentStep / 10) * 100;
                    let planPercent = 0;
                    if (totalDuration > 0) planPercent = (elapsed / totalDuration) * 100;
                    if (actualPercent < (planPercent - 10)) isDelayed = true;
                }
                if (isDelayed) delay++; else onPlan++;
            }
        });
        return { total, done, delay, onPlan, hold };
    }, [packages]);

    const StatusItem = ({ label, value, borderClass, textClass, iconClass, icon: Icon }) => (
        <div className={`flex items-center justify-between p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border ${borderClass} shadow-sm transition-all hover:shadow-md`}>
            <div className="flex items-center gap-2.5">
                <Icon size={15} className={`${iconClass} opacity-80`} strokeWidth={2} />
                <span className={`text-[11px] font-medium ${textClass} uppercase tracking-wider`}>{label}</span>
            </div>
            <span className={`text-xl font-bold ${textClass}`}>{value}</span>
        </div>
    );

    return (
        <div className="bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/80 h-[260px] flex flex-col font-sans relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-white/60 to-transparent dark:from-white/5 pointer-events-none"></div>

            <div className="flex justify-between items-start mb-5 relative z-10">
                <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Total Packages</h4>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-5xl font-black text-slate-800 dark:text-white tracking-tight">{stats.total}</h2>
                        <span className="text-sm text-slate-400 font-medium bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-full">Projects</span>
                    </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 text-slate-500 rounded-2xl shadow-inner">
                    <Briefcase size={22} strokeWidth={1.5} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 flex-1 relative z-10">
                <StatusItem label="On Plan" value={stats.onPlan} borderClass="border-emerald-100/80 dark:border-emerald-800/30" textClass="text-emerald-700 dark:text-emerald-300" iconClass="text-emerald-500" icon={CheckCircle} />
                <StatusItem label="Delay" value={stats.delay} borderClass="border-rose-100/80 dark:border-rose-800/30" textClass="text-rose-700 dark:text-rose-300" iconClass="text-rose-500" icon={AlertCircle} />
                <StatusItem label="Done" value={stats.done} borderClass="border-blue-100/80 dark:border-blue-800/30" textClass="text-blue-700 dark:text-blue-300" iconClass="text-blue-500" icon={Check} />
                <StatusItem label="Hold" value={stats.hold} borderClass="border-slate-200/80 dark:border-slate-700/50" textClass="text-slate-600 dark:text-slate-400" iconClass="text-slate-400" icon={Clock} />
            </div>
        </div>
    );
};

const RevenueBudgetCard = ({ packages }) => {
    const totalBudget = packages.reduce((sum, p) => sum + (p.totalBudget || 0), 0);
    const targetRevenue = totalBudget * 0.003; 
    const completedPackages = packages.filter(p => p.currentStep === 10);
    const earnedRevenue = completedPackages.reduce((sum, p) => {
        const basePrice = p.result?.finalPrice ? parseFloat(p.result.finalPrice) : p.totalBudget;
        return sum + (basePrice * 0.003);
    }, 0);
    const percent = targetRevenue > 0 ? (earnedRevenue / targetRevenue) * 100 : 0;

    return (
        <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-950/90 backdrop-blur-xl p-6 rounded-3xl shadow-xl h-[260px] flex flex-col justify-between overflow-hidden text-white font-sans border border-white/10 ring-1 ring-inset ring-white/5">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50 pointer-events-none z-0"></div>
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none mix-blend-soft-light"></div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-white/10 rounded-lg text-blue-200 ring-1 ring-white/20 shadow-sm"><Coins size={16} /></div>
                    <span className="text-xs font-semibold text-blue-100/80 uppercase tracking-widest">Revenue (0.3%)</span>
                </div>
                <h3 className="text-4xl font-black text-white mt-2 tracking-tight drop-shadow-sm font-mono">
                    ฿{targetRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </h3>
                <p className="text-xs text-slate-300/70 mt-1 font-medium">
                    Based on Total Budget <span className="text-white font-semibold ml-1">฿{(totalBudget / 1000000).toFixed(2)}M</span>
                </p>
            </div>

            <div className="relative z-10 mt-auto">
                 <div className="flex justify-between items-end mb-2.5">
                    <span className="text-[10px] font-semibold text-slate-300/80 uppercase tracking-wider">Realized Revenue</span>
                    <span className="text-2xl font-bold text-white">{percent.toFixed(1)}<span className="text-sm text-blue-200 ml-0.5">%</span></span>
                 </div>
                 <div className="h-2.5 w-full bg-black/30 rounded-full overflow-hidden p-[1px] ring-1 ring-white/10">
                    <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(59,130,246,0.5)]" style={{width: `${Math.max(2, percent)}%`}}></div>
                 </div>
            </div>
        </div>
    );
};

const BiddingStatCard = ({ title, value, subtext, icon: Icon, color, trend }) => { 
    const isLuxury = color === 'luxury';
    return (
        <div className={`relative p-6 rounded-3xl h-[260px] flex flex-col justify-between overflow-hidden transition-all font-sans group
            ${isLuxury 
                ? 'bg-gradient-to-br from-slate-100 via-white to-slate-200 border border-slate-200/80 shadow-md' 
                : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm'
            }`}
        >
            {isLuxury && (
                <>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ transform: 'skewX(-20deg) translateX(-100%)', animation: 'shine 3s infinite linear' }}></div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-b from-white to-transparent opacity-50 blur-xl"></div>
                    <style>{`@keyframes shine { 100% { transform: skewX(-20deg) translateX(200%); } }`}</style>
                    <Sparkles size={24} className="absolute top-4 right-4 text-slate-300/50" />
                </>
            )}

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl shadow-sm ${isLuxury ? 'bg-gradient-to-br from-white to-slate-100 text-slate-600 border border-slate-100' : 'bg-gray-100 text-gray-600'}`}>
                            <Icon size={18} strokeWidth={2} />
                        </div>
                        <span className={`text-xs font-semibold uppercase tracking-widest ${isLuxury ? 'text-slate-500' : 'text-gray-500'}`}>{title}</span>
                    </div>
                    {trend === 'up' && (
                        <div className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm ${isLuxury ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-green-100 text-green-700'}`}>
                            <ArrowUp size={11} strokeWidth={3}/> +12%
                        </div>
                    )}
                </div>
                
                <h3 className={`text-4xl font-black tracking-tight mt-2 ${isLuxury ? 'text-transparent bg-clip-text bg-gradient-to-b from-slate-700 to-slate-900' : 'text-gray-800 dark:text-white'}`}>
                    {value}
                </h3>
            </div>

            <div className="relative z-10 mt-auto">
                <div className={`h-1.5 w-12 rounded-full mb-3 ${isLuxury ? 'bg-gradient-to-r from-slate-400 to-slate-300' : 'bg-emerald-500'}`}></div>
                <p className={`text-sm font-medium ${isLuxury ? 'text-slate-600' : 'text-gray-500'}`}>{subtext}</p>
            </div>
        </div>
    ); 
};

const BiddingActivityList = ({ packages }) => {
    const alerts = useMemo(() => {
        const list = [];
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        packages.forEach(pkg => {
            if (pkg.appointments) {
                Object.entries(pkg.appointments).forEach(([stepId, data]) => {
                    if (data.date === tomorrowStr) {
                        const stepName = BIDDING_STEPS.find(s => s.id === parseInt(stepId))?.label;
                        list.push({ type: 'urgent', title: `พรุ่งนี้: ${stepName}`, desc: `${pkg.name}`, time: data.time || 'All Day' });
                    }
                });
            }
        });
        if (list.length === 0) {
            list.push({ type: 'info', title: 'อัพเดทล่าสุด', desc: 'เปิดซองประมูล: โรงงาน B', time: '10:00' });
            list.push({ type: 'info', title: 'สร้างสัญญาใหม่', desc: 'งานระบบไฟ อาคาร 3', time: '09:00' });
            list.push({ type: 'info', title: 'อนุมัติงบ', desc: 'โครงการปรับปรุงทางเดิน', time: 'Yesterday' });
        }
        return list;
    }, [packages]);

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/80 h-full flex flex-col font-sans relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-white/50 to-transparent dark:from-white/5 pointer-events-none"></div>
            <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wider relative z-10">
                <BellRing size={16} className="text-slate-400"/> Notifications
            </h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1 relative z-10">
                {alerts.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent border-b-slate-50 dark:border-b-slate-700/50 transition-all group">
                        <div className={`mt-1 p-1.5 rounded-full shrink-0 shadow-sm group-hover:shadow-md transition-shadow ${item.type === 'urgent' ? 'bg-rose-50 text-rose-500 dark:bg-rose-900/20 dark:text-rose-300' : 'bg-blue-50 text-blue-500 dark:bg-blue-900/20 dark:text-blue-300'}`}>
                            {item.type === 'urgent' ? <AlertCircle size={14}/> : <Clock size={14}/>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{item.title}</p>
                                <span className="text-[10px] font-medium text-slate-400 bg-white dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 px-2 py-0.5 rounded-full">{item.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1 font-medium">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const BiddingStatusOverview = ({ packages }) => {
    const stats = useMemo(() => {
        const total = packages.length;
        let revise = 0; let bidding = 0; let delay = 0;
        packages.forEach(pkg => {
            if (pkg.currentStep === 4 || pkg.currentStep === 5) revise++;
            if (pkg.currentStep === 6 || pkg.currentStep === 7) bidding++;
            let isDelayed = false;
            if (pkg.planStart && pkg.planEnd) {
                const start = new Date(pkg.planStart).getTime();
                const end = new Date(pkg.planEnd).getTime();
                const now = new Date().getTime();
                const totalDuration = end - start;
                const elapsed = now - start;
                const actualPercent = (pkg.currentStep / 10) * 100;
                if (totalDuration > 0 && actualPercent < ((elapsed / totalDuration) * 100 - 10)) isDelayed = true;
            }
            if (isDelayed) delay++;
        });
        const activeBase = total > 0 ? total : 1;
        return { total, revise, bidding, delay, activeBase };
    }, [packages]);

    const StatusRing = ({ label, count, base, icon: Icon, colorTheme }) => {
        const percent = (count / base) * 100;
        const themes = {
            active: { ring: '#94a3b8', icon: 'text-slate-400', text: 'text-slate-700' },
            revise: { ring: '#64748b', icon: 'text-slate-500', text: 'text-slate-700' },
            bidding: { ring: '#10b981', icon: 'text-emerald-500', text: 'text-emerald-700' },
            delay: { ring: '#ef4444', icon: 'text-rose-500', text: 'text-rose-700' },
        };
        const theme = themes[colorTheme];
        return (
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-100 hover:border-slate-200 dark:border-slate-700/80 hover:shadow-sm transition-all h-full bg-white dark:bg-slate-800/80 backdrop-blur-sm group">
                <div className="relative w-12 h-12 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <div className="absolute inset-0 rounded-full border-2 border-slate-100 dark:border-slate-700/50"></div>
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={theme.ring} strokeWidth="2.5" strokeDasharray={`${percent}, 100`} strokeLinecap="round" className="drop-shadow-sm" />
                    </svg>
                    <div className={`relative z-10 ${theme.icon}`}><Icon size={16} strokeWidth={2} /></div>
                </div>
                <div className="text-center">
                    <span className={`block text-xl font-bold leading-tight ${theme.text} dark:text-white`}>{count}</span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{label}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/80 h-[260px] flex flex-col font-sans relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-white/60 to-transparent dark:from-white/5 pointer-events-none"></div>
            <h3 className="font-bold text-gray-800 dark:text-white mb-5 flex items-center gap-2 text-sm uppercase tracking-wider relative z-10"><Layout size={16} className="text-slate-400"/> Overview Status</h3>
            <div className="grid grid-cols-4 gap-3 h-full items-start relative z-10">
                <StatusRing label="Active" count={stats.total} base={stats.activeBase} icon={Briefcase} colorTheme="active" />
                <StatusRing label="Revise" count={stats.revise} base={stats.activeBase} icon={PenTool} colorTheme="revise" />
                <StatusRing label="Bidding" count={stats.bidding} base={stats.activeBase} icon={Coins} colorTheme="bidding" />
                <StatusRing label="Delay" count={stats.delay} base={stats.activeBase} icon={AlertTriangle} colorTheme="delay" />
            </div>
        </div>
    );
};

const PersonStatusCard = ({ personData }) => {
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/80 h-[260px] flex flex-col font-sans relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-blue-50/30 to-transparent dark:from-blue-900/10 pointer-events-none"></div>
            <h3 className="font-bold text-gray-800 dark:text-white mb-5 flex items-center gap-2 text-sm uppercase tracking-wider relative z-10"><Users size={16} className="text-blue-500"/> Team Performance</h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 relative z-10">
                {personData.map((person, index) => {
                    const total = person.active + person.completed;
                    const donePercent = total > 0 ? (person.completed / total) * 100 : 0;
                    return (
                        <div key={index} className="flex flex-col gap-2">
                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold uppercase shadow-sm">{person.name.substring(0, 2)}</div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{person.name}</span>
                                </div>
                                <span className="text-[10px] font-medium text-slate-400 bg-slate-50 dark:bg-slate-700/50 px-2 py-0.5 rounded-full">{person.completed} / {total} Jobs</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden flex p-[1px] ring-1 ring-slate-200/50 dark:ring-slate-700">
                                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full shadow-sm transition-all duration-500" style={{ width: `${donePercent}%` }}></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// 🟢 7. MAIN DASHBOARD LAYOUT
const BiddingDashboard = ({ packages }) => {
    const totalBudget = packages.reduce((sum, p) => sum + (p.totalBudget || 0), 0);
    const totalSaving = packages.reduce((sum, p) => p.result?.savingBudget ? sum + p.result.savingBudget : sum, 0);
    const savingPercent = totalBudget > 0 ? (totalSaving / totalBudget) * 100 : 0;
    const ownerStats = packages.reduce((acc, p) => {
        const owner = p.owner || 'Unknown';
        if (!acc[owner]) acc[owner] = { name: owner, count: 0, budget: 0, completed: 0 };
        acc[owner].count += 1;
        acc[owner].budget += p.totalBudget;
        if (p.currentStep === 10) acc[owner].completed += 1;
        return acc;
    }, {});
    const personData = Object.values(ownerStats).map(s => ({ name: s.name, active: s.count - s.completed, completed: s.completed }));
    const budgetColors = ['#3b82f6', '#0ea5e9', '#64748b', '#94a3b8', '#cbd5e1']; 
    const budgetData = Object.values(ownerStats).map((s, index) => ({ name: s.name, value: totalBudget > 0 ? parseFloat(((s.budget / totalBudget) * 100).toFixed(1)) : 0, color: budgetColors[index % budgetColors.length] })).filter(d => d.value > 0);

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
                .font-sans { font-family: 'Sarabun', sans-serif !important; }
            `}</style>

            <div className="space-y-6 mb-8 font-sans">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <TotalProjectsCard packages={packages} />
                    <RevenueBudgetCard packages={packages} />
                    <BiddingStatCard title="ยอดประหยัด (Saving)" value={`฿${(totalSaving/1000000).toFixed(2)}M`} subtext={`Save ${savingPercent.toFixed(1)}%`} icon={ArrowDown} color="luxury" trend="up" />
                    
                    <div className="hidden xl:block xl:col-span-1 xl:row-span-2 min-h-[544px]">
                        <BiddingActivityList packages={packages} />
                    </div>
                    <div className="block xl:hidden h-[260px]">
                        <BiddingActivityList packages={packages} />
                    </div>

                    <BiddingStatusOverview packages={packages} />
                    <PersonStatusCard personData={personData} />
                    
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/80 h-[260px] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-slate-50/50 to-transparent dark:from-slate-900/20 pointer-events-none"></div>
                        <h3 className="font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2 text-sm uppercase tracking-wider relative z-10"><PieChartIcon size={16} className="text-blue-500"/> Budget Share</h3>
                        <ResponsiveContainer width="100%" height="85%" className="relative z-10">
                            <PieChart>
                                <Pie data={budgetData} innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value" stroke="none">
                                    {budgetData.map((e,i)=><Cell key={i} fill={e.color} className="drop-shadow-sm"/>)}
                                </Pie>
                                <Tooltip contentStyle={{borderRadius:'12px', border:'1px solid #e2e8f0', boxShadow:'0 4px 12px rgba(0,0,0,0.05)', fontFamily:'Sarabun', fontSize:'12px'}}/>
                                <Legend wrapperStyle={{fontSize:'11px', fontFamily:'Sarabun', opacity: 0.8}} layout="vertical" verticalAlign="middle" align="right"/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </>
    );
};

const BiddingCalendar = ({ packages }) => { return <div className="p-4 bg-white rounded-xl">Calendar (Placeholder)</div>; };
const BiddingStepper = ({ currentStep, completedSteps = {}, appointments = {}, onStepClick }) => { return (<div className="flex items-center justify-between w-full min-w-[300px]">{BIDDING_STEPS.map((step, i) => { const isCompleted = step.id < currentStep; const isCurrent = step.id === currentStep; const hasAppointment = appointments[step.id]; let cls = "w-6 h-6 rounded-full flex items-center justify-center text-[9px] border-2 font-bold relative transition-all cursor-pointer shrink-0 "; let line = "h-0.5 flex-1 mx-1 bg-gray-200 dark:bg-slate-700 rounded-full"; if (isCompleted) { cls += "bg-emerald-500 border-emerald-500 text-white"; line = "h-0.5 flex-1 mx-1 bg-emerald-500"; } else if (isCurrent) { cls += "bg-white dark:bg-slate-800 border-blue-500 text-blue-500 ring-2 ring-blue-100 dark:ring-blue-900"; } else { cls += "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-300 dark:text-gray-500"; } if (hasAppointment && !isCompleted) { cls = "w-6 h-6 rounded-full flex items-center justify-center text-[9px] border-2 font-bold relative transition-all cursor-pointer shrink-0 bg-white dark:bg-slate-800 border-orange-500 text-orange-600"; } return (<React.Fragment key={step.id}><div className="relative group flex flex-col items-center justify-center" onClick={() => onStepClick(step.id)}>{hasAppointment && !isCompleted && (<span className="absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75 animate-ping"></span>)}<div className={`${cls} relative z-10`}>{isCompleted ? <Check size={12} strokeWidth={4}/> : hasAppointment && !isCompleted ? <BellRing size={12}/> : step.id}</div><div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none w-max"><div className="bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap mb-1">{step.label}</div>{hasAppointment && (<div className="bg-orange-100 text-orange-700 text-[9px] px-2 py-0.5 rounded shadow-sm border border-orange-200 font-mono mb-1 flex items-center gap-1"><CalendarIcon size={8}/> นัด: {hasAppointment.date}</div>)}<div className="w-2 h-2 bg-gray-800 rotate-45 -mt-2"></div></div></div>{i < BIDDING_STEPS.length - 1 && <div className={line}></div>}</React.Fragment>);})}</div>); };
const BiddingProgress = ({ currentStep, startDate, endDate }) => { const actualPercent = (currentStep / 10) * 100; let planPercent = 0; if (startDate && endDate) { const start = new Date(startDate).getTime(); const end = new Date(endDate).getTime(); const now = new Date().getTime(); const totalDuration = end - start; const elapsed = now - start; if (totalDuration > 0) { planPercent = (elapsed / totalDuration) * 100; planPercent = Math.max(0, Math.min(100, planPercent)); } } const isDelayed = actualPercent < (planPercent - 10); const statusColor = isDelayed ? 'bg-red-500' : 'bg-emerald-500'; const textColor = isDelayed ? 'text-red-500' : 'text-emerald-600'; return (<div className="flex flex-col gap-1 w-full max-w-[120px]"><div className="flex justify-between items-end text-[10px]"><span className={`font-bold ${textColor}`}>Act: {actualPercent.toFixed(0)}%</span><span className="text-gray-400">Plan: {planPercent.toFixed(0)}%</span></div><div className="h-2 w-full bg-gray-100 dark:bg-slate-700 rounded-full relative overflow-hidden"><div className="absolute top-0 bottom-0 bg-gray-300 dark:bg-slate-500 opacity-50 transition-all duration-500" style={{ width: `${planPercent}%` }}></div><div className={`absolute top-0 bottom-0 rounded-full ${statusColor} transition-all duration-500 shadow-sm`} style={{ width: `${actualPercent}%` }}></div></div>{isDelayed && (<div className="flex items-center gap-1 text-[9px] text-red-500 font-bold animate-pulse"><AlertCircle size={10} /> Late</div>)}</div>); };
const BiddingResultForm = ({ pkg, onSave }) => { const [formData, setFormData] = useState({ winner: pkg.result?.winner || '', finalPrice: pkg.result?.finalPrice || '', middlePrice: pkg.result?.middlePrice || '', lowestBid: pkg.result?.lowestBid || '', avgPrice: pkg.result?.avgPrice || '' }); const budget = pkg.totalBudget; const final = parseFloat(formData.finalPrice) || 0; const middle = parseFloat(formData.middlePrice) || 0; const discountFromBudget = budget > 0 ? ((budget - final) / budget) * 100 : 0; const discountFromMiddle = middle > 0 ? ((middle - final) / middle) * 100 : 0; const savingBudget = budget - final; const savingMiddle = middle - final; return (<div className="space-y-4"><div className="overflow-hidden rounded-lg border border-gray-300 dark:border-slate-600"><table className="w-full text-xs text-center border-collapse"><thead className="bg-[#1e40af] text-white"><tr><th className="p-2 border-r border-blue-800 font-medium">ผู้ชนะการประมูล</th><th className="p-2 border-r border-blue-800 font-medium">สรุปราคา</th><th className="p-2 border-r border-blue-800 font-medium">งบประมาณ</th><th className="p-2 border-r border-blue-800 font-medium">ราคากลาง</th><th className="p-2 border-r border-blue-800 font-medium">ลดจากกลาง</th><th className="p-2 font-medium">ลดจากงบ</th></tr></thead><tbody className="bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200"><tr><td className="p-2 border-r border-gray-200 dark:border-slate-700"><input type="text" className="w-full text-center outline-none bg-transparent font-bold" placeholder="ชื่อบริษัท" value={formData.winner} onChange={e => setFormData({...formData, winner: e.target.value})} /></td><td className="p-2 border-r border-gray-200 dark:border-slate-700"><input type="number" className="w-full text-center outline-none bg-transparent font-bold text-emerald-600" placeholder="0.00" value={formData.finalPrice} onChange={e => setFormData({...formData, finalPrice: e.target.value})} /></td><td className="p-2 border-r border-gray-200 dark:border-slate-700 text-gray-500">{budget.toLocaleString()}</td><td className="p-2 border-r border-gray-200 dark:border-slate-700"><input type="number" className="w-full text-center outline-none bg-transparent" placeholder="0.00" value={formData.middlePrice} onChange={e => setFormData({...formData, middlePrice: e.target.value})} /></td><td className={`p-2 border-r border-gray-200 dark:border-slate-700 font-bold ${discountFromMiddle >= 0 ? 'text-green-600' : 'text-red-500'}`}>{middle ? `${discountFromMiddle.toFixed(2)}%` : '-'}</td><td className={`p-2 font-bold ${discountFromBudget >= 0 ? 'text-green-600' : 'text-red-500'}`}>{discountFromBudget.toFixed(2)}%</td></tr></tbody></table></div><div className="grid grid-cols-2 gap-4 text-xs"><div><label className="font-bold text-gray-500 dark:text-gray-400">ราคาเฉลี่ย ผรม.</label><input type="number" className="w-full border rounded p-1.5 mt-1 bg-white dark:bg-slate-700 dark:text-white outline-none" value={formData.avgPrice} onChange={e => setFormData({...formData, avgPrice: e.target.value})} /></div><div><label className="font-bold text-gray-500 dark:text-gray-400">ยื่นซองต่ำสุด</label><input type="number" className="w-full border rounded p-1.5 mt-1 bg-white dark:bg-slate-700 dark:text-white outline-none" value={formData.lowestBid} onChange={e => setFormData({...formData, lowestBid: e.target.value})} /></div></div><div className="flex justify-end pt-2"><button onClick={() => onSave({ ...formData, discountFromBudget, discountFromMiddle, savingBudget, savingMiddle })} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium flex items-center gap-2"><Save size={14}/> บันทึกผล</button></div></div>); };

// 🟢 MAIN PAGE COMPONENT
const BiddingPage = ({ packages, onRefresh }) => {
  const [poolProjects, setPoolProjects] = useState([]); 

  const [activeTab, setActiveTab] = useState('pool');
  const [viewMode, setViewMode] = useState('list');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [selectedPoolIds, setSelectedPoolIds] = useState([]);
  const [currentPkg, setCurrentPkg] = useState(null);
  const [targetStep, setTargetStep] = useState(null);
  const [pkgNameInput, setPkgNameInput] = useState('');
  const [pkgCodeInput, setPkgCodeInput] = useState('');
  const [stepDateInput, setStepDateInput] = useState('');
  const [stepNoteInput, setStepNoteInput] = useState('');
  const [activeModalTab, setActiveModalTab] = useState('actual');
  const [appointmentTime, setAppointmentTime] = useState('');

  // ฟังก์ชันดึงข้อมูลจาก DB (ใส่มาให้แล้ว 100% ไม่ Error แน่นอน)
// src/pages/BiddingPage.jsx

  // src/pages/BiddingPage.jsx

  // src/pages/BiddingPage.jsx

  const fetchReadyProjects = async () => {
    try {
        console.log("🔍 กำลังค้นหาโครงการที่จบ Step 7 (ส่งประมูล)...");

        // 1. ค้นหาในตาราง design_pipeline_steps ว่ามี project_id ไหนบ้างที่จบ Step 7 แล้ว
        const { data: steps, error: stepError } = await supabase
            .from('design_pipeline_steps')
            .select('project_id')
            .eq('step_order', 7)        // ✅ เงื่อนไข: ขั้นตอนที่ 7
            .eq('status', 'completed'); // ✅ เงื่อนไข: สถานะต้องเสร็จแล้ว

        if (stepError) throw stepError;

        // ถ้าไม่มีงานไหนเสร็จเลย
        if (!steps || steps.length === 0) {
            console.log("❌ ไม่พบงานที่จบ Step 7");
            setPoolProjects([]);
            return;
        }

        // ดึงเอาเฉพาะ ID ออกมาเป็น List (เช่น ['uuid-1', 'uuid-2'])
        const readyProjectIds = steps.map(s => s.project_id);

        // 2. เอา ID ที่ได้ ไปดึงข้อมูลรายละเอียดจากตาราง projects
        const { data: projects, error: projError } = await supabase
            .from('projects')
            .select('*')
            .in('id', readyProjectIds)       // ✅ เอาเฉพาะ Project ที่ผ่าน Step 7
            .is('bidding_package_id', null)  // ✅ และต้องยังไม่มีสัญญา (ปม.)
            .order('created_at', { ascending: false });

        if (projError) throw projError;

        console.log(`✅ พบโครงการพร้อมประมูล: ${projects.length} โครงการ`);
        setPoolProjects(projects || []);

    } catch (err) {
        console.error("Error fetching pool:", err);
    }
  };
  useEffect(() => {
    fetchReadyProjects();
  }, [onRefresh, packages]); 

  const handleSelectPool = (id) => setSelectedPoolIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  
  const handleCreatePackage = async () => {
    if (!pkgCodeInput || !pkgNameInput) return alert('ระบุข้อมูลให้ครบ');
    
    // กรองจาก poolProjects ที่ fetch มา
    const selectedProjs = poolProjects.filter(p => selectedPoolIds.includes(p.id));
    
    const totalBudget = selectedProjs.reduce((sum, p) => sum + p.budget, 0);
    const today = new Date(); const next60Days = new Date(); next60Days.setDate(today.getDate() + 60);
    
    const { data, error } = await supabase.from('bidding_packages').insert([{ code: pkgCodeInput, name: pkgNameInput, total_budget: totalBudget, plan_start: today, plan_end: next60Days, current_step: 1, owner: 'Admin' }]).select().single();
    
    if (error) { alert(error.message); return; }
    
    if (data && data.id) { 
        await supabase.from('projects').update({ bidding_package_id: data.id }).in('id', selectedPoolIds); 
        onRefresh(); 
        fetchReadyProjects(); 
        setIsCreateModalOpen(false); 
        setSelectedPoolIds([]); 
    }
  };

  const handleEditPackage = (pkg) => { setCurrentPkg(pkg); setIsEditModalOpen(true); };
  const handleSavePackage = async (resultData) => { await supabase.from('bidding_packages').update({ result: resultData }).eq('id', currentPkg.id); onRefresh(); setIsEditModalOpen(false); };
  
  const handleStepClick = (pkg, stepId) => {
      const step = BIDDING_STEPS.find(s => s.id === stepId);
      const prevData = pkg.completedSteps?.[stepId];
      const apptData = pkg.appointments?.[stepId];
      setCurrentPkg(pkg); setTargetStep(step);
      setStepDateInput(prevData?.date || new Date().toISOString().split('T')[0]);
      setStepNoteInput(prevData?.note || '');
      setAppointmentTime(apptData?.time || '');
      setActiveModalTab('actual'); 
      setIsDateModalOpen(true);
  };

  const handleConfirmDate = async () => {
      if(!stepDateInput) return alert("กรุณาระบุวันที่");
      let updatePayload = {};
      if (activeModalTab === 'actual') {
          const newCompletedSteps = { ...currentPkg.completedSteps, [targetStep.id]: { date: stepDateInput, note: stepNoteInput } };
          const newCurrentStep = targetStep.id >= currentPkg.currentStep ? targetStep.id : currentPkg.currentStep;
          updatePayload = { completed_steps: newCompletedSteps, current_step: newCurrentStep };
      } else {
          const newAppointments = { ...currentPkg.appointments, [targetStep.id]: { date: stepDateInput, time: appointmentTime, note: stepNoteInput } };
          updatePayload = { appointments: newAppointments };
      }
      await supabase.from('bidding_packages').update(updatePayload).eq('id', currentPkg.id);
      onRefresh();
      if (isEditModalOpen) { setCurrentPkg(prev => ({ ...prev, ...updatePayload })); }
      setIsDateModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10 font-sans">
       <BiddingDashboard packages={packages} />
       <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex flex-col xl:flex-row justify-between items-center gap-4">
               <div className="flex items-center gap-4">
                 <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 whitespace-nowrap"><FileText size={20} className="text-emerald-600 dark:text-emerald-400" /> รายการสัญญาประมูล (Bidding Packages)</h3>
                 <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-lg">
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-gray-400 dark:text-gray-400'}`} title="List View"><FileText size={16} /></button>
                    <button onClick={() => setViewMode('calendar')} className={`p-1.5 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-gray-400 dark:text-gray-400'}`} title="Calendar View"><CalendarIcon size={16} /></button>
                 </div>
               </div>
               <div className="flex gap-2 w-full sm:w-auto">
                 <button onClick={() => setIsCreateModalOpen(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none"><Plus size={16}/> สร้างสัญญาประมูลใหม่ ({poolProjects.length})</button>
               </div>
            </div>
            {viewMode === 'list' ? (
                 <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[1200px]">
                        <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold">
                            <tr><th className="p-4 w-[250px]">Package Name</th><th className="p-4 w-[100px]">Budget</th><th className="p-4 w-[100px] text-purple-600 dark:text-purple-400">Revenue (0.3%)</th><th className="p-4 w-[100px] text-center">Progress</th><th className="p-4 w-[120px] text-center">Saving Result</th><th className="p-4 text-center w-[400px]">Timeline (Click to Update)</th><th className="p-4 w-[100px]">Owner</th><th className="p-4 text-center w-[50px]">Edit</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {packages.length === 0 ? (<tr><td colSpan="8" className="p-8 text-center text-gray-400">ยังไม่มีรายการสัญญาประมูล</td></tr>) : (packages.map((pkg) => {
                                const revenue = (pkg.totalBudget || 0) * 0.003;
                                return (
                                    <tr key={pkg.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="p-4"><div className="font-bold text-gray-800 dark:text-white truncate max-w-[250px]" title={pkg.name}>{pkg.name}</div><div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Package size={10}/> {pkg.code}</div></td>
                                        <td className="p-4 font-mono text-gray-700 dark:text-gray-300">{(pkg.totalBudget/1000000).toFixed(2)} M</td>
                                        <td className="p-4 font-mono font-bold text-purple-600 dark:text-purple-400">{revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                        <td className="p-4 text-center"><BiddingProgress currentStep={pkg.currentStep} startDate={pkg.planStart} endDate={pkg.planEnd} /></td>
                                        <td className="p-4 text-center">{pkg.result ? (<div><div className={`font-bold text-sm ${pkg.result.discountFromBudget >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{pkg.result.discountFromBudget.toFixed(2)}%</div><div className="text-[10px] text-gray-400">Saving</div></div>) : (<span className="text-gray-300 text-xs">-</span>)}</td>
                                        <td className="p-4"><BiddingStepper currentStep={pkg.currentStep} completedSteps={pkg.completedSteps} appointments={pkg.appointments} onStepClick={(stepId) => handleStepClick(pkg, stepId)} /></td>
                                        <td className="p-4 text-gray-600 dark:text-gray-400 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center text-[10px]">{pkg.owner ? pkg.owner.charAt(0) : 'U'}</div> {pkg.owner}</td>
                                        <td className="p-4 text-center"><button onClick={() => handleEditPackage(pkg)} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"><Edit size={16} /></button></td>
                                    </tr>
                                );
                            }))}
                        </tbody>
                    </table>
                 </div>
            ) : (
                <div className="p-6"><BiddingCalendar packages={packages} /></div>
            )}
       </div>

       {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl p-6 shadow-2xl flex flex-col max-h-[80vh]">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-white shrink-0"><Package className="text-emerald-600"/> สร้างสัญญาประมูล (Select from Pool)</h3>
                <div className="grid grid-cols-2 gap-4 mb-4 shrink-0">
                    <div><label className="text-xs font-bold text-gray-500 dark:text-gray-400">รหัสสัญญา</label><input type="text" className="w-full border dark:border-slate-600 rounded p-2 mt-1 bg-white dark:bg-slate-700 dark:text-white outline-none" value={pkgCodeInput} onChange={e => setPkgCodeInput(e.target.value)} /></div>
                    <div><label className="text-xs font-bold text-gray-500 dark:text-gray-400">ชื่อสัญญา</label><input type="text" className="w-full border dark:border-slate-600 rounded p-2 mt-1 bg-white dark:bg-slate-700 dark:text-white outline-none" value={pkgNameInput} onChange={e => setPkgNameInput(e.target.value)} /></div>
                </div>
                <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-slate-700 rounded-lg">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-slate-700 text-gray-500"><tr><th className="p-3 w-10"></th><th className="p-3">Project</th><th className="p-3">Budget</th></tr></thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {poolProjects.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-600/50">
                                    <td className="p-3"><input type="checkbox" checked={selectedPoolIds.includes(p.id)} onChange={() => handleSelectPool(p.id)}/></td>
                                    <td className="p-3 dark:text-white">{p.name} <div className="text-xs text-gray-400">{p.location}</div></td>
                                    <td className="p-3 font-mono dark:text-gray-300">{(p.budget/1000000).toFixed(2)}M</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end gap-2 mt-4 shrink-0"><button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">ยกเลิก</button><button onClick={handleCreatePackage} disabled={selectedPoolIds.length === 0} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50">ยืนยันสร้าง ({selectedPoolIds.length})</button></div>
            </div>
        </div>
      )}

      {isEditModalOpen && currentPkg && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4"><div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]"><h3 className="text-lg font-bold mb-1 text-gray-800 dark:text-white flex items-center gap-2"><Edit size={20}/> จัดการสัญญา: {currentPkg.name}</h3><p className="text-xs text-gray-400 mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">รหัส: {currentPkg.code} | งบประมาณ: ฿{(currentPkg.totalBudget/1000000).toFixed(2)}M</p><div className="space-y-6"><div><h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">อัพเดทสถานะ (Update Status)</h4><div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 overflow-x-auto"><BiddingStepper currentStep={currentPkg.currentStep} completedSteps={currentPkg.completedSteps} appointments={currentPkg.appointments} onStepClick={(stepId) => handleStepClick(currentPkg, stepId)} /></div></div><div><h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">บันทึกผลการประมูล (Result Summary)</h4><BiddingResultForm pkg={currentPkg} onSave={handleSavePackage} /></div></div><div className="flex justify-end mt-6 pt-4 border-t border-gray-100 dark:border-slate-700"><button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">ปิดหน้าต่าง</button></div></div></div>
      )}

      {isDateModalOpen && targetStep && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4"><div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-sm p-6 shadow-2xl"><div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold">{targetStep.id}</div><div><div className="text-xs text-gray-400 font-bold uppercase">บันทึกวันที่</div><h3 className="text-lg font-bold text-gray-800 dark:text-white">{targetStep.label}</h3></div></div><div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-lg mb-4"><button onClick={() => setActiveModalTab('actual')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeModalTab === 'actual' ? 'bg-white dark:bg-slate-600 text-emerald-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>บันทึกวันจริง (Actual)</button><button onClick={() => setActiveModalTab('appointment')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeModalTab === 'appointment' ? 'bg-white dark:bg-slate-600 text-orange-500 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>ลงนัดหมาย (Appointment)</button></div><div className="space-y-4"><div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{activeModalTab === 'actual' ? 'วันที่ดำเนินการเสร็จ' : 'วันที่นัดหมาย'}</label><input type="date" className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" value={stepDateInput} onChange={e => setStepDateInput(e.target.value)} /></div>{activeModalTab === 'appointment' && (<div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">เวลา (Optional)</label><input type="time" className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-700 dark:text-white outline-none" value={appointmentTime} onChange={e => setAppointmentTime(e.target.value)} /></div>)}<div className="animate-fade-in"><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">รายละเอียด <span className="text-[10px] bg-gray-100 dark:bg-slate-600 text-gray-500 px-1.5 rounded">Optional</span></label><textarea className="w-full border dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-700 dark:text-white outline-none text-sm" rows="3" placeholder={activeModalTab === 'actual' ? "บันทึกเพิ่มเติม..." : "รายละเอียดการนัดหมาย..."} value={stepNoteInput} onChange={e => setStepNoteInput(e.target.value)}></textarea></div></div><div className="flex justify-end gap-2 mt-6"><button onClick={() => setIsDateModalOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">ยกเลิก</button><button onClick={handleConfirmDate} className={`px-4 py-2 text-white rounded shadow-lg flex items-center gap-2 ${activeModalTab === 'actual' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-500 hover:bg-orange-600'}`}>{activeModalTab === 'actual' ? <CheckCircle size={16}/> : <CalendarIcon size={16}/>}{activeModalTab === 'actual' ? 'ยืนยันจบงาน' : 'บันทึกนัดหมาย'}</button></div></div></div>
      )}

    </div>
  );
};

export default BiddingPage;