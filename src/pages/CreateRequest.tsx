import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { RequestItem } from '../types';
import { createRequest, uploadFile } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

const emptyItem: RequestItem = { name: '', quantity: 1, estimatedPrice: 0, unit: 'ชิ้น' };

export default function CreateRequest() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [items, setItems] = useState<RequestItem[]>([{ ...emptyItem }]);
    const [quotationFile, setQuotationFile] = useState<File | null>(null);

    const updateItem = (index: number, field: keyof RequestItem, value: string | number) => {
        setItems((prev) =>
            prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
        );
    };

    const addItem = () => setItems((prev) => [...prev, { ...emptyItem }]);

    const removeItem = (index: number) => {
        if (items.length <= 1) return;
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.estimatedPrice, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            alert('กรุณากรอกหัวข้อ');
            return;
        }

        if (items.some((item) => !item.name.trim())) {
            alert('กรุณาระบุชื่ออุปกรณ์ทุกรายการ');
            return;
        }

        if (!quotationFile) {
            alert('กรุณาอัปโหลดใบเสนอราคาก่อนส่งคำขอ');
            return;
        }

        setSubmitting(true);
        try {
            const id = await createRequest({
                title,
                description,
                department: currentUser?.department || '',
                requesterName: currentUser?.displayName || '',
                createdBy: currentUser?.id,
                items,
            });

            if (quotationFile) {
                await uploadFile(quotationFile, id, 'quotation');
            }

            navigate(`/requests/${id}`);
        } catch (err) {
            console.error(err);
            alert('เกิดข้อผิดพลาดในการสร้างคำขอ');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">➕ สร้างคำขอซื้อ</h1>
                <p className="page-description">กรอกรายละเอียดอุปกรณ์ IT ที่ต้องการจัดซื้อ</p>
            </div>

            <form onSubmit={handleSubmit} className="form-container">
                {/* ข้อมูลทั่วไป */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">📝 ข้อมูลทั่วไป</h2>
                    </div>
                    <div className="card-body">
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

                            <div className="form-group form-group--full">
                                <label className="form-label">รายละเอียดเพิ่มเติม</label>
                                <textarea
                                    className="form-input form-textarea"
                                    placeholder="อธิบายเหตุผลในการขอซื้อ"
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* รายการอุปกรณ์ */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">🖥️ รายการอุปกรณ์</h2>
                        <button type="button" className="btn btn--primary btn--sm" onClick={addItem}>
                            + เพิ่มรายการ
                        </button>
                    </div>
                    <div className="card-body">
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
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                        <div className="items-total">
                            <span>รวมทั้งสิ้น:</span>
                            <span className="items-total-value">{totalAmount.toLocaleString('th-TH')} บาท</span>
                        </div>
                    </div>
                </div>

                {/* ใบเสนอราคา */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">📄 ใบเสนอราคา (Quotation)</h2>
                    </div>
                    <div className="card-body">
                        <div
                            className={`file-uploader-dropzone ${quotationFile ? 'file-uploader-dropzone--has-file' : ''}`}
                            onClick={() => document.getElementById('quotation-input')?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const file = e.dataTransfer.files?.[0];
                                if (file && file.type === 'application/pdf') setQuotationFile(file);
                            }}
                        >
                            {quotationFile ? (
                                <div className="file-uploader-selected">
                                    <span className="file-icon">📄</span>
                                    <span>{quotationFile.name}</span>
                                    <button
                                        type="button"
                                        className="btn btn--ghost btn--sm"
                                        onClick={(e) => { e.stopPropagation(); setQuotationFile(null); }}
                                    >
                                        ✕ ลบ
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <span className="file-uploader-icon">📁</span>
                                    <span className="file-uploader-text">ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์</span>
                                    <span className="file-uploader-hint">รองรับไฟล์ PDF</span>
                                </>
                            )}
                        </div>
                        <input
                            id="quotation-input"
                            type="file"
                            accept=".pdf"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setQuotationFile(file);
                            }}
                        />
                    </div>
                </div>

                {/* Submit */}
                <div className="form-actions">
                    <button type="button" className="btn btn--ghost" onClick={() => navigate(-1)}>
                        ← ย้อนกลับ
                    </button>
                    <button type="submit" className="btn btn--primary btn--lg" disabled={submitting}>
                        {submitting ? (
                            <>
                                <span className="spinner spinner--sm" />
                                กำลังส่ง...
                            </>
                        ) : (
                            '📨 ส่งคำขอซื้อ'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
