import { createContext, useCallback, useContext, useEffect, useState } from "react";
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
import { userService } from "../services/userService";

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user !== null) {
                const dbUser = await userService.getUser(user.email);
                user = {
                    ...user,
                    displayName: dbUser.displayName,
                    groupId: dbUser.groupId,
                };
            }

            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const changeDisplayName = useCallback((newName) => {
        setCurrentUser((prev) => {
            return { ...prev, displayName: newName };
        });
    }, []);

    const login = async (email, password) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const logout = async () => {
        await signOut(auth);
    };

    const signup = async (email, password) => {
        const response = await createUserWithEmailAndPassword(auth, email, password);
        await userService.createUser(response.user.email);

        return response;
    };

    const emailVerification = async () => {
        // TODO: fix that. Now it doesn't work 
        await sendEmailVerification(currentUser);
        await logout();
    };

    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        const response = await signInWithPopup(auth, provider);

        const isUserExists = await userService.isUserExists(response.user.email);

        if (!isUserExists) {
            await userService.createUser(response.user.email);
        }
    };

    const resetPassword = async (email) => {
        await sendPasswordResetEmail(auth, email);
    };

    const value = {
        currentUser,
        changeDisplayName,
        login,
        logout,
        signup,
        emailVerification,
        resetPassword,
        loginWithGoogle,
    };

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
