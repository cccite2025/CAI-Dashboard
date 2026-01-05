import { createClient } from '@supabase/supabase-js';

// ค่าจาก Supabase Dashboard ของคุณ (ใส่ให้แล้ว)
const supabaseUrl = 'https://epkyqxohpnrzxnnxxrow.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwa3lxeG9ocG5yenhubnh4cm93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MDM1NDMsImV4cCI6MjA3NTM3OTU0M30.y3DmBeNyRUwXtLzs6Oh8fT0riAB5-G_-u63RpTleH1s';

export const supabase = createClient(supabaseUrl, supabaseKey);