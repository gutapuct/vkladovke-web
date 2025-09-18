import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Icon } from "@mui/material";
import {
    CheckCircle as SuccessIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    Warning as WarningIcon,
} from "@mui/icons-material";
import React from "react";

const AlertDialog = ({
    open,
    onClose,
    title = "Информация",
    message = "Операция выполнена успешно",
    type = "success", // 'info' | 'success' | 'warning' | 'error'
    confirmText = "OK",
    autoClose = false,
    autoCloseDelay = 10000,
}) => {
    // Автозакрытие
    React.useEffect(() => {
        if (open && autoClose) {
            const timer = setTimeout(() => {
                onClose();
            }, autoCloseDelay);

            return () => clearTimeout(timer);
        }
    }, [open, autoClose, autoCloseDelay, onClose]);

    // Настройки в зависимости от типа
    const getDialogSettings = () => {
        switch (type) {
            case "success":
                return {
                    icon: <SuccessIcon color="success" />,
                    color: "#4caf50",
                    title: title || "Успешно!",
                };
            case "error":
                return {
                    icon: <ErrorIcon color="error" />,
                    color: "#f44336",
                    title: title || "Ошибка!",
                };
            case "warning":
                return {
                    icon: <WarningIcon color="warning" />,
                    color: "#ff9800",
                    title: title || "Внимание!",
                };
            case "info":
            default:
                return {
                    icon: <InfoIcon color="info" />,
                    color: "#2196f3",
                    title: title || "Информация",
                };
        }
    };

    const { icon, color, title: dialogTitle } = getDialogSettings();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            sx={{
                '& .MuiPaper-root': {
                    borderRadius: 2,
                    minWidth: 300,
                    maxWidth: 400,
                    mx: 2 // Отступы по бокам на мобильных
                }
            }}
        >
            <DialogTitle
                id="alert-dialog-title"
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    color: color,
                    fontWeight: 600,
                }}
            >
                <Icon sx={{ color: "inherit" }}>{icon}</Icon>
                {dialogTitle}
            </DialogTitle>

            <DialogContent>
                <DialogContentText id="alert-dialog-description" sx={{ color: "text.primary", mt: 1 }}>
                    {message}
                </DialogContentText>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    sx={{
                        backgroundColor: color,
                        "&:hover": {
                            backgroundColor: color,
                            opacity: 0.9,
                        },
                    }}
                    fullWidth
                >
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AlertDialog;
