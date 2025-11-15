import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
} from "@mui/material";
import {
    ShoppingCart as CartIcon,
    ArrowBack,
    Remove as RemoveIcon,
    Add as AddIcon,
    Clear as ClearIcon,
    ExpandLess,
    ExpandMore,
} from "@mui/icons-material";
import { ordersService } from "../../services/ordersService";
import { useSettings } from "../../hooks/useSettings";
import { useAuth } from "../../hooks/useAuth";
import { useLoading } from "../../hooks/LoadingContext";
import { useAlert } from "../../hooks/useAlert";
import AlertDialog from "../../components/AlertDialog";

const CreateOrder = () => {
    const navigate = useNavigate();
    const { orderId } = useParams();
    const { withLoading } = useLoading();
    const { currentUser } = useAuth();
    const { activeProducts, getProductNameById, getProductInfo } = useSettings();
    const { alertState, showError, showSuccess, hideAlert } = useAlert();

    const [searchQuery, setSearchQuery] = useState("");
    const [expandedCategories, setExpandedCategories] = useState(new Set());
    const [isEditing, setIsEditing] = useState(false);

    const [orderData, setOrderData] = useState({
        title: "",
        items: [],
    });

    // Функция для сортировки категорий по алфавиту с "Другое" в конце
    const sortCategoriesWithOtherLast = (groupedItems) => {
        return Object.entries(groupedItems).sort(([categoryA], [categoryB]) => {
            const nameA = categoryA.toLowerCase();
            const nameB = categoryB.toLowerCase();

            // Если одна из категорий "Другое", помещаем её в конец
            if (nameA === "другое") return 1;
            if (nameB === "другое") return -1;

            // Остальные категории сортируем по алфавиту
            return nameA.localeCompare(nameB);
        });
    };

    const initializeNewOrder = useCallback(() => {
        setOrderData({
            title: "",
            items: activeProducts.map(product => ({
                productId: product.id,
                quantity: 0,
                buyOnlyByAction: false,
            })),
        });
    }, [activeProducts]);

    const loadOrderForEdit = useCallback(async () => {
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
                    };
                });

                setOrderData({
                    title: order.title,
                    items: allItems,
                });
            } catch (error) {
                showError(error.message);
                navigate(-1);
            }
        });
    }, [activeProducts, navigate, orderId, showError, withLoading]);

    useEffect(() => {
        if (orderId) {
            loadOrderForEdit();
        } else {
            initializeNewOrder();
        }
    }, [orderId, activeProducts, initializeNewOrder, loadOrderForEdit]);

    // Фильтрация товаров по поисковому запросу
    const filteredItems = orderData.items.filter(item => {
        if (!searchQuery.trim()) return true;

        const productName = getProductNameById(item.productId).toLowerCase();
        const category = getProductInfo(item.productId).category.toLowerCase();
        const searchLower = searchQuery.toLowerCase();

        return productName.includes(searchLower) || category.includes(searchLower);
    });

    // Группируем отфильтрованные товары по категориям
    const groupedItems = filteredItems.reduce((acc, item) => {
        const { category } = getProductInfo(item.productId);
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {});

    // Сортируем категории по алфавиту с "Другое" в конце
    const sortedCategories = sortCategoriesWithOtherLast(groupedItems);

    const handleToggleCategory = (category) => {
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

    const isCategoryExpanded = (category) => {
        return expandedCategories.has(category);
    };

    // Функция для подсчета товаров с quantity > 0 в категории
    const getItemsWithQuantityCount = (categoryItems) => {
        return categoryItems.filter(item => item.quantity > 0).length;
    };

    const handleQuantityChange = (productId, newQuantity) => {
        setOrderData((prev) => ({
            ...prev,
            items: prev.items.map((item) =>
                item.productId === productId
                    ? { ...item, quantity: Math.max(0, newQuantity) }
                    : item
            ),
        }));
    };

    const handleToggleBuyOnlyByAction = (productId) => {
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
                    createdBy: currentUser.uid,
                    items: validItems,
                });

                showSuccess("Список успешно создан!", "Успешно", () => navigate(`/order-details/${order.id}`));
            } catch (error) {
                showError(error.message);
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

        await withLoading(async () => {
            try {
                await ordersService.updateOrder(orderId, {
                    title: orderData.title.trim(),
                    items: validItems,
                });

                showSuccess("Список успешно обновлен!", "Успешно", () => navigate(`/order-details/${orderId}`));
            } catch (error) {
                showError(error.message);
            }
        });
    };

    const clearSearch = () => {
        setSearchQuery("");
    };

    const handleSubmit = () => {
        if (isEditing) {
            handleUpdateOrder();
        } else {
            handleCreateOrder();
        }
    };

    return (
        <Box sx={{ pb: 8 }}>
            <AppBar position="static" sx={{ bgcolor: "white", color: "text.primary", boxShadow: 1 }}>
                <Toolbar>
                    <IconButton edge="start" onClick={() => navigate(-1)} sx={{ mr: 2 }} size="large">
                        <ArrowBack/>
                    </IconButton>
                    <Typography variant="h7" sx={{ flexGrow: 1, fontWeight: 600 }}>
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
                                    button="true"
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
                                            const { unit } = getProductInfo(item.productId);
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
                                                            pr: 1,
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

                                                            {/* Текст с единицами измерения */}
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    width: 16,
                                                                    textAlign: 'center',
                                                                    color: 'text.secondary',
                                                                    fontSize: '0.8rem',
                                                                    fontStyle: 'italic'
                                                                }}
                                                            >
                                                                {unit}
                                                            </Typography>

                                                            {/* Иконка корзины для акции */}
                                                            <IconButton
                                                                onClick={() => handleToggleBuyOnlyByAction(item.productId)}
                                                                color={item.buyOnlyByAction && item.quantity > 0 ? "error" : "default"}
                                                                sx={{
                                                                    opacity: item.quantity > 0 ? 1 : 0.3,
                                                                    width: 32,
                                                                    height: 32,
                                                                }}
                                                                disabled={item.quantity === 0}
                                                            >
                                                                <CartIcon fontSize="medium"/>
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

            {/* Кнопки действий */}
            <Box sx={{ p: 1, pt: 2 }}>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                        onClick={() => navigate(-1)}
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
