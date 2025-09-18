import { useState, useCallback } from "react";

export const useAlert = () => {
    const [alertState, setAlertState] = useState({
        open: false,
        title: "",
        message: "",
        type: "info",
    });

    const showAlert = useCallback(({ title, message, type = "info", autoClose = false }) => {
        setAlertState({
            open: true,
            title,
            message,
            type,
            autoClose,
        });
    }, []);

    const hideAlert = useCallback(() => {
        setAlertState((prev) => ({ ...prev, open: false }));
    }, []);

    const showError = useCallback(
        (message, title = "Ошибка") => {
            showAlert({ title, message, type: "error" });
        },
        [showAlert]
    );

    const showSuccess = useCallback(
        (message, title = "Успешно") => {
            showAlert({ title, message, type: "success", autoClose: true });
        },
        [showAlert]
    );

    const showInfo = useCallback(
        (message, title = "Информация") => {
            showAlert({ title, message, type: "info", autoClose: true });
        },
        [showAlert]
    );

    const showWarning = useCallback(
        (message, title = "Внимание") => {
            showAlert({ title, message, type: "warning" });
        },
        [showAlert]
    );

    return {
        alertState,
        showAlert,
        hideAlert,
        showError,
        showSuccess,
        showInfo,
        showWarning,
    };
};
