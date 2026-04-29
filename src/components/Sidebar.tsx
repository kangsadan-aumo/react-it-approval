import { NavLink } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ComputerIcon from '@mui/icons-material/Computer';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LogoutIcon from '@mui/icons-material/Logout';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ROLE_CONFIG } from '../types';

export default function Sidebar() {
    const { currentUser, logout, hasRole } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const navItems = [
        { to: '/', label: 'แดชบอร์ด', icon: <DashboardIcon fontSize="small" />, roles: ['user', 'approver', 'admin'] },
        { to: '/requests', label: 'รายการทั้งหมด', icon: <AssignmentIcon fontSize="small" />, roles: ['user', 'approver', 'admin'] },
        { to: '/approvals', label: 'รออนุมัติ', icon: <CheckCircleIcon fontSize="small" />, roles: ['approver', 'admin'] },
        { to: '/export', label: 'ส่งออกข้อมูล', icon: <DownloadIcon fontSize="small" />, roles: ['approver', 'admin'] },
        { to: '/admin', label: 'จัดการผู้ใช้', icon: <AdminPanelSettingsIcon fontSize="small" />, roles: ['admin'] },
    ];

    const roleConfig = currentUser ? ROLE_CONFIG[currentUser.role] : null;

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo"><ComputerIcon fontSize="large" /></div>
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
                    {theme === 'dark' ? <LightModeIcon fontSize="small" style={{ marginRight: 8 }} /> : <DarkModeIcon fontSize="small" style={{ marginRight: 8 }} />}
                    {theme === 'dark' ? 'ธีมสว่าง' : 'ธีมมืด'}
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
                            <LogoutIcon />
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
