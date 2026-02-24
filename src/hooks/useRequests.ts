
import { useState, useEffect } from 'react';
import type { PurchaseRequest } from '../types';
import { getRequests, getRequestById, createRequest, updateRequestStatus, uploadFile } from '../services/supabaseData';

export function useRequests(userId?: string, role?: string) {
    const [requests, setRequests] = useState<PurchaseRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRequests = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const data = await getRequests(userId, role);
            setRequests(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests(false);

        // Polling every 10 seconds for updates without triggering the global loading state
        const interval = setInterval(() => {
            fetchRequests(true);
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
