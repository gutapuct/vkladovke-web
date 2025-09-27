// components/History.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardActions,
    Button,
    Chip,
    List,
    ListItem,
    ListItemText,
    Divider,
    Paper,
} from "@mui/material";
import { Visibility as ViewIcon, ShoppingBag as BagIcon } from "@mui/icons-material";
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
        <Box sx={{ p: 3, maxWidth: 1000, margin: "0 auto" }}>
            {/* Заголовок */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h4">История списков</Typography>
                <Box sx={{ display: "flex", gap: 2 }}>
                    <Button variant="outlined" onClick={handleBackToActive}>
                        Активные списки
                    </Button>
                    <Button variant="contained" onClick={handleCreateNewOrder}>
                        Новый список
                    </Button>
                </Box>
            </Box>

            {/* Статистика */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: "grey.50" }}>
                <Typography variant="h6" gutterBottom>
                    Статистика
                </Typography>
                <Box sx={{ display: "flex", gap: 3 }}>
                    <Chip label={`Всего завершено: ${completedOrders.length}`} variant="outlined" />
                    <Chip
                        label={`Последний созданный: ${
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
            </Paper>

            {/* Завершенных списки */}
            {completedOrders.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: "center" }}>
                    <BagIcon sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        Нет завершенных списков
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                        Здесь будут отображаться ваши завершенные списки
                    </Typography>
                    <Button variant="contained" onClick={handleCreateNewOrder}>
                        Создать первый список
                    </Button>
                </Paper>
            ) : (
                <List sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {completedOrders.map((order) => {
                        const stats = getOrderStats(order);
                        return (
                            <Card key={order.id} variant="outlined">
                                <CardContent>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "start",
                                            mb: 2,
                                        }}
                                    >
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="h6" gutterBottom>
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
                                                        opacity: item.isCompleted ? 1 : 0.6,
                                                    }}
                                                >
                                                    <ListItemText
                                                        primary={`• ${getProductNameById(item.productId)} (${category})`}
                                                        secondary={`Количество: ${item.quantity} ${unit}`}
                                                        primaryTypographyProps={{ variant: "body2" }}
                                                    />
                                                    <Chip
                                                        label={item.isCompleted ? "✓ Куплено" : "Не куплено"}
                                                        size="small"
                                                        color={item.isCompleted ? "success" : "default"}
                                                        variant="outlined"
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

                                <CardActions sx={{ justifyContent: "flex-end" }}>
                                    <Button
                                        startIcon={<ViewIcon />}
                                        onClick={() => handleViewOrder(order.id)}
                                        variant="outlined"
                                        size="small"
                                    >
                                        Подробнее
                                    </Button>
                                </CardActions>
                            </Card>
                        );
                    })}
                </List>
            )}

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
