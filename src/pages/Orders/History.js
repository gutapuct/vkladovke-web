import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Chip,
    List,
    ListItem,
    Divider,
    AppBar,
    Toolbar,
    IconButton,
    Fab,
} from "@mui/material";
import { ArrowBack, Add as AddIcon, Visibility as ViewIcon, ShoppingBag as BagIcon } from "@mui/icons-material";
import { ordersService } from "../../services/ordersService";
import { useAuth } from "../../hooks/useAuth";
import { useLoading } from "../../hooks/LoadingContext";
import { useAlert } from "../../hooks/useAlert";
import { formatFirebaseTimestamp } from "../../utils/datetimeHelper";
import AlertDialog from "../../components/AlertDialog";
import { useSettings } from "../../hooks/useSettings";

const History = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { withLoading } = useLoading();
    const { alertState, showError, hideAlert } = useAlert();
    const { getProductInfo, getProductNameById } = useSettings();

    const [completedOrders, setCompletedOrders] = useState([]);

    const loadCompletedOrders = useCallback(async () => {
        await withLoading(async () => {
            try {
                const orders = await ordersService.getCompletedOrders(currentUser.groupId);
                setCompletedOrders(orders);
            } catch (error) {
                showError(error.message);
            }
        });
    }, [currentUser.groupId, withLoading, showError]);

    useEffect(() => {
        loadCompletedOrders();
    }, [loadCompletedOrders]);

    const handleViewOrder = (orderId) => {
        navigate(`/order-details/${orderId}`);
    };

    const handleCreateNewOrder = () => {
        navigate("/create-order");
    };

    const handleBackToActive = () => {
        navigate("/");
    };

    const getOrderStats = (order) => {
        const totalItems = order.items?.length || 0;
        const completedItems = order.items?.filter((item) => item.isCompleted).length || 0;
        return { totalItems, completedItems };
    };

    return (
        <Box sx={{ pb: 8 }}>
            <AppBar position="static" sx={{ bgcolor: "white", color: "text.primary", boxShadow: 1 }}>
                <Toolbar>
                    <IconButton edge="start" onClick={handleBackToActive} sx={{ mr: 2 }} size="large">
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                        История списков
                    </Typography>
                </Toolbar>
            </AppBar>

            <Box>
                {/* Статистика */}
                <Card sx={{ borderRadius: 0, boxShadow: 2 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Статистика
                        </Typography>
                        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                            <Chip label={`Завершено: ${completedOrders.length}`} variant="outlined" color="primary" />
                            <Chip
                                label={`Последний: ${
                                    completedOrders.length > 0
                                        ? formatFirebaseTimestamp(completedOrders[0].createdAt, {
                                              day: "numeric",
                                              month: "short",
                                          })
                                        : "нет"
                                }`}
                                variant="outlined"
                            />
                        </Box>
                    </CardContent>
                </Card>

                {/* Завершенные списки */}
                {completedOrders.length === 0 ? (
                    <Box sx={{ p: 3 }}>
                        <Card
                            sx={{
                                p: 4,
                                textAlign: "center",
                                borderRadius: 2,
                            }}
                        >
                            <BagIcon sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                Нет завершенных списков
                            </Typography>
                            <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                                Здесь будут отображаться ваши завершенные списки
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={handleCreateNewOrder}
                                size="large"
                                sx={{ borderRadius: 2 }}
                            >
                                Создать первый список
                            </Button>
                        </Card>
                    </Box>
                ) : (
                    <Box sx={{ p: 2 }}>
                        <List sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            {completedOrders.map((order) => {
                                const stats = getOrderStats(order);
                                return (
                                    <Card key={order.id} variant="outlined" sx={{ borderRadius: 2 }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "start",
                                                    mb: 2,
                                                }}
                                            >
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                                        {order.title}
                                                    </Typography>
                                                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                                                        <Chip
                                                            label={`Товаров: ${stats.totalItems}`}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                        <Chip
                                                            label={`Куплено: ${stats.completedItems}`}
                                                            size="small"
                                                            color="success"
                                                            variant="outlined"
                                                        />
                                                        {order.completedAt && (
                                                            <Chip
                                                                label={`Завершен: ${formatFirebaseTimestamp(
                                                                    order.completedAt
                                                                )}`}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        )}
                                                    </Box>
                                                    <Typography variant="body2" color="textSecondary">
                                                        Создан: {formatFirebaseTimestamp(order.createdAt)}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            {/* Последние 3 товара для preview */}
                                            {order.items &&
                                                order.items.slice(0, 3).map((item) => {
                                                    const { category, unit } = getProductInfo(item.productId);

                                                    return (
                                                        <ListItem
                                                            key={item.productId}
                                                            sx={{
                                                                py: 0.5,
                                                                px: 0,
                                                                opacity: item.isCompleted ? 1 : 0.6,
                                                            }}
                                                        >
                                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                <Typography
                                                                    variant="body2"
                                                                    sx={{
                                                                        fontSize: "0.9rem",
                                                                        wordBreak: "break-word",
                                                                        lineHeight: 1.3,
                                                                    }}
                                                                >
                                                                    • {getProductNameById(item.productId)}
                                                                </Typography>
                                                                <Typography
                                                                    variant="body2"
                                                                    color="textSecondary"
                                                                    sx={{
                                                                        fontSize: "0.8rem",
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        gap: 1,
                                                                        flexWrap: "wrap",
                                                                        mt: 0.5,
                                                                    }}
                                                                >
                                                                    <span>
                                                                        {item.quantity} {unit}
                                                                    </span>
                                                                    <span>•</span>
                                                                    <span>{category}</span>
                                                                </Typography>
                                                            </Box>
                                                            <Chip
                                                                label={item.isCompleted ? "✓ Куплено" : "Не куплено"}
                                                                size="small"
                                                                color={item.isCompleted ? "success" : "default"}
                                                                variant="outlined"
                                                                sx={{ flexShrink: 0, ml: 1 }}
                                                            />
                                                        </ListItem>
                                                    );
                                                })}

                                            {order.items && order.items.length > 3 && (
                                                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                                    ... и еще {order.items.length - 3} товаров
                                                </Typography>
                                            )}
                                        </CardContent>

                                        <Divider />

                                        <Box sx={{ p: 2 }}>
                                            <Button
                                                startIcon={<ViewIcon />}
                                                onClick={() => handleViewOrder(order.id)}
                                                variant="outlined"
                                                fullWidth
                                                size="large"
                                                sx={{ borderRadius: 2 }}
                                            >
                                                Подробнее
                                            </Button>
                                        </Box>
                                    </Card>
                                );
                            })}
                        </List>
                    </Box>
                )}
            </Box>

            <Fab
                color="primary"
                aria-label="create order"
                onClick={handleCreateNewOrder}
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

export default History;
