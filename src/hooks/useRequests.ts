
import { useState, useEffect } from 'react';
import type { PurchaseRequest } from '../types';
import { subscribeToRequests, getRequestById, createRequest, updateRequestStatus, uploadFile } from '../services/firebase';

export function useRequests(userId?: string, role?: string) {
    const [requests, setRequests] = useState<PurchaseRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = subscribeToRequests((data) => {
            setRequests(data);
            setLoading(false);
            setError(null);
        }, userId, role);

        return () => unsubscribe();
    }, [userId, role]);

    return { requests, loading, error, createRequest, updateRequestStatus, uploadFile };
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
