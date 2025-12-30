import { useState, useEffect, useCallback, useMemo, FC } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
    Box,
    Typography,
    TextField,
    Button,
    Card,
    CardContent,
    IconButton,
    AppBar,
    Toolbar,
    Chip,
    ListItem,
    ListItemText,
    Collapse,
    Divider,
    Dialog,
    DialogContent,
    DialogActions,
} from "@mui/material";
import {
    ShoppingCart as CartIcon,
    ArrowBack,
    Remove as RemoveIcon,
    Add as AddIcon,
    Clear as ClearIcon,
    ExpandLess,
    ExpandMore,
    InsertCommentSharp as CommentIcon,
} from "@mui/icons-material";
import { Order, OrderItem, ordersService } from "../../services/ordersService";
import { useSettings } from "../../hooks/useSettings";
import { useAuth } from "../../hooks/useAuth";
import { useLoading } from "../../hooks/LoadingContext";
import { useAlert } from "../../hooks/useAlert";
import AlertDialog from "../../components/AlertDialog";
import { useNavigationGuard } from "../../contexts/NavigationGuardContext";
import { getErrorMessage, isFirebaseError } from "../../utils/firebase_firestore";

interface ShortOrderData extends Omit<Order, 'id' | 'createdAt' | 'completedAt' | 'isCompleted' | 'groupId'>{
}

const CreateOrder: FC = () => {
    const navigate = useNavigate();
    const { orderId } = useParams<{ orderId: string | undefined }>();
    const location = useLocation();
    const { withLoading } = useLoading();
    const currentUser = useAuth().getVerifiedCurrentUser();
    const { activeProducts, getProductNameById, getProductInfo, sortCategories } = useSettings();
    const { alertState, showError, showSuccess, hideAlert } = useAlert();

    const [searchQuery, setSearchQuery] = useState("");
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set<string>());
    const [isEditing, setIsEditing] = useState(false);
    const { shouldBlock, setShouldBlock, confirmIfNeeded } = useNavigationGuard();

    const [initialOrderData, setInitialOrderData] = useState<ShortOrderData | null>(null);

    const [orderData, setOrderData] = useState<ShortOrderData>({
        title: "",
        comment: "",
        items: [],
    });

    const [commentDialogOpen, setCommentDialogOpen] = useState(false);
    const [commentDialogProductId, setCommentDialogProductId] = useState<string | null>(null);
    const [commentInput, setCommentInput] = useState("");

    const openCommentDialog = (productId: string): void => {
        const item = orderData.items.find(i => i.productId === productId);
        setCommentDialogProductId(productId);
        setCommentInput(item?.comment || "");
        setCommentDialogOpen(true);
    };

    const closeCommentDialog = () => {
        setCommentDialogOpen(false);
        setCommentDialogProductId(null);
        setCommentInput("");
    };

    const saveComment = () => {
        if (!commentDialogProductId) return;

        setOrderData((prev) => ({
            ...prev,
            items: prev.items.map((item) =>
                item.productId === commentDialogProductId ? { ...item, comment: commentInput } : item
            ),
        }));
        closeCommentDialog();
    };

    const initializeNewOrder = useCallback(() => {
        const next: ShortOrderData = {
            title: "",
            comment: "",
            items: activeProducts.map(product => ({
                productId: product.id,
                quantity: 0,
                buyOnlyByAction: false,
                comment: "",
                isCompleted: false,
            })),
        };
        setOrderData(next);
        setInitialOrderData(next);
    }, [activeProducts]);

    const initializeCopiedOrder = useCallback((copiedOrder: ShortOrderData) => {
        const baseItems = activeProducts.map(product => ({
            productId: product.id,
            quantity: 0,
            buyOnlyByAction: false,
            comment: "",
            isCompleted: false,
        }));

        const mergedItems = baseItems.map(baseItem => {
            const copiedItem = copiedOrder.items.find(item => item.productId === baseItem.productId);
            return copiedItem ? { ...baseItem, ...copiedItem } : baseItem;
        });

        const next = {
            title: copiedOrder.title,
            comment: copiedOrder.comment,
            items: mergedItems,
        };
        setOrderData(next);
        setInitialOrderData(next);
    }, [activeProducts]);

    const loadOrderForEdit = useCallback(async () => {
        if (!orderId) return;
        await withLoading(async () => {
            try {
                const order = await ordersService.getOrder(orderId);
                setIsEditing(true);

                const allItems = activeProducts.map(product => {
                    const existingItem = order.items.find(item => item.productId === product.id);
                    return {
                        productId: product.id,
                        quantity: existingItem ? existingItem.quantity : 0,
                        buyOnlyByAction: existingItem ? existingItem.buyOnlyByAction : false,
                        isCompleted: existingItem ? existingItem.isCompleted : false,
                        comment: existingItem ? (existingItem.comment || "") : "",
                    };
                });

                const next = {
                    title: order.title,
                    comment: order.comment || "",
                    items: allItems,
                };
                setOrderData(next);
                setInitialOrderData(next);
            } catch (error) {
                if (isFirebaseError(error)) {
                    showError(getErrorMessage(error), 'Ошибка', () => navigate(-1));
                } else if (error instanceof Error) {
                    showError(error.message, 'Ошибка', () => navigate(-1));
                } else {
                    showError(String(error), 'Ошибка', () => navigate(-1));
                }
            }
        });
    }, [activeProducts, navigate, orderId, showError, withLoading]);

    useEffect(() => {
        const copiedOrder = location.state?.copiedOrder;

        if (copiedOrder) {
            // Копируем список
            initializeCopiedOrder(copiedOrder);
        } else if (orderId) {
            // Редактируем список
            void loadOrderForEdit();
        } else {
            // Новый список
            initializeNewOrder();
        }
    }, [orderId, activeProducts, initializeNewOrder, loadOrderForEdit, location.state, initializeCopiedOrder]);

    const normalized = (data: ShortOrderData) => ({
        title: data.title?.trim() || "",
        comment: data.comment?.trim() || "",
        items: data.items
            .map(i => ({
                productId: i.productId,
                quantity: i.quantity || 0,
                buyOnlyByAction: i.buyOnlyByAction,
                comment: (i.comment || "").trim(),
            }))
            .sort((a, b) => (a.productId > b.productId ? 1 : -1)),
    });

    const hasUnsavedChanges = useMemo(() => {
        if (!initialOrderData) return false;
        try {
            return JSON.stringify(normalized(orderData)) !== JSON.stringify(normalized(initialOrderData));
        } catch {
            return true;
        }
    }, [orderData, initialOrderData]);

    useEffect(() => {
        setShouldBlock(hasUnsavedChanges);
    }, [hasUnsavedChanges, setShouldBlock]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent): void => {
            if (!shouldBlock) return;
            e.preventDefault();
            e.returnValue = "";
        };
        if (shouldBlock) window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [shouldBlock]);

    // Фильтрация товаров по поисковому запросу
    const filteredItems = orderData.items.filter(item => {
        if (!searchQuery.trim()) return true;

        const productName = getProductNameById(item.productId).toLowerCase();
        const category = getProductInfo(item.productId).category.toLowerCase();
        const searchLower = searchQuery.toLowerCase();

        return productName.includes(searchLower) || category.includes(searchLower);
    });

    // Группируем отфильтрованные товары по категориям
    const groupedItems: Record<string, OrderItem[]> = filteredItems.reduce((acc: Record<string, OrderItem[]>, item) => {
        const { category } = getProductInfo(item.productId);
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {});

    // Сортируем категории по алфавиту с "Другое" в конце и товары внутри категорий по названию
    const sortedCategories = sortCategories(groupedItems);

    // Сортируем товары внутри каждой категории по названию
    sortedCategories.forEach(([_, items]) => {
        items.sort((a, b) => getProductNameById(a.productId).localeCompare(getProductNameById(b.productId)));
    });

    const handleToggleCategory = (category: string) => {
        setExpandedCategories((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(category)) {
                newSet.delete(category);
            } else {
                newSet.add(category);
            }
            return newSet;
        });
    };

    const isCategoryExpanded = (category: string): boolean => {
        return expandedCategories.has(category);
    };

    // Функция для подсчета товаров с quantity > 0 в категории
    const getItemsWithQuantityCount = (categoryItems: OrderItem[]): number => {
        return categoryItems.filter(item => item.quantity > 0).length;
    };

    const handleQuantityChange = (productId: string, newQuantity: number): void => {
        setOrderData((prev) => ({
            ...prev,
            items: prev.items.map((item) =>
                item.productId === productId
                    ? { ...item, quantity: Math.max(0, newQuantity) }
                    : item
            ),
        }));
    };

    const handleToggleBuyOnlyByAction = (productId: string): void => {
        setOrderData((prev) => ({
            ...prev,
            items: prev.items.map((item) =>
                item.productId === productId
                    ? { ...item, buyOnlyByAction: !item.buyOnlyByAction }
                    : item
            ),
        }));
    };

    const handleCreateOrder = async () => {
        // Фильтруем товары с quantity > 0
        const validItems = orderData.items.filter(item => item.quantity > 0);

        if (validItems.length === 0) {
            showError("Добавьте хотя бы один товар с количеством больше 0");
            return;
        }

        await withLoading(async () => {
            try {
                const order = await ordersService.createOrder({
                    groupId: currentUser.groupId,
                    title: orderData.title.trim(),
                    comment: orderData.comment.trim(),
                    items: validItems,
                });

                showSuccess("Список успешно создан!", "Успешно", () => { setShouldBlock(false); navigate(`/order-details/${order.id}`); });
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
    };

    const handleUpdateOrder = async () => {
        // Фильтруем товары с quantity > 0
        const validItems = orderData.items.filter(item => item.quantity > 0);

        if (validItems.length === 0) {
            showError("Добавьте хотя бы один товар с количеством больше 0");
            return;
        }

        if (!orderId) {
            showError("Не указан идентификатор списка для обновления");
            return;
        }

        await withLoading(async () => {
            try {
                await ordersService.updateOrder(orderId, {
                    title: orderData.title.trim(),
                    comment: orderData.comment.trim(),
                    items: validItems,
                });

                showSuccess("Список успешно обновлен!", "Успешно", () => { setShouldBlock(false); navigate(`/order-details/${orderId}`); });
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
    };

    const clearSearch = () => {
        setSearchQuery("");
    };

    const handleSubmit = async (): Promise<void> => {
        if (isEditing) {
            await handleUpdateOrder();
        } else {
            await handleCreateOrder();
        }
    };

    return (
        <Box sx={{ pb: 8 }}>
            <AppBar position="static" sx={{ bgcolor: "white", color: "text.primary", boxShadow: 1 }}>
                <Toolbar>
                    <IconButton edge="start" onClick={() => confirmIfNeeded(() => navigate(-1))} sx={{ mr: 2 }} size="large">
                        <ArrowBack/>
                    </IconButton>
                    <Typography variant="subtitle1" sx={{ flexGrow: 1, fontWeight: 600 }}>
                        {isEditing ? "Редактировать список" : "Новый список"}
                    </Typography>
                </Toolbar>
            </AppBar>

            {/* Название списка */}
            <Box sx={{ p: 1, display: "flex", alignItems: "center", gap: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, minWidth: 60 }}>
                    Список
                </Typography>
                <TextField
                    label="Введите название"
                    value={orderData.title}
                    onChange={(e) => setOrderData({ ...orderData, title: e.target.value })}
                    fullWidth
                    size="medium"
                    slotProps={{
                        input: {
                            sx: { fontSize: "16px" },
                        },
                    }}
                />
            </Box>

            {/* Заголовок и поиск */}
            <Box sx={{ p: 1 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 1, textAlign: "center" }}>
                    Товары
                </Typography>

                <TextField
                    label="Поиск товаров"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    fullWidth
                    size="medium"
                    placeholder="Введите название товара или категории..."
                    slotProps={{
                        input: {
                            sx: { fontSize: "16px" },
                            endAdornment: searchQuery && (
                                <IconButton
                                    onClick={clearSearch}
                                    size="small"
                                    sx={{ mr: -1 }}
                                >
                                    <ClearIcon/>
                                </IconButton>
                            ),
                        },
                    }}
                />
            </Box>

            {/* Список товаров с раскрывающимися категориями */}
            <Box sx={{ display: "flex", flexDirection: "column" }}>
                {sortedCategories.map(([category, categoryItems]) => {
                    const isExpanded = isCategoryExpanded(category);
                    const itemsWithQuantityCount = getItemsWithQuantityCount(categoryItems);

                    return (
                        <Card key={category} variant="outlined" sx={{
                            borderRadius: 0,
                            mb: 0,
                            '&:last-child': {
                                mb: 0
                            }
                        }}>
                            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                                <ListItem
                                    onClick={() => handleToggleCategory(category)}
                                    sx={{
                                        backgroundColor: '#e3f2fd',
                                        borderBottom: isExpanded ? "1px solid" : "none",
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
                                                {itemsWithQuantityCount > 0 && (
                                                    <Chip
                                                        label={itemsWithQuantityCount}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                )}
                                            </Box>
                                        }
                                    />
                                    {isExpanded ? <ExpandLess/> : <ExpandMore/>}
                                </ListItem>
                                <Collapse in={isExpanded} timeout="auto" unmountOnExit
                                          sx={{ '&:last-child': { mb: 0 } }}>
                                    <Box sx={{ '&:last-child': { mb: 0 } }}>
                                        {categoryItems.map((item, index) => {
                                            const backgroundColor = item.quantity > 0
                                                ? (item.buyOnlyByAction ? '#ffebee' : '#e8f5e8')
                                                : 'transparent';

                                            return (
                                                <Box key={item.productId} sx={{ '&:last-child': { mb: 0 } }}>
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            alignItems: "stretch",
                                                            p: 0.5,
                                                            py: 1,
                                                            backgroundColor: backgroundColor,
                                                            transition: "background-color 0.2s",
                                                            minHeight: 60,
                                                        }}
                                                    >
                                                        {/* Название товара */}
                                                        <Box sx={{
                                                            flex: 1,
                                                            minWidth: 0,
                                                            px: 1,
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}>
                                                            <Typography
                                                                variant="body1"
                                                                sx={{
                                                                    wordBreak: 'break-word',
                                                                    lineHeight: 1.3,
                                                                    fontSize: '0.9rem'
                                                                }}
                                                            >
                                                                {getProductNameById(item.productId)}
                                                            </Typography>
                                                        </Box>

                                                        {/* Блок с управлением количеством, единицами и корзиной */}
                                                        <Box sx={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 1,
                                                            flexShrink: 0
                                                        }}>
                                                            {/* Управление количеством */}
                                                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                                                <IconButton
                                                                    onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                                                    disabled={item.quantity <= 0}
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
                                                                        minWidth: 18,
                                                                        textAlign: 'center',
                                                                        fontWeight: 600,
                                                                        color: item.quantity > 0 ? "primary.main" : "text.primary",
                                                                        fontSize: '0.9rem'
                                                                    }}
                                                                >
                                                                    {item.quantity}
                                                                </Typography>

                                                                <IconButton
                                                                    onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                                                    sx={{
                                                                        border: '1px solid',
                                                                        borderColor: 'divider',
                                                                        borderRadius: '50%'
                                                                    }}
                                                                >
                                                                    <AddIcon fontSize="small"/>
                                                                </IconButton>
                                                            </Box>

                                                            {/* Иконка корзины для акции */}
                                                            <IconButton
                                                                onClick={() => handleToggleBuyOnlyByAction(item.productId)}
                                                                color={item.buyOnlyByAction && item.quantity > 0 ? "error" : "default"}
                                                                sx={{
                                                                    opacity: item.quantity > 0 ? 1 : 0.3,
                                                                    width: 32,
                                                                    height: 32,
                                                                    ml: -1
                                                                }}
                                                                disabled={item.quantity === 0}
                                                            >
                                                                <CartIcon fontSize="medium"/>
                                                            </IconButton>

                                                            {/* Иконка для комментария к товару */}
                                                            <IconButton
                                                                onClick={() => openCommentDialog(item.productId)}
                                                                sx={{
                                                                    width: 32,
                                                                    height: 32,
                                                                    ml: -2.5,
                                                                    mr: -1
                                                                }}
                                                            >
                                                                <CommentIcon fontSize="small" color={item.comment?.trim() ? "info" : "action"} />
                                                            </IconButton>
                                                        </Box>
                                                    </Box>
                                                    {index < categoryItems.length - 1 && (
                                                        <Divider sx={{ my: 0 }}/>
                                                    )}
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </Collapse>
                            </CardContent>
                        </Card>
                    );
                })}
            </Box>

            {/* Комментарий */}
            <Box sx={{ p: 1 }}>
                <TextField
                    label="Комментарий"
                    value={orderData.comment}
                    onChange={(e) => setOrderData({ ...orderData, comment: e.target.value })}
                    fullWidth
                    multiline
                    minRows={3}
                    size="medium"
                    placeholder="Добавьте заметки или комментарии к списку..."
                    slotProps={{
                        input: {
                            sx: {
                                fontSize: "16px",
                                whiteSpace: 'pre-wrap',
                            },
                        },
                    }}
                />
            </Box>

            {/* Диалог ввода комментария к товару */}
            <Dialog open={commentDialogOpen} onClose={closeCommentDialog} fullWidth>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Комментарий"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        fullWidth
                        multiline
                        minRows={3}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeCommentDialog}>Отмена</Button>
                    <Button onClick={saveComment} variant="contained">Сохранить</Button>
                </DialogActions>
            </Dialog>

            {/* Кнопки действий */}
            <Box sx={{ p: 1, pt: 2 }}>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                        onClick={() => confirmIfNeeded(() => navigate(-1))}
                        variant="outlined"
                        fullWidth
                        size="medium"
                        sx={{ borderRadius: 1 }}
                    >
                        Отмена
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={orderData.items.filter(item => item.quantity > 0).length === 0}
                        fullWidth
                        size="medium"
                        sx={{ borderRadius: 1 }}
                    >
                        {isEditing ? "Сохранить" : "Создать"}
                    </Button>
                </Box>
            </Box>

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

export default CreateOrder;
