import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
            return;
        }
        setLoading(true);
        setError('');
        await new Promise((r) => setTimeout(r, 400));
        const err = login(username, password);
        if (err) {
            setError(err);
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <span className="login-logo">🖥️</span>
                    <h1 className="login-title">ระบบขออนุมัติซื้อ</h1>
                </div>
                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="login-error">
                            ⚠️ {error}
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
                    <div className="form-group">
                        <label className="form-label">รหัสผ่าน</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn--primary btn--lg login-btn" disabled={loading}>
                        {loading ? (
                            <>
                                <span className="spinner spinner--sm" />
                                กำลังเข้าสู่ระบบ...
                            </>
                        ) : (
                            '🔓 เข้าสู่ระบบ'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
