import { arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../utils/firebase_firestore";
import { newGuid } from "../utils/guidHelper";
import {
    FIREBASE_COLLECTION_SETTINGS,
    FIREBASE_DOCUMENT_CONSTANTS,
    FIREBASE_DOCUMENT_PRODUCTS,
} from "../utils/constants";

interface SettingsService {
    getSettings: () => Promise<any>;
    getProducts: () => Promise<Product[]>;
    addProduct: (product: Product) => Promise<Product>;
    updateProduct: (product: Product) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
}

export interface Product {
    id: string;
    name: string;
    categoryId: string;
    unitId: string;
    isDeleted: boolean;
}

interface Settings {
    units: Record<string, string>;
    categories: Record<string, string>;
}

export const settingsService: SettingsService = {
    getSettings: async (): Promise<Settings> => {
        const settingsRef = doc(db, FIREBASE_COLLECTION_SETTINGS, FIREBASE_DOCUMENT_CONSTANTS);
        const settingsSnap = await getDoc(settingsRef);

        if (!settingsSnap.exists()) {
            throw new Error("Настройки не найдены");
        }

        return settingsSnap.data() as Settings;
    },

    getProducts: async (): Promise<Product[]> => {
        const productsRef = doc(db, FIREBASE_COLLECTION_SETTINGS, FIREBASE_DOCUMENT_PRODUCTS);
        const productsSnap = await getDoc(productsRef);

        if (!productsSnap.exists())
            return [];

        return productsSnap.data().items as Product[];
    },

    addProduct: async (product: Product): Promise<Product> => {
        const dbProducts: Product[] = await settingsService.getProducts();

        const nameToLowerCase: string = product.name.trim().toLowerCase();

        if (dbProducts.filter((x) => x.name.trim().toLowerCase() === nameToLowerCase && !x.isDeleted).length > 0) {
            throw new Error("Продукт с таким наименованием уже существует");
        }

        const productsRef = doc(db, FIREBASE_COLLECTION_SETTINGS, FIREBASE_DOCUMENT_PRODUCTS);

        const newProduct: Product = {
            ...product,
            id: newGuid(),
            isDeleted: false,
        };

        await updateDoc(productsRef, {
            items: arrayUnion(newProduct),
        });

        return newProduct;
    },

    updateProduct: async (product: Product): Promise<void> => {
        const productsRef = doc(db, FIREBASE_COLLECTION_SETTINGS, FIREBASE_DOCUMENT_PRODUCTS);
        const productsSnap = await getDoc(productsRef);

        if (!productsSnap.exists()) {
            return;
        }

        const currentData = productsSnap.data();
        const items: Product[] = currentData.items;

        const updatedItems = items.map((item) =>
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
    },

    deleteProduct: async (id: string): Promise<void> => {
        const productsRef = doc(db, FIREBASE_COLLECTION_SETTINGS, FIREBASE_DOCUMENT_PRODUCTS);
        const productsSnap = await getDoc(productsRef);

        if (!productsSnap.exists()) {
            return;
        }

        const currentData = productsSnap.data();
        const items: Product[] = currentData.items;

        const updatedItems = items.map((item) =>
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
