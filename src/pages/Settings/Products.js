import { useState } from "react";
import {
    Box,
    TextField,
    Button,
    Card,
    CardContent,
    IconButton,
    Dialog,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    AppBar,
    Toolbar,
    Typography,
    Fab,
    ListItem,
    ListItemText,
    Collapse,
} from "@mui/material";
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Save as SaveIcon,
    ArrowBack,
    ExpandLess,
    ExpandMore,
} from "@mui/icons-material";
import { settingsService } from "../../services/settingsService";
import { useLoading } from "../../hooks/LoadingContext";
import { useSettings } from "../../hooks/useSettings";
import { getErrorMessage } from "../../utils/firebase_firestore";
import ConfirmDialog from "../../components/ConfirmDialog";
import AlertDialog from "../../components/AlertDialog";
import { useAlert } from "../../hooks/useAlert";

const Products = () => {
    const { withLoading } = useLoading();
    const {
        units,
        categories,
        activeProducts,
        addProductToContext,
        removeProductFromContext,
        updateProductInContext,
        getProductInfo,
    } = useSettings();

    const { alertState, showError, hideAlert } = useAlert();

    const [isModalAddProductOpen, setIsModalAddProductOpen] = useState(false);
    const [removeProductDialogOpen, setRemoveProductDialogOpen] = useState(false);
    const [productToRemove, setProductToRemove] = useState({});
    const [productToEdit, setProductToEdit] = useState({});
    const [expandedCategories, setExpandedCategories] = useState(new Set());

    const defaultNewProduct = { name: "", categoryId: "", unitId: "" };
    const [newProduct, setNewProduct] = useState({ ...defaultNewProduct });

    const toggleAddProduct = () => setIsModalAddProductOpen(!isModalAddProductOpen);

    const isAnyDialogOpen = isModalAddProductOpen || removeProductDialogOpen || alertState.open;

    // Группировка продуктов по категориям и сортировка внутри категорий
    const groupedProducts = activeProducts.reduce((acc, product) => {
        const { category } = getProductInfo(product.id);
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(product);
        return acc;
    }, {});

    // Сортируем категории по алфавиту и товары внутри категорий по названию
    const sortedCategories = Object.keys(groupedProducts).sort();
    sortedCategories.forEach((category) => {
        groupedProducts[category].sort((a, b) => a.name.localeCompare(b.name));
    });

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

    const handleAddProduct = async () => {
        await withLoading(async () => {
            try {
                const response = await settingsService.addProduct(newProduct);

                addProductToContext(response);
                setNewProduct({ ...defaultNewProduct });
                toggleAddProduct(false);
            } catch (error) {
                showError(getErrorMessage(error));
            }
        });
    };

    const handleOpenRemoveProductDialog = (product) => {
        setProductToRemove(product);
        setRemoveProductDialogOpen(true);
    };

    const handleCloseRemoveProductDialog = () => setRemoveProductDialogOpen(false);

    const handleDeleteProduct = async () => {
        await withLoading(async () => {
            try {
                await settingsService.deleteProduct(productToRemove.id);
                removeProductFromContext(productToRemove.id);
                handleCloseRemoveProductDialog();
            } catch (error) {
                showError(getErrorMessage(error));
            }
        });
    };

    const handleEditProduct = (product) => {
        setProductToEdit({ ...product });
    };

    const handleSaveProductToEdit = async () => {
        await withLoading(async () => {
            try {
                await settingsService.updateProduct(productToEdit);

                updateProductInContext(productToEdit);
                setProductToEdit({});
            } catch (error) {
                showError(getErrorMessage(error));
            }
        });
    };

    return (
        <Box sx={{ pb: 8 }}>
            {/* Список товаров по категориям */}
            {activeProducts.length > 0 ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {sortedCategories.map((category) => {
                        const categoryProducts = groupedProducts[category];
                        const isExpanded = isCategoryExpanded(category);

                        return (
                            <Card key={category} variant="outlined" sx={{ borderRadius: 3 }}>
                                <CardContent sx={{ p: 0 }}>
                                    <ListItem
                                        button="true"
                                        onClick={() => handleToggleCategory(category)}
                                        sx={{
                                            backgroundColor: "grey.50",
                                            borderBottom: isExpanded ? "1px solid" : "none",
                                            borderColor: "grey.200",
                                            borderRadius: "12px 12px 0 0",
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    <Typography variant="subtitle1" fontWeight="bold">
                                                        {category}
                                                    </Typography>
                                                    <Chip
                                                        label={categoryProducts.length}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                </Box>
                                            }
                                        />
                                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                                    </ListItem>
                                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                        <Box sx={{ p: 2 }}>
                                            {categoryProducts.map((product) => {
                                                const { unit } = getProductInfo(product.id);
                                                const isEditing = productToEdit?.id === product.id;

                                                return (
                                                    <Card
                                                        key={product.id}
                                                        variant="outlined"
                                                        sx={{
                                                            borderRadius: 2,
                                                            mb: 2,
                                                            "&:last-child": { mb: 0 },
                                                        }}
                                                    >
                                                        <CardContent sx={{ py: 2, px: 2 }}>
                                                            {isEditing ? (
                                                                <Box
                                                                    sx={{
                                                                        display: "flex",
                                                                        flexDirection: "column",
                                                                        gap: 2,
                                                                    }}
                                                                >
                                                                    <TextField
                                                                        value={productToEdit.name}
                                                                        onChange={(e) =>
                                                                            setProductToEdit({
                                                                                ...productToEdit,
                                                                                name: e.target.value,
                                                                            })
                                                                        }
                                                                        label="Название товара"
                                                                        fullWidth
                                                                        size="medium"
                                                                    />
                                                                    <FormControl fullWidth size="medium">
                                                                        <InputLabel>Категория</InputLabel>
                                                                        <Select
                                                                            value={productToEdit.categoryId}
                                                                            onChange={(e) =>
                                                                                setProductToEdit({
                                                                                    ...productToEdit,
                                                                                    categoryId: parseInt(
                                                                                        e.target.value
                                                                                    ),
                                                                                })
                                                                            }
                                                                            label="Категория"
                                                                        >
                                                                            {Object.entries(categories).map(
                                                                                ([id, name]) => (
                                                                                    <MenuItem
                                                                                        key={id}
                                                                                        value={parseInt(id)}
                                                                                    >
                                                                                        {name}
                                                                                    </MenuItem>
                                                                                )
                                                                            )}
                                                                        </Select>
                                                                    </FormControl>
                                                                    <FormControl fullWidth size="medium">
                                                                        <InputLabel>Единица измерения</InputLabel>
                                                                        <Select
                                                                            value={productToEdit.unitId}
                                                                            onChange={(e) =>
                                                                                setProductToEdit({
                                                                                    ...productToEdit,
                                                                                    unitId: parseInt(e.target.value),
                                                                                })
                                                                            }
                                                                            label="Единица измерения"
                                                                        >
                                                                            {Object.entries(units).map(([id, name]) => (
                                                                                <MenuItem key={id} value={parseInt(id)}>
                                                                                    {name}
                                                                                </MenuItem>
                                                                            ))}
                                                                        </Select>
                                                                    </FormControl>
                                                                    <Button
                                                                        variant="contained"
                                                                        startIcon={<SaveIcon />}
                                                                        onClick={handleSaveProductToEdit}
                                                                        fullWidth
                                                                        size="large"
                                                                        sx={{ borderRadius: 2 }}
                                                                    >
                                                                        Сохранить
                                                                    </Button>
                                                                </Box>
                                                            ) : (
                                                                <>
                                                                    <Box
                                                                        sx={{
                                                                            display: "flex",
                                                                            justifyContent: "space-between",
                                                                            alignItems: "flex-start",
                                                                        }}
                                                                    >
                                                                        <Box sx={{ flex: 1, minWidth: 0, mr: 2 }}>
                                                                            <Typography
                                                                                variant="h6"
                                                                                sx={{
                                                                                    fontSize: "1.1rem",
                                                                                    fontWeight: 600,
                                                                                    wordBreak: "break-word",
                                                                                    lineHeight: 1.3,
                                                                                }}
                                                                            >
                                                                                {product.name}
                                                                            </Typography>
                                                                            <Box
                                                                                sx={{
                                                                                    display: "flex",
                                                                                    gap: 1,
                                                                                    flexWrap: "wrap",
                                                                                    mt: 1,
                                                                                }}
                                                                            >
                                                                                <Chip
                                                                                    label={unit}
                                                                                    variant="outlined"
                                                                                    size="small"
                                                                                />
                                                                            </Box>
                                                                        </Box>
                                                                        <Box
                                                                            sx={{
                                                                                display: "flex",
                                                                                gap: 0.5,
                                                                                flexShrink: 0,
                                                                            }}
                                                                        >
                                                                            <IconButton
                                                                                color="primary"
                                                                                onClick={() =>
                                                                                    handleEditProduct(product)
                                                                                }
                                                                                size="small"
                                                                            >
                                                                                <EditIcon />
                                                                            </IconButton>
                                                                            <IconButton
                                                                                color="error"
                                                                                onClick={() =>
                                                                                    handleOpenRemoveProductDialog(
                                                                                        product
                                                                                    )
                                                                                }
                                                                                size="small"
                                                                            >
                                                                                <DeleteIcon />
                                                                            </IconButton>
                                                                        </Box>
                                                                    </Box>
                                                                </>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}
                                        </Box>
                                    </Collapse>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Box>
            ) : (
                <Card sx={{ textAlign: "center", py: 6, borderRadius: 3 }}>
                    <CardContent>
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                            Товаров пока нет
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                            Добавьте первый товар в ваш справочник
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={toggleAddProduct}
                            size="large"
                            sx={{ borderRadius: 2 }}
                        >
                            Добавить товар
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Диалог добавления товара */}
            <Dialog open={isModalAddProductOpen} onClose={toggleAddProduct} fullScreen>
                <AppBar position="sticky" sx={{ bgcolor: "white", color: "text.primary" }}>
                    <Toolbar>
                        <IconButton edge="start" onClick={toggleAddProduct} sx={{ mr: 2 }} size="large">
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                            Новый товар
                        </Typography>
                    </Toolbar>
                </AppBar>
                <DialogContent sx={{ p: 2 }}>
                    <Box sx={{ pt: 2 }}>
                        <TextField
                            label="Наименование товара"
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                            fullWidth
                            sx={{ mb: 2 }}
                            size="medium"
                        />
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Категория</InputLabel>
                            <Select
                                value={newProduct.categoryId}
                                onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                                label="Категория"
                            >
                                <MenuItem value="">Выберите категорию</MenuItem>
                                {Object.entries(categories).map(([id, name]) => (
                                    <MenuItem key={id} value={id}>
                                        {name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Единица измерения</InputLabel>
                            <Select
                                value={newProduct.unitId}
                                onChange={(e) => setNewProduct({ ...newProduct, unitId: e.target.value })}
                                label="Единица измерения"
                            >
                                <MenuItem value="">Выберите единицу измерения</MenuItem>
                                {Object.entries(units).map(([id, name]) => (
                                    <MenuItem key={id} value={id}>
                                        {name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={toggleAddProduct}
                        variant="outlined"
                        fullWidth
                        size="large"
                        sx={{ borderRadius: 2, mr: 1 }}
                    >
                        Отмена
                    </Button>
                    <Button
                        onClick={handleAddProduct}
                        variant="contained"
                        disabled={!newProduct.name || !newProduct.categoryId || !newProduct.unitId}
                        fullWidth
                        size="large"
                        sx={{ borderRadius: 2, ml: 1 }}
                    >
                        Добавить
                    </Button>
                </DialogActions>
            </Dialog>

            {/* FAB для добавления товара */}
            {!isAnyDialogOpen && (
                <Fab
                    color="primary"
                    aria-label="add product"
                    onClick={toggleAddProduct}
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

            {/* Диалог удаления товара */}
            <ConfirmDialog
                open={removeProductDialogOpen}
                onClose={handleCloseRemoveProductDialog}
                onConfirm={handleDeleteProduct}
                title="Удалить товар"
                message={`Вы уверены, что хотите удалить товар "${productToRemove.name}"?`}
                confirmText="Удалить"
                cancelText="Отмена"
            />

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

export default Products;
