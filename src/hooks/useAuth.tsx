import React, { createContext, FC, useCallback, useContext, useEffect, useState } from "react";
import { auth } from "../utils/firebase_firestore";
import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    User as FirebaseUser,
} from "firebase/auth";
import { User, userService } from "../services/userService";

export interface AuthUser extends User {
    emailVerified: boolean;
    uid: string;
}

interface AuthContextValue {
    currentUser: AuthUser | null;
    getVerifiedCurrentUser: () => AuthUser;
    changeDisplayName: (newName: string) => void;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    signup: (email: string, password: string) => Promise<FirebaseUser>;
    emailVerification: (user: FirebaseUser) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

interface Props {
    children: React.ReactNode;
}

export const AuthProvider: FC<Props> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user: FirebaseUser | null): Promise<void> => {
            if (user !== null && user.email) {
                const dbUser = await userService.getUser(user.email);
                const authUser: AuthUser = {
                    email: user.email,
                    displayName: dbUser.displayName,
                    groupId: dbUser.groupId,
                    emailVerified: user.emailVerified,
                    uid: user.uid,
                };
                setCurrentUser(authUser);
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const changeDisplayName = useCallback((newName: string) => {
        setCurrentUser((prev) => {
            if (!prev) return null;
            return { ...prev, displayName: newName };
        });
    }, []);

    const login = async (email: string, password: string): Promise<void> => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const logout = async () => {
        await signOut(auth);
    };

    const signup = async (email: string, password: string): Promise<FirebaseUser> => {
        const response = await createUserWithEmailAndPassword(auth, email, password);
        if (!response.user.email) {
            throw new Error("User email is required");
        }
        await userService.createUser(response.user.email);

        return response.user;
    };

    const emailVerification = async (user: FirebaseUser): Promise<void> => {
        await sendEmailVerification(user);
    };

    const loginWithGoogle = async (): Promise<void> => {
        const provider = new GoogleAuthProvider();
        const response = await signInWithPopup(auth, provider);

        if (!response.user.email) {
            throw new Error("User email is required");
        }

        const isUserExists = await userService.isUserExists(response.user.email);

        if (!isUserExists) {
            await userService.createUser(response.user.email);
        }
    };

    const resetPassword = async (email: string): Promise<void> => {
        await sendPasswordResetEmail(auth, email);
    };

    const getVerifiedCurrentUser = (): AuthUser => {
        if (!currentUser) {
            throw new Error("User is not authenticated");
        }
        return currentUser;
    }


    const value = {
        currentUser,
        changeDisplayName,
        login,
        logout,
        signup,
        emailVerification,
        resetPassword,
        loginWithGoogle,
        getVerifiedCurrentUser
    };

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
