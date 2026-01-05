import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// ตั้งค่า Supabase
const supabaseUrl = 'https://epkyqxohpnrzxnnxxrow.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwa3lxeG9ocG5yenhubnh4cm93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MDM1NDMsImV4cCI6MjA3NTM3OTU0M30.y3DmBeNyRUwXtLzs6Oh8fT0riAB5-G_-u63RpTleH1s';
const supabase = createClient(supabaseUrl, supabaseKey);

// ขั้นตอนมาตรฐาน Design
const designStepsTemplate = [
  { name: 'รับข้อมูล', order: 1 },
  { name: 'ออกแบบขั้นต้น', order: 2 },
  { name: 'อนุมัติแบบ(Owner)', order: 3 },
  { name: 'แบบก่อสร้าง', order: 4 },
  { name: 'อนุมัติแบบก่อสร้าง(Owner)', order: 5 },
  { name: 'อนุมัติแบบ(หน.)', order: 6 },
  { name: 'ส่งประมูล', order: 7 }
];

async function migrate() {
  try {
    // อ่านไฟล์ข้อมูล JSON (ต้องวางไฟล์ projects_data.json ไว้ที่เดียวกัน)
    const rawData = JSON.parse(fs.readFileSync('projects_data.json', 'utf-8'));
    console.log(`🚀 พบข้อมูล ${rawData.length} โครงการ กำลังเริ่มทำงาน...`);

    for (const item of rawData) {
      // 1. Upsert Projects
      const { data: project, error: projError } = await supabase
        .from('projects')
        .upsert({
          project_code: item.code,
          year: item.year,
          name: item.name,
          location: item.location,
          bu: item.bu,
          project_type: item.type,
          responsible_design: item.owner,
          budget: item.budget
        }, { onConflict: 'project_code' })
        .select()
        .single();

      if (projError) {
        console.error(`❌ Error project ${item.code}:`, projError.message);
        continue;
      }
      console.log(`✅ (${item.code}) Processed: ${item.name}`);

      // 2. Clear old sub-data
      await supabase.from('project_progress').delete().eq('project_id', project.id);
      await supabase.from('design_pipeline_steps').delete().eq('project_id', project.id);

      // 3. Insert Progress
      await supabase.from('project_progress').insert({
        project_id: project.id,
        plan_start_date: item.planStart,
        plan_end_date: item.planEnd,
        performance_status: item.status,
        percent_plan: 0,
        percent_actual: 0
      });

      // 4. Insert Steps
      const stepsToInsert = designStepsTemplate.map(step => ({
        project_id: project.id,
        step_name: step.name,
        step_order: step.order,
        status: 'pending'
      }));
      await supabase.from('design_pipeline_steps').insert(stepsToInsert);
    }
    
    console.log('🎉 เสร็จสิ้นการทำงานทั้งหมด!');
    
  } catch (err) {
    console.error('เกิดข้อผิดพลาดในการอ่านไฟล์ หรือการเชื่อมต่อ:', err);
  }
}

migrate();