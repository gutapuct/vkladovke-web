import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";
import { FC } from "react";

interface Props {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
}

const ConfirmDialog: FC<Props> = ({
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
        <Dialog
            open={open}
            onClose={onClose}
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
                sx={{
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    pb: 2,
                    pt: 3,
                    px: 3,
                }}
            >
                {title}
            </DialogTitle>
            <DialogContent sx={{ pb: 2, px: 3 }}>
                <Typography
                    sx={{
                        fontSize: "1rem",
                        lineHeight: 1.6,
                    }}
                >
                    {message}
                </Typography>
            </DialogContent>
            <DialogActions
                sx={{
                    px: 3,
                    pb: 3,
                    gap: 2,
                }}
            >
                <Button
                    onClick={onClose}
                    size="large"
                    variant="outlined"
                    sx={{
                        flex: 1,
                        minHeight: "48px",
                        borderRadius: 2,
                    }}
                >
                    {cancelText}
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color={confirmColor}
                    size="large"
                    sx={{
                        flex: 1,
                        minHeight: "48px",
                        borderRadius: 2,
                    }}
                >
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;
