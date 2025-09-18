import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../utils/firebase_firestore";
import { newGuid } from "../utils/guidHelper";
import { FIREBASE_COLLECTION_USERS } from '../utils/constants'

export const userService = {
    createUser: async (email) => {
        const userRef = doc(db, FIREBASE_COLLECTION_USERS, email);

        const userDocument = {
            displayName: email,
            email: email,
            groupId: newGuid(),
        };

        await setDoc(userRef, userDocument);
    },

    isUserExists: async (email) => {
        const userRef = doc(db, FIREBASE_COLLECTION_USERS, email);
        const userSnap = await getDoc(userRef);

        return userSnap.exists();
    },

    getUser: async (email) => {
        const userRef = doc(db, FIREBASE_COLLECTION_USERS, email);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return userSnap.data();
        } else {
            throw new Error("Пользователь не найден");
        }
    },

    updateUser: async (email, updates) => {
        const userRef = doc(db, FIREBASE_COLLECTION_USERS, email);
        await updateDoc(userRef, updates);
    },
};
