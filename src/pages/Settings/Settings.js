import { useState } from "react";
import {
    Box,
    Typography,
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
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Save as SaveIcon } from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";
import { userService } from "../../services/userService";
import { settingsService } from "../../services/settingsService";
import { useLoading } from "../../hooks/LoadingContext";
import { useSettings } from "../../hooks/useSettings";
import { getErrorMessage } from "../../utils/firebase_firestore";
import ConfirmDialog from "../../components/ConfirmDialog";

const Settings = () => {
    const { withLoading } = useLoading();
    const { currentUser, changeDisplayName } = useAuth();
    const {
        units,
        categories,
        products,
        addProductToContext,
        removeProductFromContext,
        updateProductInContext,
        getCategoryNameById,
        getUnitNameById
    } = useSettings();

    const [canChangeName, setCanChangeName] = useState(false);
    const [tempName, setTempName] = useState("");

    const [isModalAddProductOpen, setIsModalAddProductOpen] = useState(false);

    const [removeProductDialogOpen, setRemoveProductDialogOpen] = useState(false);
    const [productToRemove, setProductToRemove] = useState({});

    const [productToEdit, setProductToEdit] = useState({});

    const [newProduct, setNewProduct] = useState({
        name: "",
        categoryId: "",
        unitId: "",
    });

    const openEditName = () => {
        setTempName(currentUser.displayName || currentUser.email);
        setCanChangeName(true);
    };

    const closeEditName = () => {
        setTempName("");
        setCanChangeName(false);
    };

    const toggleAddProduct = () => setIsModalAddProductOpen(!isModalAddProductOpen);

    const handleChangeDisplayName = async () => {
        await withLoading(async () => {
            try {
                await userService.updateUser(currentUser.email, { displayName: tempName });
                changeDisplayName(tempName);
                closeEditName();
            } catch (error) {
                alert(getErrorMessage(error));
            }
        });
    };

    const handleAddProduct = async () => {
        await withLoading(async () => {
            try {
                const response = await settingsService.addProduct(newProduct);

                addProductToContext(response);
                setNewProduct({ name: "", categoryId: "", unitId: "" });
                toggleAddProduct(false);
            } catch (error) {
                alert(getErrorMessage(error));
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
                alert(getErrorMessage(error));
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
                alert(getErrorMessage(error));
            }
        });
    };

    return (
        <>
            {/* Секция профиля */}
            <Box>
                {canChangeName ? (
                    <>
                        <TextField
                            label="Отображаемое имя"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            variant="outlined"
                            fullWidth
                            autoFocus
                        />
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
                            <Button variant="contained" onClick={handleChangeDisplayName} startIcon={<SaveIcon />}>
                                Сохранить
                            </Button>
                            <Button variant="outlined" onClick={closeEditName} size="small">
                                Отмена
                            </Button>
                        </Box>
                    </>
                ) : (
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Typography variant="h6">{currentUser.displayName || currentUser.email}</Typography>
                        <IconButton onClick={openEditName} color="primary">
                            <EditIcon />
                        </IconButton>
                    </Box>
                )}
            </Box>

            {/* Секция товаров */}
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
                                <TableCell>Наименование</TableCell>
                                <TableCell>Категория</TableCell>
                                <TableCell>Единица измерения</TableCell>
                                <TableCell align="center">Действия</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {products.map((product) => (
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
                                            <Chip label={getCategoryNameById(product.categoryId)} variant="outlined" />
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
                                            getUnitNameById(product.unitId)
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
                            ))}
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
        </>
    );
};

export default Settings;
