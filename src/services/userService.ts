import { doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../utils/firebase_firestore";
import { newGuid } from "../utils/guidHelper";
import { FIREBASE_COLLECTION_USERS, FIREBASE_DOCUMENT_INVITATION_PART } from "../utils/constants";

interface User {
    displayName: string;
    email: string;
    groupId: string;
}

interface Invitation {
    email: string;
    name: string;
    groupId: string;
}

interface UserService {
    createUser: (email: string) => Promise<void>;
    isUserExists: (email: string) => Promise<boolean>;
    getUser: (email: string) => Promise<User>;
    updateUser: (email: string, updates: Partial<User>) => Promise<void>;
    inviteUser: (currentUser: User, emailInvitation: string) => Promise<void>;
    getInvitationToApply: (currentUser: User) => Promise<Invitation | null>;
    cancelInvitation: (currentUser: User) => Promise<void>;
    applyInvitation: (currentUser: User) => Promise<void>;
}

export const userService: UserService = {
    createUser: async (email: string): Promise<void> => {
        const userRef = doc(db, FIREBASE_COLLECTION_USERS, email);

        const userDocument: User = {
            displayName: email,
            email: email,
            groupId: newGuid(),
        };

        await setDoc(userRef, userDocument);
    },

    isUserExists: async (email: string): Promise<boolean> => {
        const userRef = doc(db, FIREBASE_COLLECTION_USERS, email);
        const userSnap = await getDoc(userRef);

        return userSnap.exists();
    },

    getUser: async (email: string): Promise<User> => {
        const userRef = doc(db, FIREBASE_COLLECTION_USERS, email);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return userSnap.data() as User;
        } else {
            throw new Error("Пользователь не найден");
        }
    },

    updateUser: async (email: string, updates: Partial<User>): Promise<void> => {
        const userRef = doc(db, FIREBASE_COLLECTION_USERS, email);
        await updateDoc(userRef, updates);
    },

    inviteUser: async (currentUser: User, emailInvitation: string): Promise<void> => {
        // check that user exists
        await userService.getUser(emailInvitation);

        const invitationRef = doc(db, FIREBASE_COLLECTION_USERS, emailInvitation + FIREBASE_DOCUMENT_INVITATION_PART);

        const invitationDocument: Invitation = {
            email: currentUser.email,
            name: currentUser.displayName,
            groupId: currentUser.groupId,
        };

        await setDoc(invitationRef, invitationDocument);
    },

    getInvitationToApply: async (currentUser: User): Promise<Invitation | null> => {
        const invitationRef = doc(db, FIREBASE_COLLECTION_USERS, currentUser.email + FIREBASE_DOCUMENT_INVITATION_PART);
        const invitationSnap = await getDoc(invitationRef);

        if (invitationSnap.exists()) {
            return invitationSnap.data() as Invitation;
        }

        return null;
    },

    cancelInvitation: async (currentUser: User): Promise<void> => {
        const invitationRef = doc(db, FIREBASE_COLLECTION_USERS, currentUser.email + FIREBASE_DOCUMENT_INVITATION_PART);
        await deleteDoc(invitationRef);
    },

    applyInvitation: async (currentUser: User): Promise<void> => {
        const invitationRef = doc(db, FIREBASE_COLLECTION_USERS, currentUser.email + FIREBASE_DOCUMENT_INVITATION_PART);
        const invitationSnap = await getDoc(invitationRef);
        const invitation = invitationSnap.data() as Invitation;

        await userService.updateUser(currentUser.email, { groupId: invitation.groupId });

        await deleteDoc(invitationRef);

        const invitingRef = doc(db, FIREBASE_COLLECTION_USERS, invitation.email + FIREBASE_DOCUMENT_INVITATION_PART);
        await deleteDoc(invitingRef);
    },
};
