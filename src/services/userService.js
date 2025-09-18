import { doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../utils/firebase_firestore";
import { newGuid } from "../utils/guidHelper";
import { FIREBASE_COLLECTION_USERS, FIREBASE_DOCUMENT_INVITATION_PART } from "../utils/constants";

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

    inviteUser: async (currentUser, emailInvitation) => {
        await userService.getUser(emailInvitation);

        const invitationRef = doc(db, FIREBASE_COLLECTION_USERS, emailInvitation + FIREBASE_DOCUMENT_INVITATION_PART);

        const invitationDocument = {
            email: currentUser.email,
            name: currentUser.displayName,
            groupId: currentUser.groupId,
        };

        await setDoc(invitationRef, invitationDocument);
    },

    getInvitationToApply: async (currentUser) => {
        const invitationRef = doc(db, FIREBASE_COLLECTION_USERS, currentUser.email + FIREBASE_DOCUMENT_INVITATION_PART);
        const invitationSnap = await getDoc(invitationRef);

        if (invitationSnap.exists()) {
            return invitationSnap.data();
        } else {
            return {};
        }
    },

    cancelInvitation: async (currentUser) => {
        const invitationRef = doc(db, FIREBASE_COLLECTION_USERS, currentUser.email + FIREBASE_DOCUMENT_INVITATION_PART);
        await deleteDoc(invitationRef);
    },

    applyInvitation: async (currentUser) => {
        const invitationRef = doc(db, FIREBASE_COLLECTION_USERS, currentUser.email + FIREBASE_DOCUMENT_INVITATION_PART);
        const invitationSnap = await getDoc(invitationRef);
        const invitation = invitationSnap.data();

        await userService.updateUser(currentUser.email, { groupId: invitation.groupId });

        await deleteDoc(invitationRef);

        const invitingRef = doc(db, FIREBASE_COLLECTION_USERS, invitation.email + FIREBASE_DOCUMENT_INVITATION_PART);
        await deleteDoc(invitingRef);
    },
};
