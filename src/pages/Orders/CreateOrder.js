import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Typography,
    TextField,
    Button,
    Card,
    CardContent,
    Fab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    Autocomplete,
    Checkbox,
    FormControlLabel,
    AppBar,
    Toolbar,
    IconButton,
    Chip,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon, ArrowBack, Save as SaveIcon } from "@mui/icons-material";
import { ordersService } from "../../services/ordersService";
import { useSettings } from "../../hooks/useSettings";
import { useAuth } from "../../hooks/useAuth";
import { useLoading } from "../../hooks/LoadingContext";
import { useAlert } from "../../hooks/useAlert";
import AlertDialog from "../../components/AlertDialog";
import QuantityInput from "../../components/QuantityInput";

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
    const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);

    const isAnyDialogOpen = addItemDialogOpen || alertState.open;

    // Функция для сортировки продуктов по категориям
    const getSortedProducts = (products) => {
        return [...products].sort((a, b) => {
            const categoryA = getProductInfo(a.id).category;
            const categoryB = getProductInfo(b.id).category;

            if (categoryA < categoryB) return -1;
            if (categoryA > categoryB) return 1;

            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;

            return 0;
        });
    };

    const filteredProducts = getSortedProducts(
        activeProducts
            .filter((product) => {
                if (!searchInput) return true;

                const searchLower = searchInput.toLowerCase();
                const productName = product.name.toLowerCase();
                const category = getProductInfo(product.id).category.toLowerCase();

                return productName.includes(searchLower) || category.includes(searchLower);
            })
            .filter((product) => !orderData.items.some((item) => item.productId === product.id))
    );

    const handleAddItem = () => {
        if (!newItem.productId) return;

        const product = activeProducts.find((p) => p.id === newItem.productId);
        if (!product) return;

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

        setNewItem({ productId: "", quantity: 1, buyOnlyByAction: false });
        setSearchInput("");
        setAddItemDialogOpen(false);
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

    const handleCreateOrder = async () => {
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
        <Box sx={{ pb: 8 }}>
            <AppBar position="static" sx={{ bgcolor: "white", color: "text.primary", boxShadow: 1 }}>
                <Toolbar>
                    <IconButton edge="start" onClick={() => navigate(-1)} sx={{ mr: 2 }} size="large">
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                        Новый список
                    </Typography>
                </Toolbar>
            </AppBar>

            <Box>
                <Card sx={{ borderRadius: 0, boxShadow: 2 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Название списка
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
                    </CardContent>
                </Card>

                {/* Список товаров */}
                {orderData.items.length > 0 && (
                    <Box sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                            Товары в списке ({orderData.items.length})
                        </Typography>

                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            {orderData.items.map((item) => {
                                const { unit, category } = getProductInfo(item.productId);
                                return (
                                    <Card
                                        key={item.productId}
                                        variant="outlined"
                                        sx={{
                                            borderRadius: 2,
                                        }}
                                    >
                                        <CardContent sx={{ p: 3 }}>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "flex-start",
                                                    mb: 2,
                                                }}
                                            >
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography
                                                        variant="h6"
                                                        sx={{
                                                            fontSize: "1.1rem",
                                                            fontWeight: 600,
                                                            wordBreak: "break-word",
                                                            lineHeight: 1.3,
                                                            mb: 1,
                                                        }}
                                                    >
                                                        {getProductNameById(item.productId)}
                                                    </Typography>

                                                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                                                        <Chip
                                                            label={category}
                                                            size="small"
                                                            variant="outlined"
                                                            color="primary"
                                                        />
                                                        <Chip
                                                            label={`${item.quantity} ${unit}`}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                        {item.buyOnlyByAction && (
                                                            <Chip
                                                                label="по акции"
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ color: "red", borderColor: "red" }}
                                                            />
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Box>

                                            <Button
                                                onClick={() => handleRemoveItem(item.productId)}
                                                variant="outlined"
                                                color="error"
                                                size="medium"
                                                startIcon={<DeleteIcon />}
                                                fullWidth
                                                sx={{ borderRadius: 2 }}
                                            >
                                                Удалить из списка
                                            </Button>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </Box>
                    </Box>
                )}

                {orderData.items.length === 0 && (
                    <Box sx={{ p: 3, textAlign: "center" }}>
                        <Typography variant="body1" color="textSecondary">
                            Добавьте товары в список
                        </Typography>
                    </Box>
                )}

                {/* Кнопки действий */}
                <Box sx={{ p: 2, pt: 3 }}>
                    <Box sx={{ display: "flex", gap: 2 }}>
                        <Button
                            onClick={() => navigate(-1)}
                            variant="outlined"
                            fullWidth
                            size="large"
                            sx={{ borderRadius: 2 }}
                        >
                            Отмена
                        </Button>
                        <Button
                            onClick={handleCreateOrder}
                            variant="contained"
                            disabled={orderData.items.length === 0}
                            fullWidth
                            size="large"
                            startIcon={<SaveIcon />}
                            sx={{ borderRadius: 2 }}
                        >
                            Создать
                        </Button>
                    </Box>
                </Box>
            </Box>

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

                    <Box sx={{ mb: 3 }}>
                        <QuantityInput
                            label="Количество"
                            value={newItem.quantity}
                            onChange={(val) =>
                                setNewItem({
                                    ...newItem,
                                    quantity: val === "" ? "" : Math.max(1, parseInt(val)),
                                })
                            }
                        />
                    </Box>

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

            {!isAnyDialogOpen && (
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
        </Box>
    );
};

export default CreateOrder;
