import React from 'react';

export const LoadingScreen = () => {
    // ✅ ใช้ไฟล์ GIF ที่คุณเลือก (ต้องวางไฟล์ไว้ในโฟลเดอร์ public นะครับ)
    const duckGifPath = "/loading-ducks.gif"; 

    return (
        // ฉากหลังสีเทาอ่อนๆ เหมือนในรูปต้นฉบับ เพื่อให้กลมกลืน
        <div className="fixed inset-0 z-[9999] bg-[#E6E7E8] dark:bg-slate-900 flex flex-col items-center justify-center font-sans transition-colors duration-300">
            
            <div className="relative flex flex-col items-center">
                {/* --- ส่วนแสดงผล GIF --- */}
                <img 
                    src={duckGifPath}
                    alt="Loading Ducks"
                    // ปรับขนาดให้พอดีๆ ไม่ใหญ่เกินไป
                    className="w-[300px] h-auto object-contain mix-blend-multiply dark:mix-blend-normal"
                />

                {/* ข้อความ Loading ด้านล่าง (ใช้สีเทาเข้มให้เข้ากับธีม) */}
                <h3 className="mt-4 text-2xl font-bold text-gray-600 dark:text-gray-300 tracking-[0.2em] animate-pulse">
                    LOADING...
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    กรุณารอสักครู่... เป็ดกำลังทำงาน
                </p>

                {/* Progress Bar สีฟ้าให้เข้ากับน้ำ */}
                <div className="mt-8 w-48 h-1.5 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[#7AD7F0] animate-[loading_1.5s_ease-in-out_infinite] w-1/2 rounded-full relative left-[-50%]"></div>
                </div>
            </div>

            {/* CSS Animation สำหรับ Progress Bar */}
            <style>{`
    @keyframes loading {
        0% { left: -50%; }
        100% { left: 100%; }
    }
    .mix-blend-multiply {
        mix-blend-mode: multiply;
    }
`}</style>
        </div>
    );
};