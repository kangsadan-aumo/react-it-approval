import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AppUser, UserRole } from '../types';

const USERS_KEY = 'it_users';
const CURRENT_USER_KEY = 'it_current_user';

// Default admin user
const DEFAULT_USERS: AppUser[] = [
    {
        id: 'admin_001',
        username: 'admin',
        password: 'admin123',
        displayName: 'ผู้ดูแลระบบ',
        department: 'IT',
        email: 'admin@company.com', // 📧 แก้ไขอีเมลของผู้ดูแลระบบที่นี่
        role: 'admin',
        active: true,
        createdAt: new Date().toISOString(),
    },
    {
        id: 'approver_001',
        username: 'manager',
        password: 'manager123',
        displayName: 'หัวหน้าแผนก IT',
        department: 'IT',
        email: 'manager@company.com', // 📧 แก้ไขอีเมลของหัวหน้า/ผู้อนุมัติที่นี่
        role: 'approver',
        active: true,
        createdAt: new Date().toISOString(),
    },
    {
        id: 'user_001',
        username: 'user',
        password: 'user123',
        displayName: 'พนักงานทั่วไป',
        department: 'IT',
        email: 'user@company.com', // 📧 แก้ไขอีเมลของพนักงานที่นี่
        role: 'user',
        active: true,
        createdAt: new Date().toISOString(),
    },
];

interface AuthContextType {
    currentUser: AppUser | null;
    users: AppUser[];
    login: (username: string, password: string) => string | null; // returns error or null
    logout: () => void;
    addUser: (user: Omit<AppUser, 'id' | 'createdAt'>) => void;
    updateUser: (id: string, data: Partial<AppUser>) => void;
    deleteUser: (id: string) => void;
    hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getStoredUsers(): AppUser[] {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
        localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
    }
    try {
        return JSON.parse(raw);
    } catch {
        return DEFAULT_USERS;
    }
}

function getStoredCurrentUser(): AppUser | null {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [users, setUsers] = useState<AppUser[]>(getStoredUsers);
    const [currentUser, setCurrentUser] = useState<AppUser | null>(getStoredCurrentUser);

    useEffect(() => {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }, [users]);

    useEffect(() => {
        if (currentUser) {
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
        } else {
            localStorage.removeItem(CURRENT_USER_KEY);
        }
    }, [currentUser]);

    const login = (username: string, password: string): string | null => {
        const user = users.find((u) => u.username === username && u.password === password);
        if (!user) return 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
        if (!user.active) return 'บัญชีนี้ถูกระงับการใช้งาน';
        setCurrentUser(user);
        return null;
    };

    const logout = () => {
        setCurrentUser(null);
    };

    const addUser = (userData: Omit<AppUser, 'id' | 'createdAt'>) => {
        const exists = users.find((u) => u.username === userData.username);
        if (exists) {
            alert('ชื่อผู้ใช้นี้มีอยู่แล้ว');
            return;
        }
        const newUser: AppUser = {
            ...userData,
            email: (userData as any).email || `${userData.username}@company.com`, // Fallback email
            id: 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            createdAt: new Date().toISOString(),
        };
        setUsers((prev) => [...prev, newUser]);
    };

    const updateUser = (id: string, data: Partial<AppUser>) => {
        setUsers((prev) =>
            prev.map((u) => (u.id === id ? { ...u, ...data } : u))
        );
        // Update currentUser if editing self
        if (currentUser?.id === id) {
            setCurrentUser((prev) => prev ? { ...prev, ...data } : prev);
        }
    };

    const deleteUser = (id: string) => {
        if (id === currentUser?.id) {
            alert('ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่');
            return;
        }
        setUsers((prev) => prev.filter((u) => u.id !== id));
    };

    const hasRole = (...roles: UserRole[]): boolean => {
        if (!currentUser) return false;
        return roles.includes(currentUser.role);
    };

    return (
        <AuthContext.Provider value={{ currentUser, users, login, logout, addUser, updateUser, deleteUser, hasRole }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
