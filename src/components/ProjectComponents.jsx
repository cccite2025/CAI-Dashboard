// src/components/ProjectComponents.jsx
import { 
  // กลุ่ม 1: ไอคอนทั่วไป
  Calendar, Save, X, UploadCloud, Box, Upload, FileBox, Trash2, RotateCcw,
  Briefcase, CheckCircle, AlertCircle, Check, PauseCircle, Coins, TrendingUp,
  
  // กลุ่ม 2: ไอคอนกราฟและผู้ใช้
  PieChart, Trophy, Crown, User, GanttChartSquare, FileText, Clock, MapPin,
  
  // กลุ่ม 3: ไอคอนจัดการ
  Settings, PlayCircle, XCircle, Edit3, PenTool, Info
} from 'lucide-react';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { IFCViewer } from './IFCViewer';

import {
  PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip
} from 'recharts';
import { BU_CONFIG, WEIGHTS_BY_ORDER } from '../utils';

// ✅✅✅ 1. ย้าย Style มาไว้ตรงนี้ (Global) เพื่อแก้ปัญหา ReferenceError ทุกจุด
const inputStyle = "w-full border border-gray-200 dark:border-slate-600 rounded-lg p-2.5 text-sm bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed transition-all placeholder:text-gray-300";
const labelStyle = "block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider";

// --- Shared Components ---
export const UserAvatar = ({ name, size = "md" }) => {
  const sizeClasses = { sm: "w-6 h-6 text-[10px]", md: "w-8 h-8 text-xs", lg: "w-10 h-10 text-sm" };
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold border border-blue-100 dark:border-slate-600 shadow-sm shrink-0 select-none ring-2 ring-white dark:ring-slate-800`} title={name}>
      {name ? name.charAt(0) : '?'}
    </div>
  );
};

export const BUBadge = ({ buCode }) => {
  const config = BU_CONFIG[buCode] || BU_CONFIG['default'];
  return (
    <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${config.color} shadow-sm group relative text-lg cursor-help shrink-0`} >
      {config.icon}
      <div className="absolute bottom-full mb-2 hidden group-hover:block w-max max-w-[120px] text-center z-10 bg-gray-800 text-white text-xs p-2 rounded shadow-lg">{config.label}</div>
    </div>
  );
};

export const SegmentedProgress = ({ plan, actual, status, delayDays, projectStatus }) => {
  if (projectStatus === 'Cancelled') return <span className="text-xs text-gray-400 font-medium bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-full whitespace-nowrap">ยกเลิก</span>;
  if (projectStatus === 'Hold') return <span className="text-xs text-orange-500 font-medium bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full flex items-center gap-1 w-max mx-auto"><PauseCircle size={10}/> ชะลอ</span>;
  const totalBars = 15; const activeBars = Math.round((actual / 100) * totalBars); const isDelayed = delayDays > 0 || status === 'Delay';
  return (
    <div className="w-[100px] flex flex-col gap-1">
      <div className="flex justify-between items-end mb-0.5"><span className={`text-sm font-bold ${isDelayed ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{actual}%</span><span className="text-[9px] text-gray-400 dark:text-gray-500 font-mono">{delayDays > 0 ? <span className="text-red-500 font-bold">{delayDays}d Late</span> : `P:${plan}%`}</span></div>
      <div className="flex gap-[2px] h-2.5 items-end">{[...Array(totalBars)].map((_, index) => (<div key={index} className={`w-full rounded-[1px] transition-all duration-300 ${index < activeBars ? (isDelayed ? 'bg-red-500' : 'bg-emerald-500') + ' h-full' : 'bg-gray-100 dark:bg-slate-700 h-full'}`}></div>))}</div>
    </div>
  );
};

export const ProjectStepper = ({ steps, projectStatus, onStepClick }) => {
  if (projectStatus === 'Cancelled') return <span className="text-gray-300 text-xs italic">Cancelled</span>;
  if (!steps?.length) return <span className="text-gray-300">-</span>;
  
  const sorted = [...steps].sort((a, b) => a.step_order - b.step_order);
  
  return (
    <div className="flex items-center justify-between w-full min-w-[200px]">
      {sorted.map((s, i) => {
        let cls = "w-4 h-4 rounded-full flex items-center justify-center text-[8px] border-2 font-bold relative transition-all ";
        let line = "h-0.5 flex-1 mx-0.5 bg-gray-200 dark:bg-slate-700 rounded-full";
        
        if (s.status === 'completed') { cls += "bg-emerald-500 border-emerald-500 text-white"; line = "h-0.5 flex-1 mx-0.5 bg-emerald-500"; }
        else if (s.status === 'current') { cls += "bg-white dark:bg-slate-800 border-blue-500 text-blue-500 ring-2 ring-blue-100 dark:ring-blue-900"; }
        else { cls += "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-300 dark:text-slate-600"; }
        
        const cursorClass = onStepClick ? "cursor-pointer hover:scale-125 hover:shadow-md" : "";

        return (
          <React.Fragment key={i}>
            <div 
                className={`relative group flex flex-col items-center ${cursorClass}`}
                onClick={(e) => {
                    e.stopPropagation();
                    if (onStepClick) onStepClick(s);
                }}
            >
              <div className={cls}>
                {s.status === 'completed' ? <Check size={8} strokeWidth={4}/> : (i+1)}
              </div>
              <div className="absolute bottom-full mb-1 hidden group-hover:block w-max max-w-[100px] text-center z-10 bg-gray-800 text-white text-[10px] p-1.5 rounded shadow-lg">
                {s.step_name}
              </div>
            </div>
            {i < sorted.length - 1 && <div className={line}></div>}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const ProjectHealthCard = ({ projects }) => {
    const activeProjects = projects.filter(p => p.project_status !== 'Cancelled');
    const total = projects.length;
    const onPlan = activeProjects.filter(p => p.status === 'On Plan').length;
    const delayed = activeProjects.filter(p => p.status === 'Delay').length;
    const completed = projects.filter(p => p.status === 'Completed').length;
    const hold = projects.filter(p => p.project_status === 'Hold').length;
  
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Briefcase size={100} className="text-gray-900 dark:text-gray-100" /></div>
        <div className="flex justify-between items-start mb-6 relative z-10">
          <div><h3 className="text-gray-400 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Projects</h3><span className="text-5xl font-extrabold text-gray-800 dark:text-white tracking-tight">{total}</span></div>
          <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-2xl text-gray-600 dark:text-slate-300"><Briefcase size={24} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3 relative z-10">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800 flex flex-col"><span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1"><CheckCircle size={12}/> On Plan</span><span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{onPlan}</span></div>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-800 flex flex-col"><span className="text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-1"><AlertCircle size={12}/> Delay</span><span className="text-2xl font-bold text-red-700 dark:text-red-300">{delayed}</span></div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl border border-purple-100 dark:border-purple-800 flex flex-col"><span className="text-purple-600 dark:text-purple-400 text-xs font-bold flex items-center gap-1"><Check size={12}/> Done</span><span className="text-2xl font-bold text-purple-700 dark:text-purple-300">{completed}</span></div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl border border-orange-100 dark:border-orange-800 flex flex-col"><span className="text-orange-600 dark:text-orange-400 text-xs font-bold flex items-center gap-1"><PauseCircle size={12}/> Hold</span><span className="text-2xl font-bold text-orange-700 dark:text-orange-300">{hold}</span></div>
        </div>
      </div>
    );
};
  
export const FinancialOverviewCard = ({ totalBudget, totalForecastRevenue, actualRevenue }) => {
    const achievementPercent = totalForecastRevenue > 0 ? (actualRevenue / totalForecastRevenue) * 100 : 0;
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-6 rounded-3xl shadow-sm border border-emerald-100 dark:border-emerald-800/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-100 dark:bg-emerald-800/30 rounded-full blur-[50px] opacity-60 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex justify-between items-start">
              <div>
                <h3 className="text-emerald-900/60 dark:text-emerald-200/70 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Coins size={14} className="text-emerald-500"/> Revenue (Earned)
                </h3>
                <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 tracking-tight mt-1">
                    ฿{(actualRevenue / 1000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 font-medium">
                    Total Budget: ฿{(totalBudget / 1000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M
                </p>
             </div>
             <div className="p-3 bg-white dark:bg-emerald-900/30 backdrop-blur-sm rounded-2xl text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-100 dark:border-emerald-700/50">
                <TrendingUp size={24} />
             </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between items-end mb-2">
               <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Target: ฿{(totalForecastRevenue / 1000000).toFixed(2)}M</span>
               <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{achievementPercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-white dark:bg-slate-700/50 rounded-full h-3 overflow-hidden border border-emerald-100 dark:border-emerald-800/30">
               <div 
                 className="bg-gradient-to-r from-emerald-400 to-teal-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                 style={{ width: `${Math.min(100, achievementPercent)}%` }}
               ></div>
            </div>
          </div>
        </div>
      </div>
    );
};

export const BUMixCard = ({ buData }) => {
    const COLORS = ['#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#3B82F6', '#6366F1'];
    const totalRevenue = buData.reduce((sum, val) => sum + val.value, 0);
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden">
         <div className="flex items-center gap-2 mb-4 relative z-10"><div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 rounded-lg"><PieChart size={18}/></div><h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Revenue by BU</h3></div>
         <div className="flex-1 flex items-center gap-4">
            <div className="w-[120px] h-[120px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie data={buData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={55} paddingAngle={4} cornerRadius={4} stroke="none">{buData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie>
                </RechartsPie>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none"><span className="text-xs text-gray-400">Top</span><span className="text-lg font-bold text-gray-700 dark:text-gray-200">{buData.length}</span></div>
            </div>
            <div className="flex-1 flex flex-col gap-2 text-xs overflow-y-auto max-h-[130px] custom-scrollbar pr-1">{buData.map((entry, index) => (<div key={entry.name} className="flex justify-between items-center"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span><span className="text-gray-600 dark:text-gray-300 font-medium">{entry.name}</span></div><span className="font-bold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-slate-700 px-1.5 py-0.5 rounded">{totalRevenue > 0 ? (entry.value / totalRevenue * 100).toFixed(0) : 0}%</span></div>))}</div>
         </div>
      </div>
    );
};

export const TeamRevenueCard = ({ teamData }) => {
    const top5 = teamData.slice(0, 5);
    const maxRevenue = top5.length > 0 ? top5[0].revenue : 1;
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden">
         <div className="flex items-center gap-2 mb-4"><div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-lg"><Trophy size={18}/></div><h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Top Performers</h3></div>
         <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1">
           {top5.map((member, index) => (
             <div key={member.name} className="group">
               <div className="flex justify-between items-center mb-1">
                 <div className="flex items-center gap-3"><div className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-100 text-gray-600' : index === 2 ? 'bg-orange-100 text-orange-700' : 'text-gray-400 dark:bg-slate-700 dark:text-gray-300'}`}>{index + 1}</div><div className="flex items-center gap-2"><UserAvatar name={member.name} size="sm" /><span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{member.name}</span>{index === 0 && <Crown size={12} className="text-yellow-500 rotate-[-15deg]" />}</div></div>
                 <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">฿{(member.revenue / 1000000).toFixed(1)}M</span>
               </div>
               <div className="w-full bg-gray-50 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden"><div className={`h-1.5 rounded-full transition-all duration-500 ${index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 'bg-emerald-400'}`} style={{ width: `${(member.revenue / maxRevenue) * 100}%` }}></div></div>
             </div>
           ))}
         </div>
      </div>
    );
};

export const ProjectCard = ({ project, onClick }) => {
    const isDelayed = project.status === 'Delay';
    return (
      <div onClick={onClick} className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-700 hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative mb-3">
        <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${isDelayed ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
        <div className="pl-3">
          <div className="flex justify-between items-start mb-1"><span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-slate-700 px-1.5 py-0.5 rounded tracking-wider">{project.project_code || 'NO-ID'}</span>{isDelayed && <AlertCircle size={12} className="text-red-500" />}</div>
          <h4 className="text-xs font-bold text-gray-700 dark:text-gray-200 leading-tight mb-2 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{project.name}</h4>
          <div className="flex justify-between items-end border-t border-gray-50 dark:border-slate-700 pt-2 mt-1"><div className="flex items-center gap-1.5"><UserAvatar name={project.owner} size="sm" /><span className="text-[10px] text-gray-400 dark:text-gray-500 truncate max-w-[50px]">{project.owner}</span></div><span className="text-[10px] font-mono text-gray-500 dark:text-gray-400">{(project.budget/1000000).toFixed(1)}M</span></div>
        </div>
      </div>
    );
};

export const ProjectKanbanBoard = ({ projects, onEdit }) => {
    const steps = [{ id: 1, name: '1.เริ่มโครงการ' }, { id: 2, name: '2.วางผัง' }, { id: 3, name: '3.แบบร่าง' }, { id: 4, name: '4.แบบขออนุญาต' }, { id: 5, name: '5.แบบประมูล' }, { id: 6, name: '6.ประมูล' }, { id: 7, name: '7.ก่อสร้าง' }];
    const getProjectStep = (p) => {
      if (!p.pipeline_steps?.length) return 1;
      const current = p.pipeline_steps.find(s => s.status === 'current');
      if (current) return current.step_order;
      const completed = [...p.pipeline_steps].reverse().find(s => s.status === 'completed');
      return completed ? Math.min(completed.step_order + 1, 7) : 1;
    };
    return (
      <div className="overflow-x-auto pb-4 pt-4 mt-2">
        <div className="flex gap-4 min-w-[1600px] px-1">
          {steps.map(step => (
               <div key={step.id} className="flex-1 min-w-[220px] bg-gray-50/50 dark:bg-slate-800/50 rounded-2xl p-3 border border-transparent hover:border-gray-200 dark:hover:border-slate-700 transition-colors flex flex-col h-[600px]">
                  <div className="pb-3 mb-2 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center"><span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">{step.name}</span></div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">{projects.filter(p => getProjectStep(p) === step.id && p.project_status !== 'Cancelled').map(p => (<ProjectCard key={p.id} project={p} onClick={() => onEdit(p)} />))}</div>
               </div>
          ))}
        </div>
      </div>
    );
};

export const ProjectGanttView = ({ projects }) => {
    const { months, gridData } = useMemo(() => {
      const validProjects = projects.filter(p => p.startDate && p.endDate && p.project_status !== 'Cancelled');
      if (validProjects.length === 0) return { months: [], gridData: [] };
  
      const dates = validProjects.flatMap(p => [
          new Date(p.startDate), 
          new Date(p.endDate), 
          new Date() 
      ].filter(Boolean));
      
      const minDate = new Date(Math.min(...dates)); minDate.setMonth(minDate.getMonth() - 1);
      const maxDate = new Date(Math.max(...dates)); maxDate.setMonth(maxDate.getMonth() + 2);
  
      const months = []; 
      const current = new Date(minDate); current.setDate(1); 
      while (current <= maxDate) { 
          months.push(new Date(current)); 
          current.setMonth(current.getMonth() + 1); 
      }
      
      const totalDaysSpan = (maxDate - minDate) / (1000 * 60 * 60 * 24);
      
      const gridData = validProjects.map(p => {
          const start = new Date(p.startDate);
          const planEnd = new Date(p.endDate);
          const today = new Date();
          
          const startOffset = (start - minDate) / (1000 * 60 * 60 * 24); 
          const leftPercent = (startOffset / totalDaysSpan) * 100;
  
          const planDuration = (planEnd - start) / (1000 * 60 * 60 * 24); 
          const planWidthPercent = (planDuration / totalDaysSpan) * 100;
          const planColor = 'bg-gray-300 dark:bg-slate-600 opacity-50';
  
          let actualWidthPercent = 0;
          let barColor = 'bg-emerald-500';
  
          const isCompleted = p.status === 'Completed' || p.project_status === 'Completed';
          const isDelayed = p.status === 'Delay' || (!isCompleted && today > planEnd);
  
          if (isCompleted) {
              const finishDate = p.actualFinishDate ? new Date(p.actualFinishDate) : planEnd;
              const actualDuration = (finishDate - start) / (1000 * 60 * 60 * 24);
              actualWidthPercent = (actualDuration / totalDaysSpan) * 100;
  
              if (finishDate > planEnd) {
                  barColor = 'bg-red-500'; 
              } else {
                  barColor = 'bg-emerald-500';
              }
  
          } else {
              if (isDelayed) {
                  const currentDuration = (today - start) / (1000 * 60 * 60 * 24);
                  actualWidthPercent = (currentDuration / totalDaysSpan) * 100;
                  barColor = 'bg-red-500';
              } else {
                  actualWidthPercent = (planWidthPercent * ((p.actualPercent || 0) / 100));
                  barColor = 'bg-emerald-500';
              }
          }
          
          return { ...p, leftPercent, planWidthPercent, actualWidthPercent, barColor, planColor };
      });
  
      return { months, gridData };
    }, [projects]);
  
    if (gridData.length === 0) return <div className="p-10 text-center text-gray-400 bg-white dark:bg-slate-800 border border-dashed rounded-xl mt-4">ไม่พบข้อมูล Timeline</div>;
    
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200 dark:shadow-slate-900 border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col h-[600px] animate-fade-in mt-6 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-0 pointer-events-none"></div>
        
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm flex justify-between items-center shrink-0 z-10">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 text-lg">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg"><GanttChartSquare size={20}/></div> 
                Project Timeline
            </h3>
            <div className="flex gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700 px-4 py-2 rounded-xl border border-gray-100 dark:border-slate-600">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-300 rounded-full border border-gray-400"></div> Plan</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full shadow-sm"></div> On Plan</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div> Delay / Late</div>
            </div>
        </div>
  
        <div className="flex-1 overflow-auto relative custom-scrollbar z-10">
            <div className="min-w-[1200px] relative pb-4">
                <div className="flex border-b border-gray-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-20 shadow-sm h-10 items-center">
                    <div className="w-[220px] shrink-0 p-3 text-xs font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 border-r border-gray-100 dark:border-slate-700 sticky left-0 z-30">Project Name</div>
                    <div className="flex-1 flex h-full relative">
                        {months.map((m, i) => (
                            <div key={i} className="flex-1 min-w-[80px] text-center border-r border-gray-50 dark:border-slate-700 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase flex items-center justify-center bg-gray-50/30 dark:bg-slate-700/30">
                                {m.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' })}
                            </div>
                        ))}
                    </div>
                </div>
  
                <div className="relative">
                    {gridData.map(p => (
                        <div key={p.id} className="flex border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50/60 dark:hover:bg-slate-700/50 transition-colors group h-14 items-center">
                            <div className="w-[220px] shrink-0 px-3 py-2 border-r border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 sticky left-0 z-10 flex flex-col justify-center group-hover:bg-gray-50 dark:group-hover:bg-slate-700 transition-colors h-full shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate" title={p.name}>{p.name}</div>
                                <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5"><User size={8}/> {p.owner}</div>
                            </div>
                            
                            <div className="flex-1 relative h-full flex items-center px-2">
                                <div 
                                    className="absolute h-6 flex items-center"
                                    style={{ left: `${p.leftPercent}%`, width: `${Math.max(p.planWidthPercent, p.actualWidthPercent, 0.1)}%` }}
                                >
                                    <div 
                                        className={`absolute top-0 bottom-0 rounded-md ${p.planColor}`} 
                                        style={{ width: `${(p.planWidthPercent / Math.max(p.planWidthPercent, p.actualWidthPercent)) * 100}%` }}
                                    ></div>
                                    <div 
                                        className={`absolute top-1.5 bottom-1.5 rounded-full ${p.barColor} shadow-md transition-all duration-500 border border-white dark:border-slate-800`}
                                        style={{ width: `${(p.actualWidthPercent / Math.max(p.planWidthPercent, p.actualWidthPercent)) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    );
};

export const StepCompletionModal = ({ step, onClose, onConfirm }) => {
  const [dates, setDates] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(step.id, dates.startDate, dates.endDate);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-700">
        <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-purple-50 dark:bg-purple-900/20">
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
             <Trophy size={18} className="text-purple-600"/> ปิดจบโครงการ (Project Closure)
          </h3>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-red-500"/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-slate-700/50 rounded-lg text-xs text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-800 mb-4">
              📌 คุณกำลังทำขั้นตอนสุดท้าย: <b>{step.step_name}</b> <br/>
              กรุณาระบุวันเริ่มและวันจบโครงการตามจริงเพื่อบันทึกเข้าระบบ
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">วันเริ่มโครงการจริง</label>
              <input 
                type="date" 
                required
                value={dates.startDate}
                onChange={(e) => setDates(prev => ({...prev, startDate: e.target.value}))}
                className="w-full p-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">วันจบโครงการจริง</label>
              <input 
                type="date" 
                required
                value={dates.endDate}
                onChange={(e) => setDates(prev => ({...prev, endDate: e.target.value}))}
                className="w-full p-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-200 dark:shadow-none flex items-center justify-center gap-2 transition-all">
              <Save size={16}/> บันทึกปิดโครงการ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ✅ Component: NewProjectModal (แก้ไขสำหรับตาราง Projects แบบ Central)
export const NewProjectModal = ({ onClose, onUpdate, existingLocations, existingOwners }) => {
    const [saving, setSaving] = useState(false);
    // เก็บค่า Form
    const [formData, setFormData] = useState({ 
        project_code: '', 
        name: '', 
        location: '', 
        budget: '', 
        responsible_design: '', 
        bu: '', 
        plan_start_date: '', 
        plan_end_date: '' 
    });
    
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSelectBU = (buCode) => setFormData(prev => ({ ...prev, bu: buCode }));
    
    // ✅ Logic การบันทึกแบบใหม่
    const handleSave = async (e) => {
        e.preventDefault(); 
        try {
            setSaving(true);
            
            // 1. สร้าง Project ลงตารางกลาง (projects) *โดยไม่ส่งวันที่*
            const newProjectData = {
                project_code: formData.project_code,
                name: formData.name,
                budget: parseFloat(formData.budget) || 0,
                location: formData.location,
                responsible_design: formData.responsible_design, // แมพให้ตรงกับ DB
                bu: formData.bu,
                project_status: 'Active',
                // ❌ ตัดวันที่ออก เพราะตาราง projects ไม่มีคอลัมน์เก็บ
            };

            // insert และขอข้อมูลที่เพิ่งสร้างกลับมา (select())
            const { data: createdProject, error: createError } = await supabase
                .from('projects')
                .insert([newProjectData])
                .select()
                .single();

            if (createError) throw createError;

            // 2. (Option) ถ้าต้องการบันทึกวันที่ลงใน Design Pipeline เลย
            // เราจะไปอัปเดตตาราง design_pipeline_steps ที่ Trigger สร้างขึ้นมาให้อัตโนมัติ
            if (formData.plan_start_date || formData.plan_end_date) {
                // ตัวอย่าง: อัปเดต Step แรก หรือ Step ที่ชื่อ '1.เริ่มโครงการ'
                // หรือถ้าคุณมีคอลัมน์ใน design_pipeline_steps ที่เก็บวันที่สัญญา ก็แก้ตรงนี้ได้
                
                /* const { error: updateStepError } = await supabase
                    .from('design_pipeline_steps')
                    .update({
                        actual_start_date: formData.plan_start_date, // หรือฟิลด์วันที่ที่คุณใช้
                        actual_end_date: formData.plan_end_date
                    })
                    .eq('project_id', createdProject.id)
                    .eq('step_order', 1); // สมมติว่าลงใน Step 1

                if (updateStepError) console.error("Error updating dates:", updateStepError);
                */
            }

            alert("✅ สร้างโครงการใหม่สำเร็จ!");
            if (onUpdate) onUpdate();
            onClose();

        } catch (error) {
            console.error("Create Error:", error);
            alert("❌ เกิดข้อผิดพลาด: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    // Style constants
    const labelStyle = "block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider";
    const inputStyle = "w-full border border-gray-200 dark:border-slate-600 rounded-lg p-2.5 text-sm bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-gray-300";

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4 font-sans">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="bg-white dark:bg-slate-800 px-8 py-5 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center shrink-0">
              <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400"><Briefcase size={20} /></div>
                      สร้างโครงการใหม่ (Design)
                  </h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-400 transition-colors">✕</button>
          </div>
          
          <div className="overflow-y-auto p-8 custom-scrollbar bg-gray-50/30 dark:bg-slate-900/30">
            <form id="createProjectForm" onSubmit={handleSave} className="space-y-8">
               {/* ส่วนข้อมูลทั่วไป */}
               <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                   <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><FileText size={14}/> ข้อมูลทั่วไป</div>
                   <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                       <div className="md:col-span-4">
                           <label className={labelStyle}>รหัสโครงการ <span className="text-red-500">*</span></label>
                           <input type="text" name="project_code" value={formData.project_code} onChange={handleChange} className={`${inputStyle} pl-3 font-mono font-medium text-emerald-700 dark:text-emerald-400`} placeholder="C-2501" required />
                       </div>
                       <div className="md:col-span-8">
                           <label className={labelStyle}>ชื่อโครงการ <span className="text-red-500">*</span></label>
                           <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputStyle} placeholder="ระบุชื่อโครงการ..." required />
                       </div>
                   </div>
               </div>

              {/* Budget & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                      <label className={labelStyle}>Budget (THB) <span className="text-red-500">*</span></label>
                      <input type="number" name="budget" value={formData.budget} onChange={handleChange} className={inputStyle} placeholder="0.00" required step="0.01" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                      <label className={labelStyle}>Location</label>
                      <input list="locations" type="text" name="location" value={formData.location || ''} onChange={handleChange} className={inputStyle} placeholder="เลือกหรือพิมพ์เพิ่ม..." />
                      <datalist id="locations">{existingLocations && existingLocations.map((loc, i) => <option key={i} value={loc} />)}</datalist>
                  </div>
              </div>

              {/* วันที่สัญญา (ส่วนนี้จะแสดงให้กรอก แต่ยังไม่ได้บันทึกลง projects เพื่อกัน Error) */}
              <div className="bg-blue-50/50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-100 dark:border-blue-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                          <label className="block text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1.5">วันที่เริ่มสัญญา (Design)</label>
                          <input type="date" name="plan_start_date" value={formData.plan_start_date} onChange={handleChange} className="w-full p-2.5 border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-700 rounded-xl text-sm dark:text-white" />
                      </div>
                      <div>
                          <label className="block text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1.5">วันที่สิ้นสุดสัญญา (Design)</label>
                          <input type="date" name="plan_end_date" value={formData.plan_end_date} onChange={handleChange} className="w-full p-2.5 border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-700 rounded-xl text-sm dark:text-white" />
                      </div>
                  </div>
              </div>

              {/* BU & Owner */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.entries(BU_CONFIG).filter(([key]) => key !== 'default').map(([key, config]) => (
                          <div key={key} onClick={() => handleSelectBU(key)} className={`cursor-pointer rounded-xl p-2 border transition-all flex flex-col items-center gap-1 text-center relative ${formData.bu === key ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 ring-1 ring-emerald-500 text-emerald-800 dark:text-emerald-300' : 'border-gray-200 dark:border-slate-600 hover:border-emerald-300 hover:bg-white dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800'}`}>
                              <div className="text-xl">{config.icon}</div>
                              <span className="text-[10px] font-medium">{config.label.split(' ')[0]}</span>
                          </div>
                      ))}
                  </div>
                  <hr className="my-4 border-gray-100 dark:border-slate-700 border-dashed"/>
                  <label className={labelStyle}>ผู้รับผิดชอบ (Designer)</label>
                  <input list="owners" type="text" name="responsible_design" value={formData.responsible_design} onChange={handleChange} className={inputStyle} placeholder="เลือกหรือพิมพ์เพิ่ม..." />
                  <datalist id="owners">{existingOwners && existingOwners.map((own, i) => <option key={i} value={own} />)}</datalist>
              </div>
            </form>
          </div>
          <div className="px-8 py-5 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3 shrink-0">
              <button onClick={onClose} className="px-6 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl font-medium">ยกเลิก</button>
              <button type="submit" form="createProjectForm" disabled={saving} className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-lg font-medium">{saving ? '...' : 'สร้างโครงการ'}</button>
          </div>
        </div>
      </div>
    );
};

// ✅ Component: ProjectEditModal (แก้ไขให้ดึงและแสดงวันที่)
export const ProjectEditModal = ({ project, onClose, onUpdate, existingLocations, existingOwners }) => {
    // ----------------------------------------------------
    // 1. State & Logic
    // ----------------------------------------------------
    const [steps, setSteps] = useState([]);
    const [projectStatus, setProjectStatus] = useState(project.project_status || 'Active');
    const [cancelReason, setCancelReason] = useState(project.cancel_reason || '');
    const [saving, setSaving] = useState(false);
    const viewerRef = useRef(null);

    const [activeTab, setActiveTab] = useState('details'); 
    const [uploadingModel, setUploadingModel] = useState(false);
    const [editMode, setEditMode] = useState(false);
    
    // ✅ 1. เพิ่ม plan_start_date และ plan_end_date เข้าไปใน State
    const [projDetails, setProjDetails] = useState({ 
        name: project.name || '', 
        location: project.location || '', 
        budget: project.budget || 0, 
        responsible_design: project.owner || '', // แมพจาก owner เดิม
        plan_start_date: project.plan_start_date || '', // รับค่าวันเริ่ม
        plan_end_date: project.plan_end_date || ''      // รับค่าวันจบ
    });
  
    useEffect(() => { 
        if (project?.pipeline_steps) {
            setSteps([...project.pipeline_steps].sort((a, b) => a.step_order - b.step_order)); 
        }
    }, [project]);

    const toggleEditMode = () => { if (!editMode) { const pin = prompt("Admin PIN:"); if (pin === '1111') setEditMode(true); } else { setEditMode(false); } };
    
    const handleDetailChange = (e) => { 
        const { name, value } = e.target; 
        setProjDetails(prev => ({ 
            ...prev, 
            [name]: name === 'budget' ? parseFloat(value) || 0 : value 
        })); 
    };

    const handleStatusChange = (id, newVal) => { setSteps(prev => prev.map(s => s.id === id ? { ...s, status: newVal } : s)); };
    
    // ✅ ฟังก์ชัน handleSave
    const handleSave = async () => {
        try {
            setSaving(true);

            // 1. เตรียมข้อมูล Update
            const updates = {
                name: projDetails.name,
                location: projDetails.location,
                budget: projDetails.budget,
                responsible_design: projDetails.responsible_design, // ต้องตรงกับ DB
                
                // ✅ ส่งวันที่กลับไปบันทึกด้วย
                plan_start_date: projDetails.plan_start_date,
                plan_end_date: projDetails.plan_end_date,

                project_status: projectStatus,
                cancel_reason: projectStatus === 'Cancelled' ? cancelReason : null,
                updated_at: new Date()
            };

            // 2. ส่งข้อมูลไปอัปเดต
            const { error: projError } = await supabase
                .from('projects')
                .update(updates)
                .eq('id', project.id);

            if (projError) throw projError;

            // 3. อัปเดต Pipeline Steps
            if (steps.length > 0) {
                const stepsToUpdate = steps.map(s => ({
                    id: s.id,
                    status: s.status
                }));
                
                const { error: stepsError } = await supabase
                    .from('project_pipeline_steps')
                    .upsert(stepsToUpdate);

                if (stepsError) throw stepsError;
            }

            alert("✅ บันทึกข้อมูลเรียบร้อย!");
            if (onUpdate) onUpdate();
            onClose();

        } catch (error) {
            console.error("Save Error:", error);
            alert("❌ เกิดข้อผิดพลาด: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    // Style constants (ประกาศกันเหนียว)
    const inputStyle = "w-full border border-gray-200 dark:border-slate-600 rounded-lg p-2.5 text-sm bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed transition-all";
    const labelStyle = "block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider";

    // ----------------------------------------------------
    // 2. UI Render
    // ----------------------------------------------------
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                         <button onClick={toggleEditMode} className={`p-2 rounded-lg transition-all ${editMode ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'}`}>
                            <Edit3 size={20} />
                        </button>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{editMode ? 'แก้ไขโครงการ' : 'รายละเอียดโครงการ'}</h3>
                            <p className="text-xs text-gray-400">{project.project_code}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">✕</button>
                </div>

                {/* TAB SELECTOR */}
                <div className="flex border-b border-gray-100 dark:border-slate-700 px-6 bg-white dark:bg-slate-800">
                  <button onClick={() => setActiveTab('details')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'details' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500'}`}>
                    📝 รายละเอียด
                  </button>
                  <button onClick={() => setActiveTab('model')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'model' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500'}`}>
                    🧊 3D Model (IFC)
                  </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {activeTab === 'details' ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2"><label className={labelStyle}>Name</label><input className={inputStyle} value={projDetails.name} onChange={handleDetailChange} name="name" disabled={!editMode}/></div>
                                <div><label className={labelStyle}>Budget</label><input className={inputStyle} type="number" value={projDetails.budget} onChange={handleDetailChange} name="budget" disabled={!editMode}/></div>
                                <div><label className={labelStyle}>Location</label><input className={inputStyle} value={projDetails.location} onChange={handleDetailChange} name="location" disabled={!editMode}/></div>
                                <div><label className={labelStyle}>Designer</label><input className={inputStyle} value={projDetails.responsible_design} onChange={handleDetailChange} name="responsible_design" disabled={!editMode}/></div>
                                
                                {/* ✅ 2. เพิ่มช่อง Input วันที่ (แสดงผลเมื่อมีข้อมูล) */}
                                <div>
                                    <label className={labelStyle}>Start Date</label>
                                    <input type="date" className={inputStyle} value={projDetails.plan_start_date} onChange={handleDetailChange} name="plan_start_date" disabled={!editMode}/>
                                </div>
                                <div>
                                    <label className={labelStyle}>End Date</label>
                                    <input type="date" className={inputStyle} value={projDetails.plan_end_date} onChange={handleDetailChange} name="plan_end_date" disabled={!editMode}/>
                                </div>

                                <div>
                                    <label className={labelStyle}>Project Status</label>
                                    <select value={projectStatus} onChange={(e) => setProjectStatus(e.target.value)} disabled={!editMode} className={inputStyle}>
                                        <option value="Active">🟢 Active</option>
                                        <option value="Hold">🟠 Hold</option>
                                        <option value="Cancelled">🔴 Cancelled</option>
                                        <option value="Completed">🔵 Completed</option>
                                    </select>
                                </div>
                            </div>
                            
                            {/* Cancel Reason */}
                            {projectStatus === 'Cancelled' && (
                                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800 mt-4">
                                    <label className="text-xs font-bold text-red-600 mb-1 block">Reason</label>
                                    <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} disabled={!editMode} className="w-full p-2 rounded border border-red-200 text-sm outline-none" rows="2"></textarea>
                                </div>
                            )}

                             {/* Pipeline Steps */}
                             <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                                <h4 className="text-sm font-bold mb-3 flex items-center gap-2"><Settings size={16}/> Pipeline Progress</h4>
                                <div className="space-y-2">
                                    {steps.map((step) => (
                                        <div key={step.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-100 dark:border-slate-600">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold">{step.step_order}</div>
                                                <span className="text-sm font-medium">{step.step_name}</span>
                                            </div>
                                            <select value={step.status || 'pending'} onChange={(e) => handleStatusChange(step.id, e.target.value)} className="text-xs p-1 rounded border">
                                                <option value="pending">Pending</option>
                                                <option value="current">In Progress</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full gap-4 min-h-[500px]">
                            <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200">ไฟล์โมเดล 3D (IFC)</h4>
                                    <p className="text-xs text-gray-400">สำหรับโหมด AR</p>
                                </div>
                                <label className={`cursor-pointer px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${uploadingModel ? 'bg-gray-200' : 'bg-white border hover:border-emerald-500'}`}>
                                    {uploadingModel ? "⏳ Uploading..." : (
                                        <>
                                            <UploadCloud size={14} /> อัปโหลดใหม่
                                            <input type="file" accept=".ifc" className="hidden" 
                                                onChange={async (e) => {
                                                    const file = e.target.files[0];
                                                    if (!file) return;
                                                    setUploadingModel(true);
                                                    try {
                                                        const fileName = `${project.project_code}_${Date.now()}.ifc`;
                                                        const { error: upErr } = await supabase.storage.from('models').upload(fileName, file);
                                                        if (upErr) throw upErr;
                                                        const { data: { publicUrl } } = supabase.storage.from('models').getPublicUrl(fileName);
                                                        const { error: dbErr } = await supabase.from('projects').update({ model_url: publicUrl }).eq('id', project.id);
                                                        if (dbErr) throw dbErr;
                                                        alert("✅ อัปโหลดสำเร็จ!"); onUpdate();
                                                    } catch (err) { alert("❌ Error: " + err.message); } 
                                                    finally { setUploadingModel(false); }
                                                }}
                                            />
                                        </>
                                    )}
                                </label>
                            </div>
                            
                            <div className="flex-1 bg-gray-100 dark:bg-slate-900 rounded-2xl overflow-hidden border relative">
                                {project.model_url ? (
                                    <IFCViewer 
                                        ref={viewerRef}
                                        modelUrl={project.model_url}
                                        initialView={project.camera_view}
                                        transparent={false}
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 opacity-60"><Box size={48} /><p className="mt-2 text-sm">No Model</p></div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-gray-500 hover:bg-gray-100 font-bold">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold shadow-lg hover:bg-emerald-700">Save</button>
                </div>
            </div>
        </div>
    );
};