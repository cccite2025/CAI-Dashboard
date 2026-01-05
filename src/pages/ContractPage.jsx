// src/pages/ContractPage.jsx
import React, { useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { 
  FileSignature, DollarSign, Activity, CalendarClock, 
  ChevronRight, MoreHorizontal, TrendingUp, AlertCircle, 
  CheckCircle2, Clock, ScrollText, Wallet, Check, FolderOpen, ArrowRight, Plus, Trash2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Line, ComposedChart
} from 'recharts';

// --- CONFIG ---
const CONTRACT_STEPS = [
  { id: 1, label: 'รับเอกสารจากประมูล' },
  { id: 2, label: 'ส่ง กก. ออกร่างสัญญา' },
  { id: 3, label: 'ผู้รับจ้างลงนาม' },
  { id: 4, label: 'เสนอ กก. ลงนาม' },
  { id: 5, label: 'สัญญาแล้วเสร็จ' }
];

// --- COMPONENTS ---
const FinancialCard = ({ title, value, subtext, icon: Icon, theme }) => { 
    return (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">฿{(value/1000000).toFixed(2)}M</h3>
                <p className="text-[10px] text-gray-400 mt-1">{subtext}</p>
            </div>
            <div className={`p-3 rounded-xl ${theme === 'blue' ? 'bg-blue-50 text-blue-600' : theme === 'emerald' ? 'bg-emerald-50 text-emerald-600' : theme === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-purple-50 text-purple-600'} group-hover:scale-110 transition-transform`}>
                <Icon size={20} strokeWidth={2.5} />
            </div>
        </div>
    ); 
};

const ContractStepper = ({ currentStep, onStepClick }) => {
  return (
    <div className="flex items-center w-full max-w-md">
      {CONTRACT_STEPS.map((step, index) => {
        const isCompleted = step.id <= currentStep;
        const isCurrent = step.id === currentStep;
        return (
          <div key={step.id} className="flex items-center flex-1 relative group cursor-pointer" onClick={() => onStepClick && onStepClick(step.id)}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 shrink-0 z-10 transition-all duration-300 ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-300'} ${isCurrent ? 'ring-2 ring-emerald-200 dark:ring-emerald-900 scale-110' : ''}`} title={step.label}>
              {isCompleted ? <Check size={12} strokeWidth={3}/> : step.id}
            </div>
            {index < CONTRACT_STEPS.length - 1 && (<div className={`h-0.5 w-full mx-1 rounded-full transition-all duration-500 ${isCompleted && currentStep > step.id ? 'bg-emerald-500' : 'bg-gray-100 dark:bg-slate-700'}`}></div>)}
            {isCurrent && (<div className="absolute top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-20">{step.label}<div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div></div>)}
          </div>
        );
      })}
    </div>
  );
};

// --- MAIN PAGE ---
const ContractPage = ({ biddingData = [], contractData = [], onRefresh }) => {
  
  // 1. แยกข้อมูล: Active vs Pending
  const { newIncoming, ongoingContracts } = useMemo(() => {
      // แปลง ID เป็น String เพื่อความชัวร์ในการเทียบ
      const existingBiddingIds = contractData
          .map(c => String(c.bidding_package_id || ''))
          .filter(id => id !== '');

      const incoming = biddingData
          .filter(pkg => {
              const isFinished = pkg.currentStep >= 10;
              const isAlreadyCreated = existingBiddingIds.includes(String(pkg.id));
              return isFinished && !isAlreadyCreated;
          })
          .map(pkg => ({
              ...pkg,
              contractor_name: pkg.result?.winner || 'TBD',
              contract_value: parseFloat(pkg.result?.finalPrice) || pkg.totalBudget,
              isNew: true 
          }));

      return { newIncoming: incoming, ongoingContracts: contractData };
  }, [biddingData, contractData]);

  // รวมลิสต์แสดงผล
  const displayList = [...newIncoming, ...ongoingContracts];

  // 2. Create Contract
  const handleStartContract = async (pkg) => {
      if(!pkg.contractor_name || pkg.contractor_name === 'TBD') {
          if(!confirm("ยังไม่มีชื่อผู้รับเหมา (TBD) ยืนยันจะสร้างสัญญาหรือไม่?")) return;
      } else {
          if(!confirm(`ยืนยันสร้างสัญญาสำหรับ "${pkg.name}"?`)) return;
      }

      const { error } = await supabase.from('contracts').insert([{
          bidding_package_id: pkg.id,
          name: pkg.name,
          contractor_name: pkg.contractor_name,
          contract_value: pkg.contract_value,
          current_step: 1, 
          status: 'Processing'
      }]);

      if (error) alert(error.message);
      else onRefresh();
  };

  // 3. Update Step
  const handleUpdateStep = async (contract, nextStep) => {
      if (nextStep <= contract.current_step) return;
      if (!confirm(`อัปเดตสถานะเป็น "${CONTRACT_STEPS.find(s=>s.id===nextStep).label}"?`)) return;

      const updates = { current_step: nextStep };
      if (nextStep === 5) updates.status = 'Active';

      const { error } = await supabase.from('contracts').update(updates).eq('id', contract.id);
      if (error) alert(error.message);
      else onRefresh();
  };

  // 4. Delete Contract
  const handleDeleteContract = async (id) => {
      if (!confirm("ต้องการลบสัญญานี้? ข้อมูลจะถูกดึงใหม่จาก Bidding")) return;
      const { error } = await supabase.from('contracts').delete().eq('id', id);
      if (error) alert(error.message);
      else onRefresh();
  };

  // 🟢 Stats Calculation (แก้ไขใหม่ ไม่มี error c is not defined)
  const stats = useMemo(() => {
      // 1. Active: สัญญาที่มีในระบบแล้ว
      const activeContracts = ongoingContracts;
      // ใช้ reduce วนลูปบวกค่าเงิน
      const activeValue = activeContracts.reduce((sum, item) => sum + (parseFloat(item.contract_value) || 0), 0);
      const activeCount = activeContracts.length;

      // 2. Pending: สัญญาใหม่ที่รอสร้าง
      const pendingContracts = newIncoming;
      // ใช้ reduce วนลูปบวกค่าเงิน
      const pendingValue = pendingContracts.reduce((sum, item) => sum + (parseFloat(item.contract_value) || 0), 0);
      const pendingCount = pendingContracts.length;

      // 3. Total
      const totalValue = activeValue + pendingValue;

      return { 
          totalValue, 
          activeValue, 
          activeCount, 
          pendingValue, 
          pendingCount 
      };
  }, [ongoingContracts, newIncoming]);

  // Mock S-Curve
  const sCurveData = [
    { month: 'Jan', plan: 5, actual: 5 }, { month: 'Feb', plan: 15, actual: 12 },
    { month: 'Mar', plan: 30, actual: 28 }, { month: 'Apr', plan: 50, actual: 45 },
    { month: 'May', plan: 70, actual: 55 }, { month: 'Jun', plan: 85, actual: null }
  ];

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-gray-800 dark:text-white flex items-center gap-2">
            <FileSignature className="text-emerald-600"/> Contract Dashboard
          </h2>
          <p className="text-xs text-gray-400 mt-1">บริหารจัดการสัญญาและสถานะ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ใช้ค่าจาก stats ที่คำนวณใหม่ */}
        <FinancialCard title="Contract Value" value={stats.totalValue} subtext="มูลค่าสัญญาในมือทั้งหมด" icon={FileSignature} theme="blue" />
        <FinancialCard title="Active Contracts" value={stats.activeValue} subtext={`${stats.activeCount} สัญญาที่ลงนามแล้ว`} icon={CheckCircle2} theme="emerald" />
        <FinancialCard title="Pending Issuance" value={stats.pendingValue} subtext={`${stats.pendingCount} รอออกร่างสัญญา`} icon={Clock} theme="amber" />
        <FinancialCard title="Retention" value={stats.totalValue * 0.05} subtext="ประมาณการ 5%" icon={Wallet} theme="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden col-span-1 lg:col-span-2">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <FolderOpen size={18} className="text-orange-500"/> รายการสัญญา (Contract Tracking)
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="p-4 pl-6">Project Name</th>
                            <th className="p-4">Contractor</th>
                            <th className="p-4 text-center w-[300px]">Process Status</th>
                            <th className="p-4 text-right pr-6">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {displayList.length === 0 ? (
                            <tr><td colSpan="4" className="p-8 text-center text-gray-400">ยังไม่มีข้อมูลสัญญา</td></tr>
                        ) : (
                            displayList.map((item) => (
                                <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors ${item.isNew ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                                    <td className="p-4 pl-6">
                                        <div className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                            {item.name}
                                            {item.isNew && <span className="bg-blue-100 text-blue-600 text-[9px] px-1.5 rounded border border-blue-200 animate-pulse">New</span>}
                                        </div>
                                        <div className="text-[10px] text-gray-400">{item.contract_no || item.code || 'Draft'}</div>
                                    </td>
                                    <td className="p-4 text-gray-600 dark:text-gray-300">
                                        {!item.contractor_name || item.contractor_name === 'TBD' ? (
                                            <span className="text-red-500 font-bold text-xs bg-red-50 px-2 py-1 rounded border border-red-100">Missing Contractor</span>
                                        ) : (
                                            <span className="font-medium">{item.contractor_name}</span>
                                        )}
                                        <div className="text-[10px] text-gray-400 mt-0.5">฿{(parseFloat(item.contract_value || 0)/1000000).toFixed(2)}M</div>
                                    </td>
                                    <td className="p-4 flex justify-center">
                                        {item.isNew ? (
                                            <span className="text-xs text-gray-400 italic">Waiting to start...</span>
                                        ) : (
                                            <ContractStepper 
                                                currentStep={item.current_step} 
                                                onStepClick={(stepId) => handleUpdateStep(item, stepId)}
                                            />
                                        )}
                                    </td>
                                    <td className="p-4 pr-6 text-right">
                                        {item.isNew ? (
                                            <button onClick={() => handleStartContract(item)} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm flex items-center gap-1 ml-auto">
                                                <Plus size={12}/> Create
                                            </button>
                                        ) : (
                                            <button onClick={() => handleDeleteContract(item.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto" title="ลบสัญญา">
                                                <Trash2 size={16}/>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
        
        {/* S-Curve Section */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm h-full">
            <div className="flex justify-between items-center mb-6">
                <div><h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><TrendingUp size={18} className="text-blue-500"/> S-Curve (Active)</h3><p className="text-xs text-gray-400 mt-1">Plan vs Actual Performance</p></div>
            </div>
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={sCurveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs><linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} unit="%" />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                        <Line type="monotone" dataKey="plan" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Plan" />
                        <Area type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" name="Actual" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ContractPage;