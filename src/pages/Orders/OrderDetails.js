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
    Autocomplete,
    LinearProgress,
    FormControlLabel,
    Checkbox,
    Collapse,
    Tooltip,
} from "@mui/material";
import {
    ArrowBack,
    RadioButtonChecked,
    RadioButtonUnchecked,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    ExpandLess,
    ExpandMore,
    UnfoldLess,
    UnfoldMore,
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
    const [newItem, setNewItem] = useState({ productId: "", quantity: 1, buyOnlyByAction: false });
    const [searchInput, setSearchInput] = useState("");

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

    const filteredProducts = activeProducts
        .filter((product) => {
            if (!searchInput) return true;

            const searchLower = searchInput.toLowerCase();
            const productName = product.name.toLowerCase();
            const category = getProductInfo(product.id).category.toLowerCase();

            return productName.includes(searchLower) || category.includes(searchLower);
        })
        .filter((product) => !order?.items?.some((item) => item.productId === product.id));

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

    const expandAllPendingCategories = () => {
        const categories = Object.keys(groupedPendingItems);
        setExpandedPendingCategories(new Set(categories));
    };

    const collapseAllPendingCategories = () => {
        setExpandedPendingCategories(new Set());
    };

    const expandAllCompletedCategories = () => {
        const categories = Object.keys(groupedCompletedItems);
        setExpandedCompletedCategories(new Set(categories));
    };

    const collapseAllCompletedCategories = () => {
        setExpandedCompletedCategories(new Set());
    };

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
                <Typography variant="h6">Список не найден</Typography>
                <Button onClick={handleBack}>Назад</Button>
            </Box>
        );
    }

    const progressPercentage = order.items?.length > 0 ? (completedItems.length / order.items.length) * 100 : 0;

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

                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                            <Typography variant="body2" color="textSecondary">
                                Прогресс:
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {completedItems.length} / {order.items?.length} товаров
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
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
                            <Typography variant="body2" color="textSecondary">
                                {Math.round(progressPercentage)}% выполнено
                            </Typography>
                            {!order.isCompleted && pendingItems.length > 0 && (
                                <Typography variant="body2" color="textSecondary">
                                    Осталось: {pendingItems.length}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            <Typography variant="h5" gutterBottom>
                Товары ({order.items?.length || 0})
            </Typography>

            {pendingItems.length > 0 && (
                <>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Typography variant="h6">Осталось купить ({pendingItems.length})</Typography>
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <Tooltip title="Развернуть все категории">
                                <IconButton size="small" onClick={expandAllPendingCategories} color="primary">
                                    <UnfoldMore />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Свернуть все категории">
                                <IconButton size="small" onClick={collapseAllPendingCategories} color="primary">
                                    <UnfoldLess />
                                </IconButton>
                            </Tooltip>
                        </Box>
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
                                        {items.map((item) => {
                                            const { unit } = getProductInfo(item.productId);
                                            return (
                                                <ListItem
                                                    key={item.productId}
                                                    sx={{
                                                        pr: 8,
                                                        pl: 4,
                                                        backgroundColor: "background.paper",
                                                    }}
                                                    secondaryAction={
                                                        <Box sx={{ display: "flex", gap: 1 }}>
                                                            <IconButton
                                                                edge="end"
                                                                onClick={() => handleEditItem(item)}
                                                                color="primary"
                                                            >
                                                                <EditIcon />
                                                            </IconButton>
                                                            <IconButton
                                                                edge="end"
                                                                onClick={() => handleOpenDeleteItem(item)}
                                                                color="error"
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                            <IconButton
                                                                edge="end"
                                                                onClick={() => handleCompleteItem(item.productId)}
                                                            >
                                                                <RadioButtonUnchecked />
                                                            </IconButton>
                                                        </Box>
                                                    }
                                                >
                                                    <ListItemText
                                                        primary={
                                                            <>
                                                                {getProductNameById(item.productId)}&nbsp;
                                                                {item.buyOnlyByAction && (
                                                                    <Chip
                                                                        label="Только по акции"
                                                                        size="small"
                                                                        variant="outlined"
                                                                        sx={{ mr: 1, color: "red" }}
                                                                    />
                                                                )}
                                                            </>
                                                        }
                                                        secondary={`Количество: ${item.quantity} ${unit}`}
                                                    />
                                                </ListItem>
                                            );
                                        })}
                                    </List>
                                </Collapse>
                            </Box>
                        ))}
                    </List>
                    <Divider sx={{ my: 2 }} />
                </>
            )}

            {completedItems.length > 0 && (
                <>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Typography variant="h6">Куплено ({completedItems.length})</Typography>
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <Tooltip title="Развернуть все категории">
                                <IconButton size="small" onClick={expandAllCompletedCategories} color="primary">
                                    <UnfoldMore />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Свернуть все категории">
                                <IconButton size="small" onClick={collapseAllCompletedCategories} color="primary">
                                    <UnfoldLess />
                                </IconButton>
                            </Tooltip>
                        </Box>
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
                                <Collapse in={isCompletedCategoryExpanded(category)} timeout="auto" unmountOnExit>
                                    <List component="div" disablePadding>
                                        {items.map((item) => {
                                            const { unit } = getProductInfo(item.productId);
                                            return (
                                                <ListItem
                                                    key={item.productId}
                                                    sx={{
                                                        pr: 8,
                                                        pl: 4,
                                                        backgroundColor: "background.paper",
                                                    }}
                                                    secondaryAction={
                                                        !order.isCompleted && (
                                                            <IconButton
                                                                edge="end"
                                                                onClick={() =>
                                                                    handleCompleteItem(item.productId, false)
                                                                }
                                                            >
                                                                <RadioButtonChecked />
                                                            </IconButton>
                                                        )
                                                    }
                                                >
                                                    <ListItemText
                                                        primary={
                                                            <>
                                                                {getProductNameById(item.productId)}&nbsp;
                                                                {item.buyOnlyByAction && (
                                                                    <Chip
                                                                        label="Только по акции"
                                                                        size="small"
                                                                        variant="outlined"
                                                                        sx={{ mr: 1, color: "red" }}
                                                                    />
                                                                )}
                                                            </>
                                                        }
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
                                </Collapse>
                            </Box>
                        ))}
                    </List>
                </>
            )}

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
                                label="только по акции"
                                sx={{ whiteSpace: "nowrap" }}
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

            <Dialog open={addItemDialogOpen} onClose={() => setAddItemDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Добавить товар</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <FormControl fullWidth margin="normal">
                            <Autocomplete
                                value={activeProducts.find((p) => p.id === newItem.productId) || null}
                                onChange={handleProductSelect}
                                onInputChange={handleSearchInputChange}
                                inputValue={searchInput}
                                options={filteredProducts}
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
                                    <li key={params.key}>
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
                                    </li>
                                )}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Поиск товара"
                                        placeholder="Начните вводить название товара..."
                                    />
                                )}
                                noOptionsText="Товары не найдены"
                                filterOptions={(options, state) => options}
                            />
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
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={newItem.buyOnlyByAction}
                                    onChange={() =>
                                        setNewItem({ ...newItem, buyOnlyByAction: !newItem.buyOnlyByAction })
                                    }
                                />
                            }
                            label="только по акции"
                            sx={{ whiteSpace: "nowrap" }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddItemDialogOpen(false)}>Отмена</Button>
                    <Button onClick={handleAddItem} variant="contained" disabled={!newItem.productId}>
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

            <ConfirmDialog
                open={completeOrderOpen}
                onClose={() => setCompleteOrderOpen(false)}
                onConfirm={() => handleCompleteOrder(true)}
                title="Завершить список"
                message={`В списке имеются не завершенные товары. Вы уверены, что хотите завершить список?`}
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
