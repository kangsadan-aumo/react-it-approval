import { useState, useMemo } from 'react';
import { useRequests } from '../hooks/useRequests';
import { STATUS_CONFIG } from '../types';
import type { PurchaseRequest } from '../types';
import { useAuth } from '../contexts/AuthContext';

type FilterMode = 'month' | 'year' | 'range';

const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

function formatDate(date: Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function filterRequests(
    requests: PurchaseRequest[],
    mode: FilterMode,
    selectedMonth: number,
    selectedYear: number,
    rangeFrom: string,
    rangeTo: string
): PurchaseRequest[] {
    return requests.filter((r) => {
        const d = new Date(r.createdAt);
        if (mode === 'month') {
            return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        }
        if (mode === 'year') {
            return d.getFullYear() === selectedYear;
        }
        if (mode === 'range') {
            if (!rangeFrom || !rangeTo) return true;
            const from = new Date(rangeFrom + '-01');
            const toDate = new Date(rangeTo + '-01');
            toDate.setMonth(toDate.getMonth() + 1);
            toDate.setDate(0); // last day of "to" month
            return d >= from && d <= toDate;
        }
        return true;
    });
}

function generateExcel(data: PurchaseRequest[], filename: string) {
    // สร้าง CSV ที่เปิดใน Excel ได้ (รองรับภาษาไทยด้วย UTF-8 BOM)
    const BOM = '\uFEFF';
    const headers = [
        'เลขที่คำขอ',
        'เรื่อง',
        'แผนก',
        'ผู้ขอ',
        'จำนวนรายการ',
        'มูลค่ารวม (บาท)',
        'สถานะ',
        'วันที่สร้าง',
        'วันที่อนุมัติ/เสร็จสิ้น',
        'หมายเหตุ',
    ];

    // สร้างแถวรายละเอียดอุปกรณ์ด้วย
    const detailHeaders = [
        '',
        'ชื่ออุปกรณ์',
        'จำนวน',
        'หน่วย',
        'ราคาต่อหน่วย (บาท)',
        'รวม (บาท)',
    ];

    let csvContent = BOM;
    // Header
    csvContent += headers.map((h) => `"${h}"`).join(',') + '\n';

    data.forEach((r) => {
        // Main row
        const row = [
            r.requestNumber,
            r.title,
            r.department,
            r.requesterName,
            r.items.length.toString(),
            r.totalAmount.toFixed(2),
            STATUS_CONFIG[r.status]?.label || r.status,
            formatDate(r.createdAt),
            r.approvedAt ? formatDate(r.approvedAt) : '-',
            r.rejectionReason || '-',
        ];
        csvContent += row.map((c) => `"${c}"`).join(',') + '\n';

        // Item detail rows
        if (r.items.length > 0) {
            csvContent += detailHeaders.map((h) => `"${h}"`).join(',') + '\n';
            r.items.forEach((item) => {
                csvContent += [
                    '',
                    `"${item.name}"`,
                    item.quantity,
                    `"${item.unit}"`,
                    item.estimatedPrice.toFixed(2),
                    (item.quantity * item.estimatedPrice).toFixed(2),
                ].join(',') + '\n';
            });
        }
    });

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename + '.csv';
    a.click();
    URL.revokeObjectURL(url);
}

export default function ExportPage() {
    const { currentUser } = useAuth();
    const { requests, loading } = useRequests(currentUser?.id, currentUser?.role);
    const now = new Date();
    const [filterMode, setFilterMode] = useState<FilterMode>('month');
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [rangeFrom, setRangeFrom] = useState('');
    const [rangeTo, setRangeTo] = useState('');

    const years = useMemo(() => {
        const set = new Set<number>();
        requests.forEach((r) => set.add(new Date(r.createdAt).getFullYear()));
        if (set.size === 0) set.add(now.getFullYear());
        return Array.from(set).sort((a, b) => b - a);
    }, [requests]);

    const filtered = useMemo(
        () => filterRequests(requests, filterMode, selectedMonth, selectedYear, rangeFrom, rangeTo),
        [requests, filterMode, selectedMonth, selectedYear, rangeFrom, rangeTo]
    );

    const summary = useMemo(() => {
        const total = filtered.length;
        const totalAmount = filtered.reduce((s, r) => s + r.totalAmount, 0);
        const byStatus: Record<string, number> = {};
        filtered.forEach((r) => {
            byStatus[r.status] = (byStatus[r.status] || 0) + 1;
        });
        return { total, totalAmount, byStatus };
    }, [filtered]);

    const getFilterLabel = (): string => {
        if (filterMode === 'month') return `${THAI_MONTHS[selectedMonth]} ${selectedYear + 543}`;
        if (filterMode === 'year') return `ปี ${selectedYear + 543}`;
        if (filterMode === 'range' && rangeFrom && rangeTo) return `${rangeFrom} ถึง ${rangeTo}`;
        return 'ทั้งหมด';
    };

    const handleExport = () => {
        if (filtered.length === 0) {
            alert('ไม่มีข้อมูลในช่วงที่เลือก');
            return;
        }
        const label = getFilterLabel().replace(/\s/g, '_');
        generateExcel(filtered, `รายการขอซื้อ_${label}`);
    };

    if (loading) {
        return (
            <div className="page">
                <div className="loading-container">
                    <div className="spinner" />
                    <p>กำลังโหลดข้อมูล...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">📥 ส่งออกข้อมูล (Export)</h1>
                <p className="page-description">เลือกช่วงเวลาและส่งออกรายการขอซื้อเป็นไฟล์ Excel (.csv)</p>
            </div>

            {/* Filter Mode */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">📅 เลือกช่วงเวลา</h2>
                </div>
                <div className="card-body">
                    <div className="export-mode-tabs">
                        <button
                            className={`export-tab ${filterMode === 'month' ? 'export-tab--active' : ''}`}
                            onClick={() => setFilterMode('month')}
                        >
                            📅 เลือกเดือน
                        </button>
                        <button
                            className={`export-tab ${filterMode === 'year' ? 'export-tab--active' : ''}`}
                            onClick={() => setFilterMode('year')}
                        >
                            📆 เลือกปี
                        </button>
                        <button
                            className={`export-tab ${filterMode === 'range' ? 'export-tab--active' : ''}`}
                            onClick={() => setFilterMode('range')}
                        >
                            🗓️ ช่วงเดือน
                        </button>
                    </div>

                    <div className="export-filters">
                        {filterMode === 'month' && (
                            <div className="export-filter-row">
                                <div className="form-group">
                                    <label className="form-label">เดือน</label>
                                    <select
                                        className="form-input"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    >
                                        {THAI_MONTHS.map((m, i) => (
                                            <option key={i} value={i}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">ปี</label>
                                    <select
                                        className="form-input"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    >
                                        {years.map((y) => (
                                            <option key={y} value={y}>{y + 543}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {filterMode === 'year' && (
                            <div className="export-filter-row">
                                <div className="form-group">
                                    <label className="form-label">ปี</label>
                                    <select
                                        className="form-input"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    >
                                        {years.map((y) => (
                                            <option key={y} value={y}>{y + 543}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {filterMode === 'range' && (
                            <div className="export-filter-row">
                                <div className="form-group">
                                    <label className="form-label">จากเดือน</label>
                                    <input
                                        type="month"
                                        className="form-input"
                                        value={rangeFrom}
                                        onChange={(e) => setRangeFrom(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">ถึงเดือน</label>
                                    <input
                                        type="month"
                                        className="form-input"
                                        value={rangeTo}
                                        onChange={(e) => setRangeTo(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">📊 สรุปข้อมูลที่จะส่งออก</h2>
                    <span className="export-period-label">{getFilterLabel()}</span>
                </div>
                <div className="card-body">
                    <div className="export-summary-grid">
                        <div className="export-summary-item">
                            <span className="export-summary-value">{summary.total}</span>
                            <span className="export-summary-label">รายการทั้งหมด</span>
                        </div>
                        <div className="export-summary-item">
                            <span className="export-summary-value">{summary.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
                            <span className="export-summary-label">มูลค่ารวม</span>
                        </div>
                        {Object.entries(summary.byStatus).map(([status, count]) => (
                            <div key={status} className="export-summary-item">
                                <span className="export-summary-value">{count}</span>
                                <span className="export-summary-label">{STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label || status}</span>
                            </div>
                        ))}
                    </div>

                    {/* Preview Table */}
                    {filtered.length > 0 && (
                        <div className="table-container" style={{ marginTop: '1.5rem' }}>
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
                                    {filtered.slice(0, 10).map((r) => (
                                        <tr key={r.id}>
                                            <td>{r.requestNumber}</td>
                                            <td>{r.title}</td>
                                            <td>{r.department}</td>
                                            <td>{r.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</td>
                                            <td>
                                                <span
                                                    className="status-badge"
                                                    style={{
                                                        color: STATUS_CONFIG[r.status]?.color,
                                                        backgroundColor: STATUS_CONFIG[r.status]?.bgColor,
                                                    }}
                                                >
                                                    {STATUS_CONFIG[r.status]?.icon} {STATUS_CONFIG[r.status]?.label}
                                                </span>
                                            </td>
                                            <td>{formatDate(r.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filtered.length > 10 && (
                                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '0.75rem' }}>
                                    แสดง 10 จาก {filtered.length} รายการ
                                </p>
                            )}
                        </div>
                    )}

                    {filtered.length === 0 && (
                        <div className="empty-state" style={{ marginTop: '1.5rem' }}>
                            <span className="empty-state-icon">📭</span>
                            <p>ไม่มีข้อมูลในช่วงเวลาที่เลือก</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Export Button */}
            <div className="form-actions">
                <button
                    className="btn btn--primary btn--lg"
                    onClick={handleExport}
                    disabled={filtered.length === 0}
                >
                    📥 ส่งออก Excel ({filtered.length} รายการ)
                </button>
            </div>
        </div>
    );
}
