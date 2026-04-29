# 🧾 Purchase Approval System  
ระบบอนุมัติการสั่งซื้อสำหรับองค์กร รองรับการทำงานแบบหลายบทบาท (Role-based) และแสดงสถานะแบบเรียลไทม์  

## Features  
### 👨‍💻 Employee  
- สร้างคำขออนุมัติซื้อ (Purchase Request)  
- กรอกข้อมูลรายการ เช่น ชื่อสินค้า, จำนวนเงิน  
- แนบไฟล์ใบเสนอราคา (PDF)  
- ติดตามสถานะคำขอแบบเรียลไทม์  
### 👨‍💼 Manager  
- ตรวจสอบคำขอจากพนักงาน  
- อนุมัติ / ปฏิเสธคำขอ  
- เซ็นเอกสารด้วย Digital Signature  
### 👩‍💼 Admin  
- จัดการคำขอทั้งหมดในระบบ  
- อัปเดตสถานะคำขอ  
- Export ข้อมูลเป็น Excel  
### 🔄 Workflow  
- พนักงานสร้างคำขอ พร้อมแนบเอกสาร (PDF)  
- ระบบส่งคำขอไปยังหัวหน้า (Manager)  
- หัวหน้าทำการอนุมัติ / ปฏิเสธ  
- หากอนุมัติ → เซ็นเอกสาร (Digital Signature)  
- ผู้ใช้งานติดตามสถานะได้แบบเรียลไทม์  
### ✨ Key Highlights  
- รองรับ Role-based System (Admin / Manager / Employee)  
- มี Approval Workflow แบบลำดับขั้น  
- แสดงสถานะแบบ Real-time Tracking  
- รองรับ Digital Signature  
- Export ข้อมูลเป็น Excel  
### 🛠️ Tech Stack  
- Frontend: React, MUI  
- Backend: Node.js  
- Database: Supabase  
### 📌 Notes  
- ระบบนี้เป็น Simulation Project  
- ออกแบบตาม Workflow การอนุมัติในองค์กรจริง  
- มุ่งเน้นการออกแบบระบบและประสบการณ์ผู้ใช้งาน (UI/UX)  
