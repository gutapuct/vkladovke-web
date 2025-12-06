import { useState, useCallback } from "react";

interface Alert {
    open: boolean;
    title: string;
    message: string;
    type: "info" | "success" | "error" | "warning";
    autoClose: boolean;
    onClose: (() => void) | null;
}

interface ShowAlert extends Omit<Alert, "open"> {}

export const useAlert = () => {
    const [alertState, setAlertState] = useState<Alert>({
        open: false,
        title: "",
        message: "",
        type: "info",
        onClose: null,
        autoClose: false,
    });

    const showAlert = useCallback(({ title, message, type = "info", autoClose, onClose }: ShowAlert) => {
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
        (message: string, title = "Ошибка", onClose: (() => void) | null = null) => {
            showAlert({ title, message, type: "error", autoClose: false, onClose: onClose });
        },
        [showAlert]
    );

    const showSuccess = useCallback(
        (message: string, title = "Успешно", onClose: (() => void) | null = null) => {
            showAlert({ title, message, type: "success", autoClose: true, onClose });
        },
        [showAlert]
    );

    const showInfo = useCallback(
        (message: string, title = "Информация", onClose = null) => {
            showAlert({ title, message, type: "info", autoClose: true, onClose });
        },
        [showAlert]
    );

    const showWarning = useCallback(
        (message: string, title = "Внимание", onClose = null) => {
            showAlert({ title, message, type: "warning", autoClose: false, onClose });
        },
        [showAlert]
    );

    return {
        alertState,
        hideAlert,
        showError,
        showSuccess,
        showInfo,
        showWarning,
    };
};
