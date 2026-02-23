import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_CONFIG } from '../types'; // Removed AppUser from value import
import type { UserRole, AppUser } from '../types'; // Added AppUser to type import

export default function AdminPage() {
    const { users, currentUser, addUser, updateUser, deleteUser } = useAuth();
    const [showModal, setShowModal] = useState(false); // Renamed from showAddModal
    const [editingUserId, setEditingUserId] = useState<string | null>(null); // Track editing user

    // User form state
    const [formUsername, setFormUsername] = useState('');
    const [formPassword, setFormPassword] = useState('');
    const [formDisplayName, setFormDisplayName] = useState('');
    const [formDepartment, setFormDepartment] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formRole, setFormRole] = useState<UserRole>('user');

    const resetForm = () => {
        setFormUsername('');
        setFormPassword('');
        setFormDisplayName('');
        setFormDepartment('');
        setFormEmail('');
        setFormRole('user');
        setEditingUserId(null);
    };

    const openAddModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (user: AppUser) => {
        setFormUsername(user.username);
        setFormPassword(''); // Don't show existing password
        setFormDisplayName(user.displayName);
        setFormDepartment(user.department || '');
        setFormEmail(user.email || '');
        setFormRole(user.role);
        setEditingUserId(user.id);
        setShowModal(true);
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formUsername.trim() || !formDisplayName.trim() || (!editingUserId && !formPassword.trim())) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        const userData = {
            username: formUsername,
            password: formPassword,
            displayName: formDisplayName,
            department: formDepartment,
            email: formEmail,
            role: formRole,
        };

        if (editingUserId) {
            updateUser(editingUserId, userData);
        } else {
            addUser({
                ...userData,
                active: true,
            });
        }
        setShowModal(false);
        resetForm();
    };

    const handleToggleActive = (id: string, currentActive: boolean) => {
        updateUser(id, { active: !currentActive });
    };

    const handleDelete = (id: string, displayName: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click
        if (confirm(`ต้องการลบผู้ใช้ "${displayName}" หรือไม่?`)) {
            deleteUser(id);
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">🛡️ จัดการผู้ใช้งาน</h1>
                    <p className="page-description">เพิ่ม/ลบผู้ใช้ และจัดการสิทธิ์/บทบาท</p>
                </div>
                <button className="btn btn--primary" onClick={openAddModal}>
                    ➕ เพิ่มผู้ใช้ใหม่
                </button>
            </div>

            {/* Users Table */}
            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>ชื่อผู้ใช้</th>
                                <th>ชื่อแสดง</th>
                                <th>อีเมล</th>
                                <th>แผนก</th>
                                <th>บทบาท</th>
                                <th>สถานะ</th>
                                <th>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr
                                    key={user.id}
                                    className="table-row-hover cursor-pointer"
                                    onClick={() => openEditModal(user)}
                                    title="คลิกเพื่อแก้ไข"
                                >
                                    <td>
                                        <span className="font-mono">{user.username}</span>
                                        {user.id === currentUser?.id && (
                                            <span className="admin-you-badge">คุณ</span>
                                        )}
                                    </td>
                                    <td>{user.displayName}</td>
                                    <td>{user.email || '-'}</td>
                                    <td>{user.department || '-'}</td>
                                    <td onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-2">
                                            <span style={{ color: ROLE_CONFIG[user.role].color }}>
                                                {ROLE_CONFIG[user.role].icon} {ROLE_CONFIG[user.role].label}
                                            </span>
                                        </div>
                                    </td>
                                    <td onClick={(e) => e.stopPropagation()}>
                                        <button
                                            className={`admin-status-btn ${user.active ? 'admin-status-btn--active' : 'admin-status-btn--inactive'}`}
                                            onClick={() => handleToggleActive(user.id, user.active)}
                                            disabled={user.id === currentUser?.id}
                                        >
                                            {user.active ? '✅ เปิดใช้งาน' : '🚫 ระงับ'}
                                        </button>
                                    </td>
                                    <td onClick={(e) => e.stopPropagation()}>
                                        <button
                                            className="btn btn--danger btn--sm"
                                            onClick={(e) => handleDelete(user.id, user.displayName, e)}
                                            disabled={user.id === currentUser?.id}
                                        >
                                            🗑️ ลบ
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit User Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingUserId ? '✏️ แก้ไขข้อมูลผู้ใช้' : '➕ เพิ่มผู้ใช้ใหม่'}
                            </h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSaveUser}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">ชื่อผู้ใช้ <span className="required">*</span></label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="username"
                                            value={formUsername}
                                            onChange={(e) => setFormUsername(e.target.value)}
                                            required
                                            disabled={!!editingUserId} // Cannot change username when editing
                                        />
                                    </div>

                                    {!editingUserId && (
                                        <div className="form-group">
                                            <label className="form-label">รหัสผ่าน <span className="required">*</span></label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="password"
                                                value={formPassword}
                                                onChange={(e) => setFormPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label className="form-label">ชื่อแสดง <span className="required">*</span></label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="ชื่อ-นามสกุล"
                                            value={formDisplayName}
                                            onChange={(e) => setFormDisplayName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">อีเมล</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            placeholder="user@company.com"
                                            value={formEmail}
                                            onChange={(e) => setFormEmail(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">แผนก</label>
                                        <select
                                            className="form-input"
                                            value={formDepartment}
                                            onChange={(e) => setFormDepartment(e.target.value)}
                                        >
                                            <option value="">-- เลือกแผนก --</option>
                                            <option value="IT">IT</option>
                                            <option value="บัญชี">บัญชี</option>
                                            <option value="การเงิน">การเงิน</option>
                                            <option value="บุคคล">บุคคล</option>
                                            <option value="การตลาด">การตลาด</option>
                                            <option value="ฝ่ายขาย">ฝ่ายขาย</option>
                                            <option value="ผลิต">ผลิต</option>
                                            <option value="จัดซื้อ">จัดซื้อ</option>
                                            <option value="อื่นๆ">อื่นๆ</option>
                                        </select>
                                    </div>
                                    <div className="form-group form-group--full">
                                        <label className="form-label">บทบาท <span className="required">*</span></label>
                                        <div className="admin-role-options">
                                            {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                                                <label key={key} className={`admin-role-option ${formRole === key ? 'admin-role-option--selected' : ''}`}>
                                                    <input
                                                        type="radio"
                                                        name="role"
                                                        value={key}
                                                        checked={formRole === key}
                                                        onChange={() => setFormRole(key as UserRole)}
                                                    />
                                                    <span className="admin-role-option-icon">{cfg.icon}</span>
                                                    <span>{cfg.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn--ghost" onClick={() => setShowModal(false)}>ยกเลิก</button>
                                <button type="submit" className="btn btn--primary">
                                    {editingUserId ? '💾 บันทึกการแก้ไข' : '➕ เพิ่มผู้ใช้'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
