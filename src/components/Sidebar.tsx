import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ROLE_CONFIG } from '../types';

export default function Sidebar() {
    const { currentUser, logout, hasRole } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const navItems = [
        { to: '/', label: 'แดชบอร์ด', icon: '📊', roles: ['user', 'approver', 'admin'] },
        { to: '/requests', label: 'รายการทั้งหมด', icon: '📋', roles: ['user', 'approver', 'admin'] },
        { to: '/approvals', label: 'รออนุมัติ', icon: '✅', roles: ['approver', 'admin'] },
        { to: '/export', label: 'ส่งออกข้อมูล', icon: '📥', roles: ['approver', 'admin'] },
        { to: '/admin', label: 'จัดการผู้ใช้', icon: '🛡️', roles: ['admin'] },
    ];

    const roleConfig = currentUser ? ROLE_CONFIG[currentUser.role] : null;

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">🖥️</div>
                <h1 className="sidebar-title">ระบบขออนุมัติซื้อ</h1>
            </div>

            <nav className="sidebar-nav">
                {navItems
                    .filter((item) => item.roles.some((r) => hasRole(r as 'user' | 'approver' | 'admin')))
                    .map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`
                            }
                        >
                            <span className="sidebar-link-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
            </nav>

            <div className="sidebar-bottom">
                {/* Theme Toggle */}
                <button className="sidebar-theme-btn" onClick={toggleTheme}>
                    {theme === 'dark' ? '☀️' : '🌙'} {theme === 'dark' ? 'ธีมสว่าง' : 'ธีมมืด'}
                </button>

                {/* User Info */}
                {currentUser && (
                    <div className="sidebar-user">
                        <div className="sidebar-user-info">
                            <span className="sidebar-user-name">{currentUser.displayName}</span>
                            <span className="sidebar-user-role" style={{ color: roleConfig?.color }}>
                                {roleConfig?.icon} {roleConfig?.label}
                            </span>
                        </div>
                        <button className="sidebar-logout-btn" onClick={logout} title="ออกจากระบบ">
                            🚪
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
