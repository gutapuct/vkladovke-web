import React, { createContext, useContext, useState, useCallback, useRef, FC } from "react";

const LoadingContext = createContext<LoadingContextType | null>(null);

interface Props {
    children: React.ReactNode;
}

interface LoadingContextType {
    loading: boolean;
    showSpinner: boolean;
    loadingCount: number;
    startLoading: () => void;
    stopLoading: () => void;
    withLoading: <T>(asyncFunction: () => Promise<T>) => Promise<T>;
}

export const useLoading = () => {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error("useLoading must be used within a LoadingProvider");
    }
    return context;
};

export const LoadingProvider: FC<Props> = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [loadingCount, setLoadingCount] = useState(0);
    const [showSpinner, setShowSpinner] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const startLoading = useCallback(() => {
        setLoadingCount((prev: number): number => {
            const newCount: number = prev + 1;
            setLoading(true);

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                if (newCount > 0) {
                    setShowSpinner(true);
                }
            }, 300);

            return newCount;
        });
    }, []);

    const stopLoading = useCallback(() => {
        setLoadingCount((prev) => {
            const newCount: number = prev - 1;

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            if (newCount <= 0) {
                setLoading(false);
                setShowSpinner(false);
                return 0;
            }

            return newCount;
        });
    }, []);

    const withLoading = useCallback(
        async <T, >(asyncFunction: () => Promise<T>): Promise<T> => {
            startLoading();

            try {
                return await asyncFunction();
            } finally {
                stopLoading();
            }
        },
        [startLoading, stopLoading]
    );

    const value: LoadingContextType = {
        loading,
        showSpinner,
        loadingCount,
        startLoading,
        stopLoading,
        withLoading,
    };

    return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
};
