import { useNavigate } from "react-router-dom";
import { Order, ordersService } from "../services/ordersService";
import { useAuth } from "../hooks/useAuth";
import { Box, Button, Card, CardContent, Typography, Chip, Fab, CircularProgress } from "@mui/material";
import { Add as AddIcon, ShoppingCart as CartIcon } from "@mui/icons-material";
import { FC, useCallback, useEffect, useState } from "react";
import AlertDialog from "../components/AlertDialog";
import { useAlert } from "../hooks/useAlert";
import { useLoading } from "../hooks/LoadingContext";
import { getErrorMessage, isFirebaseError } from "../utils/firebase_firestore";
import { formatFirebaseTimestamp, dateFormats } from "../utils/datetimeHelper";

const Main: FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { alertState, showError, hideAlert } = useAlert();
    const { withLoading, loading } = useLoading();
    const [orders, setOrders] = useState<Order[]>([]);

    const handleCreateOrder = (): void => {
        navigate("/create-order");
    };

    const handleViewOrder = (orderId: string): void => {
        navigate(`/order-details/${orderId}`);
    };

    const catchOrders = useCallback(async (): Promise<void> => {
        await withLoading(async () => {
            try {
                const response: Order[] = await ordersService.getActiveOrders(currentUser.groupId);
                setOrders(response);
            } catch (error) {
                if (isFirebaseError(error)) {
                    showError(getErrorMessage(error));
                } else if (error instanceof Error) {
                    showError(error.message);
                } else {
                    showError(String(error));
                }
            }
        });
    }, [currentUser, withLoading, showError]);

    useEffect(() => {
        catchOrders();
    }, [catchOrders]);

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "60vh",
                    flexDirection: "column",
                    gap: 2,
                }}
            >
                <CircularProgress size={60} />
                <Typography variant="h6" color="textSecondary">
                    Загрузка списков...
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ pb: 10 }}>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                    p: 2,
                    background: "white",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                }}
            >
                <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
                    Мои списки
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateOrder}
                    size="large"
                    sx={{
                        borderRadius: 2,
                        px: 3,
                    }}
                >
                    Создать
                </Button>
            </Box>

            <Box sx={{ p: 2 }}>
                {orders.length === 0 ? (
                    <Card
                        sx={{
                            textAlign: "center",
                            py: 6,
                            borderRadius: 2,
                            boxShadow: 2,
                        }}
                    >
                        <CardContent>
                            <CartIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                            <Typography variant="h6" color="textSecondary" gutterBottom>
                                Списков пока нет
                            </Typography>
                            <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                                Создайте свой первый список покупок
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleCreateOrder}
                                size="large"
                                sx={{
                                    borderRadius: 2,
                                    px: 4,
                                }}
                            >
                                Создать список
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {orders.map((order) => {
                            const completedItems = order.items?.filter((item) => item.isCompleted).length || 0;
                            const totalItems = order.items?.length || 0;
                            const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

                            return (
                                <Card
                                    key={order.id}
                                    sx={{
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                        borderRadius: 2,
                                        boxShadow: 2,
                                        "&:active": {
                                            transform: "scale(0.98)",
                                            boxShadow: 1,
                                        },
                                    }}
                                    onClick={() => handleViewOrder(order.id)}
                                >
                                    <CardContent sx={{ p: 3 }}>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "flex-start",
                                                mb: 2,
                                            }}
                                        >
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    fontWeight: 600,
                                                    fontSize: "1.1rem",
                                                    flex: 1,
                                                    mr: 2,
                                                }}
                                            >
                                                {order.title}
                                            </Typography>
                                            <Chip
                                                label={`${completedItems}/${totalItems}`}
                                                color={progress === 100 ? "success" : "primary"}
                                                variant={progress === 100 ? "filled" : "outlined"}
                                                size="small"
                                            />
                                        </Box>

                                        <Typography
                                            variant="body2"
                                            color="textSecondary"
                                            sx={{ fontSize: "0.9rem", mb: 2 }}
                                        >
                                            Создан: {formatFirebaseTimestamp(order.createdAt, dateFormats.dateOnly)}
                                        </Typography>

                                        <Box sx={{ mt: 2 }}>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    mb: 1,
                                                }}
                                            >
                                                <Typography variant="body2" color="textSecondary">
                                                    Прогресс:
                                                </Typography>
                                                <Typography variant="body2" color="textSecondary">
                                                    {Math.round(progress)}%
                                                </Typography>
                                            </Box>
                                            <Box
                                                sx={{
                                                    width: "100%",
                                                    height: 8,
                                                    backgroundColor: "grey.200",
                                                    borderRadius: 4,
                                                    overflow: "hidden",
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        height: "100%",
                                                        backgroundColor: progress === 100 ? "#4caf50" : "#1976d2",
                                                        width: `${progress}%`,
                                                        transition: "width 0.3s",
                                                        borderRadius: 4,
                                                    }}
                                                />
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Box>
                )}
            </Box>

            <Fab
                color="primary"
                aria-label="create order"
                onClick={handleCreateOrder}
                sx={{
                    position: "fixed",
                    bottom: 72,
                    right: 16,
                    width: 56,
                    height: 56,
                }}
            >
                <AddIcon />
            </Fab>

            <AlertDialog
                open={alertState.open}
                onClose={hideAlert}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
            />
        </Box>
    );
};

export default Main;
