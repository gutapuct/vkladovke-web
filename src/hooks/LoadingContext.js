import { createContext, useContext, useState, useCallback } from "react";

const LoadingContext = createContext();

export const useLoading = () => {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error("useLoading must be used within a LoadingProvider");
    }
    return context;
};

export const LoadingProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [loadingCount, setLoadingCount] = useState(0);

    const startLoading = useCallback(() => {
        setLoadingCount((prev) => prev + 1);
        setLoading(true);
    }, []);

    const stopLoading = useCallback(() => {
        setLoadingCount((prev) => {
            const newCount = prev - 1;
            if (newCount <= 0) {
                setLoading(false);
                return 0;
            }
            return newCount;
        });
    }, []);

    const withLoading = useCallback(
        async (asyncFunction) => {
            startLoading();
            try {
                const result = await asyncFunction();
                console.log("asyncFunction: ", asyncFunction);
                console.log("result: ", result);
                return result;
            } finally {
                stopLoading();
            }
        },
        [startLoading, stopLoading]
    );

    const value = {
        loading,
        loadingCount,
        startLoading,
        stopLoading,
        withLoading,
    };

    return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
};
