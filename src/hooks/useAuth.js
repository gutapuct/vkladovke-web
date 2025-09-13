import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../utils/firebase_firestore";
import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
} from "firebase/auth";
import { useLoading } from "../hooks/LoadingContext";

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, serCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { withLoading } = useLoading();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            await withLoading(async () => {
                serCurrentUser(user);
                setLoading(false);
            });
        });

        return unsubscribe;
    }, [withLoading]);

    const login = async (email, password) => {
        await withLoading(async () => {
            await signInWithEmailAndPassword(auth, email, password);
        });
    };

    const logout = async () => {
        await withLoading(async () => {
            await signOut(auth);
        });
    };

    const signup = async (email, password) => {
        await withLoading(async () => {
            await createUserWithEmailAndPassword(email, password);
        });
    };

    const emailVerification = async (user) => {
        await withLoading(async () => {
            await sendEmailVerification(user);
            await logout();
        });
    };

    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        await withLoading(async () => {
            await signInWithPopup(auth, provider);
        });
    };

    const resetPassword = async (email) => {
        await withLoading(async () => {
            await sendPasswordResetEmail(auth, email);
        });
    };

    const value = {
        currentUser,
        login,
        logout,
        signup,
        emailVerification,
        resetPassword,
        loginWithGoogle,
    };

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
