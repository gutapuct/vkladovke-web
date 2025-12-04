import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
    FieldValue,
    serverTimestamp,
} from "firebase/firestore";
import { getTodayString } from "../utils/datetimeHelper";
import { db } from "../utils/firebase_firestore";
import { newGuid } from "../utils/guidHelper";
import { FIREBASE_COLLECTION_ORDERS } from "../utils/constants";

interface OrdersService {
    getOrders: (groupId: string) => Promise<Order[]>;
    getActiveOrders: (groupId: string) => Promise<Order[]>;
    getCompletedOrders: (groupId: string) => Promise<Order[]>;
    getOrder: (orderId: string) => Promise<Order>;
    createOrder: (orderData: CreateOrderData) => Promise<Order>;
    updateOrder: (orderId: string, orderData: Order) => Promise<void>;
    completeOrder: (orderId: string, complete: boolean) => Promise<void>;
    completeOrderItem: (orderId: string, productId: string, complete: boolean) => Promise<void>;
    deleteOrder: (orderId: string) => Promise<void>;
    updateOrderItem: (orderId: string, productId: string, quantity: number, buyOnlyByAction: boolean) => Promise<void>;
    removeItemFromOrder: (orderId: string, productId: string) => Promise<void>;
}

interface Order {
    id: string;
    groupId: string;
    title: string;
    comment: string;
    createdAt: Timestamp | FieldValue;
    isCompleted: boolean;
    completedAt: Timestamp | FieldValue | null;
    items: OrderItem[];
}

interface OrderItem {
    productId: string;
    quantity: number;
    buyOnlyByAction: boolean;
    isCompleted: boolean;
    comment: string;
}

interface CreateOrderData extends Omit<Order, 'id'> {
}

export const ordersService: OrdersService = {
    // Получение всех списков группы
    getOrders: async (groupId: string): Promise<Order[]> => {
        try {
            const q = query(
                collection(db, FIREBASE_COLLECTION_ORDERS),
                where("groupId", "==", groupId),
                orderBy("createdAt", "desc")
            );

            const querySnapshot = await getDocs(q);
            const orders: Order[] = [];

            querySnapshot.forEach((doc) => {
                const order = doc.data() as Order;
                orders.push(order);
            });

            return orders;
        } catch (error) {
            console.error("Ошибка получения списков:", error);
            throw error;
        }
    },

    // Получение незавершенных списков группы
    getActiveOrders: async (groupId: string): Promise<Order[]> => {
        try {
            const q = query(
                collection(db, FIREBASE_COLLECTION_ORDERS),
                where("groupId", "==", groupId),
                where("isCompleted", "==", false),
                orderBy("createdAt", "desc")
            );

            const querySnapshot = await getDocs(q);
            const orders: Order[] = [];

            querySnapshot.forEach((doc) => {
                const order = doc.data() as Order;
                orders.push(order);
            });

            return orders;
        } catch (error) {
            console.error("Ошибка получения активных списков:", error);
            throw error;
        }
    },

    // Получение завершенных списков группы
    getCompletedOrders: async (groupId: string): Promise<Order[]> => {
        try {
            const q = query(
                collection(db, FIREBASE_COLLECTION_ORDERS),
                where("groupId", "==", groupId),
                where("isCompleted", "==", true),
                orderBy("createdAt", "desc")
            );

            const querySnapshot = await getDocs(q);
            const orders: Order[] = [];

            querySnapshot.forEach((doc) => {
                const order = doc.data() as Order;
                orders.push(order);
            });

            return orders;
        } catch (error) {
            console.error("Ошибка получения завершенных списков:", error);
            throw error;
        }
    },

    // Получение конкретного списка
    getOrder: async (orderId: string): Promise<Order> => {
        try {
            const orderRef = doc(db, FIREBASE_COLLECTION_ORDERS, orderId);
            const orderSnap = await getDoc(orderRef);

            if (orderSnap.exists()) {
                return orderSnap.data() as Order;
            }

            throw new Error("Список не найден");
        } catch (error) {
            console.error("Ошибка получения списка:", error);
            throw error;
        }
    },

    // Создание нового списка
    createOrder: async (orderData: CreateOrderData): Promise<Order> => {
        try {
            const orderId = newGuid();
            const orderRef = doc(db, FIREBASE_COLLECTION_ORDERS, orderId);

            const order: Order = {
                id: orderId,
                groupId: orderData.groupId,
                title: orderData.title || `Список от ${getTodayString()}`,
                comment: orderData.comment || "",
                createdAt: serverTimestamp(),
                isCompleted: false,
                completedAt: null,
                items: orderData?.items?.map((item) => ({ ...item, isCompleted: false })) || [],
            };

            await setDoc(orderRef, order);
            return order;
        } catch (error) {
            console.error("Ошибка создания списка:", error);
            throw error;
        }
    },

    // Обновление списка
    updateOrder: async (orderId: string, orderData: Order): Promise<void> => {
        try {
            const orderRef = doc(db, FIREBASE_COLLECTION_ORDERS, orderId);
            await updateDoc(orderRef, {
                title: orderData.title,
                comment: orderData.comment || "",
                items: orderData.items.filter(item => item.quantity > 0).map(item => ({
                    ...item,
                    isCompleted: item.isCompleted || false
                }))
            });
        } catch (error) {
            console.error("Ошибка обновления списка:", error);
            throw error;
        }
    },

    // Завершение списка
    completeOrder: async (orderId: string, complete: boolean): Promise<void> => {
        try {
            const orderRef = doc(db, FIREBASE_COLLECTION_ORDERS, orderId);
            await updateDoc(orderRef, {
                isCompleted: complete,
                completedAt: complete ? serverTimestamp() : null,
            });
        } catch (error) {
            console.error("Ошибка завершения списка:", error);
            throw error;
        }
    },

    // Отметка товара как выполненного
    completeOrderItem: async (orderId: string, productId: string, complete: boolean): Promise<void> => {
        try {
            const orderRef = doc(db, FIREBASE_COLLECTION_ORDERS, orderId);
            const orderSnap = await getDoc(orderRef);

            if (!orderSnap.exists()) {
                throw new Error("Список не найден");
            }

            const orderData = orderSnap.data() as Order;

            const updatedItems = orderData.items.map((item) =>
                item.productId === productId
                    ? {
                        ...item,
                        isCompleted: complete,
                    }
                    : item
            );

            await updateDoc(orderRef, { items: updatedItems });
        } catch (error) {
            console.error("Ошибка завершения товара:", error);
            throw error;
        }
    },

    // Удаление списка
    deleteOrder: async (orderId: string): Promise<void> => {
        try {
            const orderRef = doc(db, FIREBASE_COLLECTION_ORDERS, orderId);
            await deleteDoc(orderRef);
        } catch (error) {
            console.error("Ошибка удаления списка:", error);
            throw error;
        }
    },

    // Обновление количества товара
    updateOrderItem: async (orderId: string, productId: string, quantity: number, buyOnlyByAction: boolean): Promise<void> => {
        try {
            const orderRef = doc(db, FIREBASE_COLLECTION_ORDERS, orderId);
            const orderSnap = await getDoc(orderRef);

            if (!orderSnap.exists()) {
                throw new Error("Список не найден");
            }

            const orderData = orderSnap.data() as Order;
            const updatedItems: OrderItem[] = orderData.items.map((item) =>
                item.productId === productId ? { ...item, quantity, buyOnlyByAction } : item
            );

            await updateDoc(orderRef, { items: updatedItems });
        } catch (error) {
            console.error("Ошибка обновления товара:", error);
            throw error;
        }
    },

    // Удаление товара из списка
    removeItemFromOrder: async (orderId: string, productId: string): Promise<void> => {
        try {
            const orderRef = doc(db, FIREBASE_COLLECTION_ORDERS, orderId);
            const orderSnap = await getDoc(orderRef);

            if (!orderSnap.exists()) {
                throw new Error("Список не найден");
            }

            const orderData = orderSnap.data() as Order;
            const updatedItems: OrderItem[] = orderData.items.filter((item) => item.productId !== productId);

            await updateDoc(orderRef, { items: updatedItems });
        } catch (error) {
            console.error("Ошибка удаления товара:", error);
            throw error;
        }
    },
};
