
import { useState, useEffect } from 'react';
import type { PurchaseRequest } from '../types';
import { getRequests, getRequestById, createRequest, updateRequestStatus, uploadFile } from '../services/supabaseData';

export function useRequests(userId?: string, role?: string) {
    const [requests, setRequests] = useState<PurchaseRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const data = await getRequests(userId, role);
            setRequests(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();

        // Polling every 10 seconds mapping real-time updates broadly.
        // For a full realtime experience, we'd use supabase.channel('table-db-changes').on().subscribe()
        const interval = setInterval(() => {
            fetchRequests();
        }, 10000);

        return () => clearInterval(interval);
    }, [userId, role]);

    return { requests, loading, error, createRequest, updateRequestStatus, uploadFile, refetch: fetchRequests };
}

export function useRequest(id: string | undefined, userId?: string, role?: string) {
    const [request, setRequest] = useState<PurchaseRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        getRequestById(id, userId, role)
            .then((data) => {
                setRequest(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [id, userId, role]);

    const refetch = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await getRequestById(id, userId, role);
            setRequest(data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return { request, loading, error, refetch };
}
