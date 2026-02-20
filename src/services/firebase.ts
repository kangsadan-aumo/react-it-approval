import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    query,
    orderBy,
    where,
    Timestamp,
    onSnapshot,
    type Unsubscribe,
} from 'firebase/firestore';
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
} from 'firebase/storage';
import type { PurchaseRequest, CreateRequestInput, RequestStatus } from '../types';

// ⚠️ ใส่ Firebase config ของคุณที่นี่
const firebaseConfig = {
    apiKey: "AIzaSyBjrjJe5wTgmtKGRIsWRW6jF2-hhtixAlc",
    authDomain: "it-approval-2a29a.firebaseapp.com",
    projectId: "it-approval-2a29a",
    storageBucket: "it-approval-2a29a.firebasestorage.app",
    messagingSenderId: "40833821595",
    appId: "1:40833821595:web:3954d7e3c6bea824b18f3e",
    measurementId: "G-HR1773KVLK"
};


// ตรวจว่ายังเป็น placeholder หรือไม่
const IS_DEMO_MODE = firebaseConfig.apiKey === "YOUR_API_KEY";

let db: ReturnType<typeof getFirestore> | null = null;
let storage: ReturnType<typeof getStorage> | null = null;

if (!IS_DEMO_MODE) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
}

export { db, storage };

const COLLECTION_NAME = 'purchase_requests';
const LOCAL_STORAGE_KEY = 'it_purchase_requests';

// ========== LOCAL STORAGE (DEMO MODE) ==========

function getLocalRequests(): PurchaseRequest[] {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return parsed.map((r: Record<string, unknown>) => ({
            ...r,
            createdAt: new Date(r.createdAt as string),
            updatedAt: new Date(r.updatedAt as string),
            approvedAt: r.approvedAt ? new Date(r.approvedAt as string) : undefined,
            orderedAt: r.orderedAt ? new Date(r.orderedAt as string) : undefined,
            completedAt: r.completedAt ? new Date(r.completedAt as string) : undefined,
        })) as PurchaseRequest[];
    } catch {
        return [];
    }
}

function saveLocalRequests(requests: PurchaseRequest[]) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(requests));
    // Dispatch event so listeners can update
    window.dispatchEvent(new Event('local-requests-updated'));
}

// ========== HELPERS ==========

function generateRequestNumber(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PR-${year}${month}-${random}`;
}

// ========== CRUD FUNCTIONS ==========

export async function createRequest(input: CreateRequestInput): Promise<string> {
    const totalAmount = input.items.reduce((sum, item) => sum + item.quantity * item.estimatedPrice, 0);

    if (IS_DEMO_MODE) {
        const id = 'local_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        const newRequest: PurchaseRequest = {
            id,
            requestNumber: generateRequestNumber(),
            title: input.title,
            description: input.description,
            department: input.department,
            requesterName: input.requesterName,
            createdBy: input.createdBy,
            items: input.items,
            status: 'pending',
            totalAmount,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const requests = getLocalRequests();
        requests.unshift(newRequest);
        saveLocalRequests(requests);
        return id;
    }

    const now = Timestamp.now();
    const docRef = await addDoc(collection(db!, COLLECTION_NAME), {
        requestNumber: generateRequestNumber(),
        title: input.title,
        description: input.description,
        department: input.department,
        requesterName: input.requesterName,
        createdBy: input.createdBy || '',
        items: input.items,
        status: 'pending' as RequestStatus,
        totalAmount,
        createdAt: now,
        updatedAt: now,
    });
    return docRef.id;
}

function docToPurchaseRequest(id: string, data: Record<string, unknown>): PurchaseRequest {
    return {
        id,
        requestNumber: data.requestNumber as string,
        title: data.title as string,
        description: data.description as string,
        department: data.department as string,
        requesterName: data.requesterName as string,
        items: data.items as PurchaseRequest['items'],
        status: data.status as RequestStatus,
        totalAmount: data.totalAmount as number,
        quotationUrl: data.quotationUrl as string | undefined,
        quotationName: data.quotationName as string | undefined,
        taxInvoiceUrl: data.taxInvoiceUrl as string | undefined,
        taxInvoiceName: data.taxInvoiceName as string | undefined,
        rejectionReason: data.rejectionReason as string | undefined,
        createdAt: (data.createdAt as Timestamp)?.toDate?.() ?? new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate?.() ?? new Date(),
        approvedAt: (data.approvedAt as Timestamp)?.toDate?.(),
        orderedAt: (data.orderedAt as Timestamp)?.toDate?.(),
        completedAt: (data.completedAt as Timestamp)?.toDate?.(),
    };
}

export async function getRequests(userId?: string, role?: string): Promise<PurchaseRequest[]> {
    if (IS_DEMO_MODE) {
        let requests = getLocalRequests();
        if (role === 'user' && userId) {
            requests = requests.filter(r => r.createdBy === userId);
        }
        return requests;
    }

    const requestsRef = collection(db!, COLLECTION_NAME);
    let q;

    if (role === 'user' && userId) {
        // User sees only their own requests
        q = query(requestsRef, where('createdBy', '==', userId), orderBy('createdAt', 'desc'));
    } else {
        // Admin/Approver sees all
        q = query(requestsRef, orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => docToPurchaseRequest(d.id, d.data() as Record<string, unknown>));
}

export function subscribeToRequests(callback: (requests: PurchaseRequest[]) => void, userId?: string, role?: string): Unsubscribe {
    if (IS_DEMO_MODE) {
        const getFiltered = () => {
            let reqs = getLocalRequests();
            if (role === 'user' && userId) {
                reqs = reqs.filter(r => r.createdBy === userId);
            }
            return reqs;
        };

        // ส่งข้อมูลทันที
        callback(getFiltered());
        // ฟัง event เมื่อมีการเปลี่ยนแปลง
        const handler = () => callback(getFiltered());
        window.addEventListener('local-requests-updated', handler);
        return () => window.removeEventListener('local-requests-updated', handler);
    }

    const requestsRef = collection(db!, COLLECTION_NAME);
    let q;

    if (role === 'user' && userId) {
        q = query(requestsRef, where('createdBy', '==', userId), orderBy('createdAt', 'desc'));
    } else {
        q = query(requestsRef, orderBy('createdAt', 'desc'));
    }

    return onSnapshot(q, (snapshot) => {
        const requests = snapshot.docs.map((d) => docToPurchaseRequest(d.id, d.data() as Record<string, unknown>));
        callback(requests);
    }, (error) => {
        console.error("Firebase subscription error:", error);
        // We'll also just send an empty array or handle error from UI later, but right now we just want to know if it fails.
    });
}

export async function getRequestById(id: string, userId?: string, role?: string): Promise<PurchaseRequest | null> {
    let request: PurchaseRequest | null = null;

    if (IS_DEMO_MODE) {
        const requests = getLocalRequests();
        request = requests.find((r) => r.id === id) || null;
    } else {
        const docRef = doc(db!, COLLECTION_NAME, id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            request = docToPurchaseRequest(snapshot.id, snapshot.data() as Record<string, unknown>);
        }
    }

    if (!request) return null;

    // Access Control
    if (userId && role === 'user') {
        if (request.createdBy !== userId) {
            // User trying to access other's request
            return null;
        }
    }

    return request;
}

export async function updateRequestStatus(
    id: string,
    status: RequestStatus,
    reason?: string
): Promise<void> {
    if (IS_DEMO_MODE) {
        const requests = getLocalRequests();
        const index = requests.findIndex((r) => r.id === id);
        if (index === -1) return;
        requests[index].status = status;
        requests[index].updatedAt = new Date();
        if (status === 'approved') requests[index].approvedAt = new Date();
        if (status === 'ordered') requests[index].orderedAt = new Date();
        if (status === 'completed') requests[index].completedAt = new Date();
        if (status === 'cancelled') requests[index].cancelledAt = new Date();
        if (status === 'rejected' && reason) requests[index].rejectionReason = reason;
        saveLocalRequests(requests);
        return;
    }

    const docRef = doc(db!, COLLECTION_NAME, id);
    const updateData: Record<string, unknown> = {
        status,
        updatedAt: Timestamp.now(),
    };
    if (status === 'approved') updateData.approvedAt = Timestamp.now();
    if (status === 'ordered') updateData.orderedAt = Timestamp.now();
    if (status === 'completed') updateData.completedAt = Timestamp.now();
    if (status === 'cancelled') updateData.cancelledAt = Timestamp.now();
    if (status === 'rejected' && reason) updateData.rejectionReason = reason;
    await updateDoc(docRef, updateData);
}

export async function deleteRequest(id: string): Promise<void> {
    if (IS_DEMO_MODE) {
        const requests = getLocalRequests().filter((r) => r.id !== id);
        saveLocalRequests(requests);
        return;
    }
    await deleteDoc(doc(db!, COLLECTION_NAME, id));
}

export async function uploadFile(
    file: File,
    requestId: string,
    type: 'quotation' | 'tax_invoice'
): Promise<{ url: string; name: string }> {
    if (IS_DEMO_MODE) {
        // ใน demo mode เก็บเป็น data URL
        const url = URL.createObjectURL(file);
        const requests = getLocalRequests();
        const index = requests.findIndex((r) => r.id === requestId);
        if (index !== -1) {
            if (type === 'quotation') {
                requests[index].quotationUrl = url;
                requests[index].quotationName = file.name;
            } else {
                requests[index].taxInvoiceUrl = url;
                requests[index].taxInvoiceName = file.name;
            }
            requests[index].updatedAt = new Date();
            saveLocalRequests(requests);
        }
        return { url, name: file.name };
    }

    const storageRef = ref(storage!, `${COLLECTION_NAME}/${requestId}/${type}/${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    const docRef = doc(db!, COLLECTION_NAME, requestId);
    if (type === 'quotation') {
        await updateDoc(docRef, { quotationUrl: url, quotationName: file.name, updatedAt: Timestamp.now() });
    } else {
        await updateDoc(docRef, { taxInvoiceUrl: url, taxInvoiceName: file.name, updatedAt: Timestamp.now() });
    }
    return { url, name: file.name };
}
