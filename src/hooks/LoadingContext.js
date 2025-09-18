import { createContext, useContext, useState, useCallback, useRef } from "react";

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
    const [showSpinner, setShowSpinner] = useState(false);
    const timeoutRef = useRef(null);

    const startLoading = useCallback(() => {
        setLoadingCount((prev) => {
            const newCount = prev + 1;
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
            const newCount = prev - 1;

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
        async (asyncFunction) => {
            startLoading();
            try {
                const result = await asyncFunction();
                // console.log("asyncFunction: ", asyncFunction);
                // console.log("result: ", result);
                return result;
            } finally {
                stopLoading();
            }
        },
        [startLoading, stopLoading]
    );

    const value = {
        loading,
        showSpinner,
        loadingCount,
        startLoading,
        stopLoading,
        withLoading,
    };

    return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
};
