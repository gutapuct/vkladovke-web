import { arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../utils/firebase_firestore";
import { newGuid } from "../utils/guidHelper";
import {
    FIREBASE_COLLECTION_SETTINGS,
    FIREBASE_DOCUMENT_CONSTANTS,
    FIREBASE_DOCUMENT_PRODUCTS,
} from "../utils/constants";

export const settingsService = {
    getSettings: async () => {
        const settingsRef = doc(db, FIREBASE_COLLECTION_SETTINGS, FIREBASE_DOCUMENT_CONSTANTS);
        const settingsSnap = await getDoc(settingsRef);

        if (!settingsSnap.exists()) {
            throw new Error("Настройки не найдены");
        }

        return settingsSnap.data();
    },

    getProducts: async () => {
        const productsRef = doc(db, FIREBASE_COLLECTION_SETTINGS, FIREBASE_DOCUMENT_PRODUCTS);
        const productsSnap = await getDoc(productsRef);

        return productsSnap.data().items;
    },

    addProduct: async (product) => {
        const dbProducts = await settingsService.getProducts();

        const nameToLowerCase = product.name.trim().toLowerCase();

        if (
            dbProducts.filter((x) => x.name.trim().toLowerCase() === nameToLowerCase ?? x.isDeleted === false).length >
            0
        ) {
            throw new Error("Продукт с таким наименованием уже существует");
        }

        const productsRef = doc(db, FIREBASE_COLLECTION_SETTINGS, FIREBASE_DOCUMENT_PRODUCTS);

        const newProduct = {
            ...product,
            id: newGuid(),
            isDeleted: false,
        };

        await updateDoc(productsRef, {
            items: arrayUnion(newProduct),
        });

        return newProduct;
    },

    updateProduct: async (product) => {
        const productsRef = doc(db, FIREBASE_COLLECTION_SETTINGS, FIREBASE_DOCUMENT_PRODUCTS);
        const productsSnap = await getDoc(productsRef);

        const currentData = productsSnap.data();

        const updatedItems = currentData.items.map((item) =>
            item.id === product.id
                ? {
                      ...item,
                      name: product.name,
                      categoryId: product.categoryId,
                      unitId: product.unitId,
                  }
                : item
        );

        await updateDoc(productsRef, {
            items: updatedItems,
        });

        return product;
    },

    deleteProduct: async (id) => {
        const productsRef = doc(db, FIREBASE_COLLECTION_SETTINGS, FIREBASE_DOCUMENT_PRODUCTS);
        const productsSnap = await getDoc(productsRef);

        const currentData = productsSnap.data();
        const updatedItems = currentData.items.map((item) =>
            item.id === id
                ? {
                      ...item,
                      isDeleted: true,
                  }
                : item
        );

        await updateDoc(productsRef, {
            items: updatedItems,
        });
    },
};
