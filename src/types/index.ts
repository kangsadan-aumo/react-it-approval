export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'ordered' | 'completed' | 'cancelled';

export interface RequestItem {
    name: string;
    quantity: number;
    estimatedPrice: number;
    unit: string;
}

export interface PurchaseRequest {
    id: string;
    requestNumber: string;
    title: string;
    description: string;
    department: string;
    requesterName: string;
    createdBy?: string; // user ID of the creator
    items: RequestItem[];
    status: RequestStatus;
    totalAmount: number;
    quotationUrl?: string;
    quotationName?: string;
    taxInvoiceUrl?: string;
    taxInvoiceName?: string;
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
    approvedAt?: Date;
    orderedAt?: Date;
    completedAt?: Date;
    cancelledAt?: Date;
}

export interface CreateRequestInput {
    title: string;
    description: string;
    department: string;
    requesterName: string;
    createdBy?: string;
    items: RequestItem[];
}

export const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string; bgColor: string; icon: string }> = {
    pending: { label: 'รอดำเนินการ', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', icon: '⏳' },
    approved: { label: 'อนุมัติแล้ว', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)', icon: '✅' },
    rejected: { label: 'ไม่อนุมัติ', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)', icon: '❌' },
    ordered: { label: 'สั่งซื้อแล้ว', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)', icon: '📦' },
    completed: { label: 'เสร็จสิ้น', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)', icon: '🎉' },
    cancelled: { label: 'ยกเลิก', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.15)', icon: '🚫' },
};

// ---- Auth Types ----
export type UserRole = 'user' | 'approver' | 'admin';

export interface AppUser {
    id: string;
    username: string;
    password: string;
    displayName: string;
    department: string;
    email: string; // Added email field
    role: UserRole;
    active: boolean;
    createdAt: string;
}

export const ROLE_CONFIG: Record<UserRole, { label: string; color: string; icon: string }> = {
    user: { label: 'ผู้ใช้งาน', color: '#3b82f6', icon: '👤' },
    approver: { label: 'หัวหน้า/ผู้อนุมัติ', color: '#f59e0b', icon: '👔' },
    admin: { label: 'ผู้ดูแลระบบ', color: '#ef4444', icon: '🛡️' },
};
