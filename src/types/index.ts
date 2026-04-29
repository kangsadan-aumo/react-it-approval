import React from 'react';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import BlockIcon from '@mui/icons-material/Block';
import PersonIcon from '@mui/icons-material/Person';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

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
    signedQuotationUrl?: string;
    signedQuotationName?: string;
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
    approvedAt?: Date;
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

export const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    pending: { label: 'รอดำเนินการ', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', icon: React.createElement(HourglassEmptyIcon, { fontSize: 'small' }) },
    approved: { label: 'อนุมัติ / เสร็จสิ้น', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)', icon: React.createElement(CheckCircleIcon, { fontSize: 'small' }) },
    rejected: { label: 'ไม่อนุมัติ', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)', icon: React.createElement(CancelIcon, { fontSize: 'small' }) },
    cancelled: { label: 'ยกเลิก', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.15)', icon: React.createElement(BlockIcon, { fontSize: 'small' }) },
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

export const ROLE_CONFIG: Record<UserRole, { label: string; color: string; icon: React.ReactNode }> = {
    user: { label: 'ผู้ใช้งาน', color: '#3b82f6', icon: React.createElement(PersonIcon, { fontSize: 'small' }) },
    approver: { label: 'หัวหน้า/ผู้อนุมัติ', color: '#f59e0b', icon: React.createElement(ManageAccountsIcon, { fontSize: 'small' }) },
    admin: { label: 'ผู้ดูแลระบบ', color: '#ef4444', icon: React.createElement(AdminPanelSettingsIcon, { fontSize: 'small' }) },
};
