import { supabase } from './supabase';
import type { PurchaseRequest, CreateRequestInput, RequestStatus } from '../types';

const TABLE_NAME = 'requests';
const STORAGE_BUCKET = 'it-approval';

// ========== HELPERS ==========
function generateRequestNumber(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PR-${year}${month}-${random}`;
}

const mapPurchaseRequest = (data: any): PurchaseRequest => {
    return {
        id: data.id,
        requestNumber: data.request_number,
        title: data.title,
        description: data.description,
        department: data.department,
        requesterName: data.requester_name,
        createdBy: data.created_by,
        items: data.items,
        status: data.status as RequestStatus,
        totalAmount: data.total_amount,
        quotationUrl: data.quotation_url,
        quotationName: data.quotation_name,
        signedQuotationUrl: data.signed_quotation_url,
        signedQuotationName: data.signed_quotation_name,
        rejectionReason: data.rejection_reason,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        approvedAt: data.approved_at ? new Date(data.approved_at) : undefined,
    };
};

// ========== CRUD FUNCTIONS ==========
export async function createRequest(input: CreateRequestInput): Promise<string> {
    const totalAmount = input.items.reduce((sum, item) => sum + item.quantity * item.estimatedPrice, 0);

    const { data, error } = await supabase.from(TABLE_NAME).insert({
        request_number: generateRequestNumber(),
        title: input.title,
        description: input.description,
        department: input.department,
        requester_name: input.requesterName,
        created_by: input.createdBy,
        items: input.items,
        status: 'pending',
        total_amount: totalAmount,
    }).select('id').single();

    if (error) {
        throw new Error(error.message);
    }
    return data.id;
}

export async function getRequests(userId?: string, role?: string): Promise<PurchaseRequest[]> {
    let query = supabase.from(TABLE_NAME).select('*');

    if (role === 'user' && userId) {
        query = query.eq('created_by', userId);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return data.map(mapPurchaseRequest);
}

export async function getRequestById(id: string, userId?: string, role?: string): Promise<PurchaseRequest | null> {
    let query = supabase.from(TABLE_NAME).select('*').eq('id', id);

    if (role === 'user' && userId) {
        query = query.eq('created_by', userId);
    }

    const { data, error } = await query.single();
    if (error) {
        if (error.code === 'PGRST116') return null; // No rows found
        throw new Error(error.message);
    }

    return mapPurchaseRequest(data);
}

export async function updateRequestStatus(
    id: string,
    status: RequestStatus,
    reason?: string
): Promise<void> {
    const updateData: any = {
        status,
        updated_at: new Date().toISOString()
    };
    if (status === 'approved') updateData.approved_at = updateData.updated_at;
    if (status === 'cancelled') updateData.cancelled_at = updateData.updated_at;
    if (status === 'rejected' && reason) updateData.rejection_reason = reason;

    const { error } = await supabase.from(TABLE_NAME).update(updateData).eq('id', id);
    if (error) throw new Error(error.message);
}

export async function deleteRequest(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);
    if (error) throw new Error(error.message);
}

export async function uploadFile(
    file: File,
    requestId: string,
    type: 'quotation' | 'signed_quotation'
): Promise<{ url: string; name: string }> {
    const filePath = `requests/${requestId}/${type}/${file.name}`;
    const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, { upsert: true });

    if (uploadError) throw new Error(uploadError.message);

    const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

    const url = publicUrlData.publicUrl;

    const updateData: any = {
        updated_at: new Date().toISOString()
    };
    if (type === 'quotation') {
        updateData.quotation_url = url;
        updateData.quotation_name = file.name;
    } else {
        updateData.signed_quotation_url = url;
        updateData.signed_quotation_name = file.name;
    }

    const { error: dbError } = await supabase.from(TABLE_NAME).update(updateData).eq('id', requestId);
    if (dbError) throw new Error(dbError.message);

    return { url, name: file.name };
}
