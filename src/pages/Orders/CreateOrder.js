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
    InputLabel,
    Select,
    MenuItem,
    Divider,
    Paper,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { ordersService } from "../../services/ordersService";
import { useSettings } from "../../hooks/useSettings";
import { useAuth } from "../../hooks/useAuth";
import { useLoading } from "../../hooks/LoadingContext";
import { useAlert } from "../../hooks/useAlert";
import AlertDialog from "../../components/AlertDialog";
import { DEFAULT_UNIT, NO_NAME } from "../../utils/constants";

const CreateOrder = () => {
    const navigate = useNavigate();
    const { withLoading } = useLoading();
    const { currentUser } = useAuth();
    const { activeProducts, getProductNameById, getCategoryNameById, getUnitNameById } = useSettings();
    const { alertState, showError, showSuccess, hideAlert } = useAlert();

    const [orderData, setOrderData] = useState({
        title: "",
        items: [],
    });

    const [newItem, setNewItem] = useState({
        productId: "",
        quantity: 1,
    });

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
        };

        setOrderData((prev) => ({
            ...prev,
            items: [...prev.items, item],
        }));

        // Сбрасываем форму
        setNewItem({ productId: "", quantity: 1 });
    };

    const handleRemoveItem = (productId) => {
        setOrderData((prev) => ({
            ...prev,
            items: prev.items.filter((item) => item.productId !== productId),
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

                showSuccess("Заказ успешно создан!");
                navigate(`/order-details/${order.id}`);
            } catch (error) {
                showError(error.message);
            }
        });
    };

    const getProductFullInfo = (productId) => {
        const product = activeProducts.find((p) => p.id === productId);

        if (!product) {
            return { category: NO_NAME, unit: DEFAULT_UNIT };
        }

        return {
            category: getCategoryNameById(product.categoryId),
            unit: getUnitNameById(product.unitId),
        };
    };

    return (
        <Box sx={{ p: 3, maxWidth: 800, margin: "0 auto" }}>
            {/* Заголовок */}
            <Typography variant="h4" gutterBottom>
                Создание нового заказа
            </Typography>

            {/* Информация о заказе */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <TextField
                        label="Название заказа"
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
                            <InputLabel>Продукт</InputLabel>
                            <Select
                                value={newItem.productId}
                                onChange={(e) => setNewItem({ ...newItem, productId: e.target.value })}
                                label="Продукт"
                            >
                                <MenuItem value="">Выберите продукт</MenuItem>
                                {activeProducts.map((product) => {
                                    const { category, unit } = getProductFullInfo(product.id);

                                    return (
                                        <MenuItem key={product.id} value={product.id}>
                                            {product.name} ({category}) - {unit}
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
                            sx={{ width: 120 }}
                            inputProps={{ min: 1 }}
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

            {/* Список добавленных товаров */}
            {orderData.items.length > 0 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Товары в заказе ({orderData.items.length})
                        </Typography>

                        <List>
                            {orderData.items.map((item, index) => {
                                const { category, unit } = getProductFullInfo(item.productId);
                                return (
                                    <ListItem
                                        key={item.productId}
                                        divider={index < orderData.items.length - 1}
                                        sx={{ pr: 8 }}
                                    >
                                        <ListItemText
                                            primary={
                                                <>
                                                    {getProductNameById(item.productId)} - {item.quantity} {unit}
                                                </>
                                            }
                                            secondary={
                                                <Box sx={{ mt: 1 }}>
                                                    <Chip
                                                        label={category}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ mr: 1 }}
                                                    />
                                                </Box>
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
                                Создать заказ
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            )}

            {orderData.items.length === 0 && (
                <Paper sx={{ p: 3, textAlign: "center" }}>
                    <Typography variant="body1" color="textSecondary">
                        Добавьте товары к заказу
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
