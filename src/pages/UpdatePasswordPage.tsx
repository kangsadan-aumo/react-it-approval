import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

export default function UpdatePasswordPage() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Check if user has a valid session from the email link
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                // If they come here without a recovery session, redirect away.
                // We'll trust Supabase's implicit grant flow has filled the session if valid.
                navigate('/login');
            }
        });
    }, [navigate]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('รหัสผ่านไม่ตรงกัน');
            return;
        }
        if (password.length < 6) {
            setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
            return;
        }

        setLoading(true);
        setError('');

        const { error: updateError } = await supabase.auth.updateUser({
            password: password
        });

        if (updateError) {
            setError(updateError.message);
            setLoading(false);
        } else {
            alert('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว กรุณาเข้าสู่ระบบใหม่');
            await supabase.auth.signOut();
            navigate('/login');
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <h1 className="login-title">ตั้งรหัสผ่านใหม่</h1>
                </div>
                <form onSubmit={handleUpdate} className="login-form">
                    {error && (
                        <div className="login-error">
                            ⚠️ {error}
                        </div>
                    )}
                    <div className="form-group">
                        <label className="form-label">รหัสผ่านใหม่</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">ยืนยันรหัสผ่านใหม่</label>
                        <input
                            type="password"
                            className="form-input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn--primary btn--lg login-btn" disabled={loading}>
                        {loading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่าน'}
                    </button>
                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <button type="button" className="btn btn--ghost" onClick={() => navigate('/login')}>
                            กลับไปหน้าเข้าสู่ระบบ
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
