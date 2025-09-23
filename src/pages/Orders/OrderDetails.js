import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Chip,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Divider,
} from "@mui/material";
import { ArrowBack, RadioButtonChecked, RadioButtonUnchecked } from "@mui/icons-material";
import { ordersService } from "../../services/ordersService";
import { formatFirebaseTimestamp } from "../../utils/datetimeHelper";
import { useSettings } from "../../hooks/useSettings";
import { useLoading } from "../../hooks/LoadingContext";
import AlertDialog from "../../components/AlertDialog";
import { useAlert } from "../../hooks/useAlert";
import ConfirmDialog from "../../components/ConfirmDialog";

const OrderDetails = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const { getProductNameById } = useSettings();
    const { withLoading } = useLoading();
    const { alertState, showError, hideAlert } = useAlert();
    const [completeOrderOpen, setCompleteOrderOpen] = useState(false);

    const loadOrder = useCallback(async () => {
        await withLoading(async () => {
            try {
                const orderData = await ordersService.getOrder(orderId);
                setOrder(orderData);
            } catch (error) {
                showError(error);
            }
        });
    }, [orderId, withLoading, showError]);

    useEffect(() => {
        if (orderId) {
            loadOrder();
        }
    }, [orderId, loadOrder]);

    const handleCompleteItem = async (productId, complete = true) => {
        await withLoading(async () => {
            try {
                await ordersService.completeOrderItem(orderId, productId, complete);
                setOrder({
                    ...order,
                    items: order.items.map((item) => ({
                        ...item,
                        isCompleted: item.productId === productId ? complete : item.isCompleted,
                    })),
                });
            } catch (error) {
                showError(error);
            }
        });
    };

    const handleTryCompleteOrder = async (complete = true) => {
        if (pendingItems.length > 0 && complete) {
            setCompleteOrderOpen(true);
        } else {
            await handleCompleteOrder(complete);
        }
    };

    const handleCompleteOrder = async (complete = true) => {
        await withLoading(async () => {
            try {
                await ordersService.completeOrder(orderId, complete);
                setOrder({ ...order, isCompleted: complete });

                setCompleteOrderOpen(false);

                if (complete) {
                    navigate('/');
                }
            } catch (error) {
                showError(error);
            }
        });
    };

    const handleBack = () => {
        navigate(-1);
    };

    if (!order) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h6">Заказ не найден</Typography>
                <Button onClick={handleBack}>Назад</Button>
            </Box>
        );
    }

    const completedItems = order.items?.filter((item) => item.isCompleted) || [];
    const pendingItems = order.items?.filter((item) => !item.isCompleted) || [];

    return (
        <Box sx={{ p: 3 }}>
            {/* Шапка */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <IconButton onClick={handleBack} sx={{ mr: 2 }}>
                    <ArrowBack />
                </IconButton>
                <Typography variant="h4">{order.title}</Typography>
            </Box>

            {/* Информация о заказе */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 2 }}>
                        <Box>
                            <Typography variant="body2" color="textSecondary">
                                Создан: {formatFirebaseTimestamp(order.createdAt)}
                            </Typography>
                        </Box>
                        <Chip
                            label={order.isCompleted ? "Завершен" : "В процессе"}
                            color={order.isCompleted ? "success" : "primary"}
                        />
                    </Box>

                    <Typography variant="body2">
                        Прогресс: {completedItems.length} / {order.items?.length} товаров
                    </Typography>
                </CardContent>
            </Card>

            {/* Товары */}
            <Typography variant="h5" gutterBottom>
                Товары ({order.items?.length || 0})
            </Typography>

            {/* Незавершенные товары */}
            {pendingItems.length > 0 && (
                <>
                    <Typography variant="h6" gutterBottom>
                        Осталось купить
                    </Typography>
                    <List>
                        {pendingItems.map((item) => (
                            <ListItem
                                key={item.productId}
                                secondaryAction={
                                    <IconButton edge="end" onClick={() => handleCompleteItem(item.productId)}>
                                        <RadioButtonUnchecked />
                                    </IconButton>
                                }
                            >
                                <ListItemText
                                    primary={getProductNameById(item.productId)}
                                    secondary={`Количество: ${item.quantity}`}
                                />
                            </ListItem>
                        ))}
                    </List>
                    <Divider sx={{ my: 2 }} />
                </>
            )}

            {/* Завершенные товары */}
            {completedItems.length > 0 && (
                <>
                    <Typography variant="h6" gutterBottom>
                        Куплено
                    </Typography>
                    <List>
                        {completedItems.map((item) => (
                            <ListItem
                                key={item.productId}
                                secondaryAction={
                                    <IconButton edge="end" onClick={() => handleCompleteItem(item.productId, false)}>
                                        <RadioButtonChecked />
                                    </IconButton>
                                }
                            >
                                <ListItemText
                                    primary={getProductNameById(item.productId)}
                                    secondary={`Количество: ${item.quantity}`}
                                />
                            </ListItem>
                        ))}
                    </List>
                </>
            )}

            {/* Кнопка завершения заказа */}
            {!order.isCompleted ? (
                <Box sx={{ mt: 3 }}>
                    <Button variant="contained" color="success" onClick={() => handleTryCompleteOrder(true)} fullWidth>
                        Завершить
                    </Button>
                </Box>
            ) : (
                <Box sx={{ mt: 3 }}>
                    <Button variant="contained" color="success" onClick={() => handleTryCompleteOrder(false)} fullWidth>
                        Возобносить
                    </Button>
                </Box>
            )}

            <AlertDialog
                open={alertState.open}
                onClose={hideAlert}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
            />

            <ConfirmDialog
                open={completeOrderOpen}
                onClose={() => setCompleteOrderOpen(false)}
                onConfirm={() => handleCompleteOrder(true)}
                title="Завершить список"
                message={`В списке имеются не завершенные товары. Вы уверены, что хотите завершить?`}
                confirmText="Завершить"
                cancelText="Отмена"
            />
        </Box>
    );
};

export default OrderDetails;
