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
    serverTimestamp,
} from "firebase/firestore";
import { getNowString } from "../utils/datetimeHelper";
import { db } from "../utils/firebase_firestore";
import { newGuid } from "../utils/guidHelper";
import { FIREBASE_COLLECTION_ORDERS } from "../utils/constants";

export const ordersService = {
    // Получение всех заказов группы
    getOrders: async (groupId) => {
        try {
            const q = query(
                collection(db, FIREBASE_COLLECTION_ORDERS),
                where("groupId", "==", groupId),
                orderBy("createdAt", "desc")
            );

            const querySnapshot = await getDocs(q);
            const orders = [];

            querySnapshot.forEach((doc) => {
                orders.push({
                    id: doc.id,
                    ...doc.data(),
                });
            });

            return orders;
        } catch (error) {
            console.error("Ошибка получения заказов:", error);
            throw error;
        }
    },

    // Получение незавершенных заказов группы
    getActiveOrders: async (groupId) => {
        try {
            const q = query(
                collection(db, FIREBASE_COLLECTION_ORDERS),
                where("groupId", "==", groupId),
                where("isCompleted", "==", false),
                orderBy("createdAt", "desc")
            );

            const querySnapshot = await getDocs(q);
            const orders = [];

            querySnapshot.forEach((doc) => {
                orders.push({
                    id: doc.id,
                    ...doc.data(),
                });
            });

            return orders;
        } catch (error) {
            console.error("Ошибка получения активных заказов:", error);
            throw error;
        }
    },

    // Получение завершенных заказов группы
    getCompletedOrders: async (groupId) => {
        try {
            const q = query(
                collection(db, FIREBASE_COLLECTION_ORDERS),
                where("groupId", "==", groupId),
                where("isCompleted", "==", true),
                orderBy("createdAt", "desc")
            );

            const querySnapshot = await getDocs(q);
            const orders = [];

            querySnapshot.forEach((doc) => {
                orders.push({
                    id: doc.id,
                    ...doc.data(),
                });
            });

            return orders;
        } catch (error) {
            console.error("Ошибка получения завершенных заказов:", error);
            throw error;
        }
    },

    // Получение конкретного заказа
    getOrder: async (orderId) => {
        try {
            const orderRef = doc(db, FIREBASE_COLLECTION_ORDERS, orderId);
            const orderSnap = await getDoc(orderRef);

            if (orderSnap.exists()) {
                return {
                    id: orderSnap.id,
                    ...orderSnap.data(),
                };
            }

            throw new Error("Заказ не найден");
        } catch (error) {
            console.error("Ошибка получения заказа:", error);
            throw error;
        }
    },

    // Создание нового заказа
    createOrder: async (orderData) => {
        try {
            const orderId = newGuid();
            const orderRef = doc(db, FIREBASE_COLLECTION_ORDERS, orderId);

            const order = {
                id: orderId,
                groupId: orderData.groupId,
                title: orderData.title || `Заказ от ${getNowString()}`,
                createdAt: serverTimestamp(),
                isCompleted: false,
                completedAt: null,
                items: orderData?.items?.map((item) => ({ ...item, isCompleted: false })) || [],
            };

            await setDoc(orderRef, order);
            return order;
        } catch (error) {
            console.error("Ошибка создания заказа:", error);
            throw error;
        }
    },

    // Обновление заказа
    updateOrder: async (orderId, updates) => {
        try {
            const orderRef = doc(db, FIREBASE_COLLECTION_ORDERS, orderId);
            await updateDoc(orderRef, { ...updates });
        } catch (error) {
            console.error("Ошибка обновления заказа:", error);
            throw error;
        }
    },

    // Завершение заказа
    completeOrder: async (orderId, complete) => {
        try {
            const orderRef = doc(db, FIREBASE_COLLECTION_ORDERS, orderId);
            await updateDoc(orderRef, {
                isCompleted: complete,
                completedAt: complete ? serverTimestamp() : null,
            });
        } catch (error) {
            console.error("Ошибка завершения заказа:", error);
            throw error;
        }
    },

    // Отметка товара как выполненного
    completeOrderItem: async (orderId, productId, complete) => {
        try {
            const orderRef = doc(db, FIREBASE_COLLECTION_ORDERS, orderId);
            const orderSnap = await getDoc(orderRef);

            if (!orderSnap.exists()) {
                throw new Error("Заказ не найден");
            }

            const orderData = orderSnap.data();
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

    // Добавление товара в заказ
    addItemToOrder: async (orderId, itemData) => {
        try {
            const orderRef = doc(db, FIREBASE_COLLECTION_ORDERS, orderId);
            const orderSnap = await getDoc(orderRef);

            if (!orderSnap.exists()) {
                throw new Error("Заказ не найден");
            }

            const orderData = orderSnap.data();
            const newItem = {
                id: newGuid(),
                productId: itemData.productId,
                quantity: itemData.quantity,
                idCompleted: false,
            };

            await updateDoc(orderRef, {
                items: [...orderData.items, newItem],
            });

            return newItem;
        } catch (error) {
            console.error("Ошибка добавления товара:", error);
            throw error;
        }
    },

    // Удаление заказа
    deleteOrder: async (orderId) => {
        try {
            const orderRef = doc(db, FIREBASE_COLLECTION_ORDERS, orderId);
            await deleteDoc(orderRef);
        } catch (error) {
            console.error("Ошибка удаления заказа:", error);
            throw error;
        }
    },
};
