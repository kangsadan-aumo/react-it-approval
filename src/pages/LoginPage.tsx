import { useState } from 'react';
import ComputerIcon from '@mui/icons-material/Computer';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
    const { login, resetPassword } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
            return;
        }
        setLoading(true);
        setError('');
        await new Promise((r) => setTimeout(r, 400));
        const err = await login(username, password);
        if (err) {
            setError(err);
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!username.trim()) {
            setError('กรุณากรอกอีเมลที่ใช้สมัคร');
            return;
        }

        setLoading(true);
        const err = await resetPassword(username);
        setLoading(false);

        if (err) {
            setError(err);
        } else {
            setSuccessMessage('ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยังอีเมลของคุณเรียบร้อยแล้ว โปรดตรวจสอบกล่องข้อความของคุณ');
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <span className="login-logo"><ComputerIcon fontSize="large" /></span>
                    <h1 className="login-title">ระบบขออนุมัติซื้อ</h1>
                </div>

                {isForgotPassword ? (
                    <form onSubmit={handleResetPassword} className="login-form">
                        {error && (
                            <div className="login-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <WarningIcon fontSize="small" /> {error}
                            </div>
                        )}
                        {successMessage && (
                            <div style={{ padding: '0.75rem', backgroundColor: '#dcfce3', color: '#166534', borderRadius: '4px', marginBottom: '1rem', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircleOutlineIcon fontSize="small" /> {successMessage}
                            </div>
                        )}
                        <div className="form-group">
                            <label className="form-label">อีเมล หรือ ชื่อผู้ใช้</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="อีเมลของคุณ"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <button type="submit" className="btn btn--primary btn--lg login-btn" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner spinner--sm" />
                                    กำลังดำเนินการ...
                                </>
                            ) : (
                                'ส่งลิงก์รีเซ็ตรหัสผ่าน'
                            )}
                        </button>
                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            <button type="button" className="btn btn--ghost" onClick={() => { setIsForgotPassword(false); setError(''); setSuccessMessage(''); }}>
                                กลับไปหน้าเข้าสู่ระบบ
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleSubmit} className="login-form">
                        {error && (
                            <div className="login-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <WarningIcon fontSize="small" /> {error}
                            </div>
                        )}
                        <div className="form-group">
                            <label className="form-label">ชื่อผู้ใช้</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: '4px' }}>
                            <label className="form-label">รหัสผ่าน</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
                            <a href="#" className="forgot-password-link" onClick={(e) => { e.preventDefault(); setIsForgotPassword(true); setError(''); }}>
                                Forget Password
                            </a>
                        </div>
                        <button type="submit" className="btn btn--primary btn--lg login-btn" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner spinner--sm" />
                                    กำลังเข้าสู่ระบบ...
                                </>
                            ) : (
                                'Log in'
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
