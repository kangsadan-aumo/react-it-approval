import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRequests } from '../hooks/useRequests';
import { NotificationService } from '../services/notification';
import StatusBadge from '../components/StatusBadge';
import FileUploader from '../components/FileUploader';
import { STATUS_CONFIG } from '../types';
import type { PurchaseRequest, RequestStatus, RequestItem } from '../types';
import SignatureModal from '../components/SignatureModal';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ComputerIcon from '@mui/icons-material/Computer';
import FolderIcon from '@mui/icons-material/Folder';
import BlockIcon from '@mui/icons-material/Block';
import DrawIcon from '@mui/icons-material/Draw';
import CancelIcon from '@mui/icons-material/Cancel';

export default function RequestList() {
    const { currentUser, users } = useAuth();
    const { requests, loading, createRequest, updateRequestStatus, uploadFile } = useRequests(currentUser?.id, currentUser?.role);
    const navigate = useNavigate();

    // UI State
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');
    const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Signature Modal State
    const [showSignatureModal, setShowSignatureModal] = useState(false);

    // Create Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [items, setItems] = useState<RequestItem[]>([{ name: '', quantity: 1, estimatedPrice: 0, unit: 'ชิ้น' }]);
    const [quotationFile, setQuotationFile] = useState<File | null>(null);

    const isUser = currentUser?.role === 'user';
    const isApprover = currentUser?.role === 'approver';
    const isAdmin = currentUser?.role === 'admin';

    const statusFilters: { label: string; value: RequestStatus | 'all' }[] = [
        { label: 'ทั้งหมด', value: 'all' },
        { label: 'รอดำเนินการ', value: 'pending' },
        { label: 'อนุมัติ / เสร็จสิ้น', value: 'approved' },
        { label: 'ยกเลิก', value: 'cancelled' },
        { label: 'ไม่อนุมัติ', value: 'rejected' },
    ];

    const totalAmount = useMemo(() => {
        return items.reduce((sum, item) => sum + (item.quantity * item.estimatedPrice), 0);
    }, [items]);

    const canUploadFiles = selectedRequest && (
        (isUser && selectedRequest.createdBy === currentUser?.id) ||
        isAdmin
    ) && (selectedRequest.status === 'pending');

    // Helper Functions
    const resetForm = () => {
        setTitle('');
        setDescription('');
        setItems([{ name: '', quantity: 1, estimatedPrice: 0, unit: 'ชิ้น' }]);
        setQuotationFile(null);
    };

    const openCreateModal = () => {
        resetForm();
        setShowModal(true);
    };

    const closeCreateModal = () => {
        if (!submitting) setShowModal(false);
    };

    const openDetailModal = (req: PurchaseRequest) => {
        setSelectedRequest(req);
    };

    const closeDetailModal = () => {
        setSelectedRequest(null);
        setShowRejectModal(false);
        setRejectionReason('');
    };

    const addItem = () => {
        setItems([...items, { name: '', quantity: 1, estimatedPrice: 0, unit: 'ชิ้น' }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof RequestItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setSubmitting(true);
        try {
            const input = {
                title,
                description,
                department: currentUser?.department || '',
                requesterName: currentUser?.displayName || '',
                createdBy: currentUser?.id,
                items,
            };
            const id = await createRequest(input);

            // Notify Approvers
            const approvers = users.filter(u => u.role === 'approver' || u.role === 'admin');
            const mockRequest = { ...input, id, requestNumber: 'PENDING', status: 'pending', totalAmount, createdAt: new Date(), updatedAt: new Date() } as PurchaseRequest;
            NotificationService.notifyRequestCreated(mockRequest, approvers);

            if (quotationFile) {
                await uploadFile(quotationFile, id, 'quotation');
            }
            setShowModal(false);
            resetForm();
            navigate(`/requests/${id}`);
        } catch (err) {
            console.error('Submit Error:', err);
            alert('เกิดข้อผิดพลาดในการสร้างคำขอ: ' + (err as Error).message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusChange = async (newStatus: RequestStatus, reason?: string) => {
        if (!selectedRequest) return;
        setActionLoading(true);
        try {
            await updateRequestStatus(selectedRequest.id, newStatus, reason);

            // Notify Requester
            const requester = users.find(u => u.id === selectedRequest.createdBy);
            const requesterEmail = requester?.email;

            if (requesterEmail) {
                await NotificationService.notifyStatusChanged(selectedRequest, requesterEmail, newStatus, reason);
            }

            setSelectedRequest((prev) => prev ? { ...prev, status: newStatus, updatedAt: new Date() } : null);
            setShowRejectModal(false);
            if (newStatus === 'cancelled') {
                setSelectedRequest(null);
            }
        } catch (err) {
            console.error('Status Change Error:', err);
            alert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ: ' + (err as Error).message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!selectedRequest) return;
        if (!confirm('คุณต้องการยกเลิกคำขอนี้หรือไม่?')) return;
        await handleStatusChange('cancelled');
    };

    const handleFileUpload = async (file: File, type: 'quotation' | 'signed_quotation') => {
        if (!selectedRequest) return;
        try {
            await uploadFile(file, selectedRequest.id, type);
            alert('อัปโหลดไฟล์สำเร็จ');
        } catch (err) {
            console.error('Upload Error:', err);
            alert('เกิดข้อผิดพลาดในการอัปโหลดไฟล์: ' + (err as Error).message);
        }
    };

    // ---- Role-based action buttons ----
    const getDetailActions = (req: PurchaseRequest): React.ReactNode[] => {
        const actions: React.ReactNode[] = [];

        if (req.status === 'pending') {
            if (isUser) {
                actions.push(
                    <button key="cancel" className="btn btn--danger" onClick={handleCancel} disabled={actionLoading} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {actionLoading ? <span className="spinner spinner--sm" /> : <BlockIcon fontSize="small" />} ยกเลิกคำขอ
                    </button>
                );
            }
            if (isApprover) {
                actions.push(
                    <button key="approve" className="btn" style={{ backgroundColor: STATUS_CONFIG.approved.color, color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => {
                        if (!req.quotationUrl) {
                            alert('กรุณารอผู้ใช้อัปโหลดใบเสนอราคาก่อนอนุมัติ');
                            return;
                        }
                        setShowSignatureModal(true);
                    }} disabled={actionLoading}>
                        {actionLoading ? <span className="spinner spinner--sm" /> : <DrawIcon fontSize="small" />} เซ็นชื่ออนุมัติ
                    </button>,
                    <button key="reject" className="btn btn--danger" onClick={() => setShowRejectModal(true)} disabled={actionLoading} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CancelIcon fontSize="small" /> ไม่อนุมัติ
                    </button>
                );
            }
            if (isAdmin) {
                actions.push(
                    <button key="approve" className="btn" style={{ backgroundColor: STATUS_CONFIG.approved.color, color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => {
                        if (!req.quotationUrl) {
                            alert('กรุณารอผู้ใช้อัปโหลดใบเสนอราคาก่อนอนุมัติ');
                            return;
                        }
                        setShowSignatureModal(true);
                    }} disabled={actionLoading}>
                        {actionLoading ? <span className="spinner spinner--sm" /> : <DrawIcon fontSize="small" />} เซ็นชื่ออนุมัติ
                    </button>,
                    <button key="reject" className="btn btn--danger" onClick={() => setShowRejectModal(true)} disabled={actionLoading} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CancelIcon fontSize="small" /> ไม่อนุมัติ
                    </button>,
                    <button key="cancel" className="btn btn--ghost btn--danger-text" onClick={handleCancel} disabled={actionLoading} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <BlockIcon fontSize="small" /> ยกเลิกคำขอ
                    </button>
                );
            }
        }

        return actions;
    };

    // ---- Render ----
    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner spinner--lg" />
                <p>กำลังโหลดข้อมูล...</p>
            </div>
        );
    }

    const filtered = requests.filter((req) => {
        const matchSearch =
            !search ||
            req.title.toLowerCase().includes(search.toLowerCase()) ||
            req.requestNumber.toLowerCase().includes(search.toLowerCase()) ||
            req.requesterName.toLowerCase().includes(search.toLowerCase()) ||
            req.department.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || req.status === statusFilter;
        return matchSearch && matchStatus;
    });

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><AssignmentIcon fontSize="large" /> {isUser ? 'รายการคำขอซื้อของฉัน' : 'รายการคำขอซื้อทั้งหมด'}</h1>
                    <p className="page-description">
                        {isUser ? 'ดูและจัดการคำขอซื้ออุปกรณ์ IT ที่คุณสร้าง' : 'ดูและจัดการคำขอซื้ออุปกรณ์ IT ทั้งหมด'}
                    </p>
                </div>
                <button className="btn btn--primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AddIcon fontSize="small" /> สร้างคำขอใหม่
                </button>
            </div>

            {/* Filters */}
            <div className="card filter-card">
                <div className="filter-bar">
                    <div className="search-box">
                        <span className="search-icon"><SearchIcon /></span>
                        <input
                            type="text"
                            className="form-input search-input"
                            placeholder="ค้นหาเลขที่, เรื่อง, ผู้ขอ, แผนก..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="status-filters">
                        {statusFilters.map((sf) => (
                            <button
                                key={sf.value}
                                className={`filter-btn ${statusFilter === sf.value ? 'filter-btn--active' : ''}`}
                                onClick={() => setStatusFilter(sf.value)}
                            >
                                {sf.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>เลขที่</th>
                                <th>เรื่อง</th>
                                <th>ผู้ขอ</th>
                                <th className="text-center">แผนก</th>
                                <th className="text-center">มูลค่า (บาท)</th>
                                <th className="text-center">สถานะ</th>
                                <th className="text-center">วันที่สร้าง</th>
                                <th>เอกสาร</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="table-empty">
                                        {search || statusFilter !== 'all'
                                            ? 'ไม่พบรายการที่ตรงกับเงื่อนไข'
                                            : 'ยังไม่มีคำขอซื้อ'}
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((req, index) => (
                                    <tr
                                        key={req.id}
                                        className="table-row-hover table-row-clickable"
                                        onClick={() => openDetailModal(req)}
                                        style={{ animationDelay: `${index * 0.05}s` }}
                                    >
                                        <td>
                                            <span className="table-link">{req.requestNumber}</span>
                                        </td>
                                        <td className="table-cell-title">{req.title}</td>
                                        <td>{req.requesterName}</td>
                                        <td className="text-center">{req.department}</td>
                                        <td className="text-center font-mono">
                                            {req.totalAmount.toLocaleString('th-TH')}
                                        </td>
                                        <td className="text-center">
                                            <StatusBadge status={req.status as RequestStatus} size="sm" />
                                        </td>
                                        <td className="text-center">{new Date(req.createdAt).toLocaleDateString('th-TH')}</td>
                                        <td>
                                            <div className="doc-icons" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '4px' }}>
                                                {req.quotationUrl && (
                                                    <a href={req.quotationUrl} target="_blank" rel="noopener noreferrer" title="ใบเสนอราคา">
                                                        <DescriptionIcon fontSize="small" />
                                                    </a>
                                                )}
                                                {req.signedQuotationUrl && (
                                                    <a href={req.signedQuotationUrl} target="_blank" rel="noopener noreferrer" title="เอกสารอนุมัติ (เซ็นแล้ว)">
                                                        <CheckCircleIcon fontSize="small" color="success" />
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="table-footer">
                    <span>แสดง {filtered.length} จาก {requests.length} รายการ</span>
                </div>
            </div>

            {/* ===== Detail View Modal ===== */}
            {selectedRequest && !showRejectModal && (
                <div className="modal-overlay" onClick={closeDetailModal}>
                    <div className="modal modal--lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <h2 className="modal-title">{selectedRequest.requestNumber}</h2>
                                <StatusBadge status={selectedRequest.status} size="sm" />
                            </div>
                            <button className="modal-close" onClick={closeDetailModal}><CloseIcon /></button>
                        </div>
                        <div className="modal-body">
                            {/* Timeline — อยู่บนสุด */}
                            <div className="detail-modal-timeline">
                                <h3 className="modal-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CalendarTodayIcon /> ไทม์ไลน์</h3>
                                <div className="timeline timeline--horizontal">
                                    <div className="timeline-item timeline-item--done">
                                        <div className="timeline-dot" />
                                        <div className="timeline-content">
                                            <span className="timeline-label">สร้างคำขอ</span>
                                            <span className="timeline-date">
                                                {new Date(selectedRequest.createdAt).toLocaleDateString('th-TH')}
                                            </span>
                                        </div>
                                    </div>
                                    {selectedRequest.status === 'cancelled' ? (
                                        <div className="timeline-item timeline-item--done">
                                            <div className="timeline-dot" style={{ borderColor: '#6b7280' }} />
                                            <div className="timeline-content">
                                                <span className="timeline-label">ยกเลิก</span>
                                                <span className="timeline-date">
                                                    {selectedRequest.cancelledAt
                                                        ? new Date(selectedRequest.cancelledAt).toLocaleDateString('th-TH')
                                                        : new Date(selectedRequest.updatedAt).toLocaleDateString('th-TH')}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className={`timeline-item ${selectedRequest.approvedAt || selectedRequest.status === 'rejected' ? 'timeline-item--done' : ''}`}>
                                                <div className="timeline-dot" style={{ borderColor: selectedRequest.status === 'rejected' ? '#ef4444' : undefined }} />
                                                <div className="timeline-content">
                                                    <span className="timeline-label">
                                                        {selectedRequest.status === 'rejected' ? 'ไม่อนุมัติ' : 'อนุมัติ / เสร็จสิ้น'}
                                                    </span>
                                                    <span className="timeline-date">
                                                        {selectedRequest.approvedAt
                                                            ? new Date(selectedRequest.approvedAt).toLocaleDateString('th-TH')
                                                            : selectedRequest.status === 'rejected'
                                                                ? new Date(selectedRequest.updatedAt).toLocaleDateString('th-TH')
                                                                : '—'}
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* ข้อมูลทั่วไป */}
                            <h3 className="modal-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><EditNoteIcon /> ข้อมูลทั่วไป</h3>
                            <div className="detail-modal-info">
                                <div className="detail-field">
                                    <span className="detail-field-label">เรื่อง</span>
                                    <span className="detail-field-value">{selectedRequest.title}</span>
                                </div>
                                <div className="detail-field">
                                    <span className="detail-field-label">ผู้ขอ</span>
                                    <span className="detail-field-value">{selectedRequest.requesterName}</span>
                                </div>
                                <div className="detail-field">
                                    <span className="detail-field-label">แผนก</span>
                                    <span className="detail-field-value">{selectedRequest.department}</span>
                                </div>
                                <div className="detail-field">
                                    <span className="detail-field-label">วันที่สร้าง</span>
                                    <span className="detail-field-value">
                                        {new Date(selectedRequest.createdAt).toLocaleDateString('th-TH', {
                                            year: 'numeric', month: 'long', day: 'numeric',
                                        })}
                                    </span>
                                </div>
                                {selectedRequest.description && (
                                    <div className="detail-field detail-field--full">
                                        <span className="detail-field-label">รายละเอียด</span>
                                        <span className="detail-field-value">{selectedRequest.description}</span>
                                    </div>
                                )}
                                {selectedRequest.rejectionReason && (
                                    <div className="detail-field detail-field--full">
                                        <span className="detail-field-label">เหตุผลที่ไม่อนุมัติ</span>
                                        <span className="detail-field-value text-danger">{selectedRequest.rejectionReason}</span>
                                    </div>
                                )}
                            </div>

                            {/* รายการอุปกรณ์ */}
                            <h3 className="modal-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ComputerIcon /> รายการอุปกรณ์</h3>
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
                                        {selectedRequest.items.map((item, index) => (
                                            <tr key={index}>
                                                <td>{index + 1}</td>
                                                <td>{item.name}</td>
                                                <td className="text-center">{item.quantity}</td>
                                                <td className="text-center">{item.unit}</td>
                                                <td className="text-right font-mono">{item.estimatedPrice.toLocaleString('th-TH')}</td>
                                                <td className="text-right font-mono">{(item.quantity * item.estimatedPrice).toLocaleString('th-TH')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan={5} className="text-right"><strong>รวมทั้งสิ้น</strong></td>
                                            <td className="text-right font-mono">
                                                <strong>{selectedRequest.totalAmount.toLocaleString('th-TH')} บาท</strong>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* เอกสาร — user/admin อัปโหลดใบเสนอราคา (lock เมื่อไม่ได้เป็น pending) */}
                            {canUploadFiles && (
                                <>
                                    <h3 className="modal-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FolderIcon /> ใบเสนอราคา</h3>
                                    <div className="documents-grid">
                                        <FileUploader
                                            label="📄 ใบเสนอราคา (Quotation)"
                                            currentFileName={selectedRequest.quotationName}
                                            currentFileUrl={selectedRequest.quotationUrl}
                                            onUpload={(file) => handleFileUpload(file, 'quotation')}
                                            locked={selectedRequest.status !== 'pending'}
                                        />
                                    </div>
                                </>
                            )}

                            {/* เอกสารอนุมัติให้ดาวน์โหลด */}
                            {selectedRequest.signedQuotationUrl && (
                                <>
                                    <h3 className="modal-section-title" style={{ color: STATUS_CONFIG.approved.color, display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircleIcon /> เอกสารอนุมัติ (E-Signature)</h3>
                                    <div className="documents-grid">
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <strong>{selectedRequest.signedQuotationName || 'signed_quotation.pdf'}</strong>
                                            <p className="text-muted">เอกสารใบเสนอราคาที่ได้รับการเซ็นอนุมัติแล้ว</p>
                                            <a
                                                href={selectedRequest.signedQuotationUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn--success"
                                                style={{ alignSelf: 'flex-start' }}
                                                download
                                            >
                                                ⬇️ ดาวน์โหลดเอกสารอนุมัติ
                                            </a>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* เอกสาร — approver ดูอย่างเดียวระหว่างรอพิจารณา */}
                            {isApprover && selectedRequest.status === 'pending' && selectedRequest.quotationUrl && (
                                <>
                                    <h3 className="modal-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FolderIcon /> เอกสารประกอบการพิจารณา</h3>
                                    <div className="documents-grid">
                                        {selectedRequest.quotationUrl && (
                                            <a href={selectedRequest.quotationUrl} target="_blank" rel="noopener noreferrer" className="btn btn--ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <DescriptionIcon fontSize="small" /> ดูใบเสนอราคาต้นฉบับ
                                            </a>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer — action buttons */}
                        {getDetailActions(selectedRequest).length > 0 && (
                            <div className="modal-footer">
                                {getDetailActions(selectedRequest)}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ===== Reject Modal (sub-modal) ===== */}
            {showRejectModal && selectedRequest && (
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

            {/* Signature Modal within RequestList */}
            {showSignatureModal && selectedRequest && (
                <SignatureModal
                    isOpen={showSignatureModal}
                    onClose={() => setShowSignatureModal(false)}
                    pdfUrl={selectedRequest.quotationUrl}
                    requestId={selectedRequest.id}
                    onSuccess={async () => {
                        await handleStatusChange('approved');
                        setShowSignatureModal(false);
                        setSelectedRequest(null);
                    }}
                />
            )}

            {/* ===== Create Request Modal ===== */}
            {showModal && (
                <div className="modal-overlay" onClick={closeCreateModal}>
                    <div className="modal modal--lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><AddIcon /> สร้างคำขอซื้อใหม่</h2>
                            <button className="modal-close" onClick={closeCreateModal}><CloseIcon /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {/* ข้อมูลทั่วไป */}
                                <h3 className="modal-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><EditNoteIcon /> ข้อมูลทั่วไป</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">เรื่อง / หัวข้อ <span className="required">*</span></label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="เช่น ขอซื้อคอมพิวเตอร์สำหรับแผนกบัญชี"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">แผนก</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={currentUser?.department || ''}
                                            disabled
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">ผู้ขอ</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={currentUser?.displayName || ''}
                                            disabled
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">รายละเอียดเพิ่มเติม</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="อธิบายเหตุผลในการขอซื้อ"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* รายการอุปกรณ์ */}
                                <div className="modal-section-header">
                                    <h3 className="modal-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ComputerIcon /> รายการอุปกรณ์</h3>
                                    <button type="button" className="btn btn--primary btn--sm" onClick={addItem} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <AddIcon fontSize="small" /> เพิ่มรายการ
                                    </button>
                                </div>
                                {items.map((item, index) => (
                                    <div key={index} className="item-row">
                                        <div className="item-row-number">{index + 1}</div>
                                        <div className="item-row-fields">
                                            <div className="form-group">
                                                <label className="form-label">ชื่ออุปกรณ์ <span className="required">*</span></label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="เช่น โน้ตบุ๊ก Dell Latitude 5540"
                                                    value={item.name}
                                                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">จำนวน</label>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    min={1}
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">หน่วย</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={item.unit}
                                                    onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">ราคาประเมิน (บาท)</label>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    min={0}
                                                    step="0.01"
                                                    value={item.estimatedPrice}
                                                    onChange={(e) => updateItem(index, 'estimatedPrice', parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                        </div>
                                        <div className="item-row-subtotal">
                                            {(item.quantity * item.estimatedPrice).toLocaleString('th-TH')} ฿
                                        </div>
                                        {items.length > 1 && (
                                            <button
                                                type="button"
                                                className="btn btn--danger btn--icon"
                                                onClick={() => removeItem(index)}
                                                title="ลบรายการ"
                                            >
                                                <CloseIcon fontSize="small" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <div className="items-total">
                                    <span>รวมทั้งสิ้น:</span>
                                    <span className="items-total-value">{totalAmount.toLocaleString('th-TH')} บาท</span>
                                </div>

                                {/* ใบเสนอราคา (บังคับ) */}
                                <h3 className="modal-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><DescriptionIcon /> ใบเสนอราคา (Quotation) <span className="required">*</span></h3>
                                <div
                                    className={`file-uploader-dropzone ${quotationFile ? 'file-uploader-dropzone--has-file' : ''}`}
                                    onClick={() => document.getElementById('modal-quotation-input')?.click()}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const file = e.dataTransfer.files?.[0];
                                        if (file && file.type === 'application/pdf') setQuotationFile(file);
                                    }}
                                >
                                    {quotationFile ? (
                                        <div className="file-uploader-selected">
                                            <span className="file-icon"><DescriptionIcon fontSize="small" /></span>
                                            <span>{quotationFile.name}</span>
                                            <button
                                                type="button"
                                                className="btn btn--ghost btn--sm"
                                                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                                                onClick={(e) => { e.stopPropagation(); setQuotationFile(null); }}
                                            >
                                                <CloseIcon fontSize="small" /> ลบ
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="file-uploader-icon"><FolderIcon fontSize="large" /></span>
                                            <span className="file-uploader-text">ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์</span>
                                            <span className="file-uploader-hint">รองรับไฟล์ PDF (จำเป็นต้องแนบ)</span>
                                        </>
                                    )}
                                </div>
                                <input
                                    id="modal-quotation-input"
                                    type="file"
                                    accept=".pdf"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) setQuotationFile(file);
                                    }}
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn--ghost" onClick={closeCreateModal} disabled={submitting}>
                                    ยกเลิก
                                </button>
                                <button type="submit" className="btn btn--primary" disabled={submitting || !quotationFile}>
                                    {submitting ? (
                                        <>
                                            <span className="spinner spinner--sm" />
                                            กำลังส่ง...
                                        </>
                                    ) : (
                                        'ส่งคำขออนุมัติ'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
