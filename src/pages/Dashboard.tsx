import { useRequests } from '../hooks/useRequests';
import { STATUS_CONFIG } from '../types';
import type { RequestStatus } from '../types';
import StatusBadge from '../components/StatusBadge';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import React from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DescriptionIcon from '@mui/icons-material/Description';

export default function Dashboard() {
    const { currentUser } = useAuth();
    const { requests, loading } = useRequests(currentUser?.id, currentUser?.role);

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner spinner--lg" />
                <p>กำลังโหลดข้อมูล...</p>
            </div>
        );
    }

    // Role check: Admin/Approver sees all, User sees only own
    const isAdmin = currentUser?.role === 'admin';
    const isApprover = currentUser?.role === 'approver';
    const canViewAll = isAdmin || isApprover;

    const statusCounts = requests.reduce(
        (acc, req) => {
            acc[req.status] = (acc[req.status] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>
    );

    const totalAmount = requests.reduce((sum, r) => sum + r.totalAmount, 0);
    const recentRequests = requests.slice(0, 5);

    return (
        <div className="page dashboard-page">
            <div className="page-header">
                <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><DashboardIcon fontSize="large" /> แดชบอร์ด</h1>
                <p className="page-description">
                    {canViewAll ? 'ภาพรวมคำขอซื้ออุปกรณ์ IT ทั้งหมด' : 'ภาพรวมคำขอซื้ออุปกรณ์ IT ของคุณ'}
                </p>
            </div>

            {/* Summary Cards */}
            <div className="dashboard-cards">
                <div className="dashboard-card dashboard-card--total">
                    <div className="dashboard-card-icon"><AssignmentIcon fontSize="large" /></div>
                    <div className="dashboard-card-info">
                        <span className="dashboard-card-value">{requests.length}</span>
                        <span className="dashboard-card-label">{canViewAll ? 'คำขอทั้งหมด' : 'คำขอของฉัน'}</span>
                    </div>
                </div>

                {(Object.keys(STATUS_CONFIG) as RequestStatus[]).map((status) => {
                    const config = STATUS_CONFIG[status];
                    return (
                        <div
                            key={status}
                            className="dashboard-card"
                            style={{ borderLeftColor: config.color }}
                        >
                            <div className="dashboard-card-icon">
                                {React.cloneElement(config.icon as React.ReactElement, { fontSize: 'large' })}
                            </div>
                            <div className="dashboard-card-info">
                                <span className="dashboard-card-value">{statusCounts[status] || 0}</span>
                                <span className="dashboard-card-label">{config.label}</span>
                            </div>
                        </div>
                    );
                })}

                <div className="dashboard-card dashboard-card--amount">
                    <div className="dashboard-card-icon"><AttachMoneyIcon fontSize="large" /></div>
                    <div className="dashboard-card-info">
                        <span className="dashboard-card-value">
                            {totalAmount.toLocaleString('th-TH')}
                        </span>
                        <span className="dashboard-card-label">มูลค่ารวม (บาท)</span>
                    </div>
                </div>
            </div>

            {/* Recent Requests */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><DescriptionIcon /> คำขอล่าสุด</h2>
                    <Link to="/requests" className="btn btn--ghost btn--sm">
                        ดูทั้งหมด →
                    </Link>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>เลขที่</th>
                                <th>เรื่อง</th>
                                <th>แผนก</th>
                                <th>มูลค่า</th>
                                <th>สถานะ</th>
                                <th>วันที่</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="table-empty">
                                        ยังไม่มีคำขอซื้อ
                                    </td>
                                </tr>
                            ) : (
                                recentRequests.map((req) => (
                                    <tr key={req.id}>
                                        <td>
                                            <Link to={`/requests/${req.id}`} className="table-link">
                                                {req.requestNumber}
                                            </Link>
                                        </td>
                                        <td>{req.title}</td>
                                        <td>{req.department}</td>
                                        <td className="text-right">
                                            {req.totalAmount.toLocaleString('th-TH')} ฿
                                        </td>
                                        <td>
                                            <StatusBadge status={req.status} size="sm" />
                                        </td>
                                        <td>{req.createdAt.toLocaleDateString('th-TH')}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
