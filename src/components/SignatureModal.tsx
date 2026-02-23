import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { PDFDocument } from 'pdf-lib';
import { uploadFile } from '../services/supabaseData';

interface SignatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    pdfUrl?: string;
    requestId: string;
}

export default function SignatureModal({ isOpen, onClose, onSuccess, pdfUrl, requestId }: SignatureModalProps) {
    const sigCanvas = useRef<SignatureCanvas>(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const clearSignature = () => {
        sigCanvas.current?.clear();
    };

    const handleConfirm = async () => {
        if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
            alert('กรุณาเซ็นชื่อก่อนยืนยัน');
            return;
        }

        setLoading(true);
        try {
            // 1. Get the signature image
            const signatureDataUrl = sigCanvas.current.toDataURL('image/png');
            let finalFile: File | null = null;

            if (pdfUrl) {
                // 2. Fetch the existing PDF
                const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());

                // 3. Load PDF and image with pdf-lib
                const pdfDoc = await PDFDocument.load(existingPdfBytes);
                const pngImage = await pdfDoc.embedPng(signatureDataUrl);

                // Get the last page to stamp the signature on (or we can stamp on first page)
                const pages = pdfDoc.getPages();
                const targetPage = pages[pages.length - 1];
                const { width } = targetPage.getSize();

                // Dimensions for the signature
                const sigWidth = 150;
                const sigHeight = (pngImage.height / pngImage.width) * sigWidth;

                // Draw signature on the bottom right (adjust coordinates as needed)
                targetPage.drawImage(pngImage, {
                    x: width - sigWidth - 50,
                    y: 50,
                    width: sigWidth,
                    height: sigHeight,
                });

                // 4. Save the modified PDF
                const pdfBytes = await pdfDoc.save();
                const blob = new Blob([pdfBytes.buffer as BlobPart], { type: 'application/pdf' });
                // We fake a file object to match the uploadFile signature
                finalFile = new File([blob], `signed_quotation.pdf`, { type: 'application/pdf' });
            } else {
                // If there's no original PDF (shouldn't happen normally in this flow), just convert the image to PDF
                const pdfDoc = await PDFDocument.create();
                const page = pdfDoc.addPage();
                const pngImage = await pdfDoc.embedPng(signatureDataUrl);

                const sigWidth = 300;
                const sigHeight = (pngImage.height / pngImage.width) * sigWidth;

                page.drawImage(pngImage, {
                    x: 50,
                    y: page.getHeight() - sigHeight - 50,
                    width: sigWidth,
                    height: sigHeight,
                });

                const pdfBytes = await pdfDoc.save();
                const blob = new Blob([pdfBytes.buffer as BlobPart], { type: 'application/pdf' });
                finalFile = new File([blob], `signed_document.pdf`, { type: 'application/pdf' });
            }

            // 5. Upload the signed PDF
            await uploadFile(finalFile, requestId, 'signed_quotation');
            onSuccess();
        } catch (error) {
            console.error('Error signing PDF:', error);
            alert('เกิดข้อผิดพลาดในการประมวลผลไฟล์ หรือสิทธิ์การเข้าถึงไฟล์ถูกบล็อก');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: '500px' }}>
                <div className="modal-header">
                    <h3>✍️ เซ็นชื่ออนุมัติ</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <p style={{ marginBottom: '10px' }}>
                        กรุณาเซ็นชื่อในกรอบด้านล่าง ลายเซ็นนี้จะถูกประทับลงในเอกสารใบเสนอราคา (หน้าสุดท้าย) อัตโนมัติ
                    </p>
                    <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
                        <SignatureCanvas
                            ref={sigCanvas}
                            penColor="blue"
                            canvasProps={{
                                width: 460,
                                height: 200,
                                className: 'sigCanvas'
                            }}
                        />
                    </div>
                    <div style={{ textAlign: 'right', marginTop: '10px' }}>
                        <button className="btn btn--ghost btn--sm" onClick={clearSignature}>
                            ลบลายเซ็น
                        </button>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn--ghost" onClick={onClose} disabled={loading}>
                        ยกเลิก
                    </button>
                    <button
                        className="btn btn--success"
                        onClick={handleConfirm}
                        disabled={loading}
                    >
                        {loading ? <span className="spinner spinner--sm" /> : '✅'} ยืนยันและเซ็นอนุมัติ
                    </button>
                </div>
            </div>
        </div>
    );
}
