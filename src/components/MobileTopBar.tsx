import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';


export default function MobileTopBar() {
    const { currentUser, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();


    return (
        <header className="mobile-topbar">
            <div className="mobile-topbar-left">
                <span className="mobile-logo">🖥️</span>
                <span className="mobile-title">ระบบขออนุมัติซื้อ</span>
            </div>
            <div className="mobile-topbar-right">
                {currentUser && (
                    <div className="mobile-user-menu">
                        <span className="mobile-user-name" style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                            {currentUser.displayName}
                        </span>
                        <button className="btn btn--icon btn--ghost" onClick={logout}>
                            🚪
                        </button>
                    </div>
                )}
                <button className="btn btn--icon btn--ghost" onClick={toggleTheme}>
                    {theme === 'dark' ? '☀️' : '🌙'}
                </button>
            </div>
        </header>
    );
}
