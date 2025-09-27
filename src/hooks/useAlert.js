import { useState, useCallback } from "react";

export const useAlert = () => {
    const [alertState, setAlertState] = useState({
        open: false,
        title: "",
        message: "",
        type: "info",
        onClose: null,
    });

    const showAlert = useCallback(({ title, message, type = "info", autoClose = false, onClose = null }) => {
        setAlertState({
            open: true,
            title,
            message,
            type,
            autoClose,
            onClose,
        });
    }, []);

    const hideAlert = useCallback(() => {
        if (alertState.onClose) {
            alertState.onClose();
        }

        setAlertState((prev) => ({ ...prev, open: false, onClose: null }));
    }, [alertState]);

    const showError = useCallback(
        (message, title = "Ошибка", onClose = null) => {
            showAlert({ title, message, type: "error", onClose });
        },
        [showAlert]
    );

    const showSuccess = useCallback(
        (message, title = "Успешно", onClose = null) => {
            showAlert({ title, message, type: "success", autoClose: true, onClose });
        },
        [showAlert]
    );

    const showInfo = useCallback(
        (message, title = "Информация", onClose = null) => {
            showAlert({ title, message, type: "info", autoClose: true, onClose });
        },
        [showAlert]
    );

    const showWarning = useCallback(
        (message, title = "Внимание", onClose = null) => {
            showAlert({ title, message, type: "warning", onClose });
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
