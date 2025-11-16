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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    LinearProgress,
    FormControlLabel,
    Checkbox,
    Collapse,
    AppBar,
    Toolbar,
    IconButton,
} from "@mui/material";
import {
    ArrowBack,
    Delete as DeleteIcon,
    Add as AddIcon,
    ExpandLess,
    ExpandMore,
    Check as CheckIcon,
    ShoppingCart as CartIcon,
    Remove as RemoveIcon,
    Edit as EditIcon,
} from "@mui/icons-material";
import { ordersService } from "../../services/ordersService";
import { formatFirebaseTimestamp } from "../../utils/datetimeHelper";
import { useSettings } from "../../hooks/useSettings";
import { useLoading } from "../../hooks/LoadingContext";
import AlertDialog from "../../components/AlertDialog";
import { useAlert } from "../../hooks/useAlert";
import ConfirmDialog from "../../components/ConfirmDialog";
import OrderItem from "./OrderItem";

const OrderDetails = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const { getProductNameById, getProductInfo, sortCategories } = useSettings();
    const { withLoading } = useLoading();
    const { alertState, showError, showSuccess, hideAlert } = useAlert();
    const [completeOrderOpen, setCompleteOrderOpen] = useState(false);
    const [editItemDialogOpen, setEditItemDialogOpen] = useState(false);
    const [deleteOrderOpen, setDeleteOrderOpen] = useState(false);
    const [deleteItemOpen, setDeleteItemOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [editingItem, setEditingItem] = useState(null);

    const [expandedPendingCategories, setExpandedPendingCategories] = useState(new Set());
    const [expandedCompletedCategories, setExpandedCompletedCategories] = useState(new Set());

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

    const pendingItems = order?.items?.filter((item) => !item.isCompleted) || [];
    const groupedPendingItems = pendingItems.reduce((acc, item) => {
        const { category } = getProductInfo(item.productId);
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {});

    const completedItems = order?.items?.filter((item) => item.isCompleted) || [];
    const groupedCompletedItems = completedItems.reduce((acc, item) => {
        const { category } = getProductInfo(item.productId);
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {});

    // Сортируем категории для обоих блоков и товары внутри категорий по названию
    const sortedPendingCategories = sortCategories(groupedPendingItems);
    const sortedCompletedCategories = sortCategories(groupedCompletedItems);

    // Сортируем товары внутри каждой категории по названию
    sortedPendingCategories.forEach(([_, items]) => {
        items.sort((a, b) => getProductNameById(a.productId).localeCompare(getProductNameById(b.productId)));
    });

    sortedCompletedCategories.forEach(([_, items]) => {
        items.sort((a, b) => getProductNameById(a.productId).localeCompare(getProductNameById(b.productId)));
    });

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
                await ordersService.updateOrderItem(
                    orderId,
                    editingItem.productId,
                    editingItem.quantity,
                    editingItem.buyOnlyByAction
                );
                setEditItemDialogOpen(false);
                setEditingItem(null);
                setOrder({
                    ...order,
                    items: order.items.map((item) => ({
                        ...item,
                        quantity: item.productId === editingItem.productId ? editingItem.quantity : item.quantity,
                        buyOnlyByAction:
                            item.productId === editingItem.productId
                                ? editingItem.buyOnlyByAction
                                : item.buyOnlyByAction,
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

    const handleTryCompleteOrder = async (complete = true) => {
        if (pendingItems.filter(x => !x.buyOnlyByAction).length > 0 && complete) {
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

                showSuccess(
                    `Список ${complete ? "завершен" : "возобновлен"}`,
                    "Успешно",
                    complete ? navigate("/") : loadOrder
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
                showSuccess("Список успешно удален", "Успешно", navigate("/"));
            } catch (error) {
                showError(error.message);
            }
        });
    };

    const handleTogglePendingCategory = (category) => {
        setExpandedPendingCategories((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(category)) {
                newSet.delete(category);
            } else {
                newSet.add(category);
            }
            return newSet;
        });
    };

    const handleToggleCompletedCategory = (category) => {
        setExpandedCompletedCategories((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(category)) {
                newSet.delete(category);
            } else {
                newSet.add(category);
            }
            return newSet;
        });
    };

    const isPendingCategoryExpanded = (category) => {
        return expandedPendingCategories.has(category);
    };

    const isCompletedCategoryExpanded = (category) => {
        return expandedCompletedCategories.has(category);
    };

    if (!order) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h6">Загрузка...</Typography>
            </Box>
        );
    }

    const progressPercentage = order.items?.length > 0 ? (completedItems.length / order.items.length) * 100 : 0;

    return (
        <Box sx={{ pb: 8 }}>
            <AppBar position="sticky" sx={{ bgcolor: "white", color: "text.primary", boxShadow: 1 }}>
                <Toolbar>
                    <IconButton
                        edge="start"
                        onClick={() => navigate(order.isCompleted ? "/history" : "/")}
                        sx={{ mr: 0.5 }}
                        size="large"
                    >
                        <ArrowBack/>
                    </IconButton>
                    <Typography variant="h7" sx={{ flexGrow: 1, fontWeight: 600 }}>
                        {order.title}
                    </Typography>
                    <IconButton
                        color="primary"
                        onClick={() => navigate(`/edit-order/${orderId}`)}
                        size="large"
                    >
                        <EditIcon/>
                    </IconButton>
                    <IconButton color="error" onClick={() => setDeleteOrderOpen(true)} size="large">
                        <DeleteIcon/>
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Box sx={{ p: 2 }}>
                {/* Статистика списка */}
                <Card sx={{ mb: 3, borderRadius: 2 }}>
                    <CardContent>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                            <Chip
                                label={order.isCompleted ? "Завершен" : "Активный"}
                                color={order.isCompleted ? "success" : "primary"}
                                variant="filled"
                            />
                            <Typography variant="body2" color="textSecondary">
                                {formatFirebaseTimestamp(order.createdAt)}
                            </Typography>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                <Typography variant="body2" color="textSecondary">
                                    Прогресс:
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {completedItems.length} / {order.items?.length}
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={progressPercentage}
                                sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: "#f0f0f0",
                                    "& .MuiLinearProgress-bar": {
                                        borderRadius: 4,
                                        backgroundColor: order.isCompleted ? "#4caf50" : "#1976d2",
                                    },
                                }}
                            />
                        </Box>
                    </CardContent>
                </Card>

                {/* Товары для покупки */}
                {pendingItems.length > 0 && (
                    <Card sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ p: 0 }}>
                            <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Осталось купить ({pendingItems.length})
                                </Typography>
                            </Box>
                            <List>
                                {sortedPendingCategories.map(([category, items]) => (
                                    <Box key={category}>
                                        <ListItem
                                            button="true"
                                            onClick={() => handleTogglePendingCategory(category)}
                                            sx={{
                                                backgroundColor: '#e3f2fd',
                                                borderBottom: "1px solid",
                                                borderColor: "grey.200",
                                                '&:active': {
                                                    backgroundColor: '#e3f2fd',
                                                },
                                                '&:hover': {
                                                    backgroundColor: '#e3f2fd',
                                                }
                                            }}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                        <Typography variant="subtitle1" fontWeight="bold">
                                                            {category}
                                                        </Typography>
                                                        <Chip
                                                            label={items.length}
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                        />
                                                    </Box>
                                                }
                                            />
                                            {isPendingCategoryExpanded(category) ? <ExpandLess/> : <ExpandMore/>}
                                        </ListItem>
                                        <Collapse in={isPendingCategoryExpanded(category)} timeout="auto" unmountOnExit>
                                            <List component="div" disablePadding>
                                                {items.map((item) => (
                                                    <OrderItem
                                                        key={item.productId}
                                                        item={item}
                                                        order={order}
                                                        onEdit={handleEditItem}
                                                        onDelete={handleOpenDeleteItem}
                                                        onComplete={handleCompleteItem}
                                                        getProductNameById={getProductNameById}
                                                        getProductInfo={getProductInfo}
                                                    />
                                                ))}
                                            </List>
                                        </Collapse>
                                    </Box>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                )}

                {/* Комментарий */}
                {order.comment && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                            Комментарий:
                        </Typography>
                        <Card variant="outlined" sx={{ backgroundColor: 'grey.50', p: 2 }}>
                            <Typography
                                variant="body1"
                                sx={{
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    lineHeight: 1.5,
                                }}
                            >
                                {order.comment}
                            </Typography>
                        </Card>
                    </Box>
                )}

                {/* Купленные товары */}
                {completedItems.length > 0 && (
                    <Card sx={{ my: 3, borderRadius: 2 }}>
                        <CardContent sx={{ p: 0 }}>
                            <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Куплено ({completedItems.length})
                                </Typography>
                            </Box>
                            <List>
                                {sortedCompletedCategories.map(([category, items]) => (
                                    <Box key={category}>
                                        <ListItem
                                            button="true"
                                            onClick={() => handleToggleCompletedCategory(category)}
                                            sx={{
                                                backgroundColor: '#e3f2fd',
                                                borderBottom: "1px solid",
                                                borderColor: "grey.200",
                                                '&:active': {
                                                    backgroundColor: '#e3f2fd',
                                                },
                                                '&:hover': {
                                                    backgroundColor: '#e3f2fd',
                                                }
                                            }}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                        <Typography variant="subtitle1" fontWeight="bold">
                                                            {category}
                                                        </Typography>
                                                        <Chip
                                                            label={items.length}
                                                            size="small"
                                                            color="success"
                                                            variant="outlined"
                                                        />
                                                    </Box>
                                                }
                                            />
                                            {isCompletedCategoryExpanded(category) ? <ExpandLess/> : <ExpandMore/>}
                                        </ListItem>
                                        <Collapse
                                            in={isCompletedCategoryExpanded(category)}
                                            timeout="auto"
                                            unmountOnExit
                                        >
                                            <List component="div" disablePadding>
                                                {items.map((item) => (
                                                    <OrderItem
                                                        key={item.productId}
                                                        item={item}
                                                        order={order}
                                                        onEdit={handleEditItem}
                                                        onDelete={handleOpenDeleteItem}
                                                        onComplete={handleCompleteItem}
                                                        getProductNameById={getProductNameById}
                                                        getProductInfo={getProductInfo}
                                                    />
                                                ))}
                                            </List>
                                        </Collapse>
                                    </Box>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                )}

                {/* Кнопка завершения/возобновления */}
                {!order.isCompleted ? (
                    <Button
                        variant="contained"
                        color="success"
                        onClick={() => handleTryCompleteOrder(true)}
                        disabled={order.items.length === 0}
                        fullWidth
                        size="large"
                        startIcon={<CheckIcon/>}
                        sx={{ borderRadius: 2 }}
                    >
                        Завершить список
                    </Button>
                ) : (
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => handleTryCompleteOrder(false)}
                        fullWidth
                        size="large"
                        sx={{ borderRadius: 2 }}
                    >
                        Возобновить список
                    </Button>
                )}
            </Box>

            {/* Диалог редактирования товара */}
            <Dialog
                open={editItemDialogOpen}
                onClose={() => setEditItemDialogOpen(false)}
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
                        borderBottom: 1,
                        borderColor: "divider",
                    }}
                >
                    Редактировать товар
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                    {editingItem && (
                        <Box sx={{ pt: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                {getProductNameById(editingItem.productId)}
                            </Typography>

                            {/* Управление количеством */}
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                    Количество:
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <IconButton
                                        onClick={() => setEditingItem({
                                            ...editingItem,
                                            quantity: Math.max(1, editingItem.quantity - 1)
                                        })}
                                        disabled={editingItem.quantity <= 1}
                                        sx={{
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: '50%',
                                        }}
                                    >
                                        <RemoveIcon fontSize="small"/>
                                    </IconButton>

                                    <Typography
                                        variant="body1"
                                        sx={{
                                            minWidth: 40,
                                            textAlign: 'center',
                                            fontWeight: 600,
                                            color: "primary.main",
                                            fontSize: '1.1rem'
                                        }}
                                    >
                                        {editingItem.quantity}
                                    </Typography>

                                    <IconButton
                                        onClick={() => setEditingItem({
                                            ...editingItem,
                                            quantity: editingItem.quantity + 1
                                        })}
                                        sx={{
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: '50%'
                                        }}
                                    >
                                        <AddIcon fontSize="small"/>
                                    </IconButton>
                                </Box>
                            </Box>

                            {/* Чекбокс с иконкой корзинки */}
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={editingItem.buyOnlyByAction}
                                        onChange={() =>
                                            setEditingItem({
                                                ...editingItem,
                                                buyOnlyByAction: !editingItem.buyOnlyByAction,
                                            })
                                        }
                                    />
                                }
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CartIcon
                                            fontSize="small"
                                            color={editingItem.buyOnlyByAction ? "error" : "inherit"}
                                        />
                                        <Typography>Только по акции</Typography>
                                    </Box>
                                }
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0, gap: 2 }}>
                    <Button
                        onClick={() => setEditItemDialogOpen(false)}
                        variant="outlined"
                        size="large"
                        sx={{
                            flex: 1,
                            borderRadius: 2,
                        }}
                    >
                        Отмена
                    </Button>
                    <Button
                        onClick={handleUpdateItem}
                        variant="contained"
                        size="large"
                        sx={{
                            flex: 1,
                            borderRadius: 2,
                        }}
                    >
                        Сохранить
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

            <ConfirmDialog
                open={completeOrderOpen}
                onClose={() => setCompleteOrderOpen(false)}
                onConfirm={() => handleCompleteOrder(true)}
                title="Завершить список"
                message="В списке имеются не завершенные товары. Вы уверены, что хотите завершить список?"
                confirmText="Завершить"
                cancelText="Отмена"
            />

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
                        ? `Вы уверены, что хотите удалить "${getProductNameById(itemToDelete.productId)}" из списка?`
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
