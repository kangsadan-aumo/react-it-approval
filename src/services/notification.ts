import type { AppUser, PurchaseRequest } from '../types';

export const NotificationService = {
    sendEmail: (to: string[], subject: string, body: string) => {
        // In a real app, this would call a backend API or Email Service (e.g., SendGrid, Firebase Extensions)
        console.log(`%c[📧 Email Notification]`, 'color: #3b82f6; font-weight: bold;');
        console.log(`To: ${to.join(', ')}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${body}`);
        console.log('-----------------------------------');

        // Simulate API call delay
        return new Promise((resolve) => setTimeout(resolve, 500));
    },

    notifyRequestCreated: async (request: PurchaseRequest, approvers: AppUser[]) => {
        const emails = approvers.map(u => u.email).filter(Boolean);
        if (emails.length === 0) return;

        const subject = `[New Request] ${request.requestNumber}: ${request.title}`;
        const body = `
      เรียน หัวหน้าแผนก/ผู้ดูแลระบบ,

      มีคำขออนุมัติสั่งซื้อใหม่รอการดำเนินการ:
      
      เลขที่: ${request.requestNumber}
      เรื่อง: ${request.title}
      ผู้ขอ: ${request.requesterName}
      แผนก: ${request.department}
      มูลค่ารวม: ${request.totalAmount.toLocaleString('th-TH')} บาท
      
      กรุณาเข้าสู่ระบบเพื่อตรวจสอบและอนุมัติ: ${window.location.origin}/requests/${request.id}
    `;

        await NotificationService.sendEmail(emails, subject, body);
    },

    notifyStatusChanged: async (request: PurchaseRequest, requesterEmail: string, status: string, reason?: string) => {
        if (!requesterEmail) return;

        let statusText = status;
        switch (status) {
            case 'approved': statusText = 'อนุมัติแล้ว ✅'; break;
            case 'rejected': statusText = 'ไม่อนุมัติ ❌'; break;
            case 'ordered': statusText = 'สั่งซื้อแล้ว 📦'; break;
            case 'completed': statusText = 'เสร็จสิ้น 🎉'; break;
            case 'cancelled': statusText = 'ยกเลิก 🚫'; break;
        }

        const subject = `[Update] ${request.requestNumber}: สถานะเปลี่ยนเป็น ${statusText}`;
        let body = `
      เรียน คุณ ${request.requesterName},

      คำขอสั่งซื้อเลขที่ ${request.requestNumber} ของคุณมีการอัปเดตสถานะ:
      
      สถานะใหม่: ${statusText}
    `;

        if (reason) {
            body += `\nเหตุผล/หมายเหตุ: ${reason}`;
        }

        body += `\n\nตรวจสอบรายละเอียด: ${window.location.origin}/requests/${request.id}`;

        await NotificationService.sendEmail([requesterEmail], subject, body);
    }
};
