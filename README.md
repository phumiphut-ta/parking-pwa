# 🚗 ที่จอดรถของฉัน (My Parking PWA)

**เว็บแอปบันทึกพิกัดและโน้ตช่วยจำชั้นจอดรถ ใช้งาน Offline ได้ ไม่ต้องโหลดแอป**

แอปพลิเคชันแบบ Progressive Web App (PWA) ที่ออกแบบมาให้ใช้งานง่าย รวดเร็ว และสวยงามเหมือนแอป Native บนมือถือ พัฒนาด้วยเทคโนโลยีเว็บมาตรฐาน (HTML/CSS/JS) ทำให้ไม่ต้องง้อ App Store

![App Screenshot](https://via.placeholder.com/800x400?text=App+Screenshot+Here)

## ✨ ฟีเจอร์หลัก (Features)

- 📍 **บันทึกพิกัดแม่นยำ**: ใช้ GPS ของเครื่องเพื่อระจุดจอดรถอย่างรวดเร็ว
- 📝 **จดโน้ตช่วยจำ**: บันทึกชั้น โซน หรือเลขช่องจอดได้ (เช่น "ชั้น 3A เสา B12")
- 🗺️ **แผนที่ในตัว**: ดูตำแหน่งรถเทียบกับตำแหน่งปัจจุบันได้ทันที
- 🧭 **นำทางกลับรถ**: ปุ่มเดียวเพื่อเปิด Google Maps หรือ Apple Maps นำทางกลับไปที่รถ
- 📶 **ใช้งาน Offline**: ทำงานได้แม้ไม่มีอินเทอร์เน็ต (ด้วยระบบ Service Worker Cache)
- 🚫 **โหมดไม่มี GPS**: หากอยู่ในอาคารที่รับสัญญาณไม่ได้ สามารถเลือกบันทึก "เฉพาะโน้ต" ได้
- 📱 **ติดตั้งง่าย**: เพิ่มลงหน้าจอ Home Screen ได้ทันที รองรับทั้ง iOS (Safari) และ Android (Chrome)
- ⏱️ **ระบบจับเวลาและแจ้งเตือน**: บันทึกเวลาจอดแบบเรียลไทม์ และกำหนดเวลานับถอยหลังก่อนหมดเวลาจอดฟรี พร้อมแถบความคืบหน้าเปลี่ยนสีตามเวลาที่เหลือ (เขียว -> ส้มเมื่อใกล้หมด -> แดงเมื่อหมดเวลา)
- 📤 **แชร์พิกัดง่ายๆ**: ปุ่มสำหรับแชร์พิกัดและโน้ตจอดรถไปยัง Line, Messenger หรือโซเชียลอื่นๆ หรือคัดลอกพิกัดลง Clipboard อัตโนมัติด้วย Web Share API
- 🖥️ **แผนที่เต็มจอ (Fullscreen Map)**: ปุ่มสำหรับสลับการแสดงผลแผนที่แบบเต็มหน้าจอ และหุบกลับเข้าสู่หน้าปกติได้สะดวก
- 📐 **ปรับระยะซูมอัตโนมัติ (Auto-fit Bounds)**: ระบบจะซูมและจัดระยะแผนที่ให้อยู่ในมุมมองที่มองเห็นทั้งตำแหน่งปัจจุบันและพิกัดที่จอดรถพร้อมกันเสมอเมื่อเปิดแผนที่หรือเคลื่อนที่


## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend**: HTML5, Vanilla JavaScript
- **Styling**: CSS3 (Modern Glassmorphism Design, Linear Gradients)
- **Map Library**: [Leaflet.js](https://leafletjs.com/) + OpenStreetMap Tiles
- **Icons**: FontAwesome 6
- **PWA**: Manifest.json + Service Worker (Caching Strategy)

## 📱 วิธีการติดตั้งลงมือถือ (User Guide)

ไม่ต้องเข้า App Store สามารถติดตั้งผ่าน Browser ได้เลย:

### สำหรับ iOS (iPhone/iPad)
1. เปิดลิงก์เว็บใน **Safari**
2. กดปุ่ม **แชร์ (Share)** <i class="fa-solid fa-arrow-up-from-bracket"></i> ด้านล่าง
3. เลื่อนลงมาเลือกเมนู **"เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)**
4. กด **เพิ่ม (Add)** มุมขวาบน

### สำหรับ Android
1. เปิดลิงก์เว็บใน **Chrome**
2. กดปุ่ม **จุดสามจุด (Menu)** มุมขวาบน
3. เลือก **"ติดตั้งแอป" (Install App)** หรือ **"เพิ่มลงหน้าจอหลัก" (Add to Home screen)**

---

## 🚀 สำหรับนักพัฒนา: การนำขึ้นใช้งาน (Deployment)

เนื่องจากแอปจำเป็นต้องใช้ **GPS Location Service** ซึ่ง Browser บังคับว่าต้องรันผ่าน **HTTPS** เท่านั้น (รัน Localhost หรือ HTTP ธรรมดาบนมือถือจะใช้ GPS ไม่ได้)

วิธีที่ง่ายและฟรีที่สุดคือใช้ **GitHub Pages**:

1. **สร้าง Repository**: สร้าง Repo ใหม่ใน GitHub ของคุณ
2. **อัปโหลดไฟล์**: นำไฟล์ทั้งหมดในโปรเจกต์นี้ขึ้นไปที่ Branch `master` หรือ `main`
3. **ตั้งค่า Pages**:
    - ไปที่ `Settings` > `Pages`
    - ตรง **Source** ให้เลือก `Deploy from a branch`
    - เลือก Branch `master` แล้วกด Save
4. **เสร็จสิ้น**: รอประมาณ 2 นาที GitHub จะแจ้งลิงก์สำหรับใช้งาน (เช่น `https://username.github.io/repo-name/`)

## 📄 โครงสร้างไฟล์ (Project Structure)

```text
/
├── index.html       # หน้าจอหลักของแอป
├── style.css        # ดีไซน์และ Animation ทั้งหมด
├── app.js           # Logic การทำงาน (GPS, Map, LocalStorage)
├── manifest.json    # การตั้งค่า PWA (ชื่อแอป, ไอคอน, สีTheme)
├── sw.js            # Service Worker (จัดการ Offline Mode)
└── icon-*.png       # ไอคอนของแอป
```

---
*Crafted by Phmiphut P.*
