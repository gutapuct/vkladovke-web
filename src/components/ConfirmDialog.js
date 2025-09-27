import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";

// components/ConfirmDialog.jsx - добавьте поддержку цвета
const ConfirmDialog = ({
    open,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Подтвердить",
    cancelText = "Отмена",
    confirmColor = "primary",
}) => {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <Typography>{message}</Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{cancelText}</Button>
                <Button onClick={onConfirm} variant="contained" color={confirmColor}>
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;
