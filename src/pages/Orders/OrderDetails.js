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
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import {
    ArrowBack,
    RadioButtonChecked,
    RadioButtonUnchecked,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
} from "@mui/icons-material";
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
    const { activeProducts, getProductNameById, getProductInfo } = useSettings();
    const { withLoading } = useLoading();
    const { alertState, showError, showSuccess, hideAlert } = useAlert();
    const [completeOrderOpen, setCompleteOrderOpen] = useState(false);
    const [editItemDialogOpen, setEditItemDialogOpen] = useState(false);
    const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
    const [deleteOrderOpen, setDeleteOrderOpen] = useState(false);
    const [deleteItemOpen, setDeleteItemOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [newItem, setNewItem] = useState({ productId: "", quantity: 1 });

    const loadOrder = useCallback(async () => {
        await withLoading(async () => {
            try {
                const orderData = await ordersService.getOrder(orderId);
                setOrder(orderData);
            } catch (error) {
                showError(error.message);
            }
        });
    }, [orderId, withLoading, showError]);

    useEffect(() => {
        if (orderId) {
            loadOrder();
        }
    }, [orderId, loadOrder]);

    const handleCompleteItem = async (productId, complete = true) => {
        if (order.isCompleted) return;

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
                showError(error.message);
            }
        });
    };

    const handleEditItem = (item) => {
        setEditingItem({ ...item });
        setEditItemDialogOpen(true);
    };

    const handleUpdateItem = async () => {
        if (!editingItem || editingItem.quantity < 1) {
            showError("Введите корректное количество");
            return;
        }

        await withLoading(async () => {
            try {
                await ordersService.updateOrderItem(orderId, editingItem.productId, editingItem.quantity);
                setEditItemDialogOpen(false);
                setEditingItem(null);
                setOrder({
                    ...order,
                    items: order.items.map((item) => ({
                        ...item,
                        quantity: item.productId === editingItem.productId ? editingItem.quantity : item.quantity,
                    })),
                });
            } catch (error) {
                showError(error.message);
            }
        });
    };

    const handleOpenDeleteItem = (item) => {
        setItemToDelete(item);
        setDeleteItemOpen(true);
    };

    const handleRemoveItem = async () => {
        if (!itemToDelete) return;

        await withLoading(async () => {
            try {
                await ordersService.removeItemFromOrder(orderId, itemToDelete.productId);
                setDeleteItemOpen(false);
                setItemToDelete(null);
                setOrder({
                    ...order,
                    items: order.items.filter((item) => item.productId !== itemToDelete.productId),
                });
            } catch (error) {
                showError(error.message);
            }
        });
    };

    const handleAddItem = async () => {
        if (!newItem.productId) {
            showError("Выберите товар");
            return;
        }

        if (newItem.quantity < 1) {
            showError("Введите корректное количество");
            return;
        }

        const isAlreadyAdded = order.items.some((item) => item.productId === newItem.productId);
        if (isAlreadyAdded) {
            showError("Этот товар уже есть в списке");
            return;
        }

        await withLoading(async () => {
            try {
                await ordersService.addItemToOrder(orderId, {
                    productId: newItem.productId,
                    quantity: newItem.quantity,
                });
                setAddItemDialogOpen(false);
                setNewItem({ productId: "", quantity: 1 });
                setOrder({
                    ...order,
                    items: [
                        ...order.items,
                        { productId: newItem.productId, quantity: newItem.quantity, isCompleted: false },
                    ],
                });
            } catch (error) {
                showError(error.message);
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
                setCompleteOrderOpen(false);

                showSuccess(`Список ${complete ? "завершен" : "возобновлен"}`, "Успешно", () =>
                    complete ? navigate("/") : null
                );
            } catch (error) {
                showError(error.message);
            }
        });
    };

    const handleDeleteOrder = async () => {
        await withLoading(async () => {
            try {
                await ordersService.deleteOrder(orderId);
                setDeleteOrderOpen(false);
                showSuccess("Список успешно удален", "Успешно", () => navigate("/"));
            } catch (error) {
                showError(error.message);
            }
        });
    };

    const handleBack = () => {
        navigate(-1);
    };

    if (!order) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h6">Список не найден</Typography>
                <Button onClick={handleBack}>Назад</Button>
            </Box>
        );
    }

    const completedItems = order.items?.filter((item) => item.isCompleted) || [];
    const pendingItems = order.items?.filter((item) => !item.isCompleted) || [];

    const getItemToDeleteInfo = () => {
        if (!itemToDelete) return { name: "", category: "", quantity: 1 };
        const { category, unit } = getProductInfo(itemToDelete.productId);
        return {
            name: getProductNameById(itemToDelete.productId),
            category,
            quantity: itemToDelete.quantity,
            unit,
        };
    };

    const itemToDeleteInfo = getItemToDeleteInfo();

    return (
        <Box sx={{ p: 3 }}>
            {/* Шапка */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <IconButton onClick={handleBack} sx={{ mr: 2 }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h4">{order.title}</Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 2 }}>
                    {!order.isCompleted && (
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddItemDialogOpen(true)}>
                            Добавить товар
                        </Button>
                    )}
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => setDeleteOrderOpen(true)}
                    >
                        Удалить список
                    </Button>
                </Box>
            </Box>

            {/* Информация о списке */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 2 }}>
                        <Box>
                            <Typography variant="body2" color="textSecondary">
                                Создан: {formatFirebaseTimestamp(order.createdAt)}
                            </Typography>
                            {order.completedAt && (
                                <Typography variant="body2" color="textSecondary">
                                    Завершен: {formatFirebaseTimestamp(order.completedAt)}
                                </Typography>
                            )}
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
                        Осталось купить ({pendingItems.length})
                    </Typography>
                    <List>
                        {pendingItems.map((item) => {
                            const { category, unit } = getProductInfo(item.productId);

                            return (
                                <ListItem
                                    key={item.productId}
                                    secondaryAction={
                                        <Box sx={{ display: "flex", gap: 1 }}>
                                            <IconButton edge="end" onClick={() => handleEditItem(item)} color="primary">
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                edge="end"
                                                onClick={() => handleOpenDeleteItem(item)}
                                                color="error"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                            <IconButton edge="end" onClick={() => handleCompleteItem(item.productId)}>
                                                <RadioButtonUnchecked />
                                            </IconButton>
                                        </Box>
                                    }
                                >
                                    <ListItemText
                                        primary={`${getProductNameById(item.productId)} (${category})`}
                                        secondary={`Количество: ${item.quantity} ${unit}`}
                                    />
                                </ListItem>
                            );
                        })}
                    </List>
                    <Divider sx={{ my: 2 }} />
                </>
            )}

            {/* Завершенные товары */}
            {completedItems.length > 0 && (
                <>
                    <Typography variant="h6" gutterBottom>
                        Куплено ({completedItems.length})
                    </Typography>
                    <List>
                        {completedItems.map((item) => {
                            const { category, unit } = getProductInfo(item.productId);

                            return (
                                <ListItem
                                    key={item.productId}
                                    secondaryAction={
                                        !order.isCompleted && (
                                            <IconButton
                                                edge="end"
                                                onClick={() => handleCompleteItem(item.productId, false)}
                                            >
                                                <RadioButtonChecked />
                                            </IconButton>
                                        )
                                    }
                                >
                                    <ListItemText
                                        primary={`${getProductNameById(item.productId)} (${category})`}
                                        secondary={`Количество: ${item.quantity} ${unit}`}
                                        sx={{
                                            opacity: 0.7,
                                            textDecoration: order.isCompleted ? "line-through" : "none",
                                        }}
                                    />
                                </ListItem>
                            );
                        })}
                    </List>
                </>
            )}

            {/* Кнопки управления списком */}
            <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
                {!order.isCompleted ? (
                    <Button
                        variant="contained"
                        color="success"
                        onClick={() => handleTryCompleteOrder(true)}
                        disabled={order.items.length === 0}
                        sx={{ flex: 1 }}
                    >
                        Завершить список
                    </Button>
                ) : (
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => handleTryCompleteOrder(false)}
                        sx={{ flex: 1 }}
                    >
                        Возобновить список
                    </Button>
                )}
            </Box>

            {/* Диалог редактирования товара */}
            <Dialog open={editItemDialogOpen} onClose={() => setEditItemDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Редактировать товар</DialogTitle>
                <DialogContent>
                    {editingItem && (
                        <Box sx={{ pt: 2 }}>
                            <Typography variant="body1" gutterBottom>
                                {getProductNameById(editingItem.productId)}
                            </Typography>
                            <TextField
                                label="Количество"
                                type="number"
                                value={editingItem.quantity}
                                onChange={(e) =>
                                    setEditingItem({
                                        ...editingItem,
                                        quantity: parseInt(e.target.value) || 1,
                                    })
                                }
                                fullWidth
                                margin="normal"
                                inputProps={{ min: 1 }}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditItemDialogOpen(false)}>Отмена</Button>
                    <Button onClick={handleUpdateItem} variant="contained">
                        Сохранить
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Диалог добавления товара */}
            <Dialog open={addItemDialogOpen} onClose={() => setAddItemDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Добавить товар</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Товар</InputLabel>
                            <Select
                                value={newItem.productId}
                                onChange={(e) => setNewItem({ ...newItem, productId: e.target.value })}
                                label="Товар"
                            >
                                <MenuItem value="">Выберите товар</MenuItem>
                                {activeProducts
                                    .filter((product) => !order.items.some((item) => item.productId === product.id))
                                    .map((product) => {
                                        const { category } = getProductInfo(product.id);

                                        return (
                                            <MenuItem key={product.id} value={product.id}>
                                                {product.name} ({category})
                                            </MenuItem>
                                        );
                                    })}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Количество"
                            type="number"
                            value={newItem.quantity}
                            onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                            fullWidth
                            margin="normal"
                            inputProps={{ min: 1 }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddItemDialogOpen(false)}>Отмена</Button>
                    <Button onClick={handleAddItem} variant="contained">
                        Добавить
                    </Button>
                </DialogActions>
            </Dialog>

            <AlertDialog
                open={alertState.open}
                onClose={hideAlert}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
            />

            {/* Подтверждение завершения списка */}
            <ConfirmDialog
                open={completeOrderOpen}
                onClose={() => setCompleteOrderOpen(false)}
                onConfirm={() => handleCompleteOrder(true)}
                title="Завершить список"
                message={`В списке имеются не завершенные товары. Вы уверены, что хотите завершить список?`}
                confirmText="Завершить"
                cancelText="Отмена"
            />

            {/* Подтверждение удаления списка */}
            <ConfirmDialog
                open={deleteOrderOpen}
                onClose={() => setDeleteOrderOpen(false)}
                onConfirm={handleDeleteOrder}
                title="Удалить список"
                message={`Вы уверены, что хотите удалить список "${order.title}"? Это действие нельзя отменить.`}
                confirmText="Удалить"
                cancelText="Отмена"
                confirmColor="error"
            />

            {/* Подтверждение удаления товара */}
            <ConfirmDialog
                open={deleteItemOpen}
                onClose={() => {
                    setDeleteItemOpen(false);
                    setItemToDelete(null);
                }}
                onConfirm={handleRemoveItem}
                title="Удалить товар"
                message={
                    itemToDelete
                        ? `Вы уверены, что хотите удалить "${itemToDeleteInfo.name}" (${itemToDeleteInfo.quantity} ${itemToDeleteInfo.unit}) из списка?`
                        : "Удалить товар?"
                }
                confirmText="Удалить"
                cancelText="Отмена"
                confirmColor="error"
            />
        </Box>
    );
};

export default OrderDetails;
