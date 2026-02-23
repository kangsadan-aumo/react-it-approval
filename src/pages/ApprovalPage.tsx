import { Link } from 'react-router-dom';
import { useRequests } from '../hooks/useRequests';
import StatusBadge from '../components/StatusBadge';
import { updateRequestStatus } from '../services/supabaseData';
import { useState } from 'react';

import { useAuth } from '../contexts/AuthContext';
import SignatureModal from '../components/SignatureModal';

export default function ApprovalPage() {
    const { currentUser } = useAuth();
    const { requests, loading } = useRequests(currentUser?.id, currentUser?.role);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectId, setRejectId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const [signatureId, setSignatureId] = useState<string | null>(null);
    const [signaturePdfUrl, setSignaturePdfUrl] = useState<string | undefined>(undefined);

    const pendingRequests = requests.filter((r) => r.status === 'pending');

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner spinner--lg" />
                <p>กำลังโหลดข้อมูล...</p>
            </div>
        );
    }

    const handleReject = async () => {
        if (!rejectId) return;
        setActionLoading(rejectId);
        try {
            await updateRequestStatus(rejectId, 'rejected', rejectionReason);
            setRejectId(null);
            setRejectionReason('');
            // force reload happens through snapshot normally
        } catch (err) {
            console.error(err);
            alert('เกิดข้อผิดพลาด');
        } finally {
            setActionLoading(null);
        }
    };

    const handleApproveSigned = async () => {
        if (!signatureId) return;
        setActionLoading(signatureId);
        try {
            await updateRequestStatus(signatureId, 'approved');
        } catch (err) {
            console.error(err);
            alert('เกิดข้อผิดพลาด');
        } finally {
            setActionLoading(null);
            setSignatureId(null);
            setSignaturePdfUrl(undefined);
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">✅ รออนุมัติ</h1>
                    <p className="page-description">
                        คำขอซื้อที่รอการพิจารณา ({pendingRequests.length} รายการ)
                    </p>
                </div>
            </div>

            {pendingRequests.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">🎉</div>
                        <h3>ไม่มีคำขอที่รออนุมัติ</h3>
                        <p>คำขอซื้อทั้งหมดได้รับการดำเนินการแล้ว</p>
                    </div>
                </div>
            ) : (
                <div className="approval-grid">
                    {pendingRequests.map((req) => (
                        <div key={req.id} className="approval-card card">
                            <div className="card-header">
                                <div>
                                    <Link to={`/requests/${req.id}`} className="table-link">
                                        <strong>{req.requestNumber}</strong>
                                    </Link>
                                    <StatusBadge status={req.status} size="sm" />
                                </div>
                                <span className="approval-card-date">
                                    {req.createdAt.toLocaleDateString('th-TH')}
                                </span>
                            </div>
                            <div className="card-body">
                                <h3 className="approval-card-title">{req.title}</h3>
                                <div className="approval-card-meta">
                                    <span>👤 {req.requesterName}</span>
                                    <span>🏢 {req.department}</span>
                                    <span>💰 {req.totalAmount.toLocaleString('th-TH')} บาท</span>
                                </div>
                                {req.description && (
                                    <p className="approval-card-desc">{req.description}</p>
                                )}
                                <div className="approval-card-items">
                                    <strong>รายการ ({req.items.length}):</strong>
                                    <ul>
                                        {req.items.slice(0, 3).map((item, i) => (
                                            <li key={i}>
                                                {item.name} × {item.quantity} ({item.estimatedPrice.toLocaleString('th-TH')} ฿)
                                            </li>
                                        ))}
                                        {req.items.length > 3 && (
                                            <li className="text-muted">...อีก {req.items.length - 3} รายการ</li>
                                        )}
                                    </ul>
                                </div>

                                {req.quotationUrl && (
                                    <a
                                        href={req.quotationUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="approval-card-doc"
                                    >
                                        📄 ดูใบเสนอราคา
                                    </a>
                                )}
                            </div>
                            <div className="card-footer">
                                <button
                                    className="btn btn--success"
                                    onClick={() => {
                                        if (!req.quotationUrl) {
                                            alert('กรุณารอเอกสารใบเสนอราคาก่อนเซ็นอนุมัติ');
                                            return;
                                        }
                                        setSignatureId(req.id);
                                        setSignaturePdfUrl(req.quotationUrl);
                                    }}
                                    disabled={actionLoading === req.id}
                                >
                                    {actionLoading === req.id ? (
                                        <span className="spinner spinner--sm" />
                                    ) : (
                                        '✍️'
                                    )}{' '}
                                    เซ็นชื่ออนุมัติ
                                </button>
                                <button
                                    className="btn btn--danger"
                                    onClick={() => setRejectId(req.id)}
                                    disabled={actionLoading === req.id}
                                >
                                    ❌ ไม่อนุมัติ
                                </button>
                                <Link to={`/requests/${req.id}`} className="btn btn--ghost">
                                    ดูรายละเอียด →
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Reject Modal */}
            {rejectId && (
                <div className="modal-overlay" onClick={() => setRejectId(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>❌ ไม่อนุมัติคำขอ</h3>
                            <button className="modal-close" onClick={() => setRejectId(null)}>✕</button>
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
                            <button className="btn btn--ghost" onClick={() => setRejectId(null)}>
                                ยกเลิก
                            </button>
                            <button
                                className="btn btn--danger"
                                onClick={handleReject}
                                disabled={actionLoading === rejectId}
                            >
                                ยืนยันไม่อนุมัติ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Signature Modal */}
            {signatureId && (
                <SignatureModal
                    isOpen={!!signatureId}
                    onClose={() => {
                        setSignatureId(null);
                        setSignaturePdfUrl(undefined);
                    }}
                    onSuccess={handleApproveSigned}
                    requestId={signatureId}
                    pdfUrl={signaturePdfUrl}
                />
            )}
        </div>
    );
}
