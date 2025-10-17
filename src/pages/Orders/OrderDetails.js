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
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    Autocomplete,
    LinearProgress,
    FormControlLabel,
    Checkbox,
    Collapse,
    AppBar,
    Toolbar,
    IconButton,
    Fab,
} from "@mui/material";
import {
    ArrowBack,
    Delete as DeleteIcon,
    Add as AddIcon,
    ExpandLess,
    ExpandMore,
    Check as CheckIcon,
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
    const [newItem, setNewItem] = useState({ productId: "", quantity: 1, buyOnlyByAction: false });
    const [searchInput, setSearchInput] = useState("");

    const [expandedPendingCategories, setExpandedPendingCategories] = useState(new Set());
    const [expandedCompletedCategories, setExpandedCompletedCategories] = useState(new Set());

    const isAnyDialogOpen =
        editItemDialogOpen ||
        addItemDialogOpen ||
        deleteOrderOpen ||
        deleteItemOpen ||
        completeOrderOpen ||
        alertState.open;

    // Функция для сортировки продуктов по категориям
    const getSortedProducts = (products) => {
        return [...products].sort((a, b) => {
            const categoryA = getProductInfo(a.id).category;
            const categoryB = getProductInfo(b.id).category;

            if (categoryA < categoryB) return -1;
            if (categoryA > categoryB) return 1;

            // Если категории одинаковые, сортируем по названию
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;

            return 0;
        });
    };

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

    const filteredProducts = getSortedProducts(
        activeProducts
            .filter((product) => {
                if (!searchInput) return true;

                const searchLower = searchInput.toLowerCase();
                const productName = product.name.toLowerCase();
                const category = getProductInfo(product.id).category.toLowerCase();

                return productName.includes(searchLower) || category.includes(searchLower);
            })
            .filter((product) => !order?.items?.some((item) => item.productId === product.id))
    );

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

    const handleProductSelect = (_, value) => {
        if (value) {
            setNewItem({ ...newItem, productId: value.id });
        } else {
            setNewItem({ ...newItem, productId: "", buyOnlyByAction: false });
            setSearchInput("");
        }
    };

    const handleSearchInputChange = (_, value) => {
        setSearchInput(value);
    };

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
                    buyOnlyByAction: newItem.buyOnlyByAction,
                });
                setAddItemDialogOpen(false);

                setOrder({
                    ...order,
                    items: [
                        ...order.items,
                        {
                            productId: newItem.productId,
                            quantity: newItem.quantity,
                            isCompleted: false,
                            buyOnlyByAction: newItem.buyOnlyByAction,
                        },
                    ],
                });

                setNewItem({ productId: "", quantity: 1, buyOnlyByAction: false });
                setSearchInput("");
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
                        sx={{ mr: 2 }}
                        size="large"
                    >
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                        {order.title}
                    </Typography>
                    <IconButton color="error" onClick={() => setDeleteOrderOpen(true)} size="large">
                        <DeleteIcon />
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
                    <Card sx={{ mb: 3, borderRadius: 2 }}>
                        <CardContent sx={{ p: 0 }}>
                            <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Осталось купить ({pendingItems.length})
                                </Typography>
                            </Box>
                            <List>
                                {Object.entries(groupedPendingItems).map(([category, items]) => (
                                    <Box key={category}>
                                        <ListItem
                                            button="true"
                                            onClick={() => handleTogglePendingCategory(category)}
                                            sx={{
                                                backgroundColor: "grey.50",
                                                borderBottom: "1px solid",
                                                borderColor: "grey.200",
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
                                            {isPendingCategoryExpanded(category) ? <ExpandLess /> : <ExpandMore />}
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

                {/* Купленные товары */}
                {completedItems.length > 0 && (
                    <Card sx={{ mb: 3, borderRadius: 2 }}>
                        <CardContent sx={{ p: 0 }}>
                            <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Куплено ({completedItems.length})
                                </Typography>
                            </Box>
                            <List>
                                {Object.entries(groupedCompletedItems).map(([category, items]) => (
                                    <Box key={category}>
                                        <ListItem
                                            button="true"
                                            onClick={() => handleToggleCompletedCategory(category)}
                                            sx={{
                                                backgroundColor: "grey.50",
                                                borderBottom: "1px solid",
                                                borderColor: "grey.200",
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
                                            {isCompletedCategoryExpanded(category) ? <ExpandLess /> : <ExpandMore />}
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
                        startIcon={<CheckIcon />}
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
                                sx={{ mb: 3 }}
                                slotProps={{
                                    htmlInput: {
                                        min: 1,
                                    },
                                }}
                            />
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
                                label="Только по акции"
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

            {/* Диалог добавления товара */}
            <Dialog
                open={addItemDialogOpen}
                onClose={() => setAddItemDialogOpen(false)}
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
                            maxHeight: "calc(100% - 40px)",
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
                    Добавить товар
                </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <Autocomplete
                            value={activeProducts.find((p) => p.id === newItem.productId) || null}
                            onChange={handleProductSelect}
                            onInputChange={handleSearchInputChange}
                            inputValue={searchInput}
                            options={filteredProducts}
                            filterOptions={(x) => x}
                            getOptionLabel={(option) => option.name}
                            groupBy={(option) => getProductInfo(option.id).category}
                            renderOption={(props, option) => {
                                const { key, ...otherProps } = props;
                                const { unit } = getProductInfo(option.id);
                                return (
                                    <li key={option.id} {...otherProps}>
                                        <Box sx={{ pl: 2 }}>
                                            <Typography variant="body1">{option.name}</Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                {unit}
                                            </Typography>
                                        </Box>
                                    </li>
                                );
                            }}
                            renderGroup={(params) => (
                                <div key={params.key}>
                                    <Box
                                        sx={{
                                            backgroundColor: "grey.100",
                                            fontWeight: "bold",
                                            px: 2,
                                            py: 1,
                                            position: "sticky",
                                            top: 0,
                                            zIndex: 1,
                                        }}
                                    >
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {params.group}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ pl: 0 }}>{params.children}</Box>
                                </div>
                            )}
                            renderInput={(params) => (
                                <TextField {...params} label="Поиск товара" placeholder="Начните вводить название..." />
                            )}
                            noOptionsText="Товары не найдены"
                        />
                    </FormControl>
                    <TextField
                        label="Количество"
                        type="number"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                        fullWidth
                        sx={{ mb: 3 }}
                        slotProps={{
                            htmlInput: {
                                min: 1,
                            },
                        }}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={newItem.buyOnlyByAction}
                                onChange={() => setNewItem({ ...newItem, buyOnlyByAction: !newItem.buyOnlyByAction })}
                            />
                        }
                        label="Только по акции"
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0, gap: 2 }}>
                    <Button
                        onClick={() => setAddItemDialogOpen(false)}
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
                        onClick={handleAddItem}
                        variant="contained"
                        disabled={!newItem.productId}
                        size="large"
                        sx={{
                            flex: 1,
                            borderRadius: 2,
                        }}
                    >
                        Добавить
                    </Button>
                </DialogActions>
            </Dialog>

            {/* FAB для добавления товара */}
            {!order.isCompleted && !isAnyDialogOpen && (
                <Fab
                    color="primary"
                    aria-label="add item"
                    onClick={() => setAddItemDialogOpen(true)}
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
