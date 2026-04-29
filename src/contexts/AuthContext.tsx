import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AppUser, UserRole } from '../types';
import { supabase } from '../services/supabase';

interface AuthContextType {
    currentUser: AppUser | null;
    users: AppUser[];
    loading: boolean;
    login: (username: string, password: string) => Promise<string | null>;
    logout: () => Promise<void>;
    addUser: (user: Omit<AppUser, 'id' | 'createdAt'>) => Promise<void>;
    updateUser: (id: string, data: Partial<AppUser>) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
    resetPassword: (email: string) => Promise<string | null>;
    hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: true });
        if (error) {
            console.error('Error fetching users:', error);
            return;
        }

        const mappedUsers: AppUser[] = data.map(u => ({
            id: u.id,
            username: u.email.split('@')[0],
            password: '***', // We don't store plain passwords
            displayName: u.display_name || u.email,
            department: u.department,
            email: u.email,
            role: u.role as UserRole,
            active: true,
            createdAt: u.created_at
        }));
        setUsers(mappedUsers);
    };

    const fetchCurrentUser = async (userId: string) => {
        const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
        if (error || !data) {
            setCurrentUser(null);
            return;
        }

        setCurrentUser({
            id: data.id,
            username: data.email.split('@')[0],
            password: '***',
            displayName: data.display_name || data.email,
            department: data.department,
            email: data.email,
            role: data.role as UserRole,
            active: true,
            createdAt: data.created_at
        });
    };

    useEffect(() => {
        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                fetchCurrentUser(session.user.id);
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                fetchCurrentUser(session.user.id);
            } else {
                setCurrentUser(null);
            }
        });

        // Fetch all users for Admin panel
        fetchUsers();

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email: string, password: string): Promise<string | null> => {
        // To keep backwards compatibility with the UI expecting username, we can try appending the domain
        const actualEmail = email.includes('@') ? email : `${email}@company.com`;

        const { error } = await supabase.auth.signInWithPassword({
            email: actualEmail,
            password,
        });

        if (error) {
            return error.message;
        }
        return null;
    };

    const logout = async () => {
        await supabase.auth.signOut();
    };

    const addUser = async (_userData: Omit<AppUser, 'id' | 'createdAt'>) => {
        alert('ในระบบ Supabase การสร้างผู้ใช้ใหม่ต้องทำผ่านหน้า Sign Up หรือหน้า Dashboard แทนครับ');
    };

    const updateUser = async (id: string, data: Partial<AppUser>) => {
        const updatePayload: any = {};
        if (data.displayName) updatePayload.display_name = data.displayName;
        if (data.department) updatePayload.department = data.department;
        if (data.role) updatePayload.role = data.role;

        const { error } = await supabase.from('users').update(updatePayload).eq('id', id);
        if (error) {
            alert('Error updating user: ' + error.message);
            return;
        }

        // Refresh lists
        fetchUsers();
        if (currentUser?.id === id) {
            fetchCurrentUser(id);
        }
    };

    const deleteUser = async (id: string) => {
        if (id === currentUser?.id) {
            alert('ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่');
            return;
        }

        // You cannot delete users directly from client side without Admin privileges.
        // Needs Supabase Edge Function to delete from auth.users.
        alert('การลบผู้ใช้ต้องรันผ่าน Supabase Edge Functions / Admin API. ปัจจุบันจะทำได้แค่ลบออกจากตาราง users');
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (error) {
            alert('Error deleting user: ' + error.message);
        } else {
            fetchUsers();
        }
    };

    const resetPassword = async (email: string): Promise<string | null> => {
        const actualEmail = email.includes('@') ? email : `${email}@company.com`;
        const { error } = await supabase.auth.resetPasswordForEmail(actualEmail, {
            redirectTo: window.location.origin + '/update-password',
        });
        if (error) {
            return error.message;
        }
        return null;
    };

    const hasRole = (...roles: UserRole[]): boolean => {
        if (!currentUser) return false;
        return roles.includes(currentUser.role);
    };

    return (
        <AuthContext.Provider value={{ currentUser, users, loading, login, logout, addUser, updateUser, deleteUser, resetPassword, hasRole }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
