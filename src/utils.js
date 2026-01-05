// src/utils.js
// เก็บค่า Config และฟังก์ชันคำนวณต่างๆ

export const BU_CONFIG = {
  'SW': { icon: '🐷', color: 'bg-pink-100 text-pink-600', label: 'สุกร (Swine)' },
  'BR': { icon: '🐔', color: 'bg-orange-100 text-orange-600', label: 'ไก่เนื้อ (Broiler)' },
  'LA': { icon: '🥚', color: 'bg-yellow-100 text-yellow-600', label: 'ไก่ไข่ (Layer)' },
  'FE': { icon: '🌽', color: 'bg-emerald-100 text-emerald-600', label: 'อาหารสัตว์ (Feed)' },
  'FO': { icon: '🍱', color: 'bg-purple-100 text-purple-600', label: 'อาหารสำเร็จ (Food)' },
  'AQ': { icon: '🦐', color: 'bg-cyan-100 text-cyan-600', label: 'สัตว์น้ำ (Aqua)' },
  'OT': { icon: '🏭', color: 'bg-gray-100 text-gray-600', label: 'อื่นๆ (Others)' },
  'default': { icon: '❓', color: 'bg-gray-200 text-gray-500', label: 'Unknown' }
};

export const WEIGHTS_BY_ORDER = { 1: 0, 2: 10, 3: 10, 4: 40, 5: 15, 6: 15, 7: 10 };
export const REVENUE_FACTOR = 0.011; // 1.1%

export const convertDate = (dateStr) => {
  if (!dateStr || dateStr === '-') return null;
  try {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const [day, month, year] = parts;
    return `${year.length === 2 ? '20'+year : year}-${month.length === 1 ? '0'+month : month}-${day.length === 1 ? '0'+day : day}`;
  } catch (e) { return null; }
};

export const calculateProjectStatus = (progressData, steps, projectStatus) => {
  if (projectStatus === 'Cancelled') {
    return { actualPercent: 0, planPercent: 0, status: 'Cancelled', delayDays: 0, startDate: '-', endDate: '-' };
  }

  const startDate = progressData?.plan_start_date ? new Date(progressData.plan_start_date) : null;
  const endDate = progressData?.plan_end_date ? new Date(progressData.plan_end_date) : null;
  const actualFinishDate = progressData?.actual_finish_date ? new Date(progressData.actual_finish_date) : null;
  const today = new Date();

  let actualPercent = 0;
  if (steps && steps.length > 0) {
    steps.forEach(step => {
      if (step.status === 'completed') actualPercent += WEIGHTS_BY_ORDER[step.step_order] || 0;
    });
  }
  actualPercent = Math.min(100, Math.round(actualPercent));

  let planPercent = 0;
  if (startDate && endDate) {
    const totalDuration = endDate - startDate;
    const compareDate = today; 
    const elapsed = compareDate - startDate;
    if (totalDuration > 0) planPercent = (elapsed / totalDuration) * 100;
    planPercent = Math.max(0, Math.min(100, Math.round(planPercent)));
  }

  let status = 'On Plan';
  if (planPercent - actualPercent > 5) status = 'Delay';
  if (actualPercent >= 100) status = 'Completed';
  if (projectStatus === 'Hold') status = 'Hold';

  let delayDays = 0;
  if (endDate && projectStatus !== 'Hold') {
    if (status === 'Completed') {
        if (actualFinishDate && actualFinishDate > endDate) {
            const diffTime = Math.abs(actualFinishDate - endDate);
            delayDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } else if (!actualFinishDate && today > endDate) {
            const diffTime = Math.abs(today - endDate);
            delayDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
    } else {
        if (today > endDate) {
            const diffTime = Math.abs(today - endDate);
            delayDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
    }
  }

  return {
    actualPercent, planPercent, status, delayDays,
    startDate: startDate ? startDate.toISOString().split('T')[0] : '-',
    endDate: endDate ? endDate.toISOString().split('T')[0] : '-'
  };
};