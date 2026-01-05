import requests
import time
import uuid
import hashlib
import msvcrt
import webbrowser

# ==========================================
# 1. ข้อมูลของคุณ
# ==========================================
APP_ID = 'lc2e13fd573480426d'
APP_SECRET = '0e3684c5605c4f479faff2a452ae81'
DEVICE_ID = 'E3AFAAJPSF46C8A'
CHANNEL = '0'

def get_access_token():
    url = "https://openapi.easy4ip.com/openapi/accessToken"
    nonce = str(uuid.uuid4())
    timestamp = int(time.time())
    sign_str = f"time:{timestamp},nonce:{nonce},appSecret:{APP_SECRET}"
    sign = hashlib.md5(sign_str.encode('utf-8')).hexdigest()
    try:
        r = requests.post(url, json={"system": {"ver": "1.0", "appId": APP_ID, "sign": sign, "time": timestamp, "nonce": nonce}, "id": "1", "params": {}})
        return r.json()["result"]["data"]["accessToken"]
    except:
        return None

def move_camera(token, direction):
    url = "https://openapi.easy4ip.com/openapi/controlMovePTZ"
    nonce = str(uuid.uuid4())
    timestamp = int(time.time())
    sign_str = f"time:{timestamp},nonce:{nonce},appSecret:{APP_SECRET}"
    sign = hashlib.md5(sign_str.encode('utf-8')).hexdigest()
    
    # สั่งหมุน 1 วินาที
    requests.post(url, json={
        "system": {"ver": "1.0", "appId": APP_ID, "sign": sign, "time": timestamp, "nonce": nonce},
        "id": "2",
        "params": {"token": token, "deviceId": DEVICE_ID, "channelId": CHANNEL, "operation": str(direction), "duration": "1000"}
    })

def take_snapshot(token):
    print("📸 กำลังถ่ายรูปอัปเดตตำแหน่ง...")
    url = "https://openapi.easy4ip.com/openapi/setDeviceSnapEnhanced"
    nonce = str(uuid.uuid4())
    timestamp = int(time.time())
    sign_str = f"time:{timestamp},nonce:{nonce},appSecret:{APP_SECRET}"
    sign = hashlib.md5(sign_str.encode('utf-8')).hexdigest()

    response = requests.post(url, json={
        "system": {"ver": "1.0", "appId": APP_ID, "sign": sign, "time": timestamp, "nonce": nonce},
        "id": "2",
        "params": {"token": token, "deviceId": DEVICE_ID, "channelId": CHANNEL}
    })
    
    try:
        result = response.json()
        if "url" in result["result"]["data"]:
            image_url = result["result"]["data"]["url"]
            print(f"✅ เปิดดูรูป: {image_url}")
            webbrowser.open(image_url) 
    except:
        print("❌ ถ่ายรูปไม่ทัน (หรือแบตหมด)")

# ==========================================
# ส่วนควบคุมหลัก (แก้บั๊กรับค่าปุ่มกดแล้ว)
# ==========================================
if __name__ == "__main__":
    print("⏳ เชื่อมต่อกล้อง...")
    token = get_access_token()
    
    if token:
        print("\n🎮 โหมด Move & Snap")
        print("เปลี่ยนภาษาเป็น [English] ก่อนกดนะครับ")
        print("[w] ขึ้น  [s] ลง  [a] ซ้าย  [d] ขวา")
        print("กด [q] เพื่อออก")
        
        while True:
            if msvcrt.kbhit():
                # อ่านค่าปุ่มกดแบบ Bytes (ไม่ต้อง Decode ให้ Error)
                key = msvcrt.getch()
                
                # ถ้ากดปุ่มพิเศษ (เช่นลูกศร) มันจะส่งค่ามา 2 รอบ ให้ข้ามไป
                if key == b'\xe0' or key == b'\x00':
                    msvcrt.getch() 
                    continue

                direction = None
                if key == b'a': direction = 3   # ซ้าย
                elif key == b'd': direction = 4 # ขวา
                elif key == b'w': direction = 1 # บน
                elif key == b's': direction = 2 # ล่าง
                elif key == b'q': break
                
                if direction:
                    print(f"🔄 กำลังหมุน... (ทิศ {direction})")
                    move_camera(token, direction)
                    
                    print("⏳ รอ 4 วินาที ให้กล้องหยุดนิ่ง...")
                    time.sleep(4) 
                    
                    take_snapshot(token) 
                    print("-----------------------------")
            
            time.sleep(0.1)
    else:
        print("❌ เชื่อมต่อไม่ได้")