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
    type = "success",
    confirmText = "OK",
    autoClose = false,
    autoCloseDelay = 10000,
}) => {
    React.useEffect(() => {
        if (open && autoClose) {
            const timer = setTimeout(() => {
                onClose();
            }, autoCloseDelay);

            return () => clearTimeout(timer);
        }
    }, [open, autoClose, autoCloseDelay, onClose]);

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
                "& .MuiBackdrop-root": {
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    backdropFilter: "blur(2px)",
                },
            }}
            slotProps={{
                paper: {
                    sx: {
                        margin: "20px",
                        maxWidth: "calc(100% - 40px)",
                        width: "100%",
                        borderRadius: 3,
                        boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                    },
                },
            }}
        >
            <DialogTitle
                id="alert-dialog-title"
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    color: color,
                    fontWeight: 600,
                    fontSize: "1.25rem",
                    pt: 3,
                    pb: 2,
                    px: 3,
                }}
            >
                <Icon sx={{ color: "inherit", fontSize: "1.5rem" }}>{icon}</Icon>
                {dialogTitle}
            </DialogTitle>

            <DialogContent sx={{ pt: 1, px: 3 }}>
                <DialogContentText
                    id="alert-dialog-description"
                    sx={{
                        color: "text.primary",
                        mt: 1,
                        fontSize: "1rem",
                        lineHeight: 1.6,
                    }}
                >
                    {message}
                </DialogContentText>
            </DialogContent>

            <DialogActions
                sx={{
                    px: 3,
                    pb: 3,
                    pt: 2,
                }}
            >
                <Button
                    onClick={onClose}
                    variant="contained"
                    size="large"
                    sx={{
                        backgroundColor: color,
                        "&:hover": {
                            backgroundColor: color,
                            opacity: 0.9,
                        },
                        minHeight: "48px",
                        fontSize: "1rem",
                        borderRadius: 2,
                        flex: 1,
                    }}
                >
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AlertDialog;
