import { useParams, useNavigate } from 'react-router-dom';
import { useRequest } from '../hooks/useRequests';
import StatusBadge from '../components/StatusBadge';
import FileUploader from '../components/FileUploader';
import { updateRequestStatus, uploadFile } from '../services/firebase';
import type { RequestStatus } from '../types';
import { STATUS_CONFIG } from '../types';
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function RequestDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentUser, hasRole } = useAuth();
    const { request, loading, refetch } = useRequest(id, currentUser?.id, currentUser?.role);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner spinner--lg" />
                <p>กำลังโหลดข้อมูล...</p>
            </div>
        );
    }

    if (!request) {
        return (
            <div className="page">
                <div className="empty-state">
                    <h2>❌ ไม่พบคำขอซื้อ</h2>
                    <p>คำขอซื้อที่คุณต้องการดูไม่มีในระบบ</p>
                    <button className="btn btn--primary" onClick={() => navigate('/requests')}>
                        ← กลับไปรายการ
                    </button>
                </div>
            </div>
        );
    }

    const handleStatusChange = async (newStatus: RequestStatus, reason?: string) => {
        if (!id) return;
        setActionLoading(true);
        try {
            await updateRequestStatus(id, newStatus, reason);
            await refetch();
            setShowRejectModal(false);
        } catch (err) {
            console.error(err);
            alert('เกิดข้อผิดพลาด');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!id) return;
        if (!confirm('คุณต้องการยกเลิกคำขอนี้หรือไม่?')) return;
        setActionLoading(true);
        try {
            await updateRequestStatus(id, 'cancelled');
            await refetch();
        } catch (err) {
            console.error(err);
            alert('เกิดข้อผิดพลาดในการยกเลิก');
        } finally {
            setActionLoading(false);
        }
    };

    const handleFileUpload = async (file: File, type: 'quotation' | 'tax_invoice') => {
        if (!id) return;
        await uploadFile(file, id, type);
        await refetch();
    };

    // ---- Role-based permissions ----
    const isUser = hasRole('user');
    const isApprover = hasRole('approver');
    const isAdmin = hasRole('admin');

    // Determine which action buttons to show based on role
    const getActions = () => {
        const actions: React.ReactNode[] = [];

        if (request.status === 'pending') {
            // User: can only cancel
            if (isUser) {
                actions.push(
                    <button
                        key="cancel"
                        className="btn btn--danger"
                        onClick={handleCancel}
                        disabled={actionLoading}
                    >
                        {actionLoading ? <span className="spinner spinner--sm" /> : '🚫'} ยกเลิกคำขอ
                    </button>
                );
            }

            // Approver: approve/reject only
            if (isApprover) {
                actions.push(
                    <button
                        key="approved"
                        className="btn"
                        style={{ backgroundColor: STATUS_CONFIG.approved.color, color: '#fff' }}
                        onClick={() => handleStatusChange('approved')}
                        disabled={actionLoading}
                    >
                        {actionLoading ? <span className="spinner spinner--sm" /> : '✅'} อนุมัติ
                    </button>,
                    <button
                        key="rejected"
                        className="btn btn--danger"
                        onClick={() => setShowRejectModal(true)}
                        disabled={actionLoading}
                    >
                        ❌ ไม่อนุมัติ
                    </button>
                );
            }

            // Admin: can do everything
            if (isAdmin) {
                actions.push(
                    <button
                        key="approved"
                        className="btn"
                        style={{ backgroundColor: STATUS_CONFIG.approved.color, color: '#fff' }}
                        onClick={() => handleStatusChange('approved')}
                        disabled={actionLoading}
                    >
                        {actionLoading ? <span className="spinner spinner--sm" /> : '✅'} อนุมัติ
                    </button>,
                    <button
                        key="rejected"
                        className="btn btn--danger"
                        onClick={() => setShowRejectModal(true)}
                        disabled={actionLoading}
                    >
                        ❌ ไม่อนุมัติ
                    </button>,
                    <button
                        key="cancel"
                        className="btn btn--ghost btn--danger-text"
                        onClick={handleCancel}
                        disabled={actionLoading}
                    >
                        🚫 ยกเลิกคำขอ
                    </button>
                );
            }
        }

        if (request.status === 'approved' && (isAdmin || isUser)) {
            actions.push(
                <button
                    key="ordered"
                    className="btn"
                    style={{ backgroundColor: STATUS_CONFIG.ordered.color, color: '#fff' }}
                    onClick={() => handleStatusChange('ordered')}
                    disabled={actionLoading}
                >
                    {actionLoading ? <span className="spinner spinner--sm" /> : '📦'} สั่งซื้อแล้ว
                </button>
            );
        }

        if (request.status === 'ordered' && (isAdmin || isUser)) {
            const hasTaxInvoice = !!request.taxInvoiceUrl;
            actions.push(
                <button
                    key="completed"
                    className="btn"
                    style={{ backgroundColor: hasTaxInvoice ? STATUS_CONFIG.completed.color : '#6b7280', color: '#fff' }}
                    onClick={() => {
                        if (!hasTaxInvoice) {
                            alert('กรุณาอัปโหลดใบกำกับภาษีก่อนกดเสร็จสิ้น');
                            return;
                        }
                        handleStatusChange('completed');
                    }}
                    disabled={actionLoading}
                >
                    {actionLoading ? <span className="spinner spinner--sm" /> : '🎉'} เสร็จสิ้น
                </button>
            );
        }

        return actions;
    };

    const actionButtons = getActions();

    // Can upload files: user and admin can, approver cannot
    const canUploadFiles = !isApprover;

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <button className="btn btn--ghost btn--sm" onClick={() => navigate('/requests')}>
                        ← กลับไปรายการ
                    </button>
                    <h1 className="page-title">{request.requestNumber}</h1>
                    <p className="page-description">{request.title}</p>
                </div>
                <StatusBadge status={request.status} size="lg" />
            </div>

            <div className="detail-grid">
                {/* ข้อมูลทั่วไป */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">📝 ข้อมูลทั่วไป</h2>
                    </div>
                    <div className="card-body">
                        <div className="detail-fields">
                            <div className="detail-field">
                                <span className="detail-field-label">เลขที่คำขอ</span>
                                <span className="detail-field-value">{request.requestNumber}</span>
                            </div>
                            <div className="detail-field">
                                <span className="detail-field-label">ผู้ขอ</span>
                                <span className="detail-field-value">{request.requesterName}</span>
                            </div>
                            <div className="detail-field">
                                <span className="detail-field-label">แผนก</span>
                                <span className="detail-field-value">{request.department}</span>
                            </div>
                            <div className="detail-field">
                                <span className="detail-field-label">วันที่สร้าง</span>
                                <span className="detail-field-value">
                                    {new Date(request.createdAt).toLocaleDateString('th-TH', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </span>
                            </div>
                            {request.description && (
                                <div className="detail-field detail-field--full">
                                    <span className="detail-field-label">รายละเอียด</span>
                                    <span className="detail-field-value">{request.description}</span>
                                </div>
                            )}
                            {request.rejectionReason && (
                                <div className="detail-field detail-field--full">
                                    <span className="detail-field-label">เหตุผลที่ไม่อนุมัติ</span>
                                    <span className="detail-field-value text-danger">{request.rejectionReason}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">📅 ไทม์ไลน์</h2>
                    </div>
                    <div className="card-body">
                        <div className="timeline">
                            <div className="timeline-item timeline-item--done">
                                <div className="timeline-dot" />
                                <div className="timeline-content">
                                    <span className="timeline-label">สร้างคำขอ</span>
                                    <span className="timeline-date">
                                        {new Date(request.createdAt).toLocaleDateString('th-TH')}
                                    </span>
                                </div>
                            </div>
                            {request.status === 'cancelled' ? (
                                <div className="timeline-item timeline-item--done">
                                    <div className="timeline-dot" style={{ borderColor: '#6b7280' }} />
                                    <div className="timeline-content">
                                        <span className="timeline-label">ยกเลิก</span>
                                        <span className="timeline-date">
                                            {request.cancelledAt ? new Date(request.cancelledAt).toLocaleDateString('th-TH') : new Date(request.updatedAt).toLocaleDateString('th-TH')}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className={`timeline-item ${request.approvedAt || request.status === 'rejected' ? 'timeline-item--done' : ''}`}>
                                        <div className="timeline-dot" style={{ borderColor: request.status === 'rejected' ? '#ef4444' : undefined }} />
                                        <div className="timeline-content">
                                            <span className="timeline-label">
                                                {request.status === 'rejected' ? 'ไม่อนุมัติ' : 'อนุมัติ'}
                                            </span>
                                            <span className="timeline-date">
                                                {request.approvedAt ? new Date(request.approvedAt).toLocaleDateString('th-TH') : (request.status === 'rejected' ? new Date(request.updatedAt).toLocaleDateString('th-TH') : '—')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`timeline-item ${request.orderedAt ? 'timeline-item--done' : ''}`}>
                                        <div className="timeline-dot" />
                                        <div className="timeline-content">
                                            <span className="timeline-label">สั่งซื้อ</span>
                                            <span className="timeline-date">
                                                {request.orderedAt ? new Date(request.orderedAt).toLocaleDateString('th-TH') : '—'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`timeline-item ${request.completedAt ? 'timeline-item--done' : ''}`}>
                                        <div className="timeline-dot" />
                                        <div className="timeline-content">
                                            <span className="timeline-label">เสร็จสิ้น</span>
                                            <span className="timeline-date">
                                                {request.completedAt ? new Date(request.completedAt).toLocaleDateString('th-TH') : '—'}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* รายการอุปกรณ์ */}
                <div className="card card--full">
                    <div className="card-header">
                        <h2 className="card-title">🖥️ รายการอุปกรณ์</h2>
                    </div>
                    <div className="card-body">
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>ชื่ออุปกรณ์</th>
                                        <th>จำนวน</th>
                                        <th>หน่วย</th>
                                        <th>ราคาต่อหน่วย</th>
                                        <th>รวม</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {request.items.map((item, index) => (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td>{item.name}</td>
                                            <td className="text-center">{item.quantity}</td>
                                            <td className="text-center">{item.unit}</td>
                                            <td className="text-right font-mono">
                                                {item.estimatedPrice.toLocaleString('th-TH')}
                                            </td>
                                            <td className="text-right font-mono">
                                                {(item.quantity * item.estimatedPrice).toLocaleString('th-TH')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={5} className="text-right"><strong>รวมทั้งสิ้น</strong></td>
                                        <td className="text-right font-mono">
                                            <strong>{request.totalAmount.toLocaleString('th-TH')} บาท</strong>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                {/* เอกสาร — ซ่อนจากผู้อนุมัติ */}
                {canUploadFiles && (
                    <div className="card card--full">
                        <div className="card-header">
                            <h2 className="card-title">📁 เอกสารแนบ</h2>
                        </div>
                        <div className="card-body">
                            <div className="documents-grid">
                                <FileUploader
                                    label="📄 ใบเสนอราคา (Quotation)"
                                    currentFileName={request.quotationName}
                                    currentFileUrl={request.quotationUrl}
                                    onUpload={(file) => handleFileUpload(file, 'quotation')}
                                    locked={!!request.quotationUrl}
                                />

                                <FileUploader
                                    label="🧾 ใบกำกับภาษี (Tax Invoice)"
                                    currentFileName={request.taxInvoiceName}
                                    currentFileUrl={request.taxInvoiceUrl}
                                    onUpload={(file) => handleFileUpload(file, 'tax_invoice')}
                                    disabled={!['ordered', 'completed'].includes(request.status)}
                                    locked={!!request.taxInvoiceUrl}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* เอกสาร — ผู้อนุมัติเห็นแค่ดูไฟล์ ไม่อัปโหลด */}
                {isApprover && (request.quotationUrl || request.taxInvoiceUrl) && (
                    <div className="card card--full">
                        <div className="card-header">
                            <h2 className="card-title">📁 เอกสารแนบ</h2>
                        </div>
                        <div className="card-body">
                            <div className="documents-grid">
                                {request.quotationUrl && (
                                    <a href={request.quotationUrl} target="_blank" rel="noopener noreferrer" className="btn btn--ghost">
                                        📄 ดูใบเสนอราคา
                                    </a>
                                )}
                                {request.taxInvoiceUrl && (
                                    <a href={request.taxInvoiceUrl} target="_blank" rel="noopener noreferrer" className="btn btn--ghost">
                                        🧾 ดูใบกำกับภาษี
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                {actionButtons.length > 0 && (
                    <div className="card card--full">
                        <div className="card-header">
                            <h2 className="card-title">⚡ ดำเนินการ</h2>
                        </div>
                        <div className="card-body">
                            <div className="action-buttons">
                                {actionButtons}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>❌ ไม่อนุมัติคำขอ</h3>
                            <button className="modal-close" onClick={() => setShowRejectModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">เหตุผลที่ไม่อนุมัติ</label>
                                <textarea
                                    className="form-input form-textarea"
                                    rows={3}
                                    placeholder="ระบุเหตุผล..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn--ghost" onClick={() => setShowRejectModal(false)}>
                                ยกเลิก
                            </button>
                            <button
                                className="btn btn--danger"
                                onClick={() => handleStatusChange('rejected', rejectionReason)}
                                disabled={actionLoading}
                            >
                                {actionLoading ? <span className="spinner spinner--sm" /> : '❌'} ยืนยันไม่อนุมัติ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
