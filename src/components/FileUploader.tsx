import { useState, useRef } from 'react';
import LockIcon from '@mui/icons-material/Lock';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface FileUploaderProps {
    label: string;
    accept?: string;
    currentFileName?: string;
    currentFileUrl?: string;
    onUpload: (file: File) => Promise<void>;
    disabled?: boolean;
    /** When true, the file is already uploaded and cannot be changed or removed */
    locked?: boolean;
}

export default function FileUploader({
    label,
    accept = '.pdf',
    currentFileName,
    currentFileUrl,
    onUpload,
    disabled = false,
    locked = false,
}: FileUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        if (locked) return;
        setUploading(true);
        try {
            await onUpload(file);
        } catch (err) {
            console.error('Upload error:', err);
            alert('อัปโหลดไฟล์ล้มเหลว');
        } finally {
            setUploading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (locked) return;
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    // If file is already uploaded and locked — show read-only view
    if (locked && currentFileName && currentFileUrl) {
        return (
            <div className="file-uploader">
                <label className="file-uploader-label">{label}</label>
                <div className="file-uploader-current file-uploader-current--locked">
                    <span className="file-icon"><LockIcon fontSize="small" /></span>
                    <a href={currentFileUrl} target="_blank" rel="noopener noreferrer">
                        {currentFileName}
                    </a>
                    <span className="file-locked-badge">อัปโหลดแล้ว</span>
                </div>
            </div>
        );
    }

    return (
        <div className="file-uploader">
            <label className="file-uploader-label">{label}</label>

            {currentFileName && currentFileUrl && (
                <div className="file-uploader-current">
                    <span className="file-icon"><InsertDriveFileIcon fontSize="small" /></span>
                    <a href={currentFileUrl} target="_blank" rel="noopener noreferrer">
                        {currentFileName}
                    </a>
                </div>
            )}

            <div
                className={`file-uploader-dropzone ${dragOver ? 'file-uploader-dropzone--active' : ''} ${disabled ? 'file-uploader-dropzone--disabled' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !disabled && fileInputRef.current?.click()}
            >
                {uploading ? (
                    <div className="file-uploader-loading">
                        <div className="spinner" />
                        <span>กำลังอัปโหลด...</span>
                    </div>
                ) : (
                    <>
                        <span className="file-uploader-icon"><CloudUploadIcon fontSize="large" /></span>
                        <span className="file-uploader-text">
                            ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
                        </span>
                        <span className="file-uploader-hint">รองรับไฟล์ PDF</span>
                    </>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleChange}
                style={{ display: 'none' }}
                disabled={disabled || locked}
            />
        </div>
    );
}
