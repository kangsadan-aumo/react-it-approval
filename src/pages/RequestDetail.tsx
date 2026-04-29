import { useParams, useNavigate } from 'react-router-dom';
import { useRequest } from '../hooks/useRequests';
import StatusBadge from '../components/StatusBadge';
import FileUploader from '../components/FileUploader';
import { updateRequestStatus, uploadFile } from '../services/supabaseData';
import type { RequestStatus } from '../types';
import { STATUS_CONFIG } from '../types';
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SignatureModal from '../components/SignatureModal';
import CancelIcon from '@mui/icons-material/Cancel';
import BlockIcon from '@mui/icons-material/Block';
import DrawIcon from '@mui/icons-material/Draw';
import EditNoteIcon from '@mui/icons-material/EditNote';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ComputerIcon from '@mui/icons-material/Computer';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import BoltIcon from '@mui/icons-material/Bolt';
import CloseIcon from '@mui/icons-material/Close';

export default function RequestDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentUser, hasRole } = useAuth();
    const { request, loading, refetch } = useRequest(id, currentUser?.id, currentUser?.role);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showSignatureModal, setShowSignatureModal] = useState(false);
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
                    <h2><CancelIcon fontSize="large" color="error" style={{ verticalAlign: 'middle', marginRight: '8px' }} />ไม่พบคำขอซื้อ</h2>
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

    const handleFileUpload = async (file: File, type: 'quotation' | 'signed_quotation') => {
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
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                        {actionLoading ? <span className="spinner spinner--sm" /> : <BlockIcon fontSize="small" />} ยกเลิกคำขอ
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
                        onClick={() => {
                            if (!request.quotationUrl) {
                                alert('กรุณารอผู้ใช้อัปโหลดใบเสนอราคาก่อนอนุมัติ');
                                return;
                            }
                            setShowSignatureModal(true);
                        }}
                        disabled={actionLoading}
                    >
                        {actionLoading ? <span className="spinner spinner--sm" /> : '✍️'} เซ็นชื่ออนุมัติ
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
                        onClick={() => {
                            if (!request.quotationUrl) {
                                alert('กรุณารอผู้ใช้อัปโหลดใบเสนอราคาก่อนอนุมัติ');
                                return;
                            }
                            setShowSignatureModal(true);
                        }}
                        disabled={actionLoading}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                        {actionLoading ? <span className="spinner spinner--sm" /> : <DrawIcon fontSize="small" />} เซ็นชื่ออนุมัติ
                    </button>,
                    <button
                        key="rejected"
                        className="btn btn--danger"
                        onClick={() => setShowRejectModal(true)}
                        disabled={actionLoading}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                        <CancelIcon fontSize="small" /> ไม่อนุมัติ
                    </button>,
                    <button
                        key="cancel"
                        className="btn btn--ghost btn--danger-text"
                        onClick={handleCancel}
                        disabled={actionLoading}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                        <BlockIcon fontSize="small" /> ยกเลิกคำขอ
                    </button>
                );
            }
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
                        <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><EditNoteIcon /> ข้อมูลทั่วไป</h2>
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
                        <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CalendarTodayIcon /> ไทม์ไลน์</h2>
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
                                                {request.status === 'rejected' ? 'ไม่อนุมัติ' : 'อนุมัติ / เสร็จสิ้น'}
                                            </span>
                                            <span className="timeline-date">
                                                {request.approvedAt ? new Date(request.approvedAt).toLocaleDateString('th-TH') : (request.status === 'rejected' ? new Date(request.updatedAt).toLocaleDateString('th-TH') : '—')}
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
                        <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ComputerIcon /> รายการอุปกรณ์</h2>
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

                {/* เอกสาร — ผู้ใช้/แอดมิน อัปโหลดใบเสนอราคา */}
                {canUploadFiles && (
                    <div className="card card--full">
                        <div className="card-header">
                            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FolderIcon /> ใบเสนอราคา</h2>
                        </div>
                        <div className="card-body">
                            <div className="documents-grid">
                                <FileUploader
                                    label="📄 ใบเสนอราคา (Quotation)"
                                    currentFileName={request.quotationName}
                                    currentFileUrl={request.quotationUrl}
                                    onUpload={(file) => handleFileUpload(file, 'quotation')}
                                    locked={request.status !== 'pending'}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* แยกเอกสารใบเสนอราคาที่เซ็นแล้วออกมาให้โหลดได้ */}
                {request.signedQuotationUrl && (
                    <div className="card card--full">
                        <div className="card-header">
                            <h2 className="card-title" style={{ color: STATUS_CONFIG.approved.color, display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircleIcon /> เอกสารอนุมัติ (E-Signature)</h2>
                        </div>
                        <div className="card-body">
                            <div className="documents-grid">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <strong>{request.signedQuotationName || 'signed_quotation.pdf'}</strong>
                                    <p className="text-muted">เอกสารใบเสนอราคาที่ได้รับการเซ็นอนุมัติแล้ว</p>
                                    <a
                                        href={request.signedQuotationUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn--success"
                                        style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        download
                                    >
                                        <DownloadIcon fontSize="small" /> ดาวน์โหลดเอกสารอนุมัติ
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* เอกสาร — ผู้อนุมัติเห็นแค่ดูไฟล์ ไม่อัปโหลด (กรณีรอดำเนินการดูใบจดหมาย) */}
                {isApprover && request.quotationUrl && request.status === 'pending' && (
                    <div className="card card--full">
                        <div className="card-header">
                            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FolderIcon /> เอกสารประกอบการพิจารณา</h2>
                        </div>
                        <div className="card-body">
                            <div className="documents-grid">
                                <a href={request.quotationUrl} target="_blank" rel="noopener noreferrer" className="btn btn--ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <DescriptionIcon fontSize="small" /> ดูใบเสนอราคาต้นฉบับ
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                {actionButtons.length > 0 && (
                    <div className="card card--full">
                        <div className="card-header">
                            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><BoltIcon /> ดำเนินการ</h2>
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
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CancelIcon color="error" /> ไม่อนุมัติคำขอ</h3>
                            <button className="modal-close" onClick={() => setShowRejectModal(false)}><CloseIcon /></button>
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
                                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                {actionLoading ? <span className="spinner spinner--sm" /> : <CancelIcon fontSize="small" />} ยืนยันไม่อนุมัติ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Signature Modal */}
            {showSignatureModal && id && (
                <SignatureModal
                    isOpen={showSignatureModal}
                    onClose={() => setShowSignatureModal(false)}
                    pdfUrl={request.quotationUrl}
                    requestId={id}
                    onSuccess={async () => {
                        await handleStatusChange('approved');
                        setShowSignatureModal(false);
                    }}
                />
            )}
        </div>
    );
}
