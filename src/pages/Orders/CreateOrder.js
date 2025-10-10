import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Typography,
    TextField,
    Button,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Chip,
    FormControl,
    Autocomplete,
    Divider,
    Paper,
    Checkbox,
    FormControlLabel,
    Collapse,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon, ExpandLess, ExpandMore } from "@mui/icons-material";
import { ordersService } from "../../services/ordersService";
import { useSettings } from "../../hooks/useSettings";
import { useAuth } from "../../hooks/useAuth";
import { useLoading } from "../../hooks/LoadingContext";
import { useAlert } from "../../hooks/useAlert";
import AlertDialog from "../../components/AlertDialog";

const CreateOrder = () => {
    const navigate = useNavigate();
    const { withLoading } = useLoading();
    const { currentUser } = useAuth();
    const { activeProducts, getProductNameById, getProductInfo } = useSettings();
    const { alertState, showError, showSuccess, hideAlert } = useAlert();

    const [orderData, setOrderData] = useState({
        title: "",
        items: [],
    });

    const [newItem, setNewItem] = useState({
        productId: "",
        quantity: 1,
        buyOnlyByAction: false,
    });

    const [searchInput, setSearchInput] = useState("");
    const [expandedCategories, setExpandedCategories] = useState({});

    // Фильтруем продукты для автокомплита
    const filteredProducts = activeProducts
        .filter((product) => {
            if (!searchInput) return true;

            const searchLower = searchInput.toLowerCase();
            const productName = product.name.toLowerCase();
            const category = getProductInfo(product.id).category.toLowerCase();

            return productName.includes(searchLower) || category.includes(searchLower);
        })
        .filter((product) => !orderData.items.some((item) => item.productId === product.id));

    // Группируем товары по категориям
    const groupedItems = orderData.items.reduce((acc, item) => {
        const { category } = getProductInfo(item.productId);
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {});

    // Автоматически раскрываем все категории при добавлении товаров
    useState(() => {
        const categories = Object.keys(groupedItems);
        const initialExpandedState = {};
        categories.forEach((category) => {
            initialExpandedState[category] = true;
        });
        setExpandedCategories(initialExpandedState);
    }, [groupedItems]);

    const handleAddItem = () => {
        if (!newItem.productId) return;

        const product = activeProducts.find((p) => p.id === newItem.productId);
        if (!product) return;

        // Проверяем, не добавлен ли уже этот продукт
        const isAlreadyAdded = orderData.items.some((item) => item.productId === newItem.productId);
        if (isAlreadyAdded) {
            showError("Этот продукт уже добавлен в список");
            return;
        }

        const item = {
            productId: newItem.productId,
            quantity: newItem.quantity,
            buyOnlyByAction: newItem.buyOnlyByAction,
        };

        setOrderData((prev) => ({
            ...prev,
            items: [...prev.items, item],
        }));

        // Автоматически раскрываем категорию нового товара
        const { category } = getProductInfo(newItem.productId);
        setExpandedCategories((prev) => ({
            ...prev,
            [category]: true,
        }));

        // Сбрасываем форму
        setNewItem({ productId: "", quantity: 1, buyOnlyByAction: false });
        setSearchInput("");
    };

    const handleProductSelect = (_, value) => {
        if (value) {
            setNewItem({ ...newItem, productId: value.id });
        } else {
            setNewItem({ ...newItem, productId: "" });
            setSearchInput("");
        }
    };

    const handleSearchInputChange = (_, value) => {
        setSearchInput(value);
    };

    const handleRemoveItem = (productId) => {
        setOrderData((prev) => ({
            ...prev,
            items: prev.items.filter((item) => item.productId !== productId),
        }));
    };

    const handleToggleCategory = (category) => {
        setExpandedCategories((prev) => ({
            ...prev,
            [category]: !prev[category],
        }));
    };

    const handleCreateOrder = async () => {
        if (!orderData.title.trim()) {
            showError("Введите название списка");
            return;
        }

        if (orderData.items.length === 0) {
            showError("Добавьте хотя бы один товар");
            return;
        }

        await withLoading(async () => {
            try {
                const order = await ordersService.createOrder({
                    groupId: currentUser.groupId,
                    title: orderData.title,
                    createdBy: currentUser.uid,
                    items: orderData.items,
                });

                showSuccess("Список успешно создан!", navigate(`/order-details/${order.id}`));
            } catch (error) {
                showError(error.message);
            }
        });
    };

    return (
        <Box sx={{ p: 3, maxWidth: 800, margin: "0 auto" }}>
            {/* Заголовок */}
            <Typography variant="h4" gutterBottom>
                Создание нового списка
            </Typography>

            {/* Информация о списке */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <TextField
                        label="Название списка"
                        value={orderData.title}
                        onChange={(e) => setOrderData({ ...orderData, title: e.target.value })}
                        fullWidth
                        margin="normal"
                        required
                    />
                </CardContent>
            </Card>

            {/* Добавление товаров */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Добавить товары
                    </Typography>

                    <Box sx={{ display: "flex", gap: 2, alignItems: "end", mb: 2 }}>
                        <FormControl fullWidth>
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
                            sx={{ width: 120 }}
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

                        <Button
                            variant="contained"
                            onClick={handleAddItem}
                            disabled={!newItem.productId}
                            startIcon={<AddIcon />}
                        >
                            Добавить
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* Список добавленных товаров с группировкой по категориям */}
            {orderData.items.length > 0 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Товары в списке ({orderData.items.length})
                        </Typography>

                        <List>
                            {Object.entries(groupedItems).map(([category, items]) => (
                                <Box key={category}>
                                    <ListItem
                                        button
                                        onClick={() => handleToggleCategory(category)}
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
                                        {expandedCategories[category] ? <ExpandLess /> : <ExpandMore />}
                                    </ListItem>
                                    <Collapse in={expandedCategories[category] !== false} timeout="auto" unmountOnExit>
                                        <List component="div" disablePadding>
                                            {items.map((item, index) => {
                                                const { unit } = getProductInfo(item.productId);
                                                return (
                                                    <ListItem
                                                        key={item.productId}
                                                        divider={index < items.length - 1}
                                                        sx={{
                                                            pr: 8,
                                                            pl: 4,
                                                            backgroundColor: "background.paper",
                                                        }}
                                                    >
                                                        <ListItemText
                                                            primary={
                                                                <>
                                                                    {getProductNameById(item.productId)} -{" "}
                                                                    {item.quantity} {unit}
                                                                </>
                                                            }
                                                            secondary={
                                                                item.buyOnlyByAction && (
                                                                    <Box sx={{ mt: 1 }}>
                                                                        <Chip
                                                                            label="Только по акции"
                                                                            size="small"
                                                                            variant="outlined"
                                                                            sx={{ color: "red", borderColor: "red" }}
                                                                        />
                                                                    </Box>
                                                                )
                                                            }
                                                            secondaryTypographyProps={{ component: "div" }}
                                                        />

                                                        {/* Кнопка удаления с позиционированием */}
                                                        <Box
                                                            sx={{
                                                                position: "absolute",
                                                                right: 16,
                                                                top: "50%",
                                                                transform: "translateY(-50%)",
                                                            }}
                                                        >
                                                            <IconButton
                                                                onClick={() => handleRemoveItem(item.productId)}
                                                                color="error"
                                                                size="small"
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </Box>
                                                    </ListItem>
                                                );
                                            })}
                                        </List>
                                    </Collapse>
                                </Box>
                            ))}
                        </List>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                            <Button onClick={() => navigate("/")} variant="outlined">
                                Отмена
                            </Button>

                            <Button
                                onClick={handleCreateOrder}
                                variant="contained"
                                disabled={!orderData.title || orderData.items.length === 0}
                            >
                                Создать список
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            )}

            {orderData.items.length === 0 && (
                <Paper sx={{ p: 3, textAlign: "center" }}>
                    <Typography variant="body1" color="textSecondary">
                        Добавьте товары в список
                    </Typography>
                </Paper>
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

export default CreateOrder;
