import { useState } from "react";
import {
    Box,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    TableSortLabel,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Save as SaveIcon } from "@mui/icons-material";
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

    // Состояние для сортировки
    const [orderBy, setOrderBy] = useState("category"); // поле для сортировки
    const [order, setOrder] = useState("asc"); // направление сортировки: 'asc' или 'desc'

    const defaultNewProduct = { name: "", categoryId: "", unitId: "" };
    const [newProduct, setNewProduct] = useState({ ...defaultNewProduct });

    const toggleAddProduct = () => setIsModalAddProductOpen(!isModalAddProductOpen);

    // Функция для обработки сортировки
    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === "asc";
        setOrder(isAsc ? "desc" : "asc");
        setOrderBy(property);
    };

    // Функция сортировки продуктов
    const getSortedProducts = () => {
        return [...activeProducts].sort((a, b) => {
            let aValue, bValue;

            if (orderBy === "name") {
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
            } else if (orderBy === "category") {
                const aCategory = getProductInfo(a.id).category;
                const bCategory = getProductInfo(b.id).category;
                aValue = aCategory.toLowerCase();
                bValue = bCategory.toLowerCase();
            } else if (orderBy === "unit") {
                const aUnit = getProductInfo(a.id).unit;
                const bUnit = getProductInfo(b.id).unit;
                aValue = aUnit.toLowerCase();
                bValue = bUnit.toLowerCase();
            }

            if (aValue < bValue) {
                return order === "asc" ? -1 : 1;
            }
            if (aValue > bValue) {
                return order === "asc" ? 1 : -1;
            }
            return 0;
        });
    };

    const sortedProducts = getSortedProducts();

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
        <>
            <Box sx={{ mt: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={toggleAddProduct}>
                        Добавить товар
                    </Button>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    <TableSortLabel
                                        active={orderBy === "name"}
                                        direction={orderBy === "name" ? order : "asc"}
                                        onClick={() => handleRequestSort("name")}
                                    >
                                        Наименование
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={orderBy === "category"}
                                        direction={orderBy === "category" ? order : "asc"}
                                        onClick={() => handleRequestSort("category")}
                                    >
                                        Категория
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={orderBy === "unit"}
                                        direction={orderBy === "unit" ? order : "asc"}
                                        onClick={() => handleRequestSort("unit")}
                                    >
                                        Единица измерения
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="center">Действия</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedProducts.map((product) => {
                                const { category, unit } = getProductInfo(product.id);

                                return (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            {productToEdit?.id === product.id ? (
                                                <TextField
                                                    value={productToEdit.name}
                                                    onChange={(e) =>
                                                        setProductToEdit({
                                                            ...productToEdit,
                                                            name: e.target.value,
                                                        })
                                                    }
                                                    size="small"
                                                    fullWidth
                                                />
                                            ) : (
                                                product.name
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {productToEdit?.id === product.id ? (
                                                <FormControl fullWidth size="small">
                                                    <Select
                                                        value={productToEdit.categoryId}
                                                        onChange={(e) =>
                                                            setProductToEdit({
                                                                ...productToEdit,
                                                                categoryId: parseInt(e.target.value),
                                                            })
                                                        }
                                                    >
                                                        {Object.entries(categories).map(([id, name]) => (
                                                            <MenuItem key={id} value={parseInt(id)}>
                                                                {name}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            ) : (
                                                <Chip label={category} variant="outlined" />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {productToEdit?.id === product.id ? (
                                                <FormControl fullWidth size="small">
                                                    <Select
                                                        value={productToEdit.unitId}
                                                        onChange={(e) =>
                                                            setProductToEdit({
                                                                ...productToEdit,
                                                                unitId: parseInt(e.target.value),
                                                            })
                                                        }
                                                    >
                                                        {Object.entries(units).map(([id, name]) => (
                                                            <MenuItem key={id} value={parseInt(id)}>
                                                                {name}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            ) : (
                                                unit
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            {productToEdit?.id === product.id ? (
                                                <IconButton color="primary" onClick={handleSaveProductToEdit}>
                                                    <SaveIcon />
                                                </IconButton>
                                            ) : (
                                                <IconButton color="primary" onClick={() => handleEditProduct(product)}>
                                                    <EditIcon />
                                                </IconButton>
                                            )}
                                            <IconButton
                                                color="error"
                                                onClick={() => handleOpenRemoveProductDialog(product)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* Диалог добавления товара */}
            <Dialog open={isModalAddProductOpen} onClose={toggleAddProduct} maxWidth="sm" fullWidth>
                <DialogTitle>Добавить новый товар</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <TextField
                            label="Наименование товара"
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                            fullWidth
                            margin="normal"
                        />
                        <FormControl fullWidth margin="normal">
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
                        <FormControl fullWidth margin="normal">
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
                <DialogActions>
                    <Button onClick={toggleAddProduct}>Отмена</Button>
                    <Button
                        onClick={handleAddProduct}
                        variant="contained"
                        disabled={!newProduct.name || !newProduct.categoryId || !newProduct.unitId}
                    >
                        Добавить
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Диалог удаления товара */}
            <ConfirmDialog
                open={removeProductDialogOpen}
                onClose={handleCloseRemoveProductDialog}
                onConfirm={handleDeleteProduct}
                title="Удалить товар"
                message={`Вы уверены, что хотите удалить товар "${productToRemove.name}" ?`}
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
        </>
    );
};

export default Products;
