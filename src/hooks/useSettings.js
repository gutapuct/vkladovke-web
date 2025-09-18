import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { settingsService } from "../services/settingsService";
import { NO_NAME } from "../utils/constants";

const SettingsContext = createContext();

export const useSettings = () => {
    return useContext(SettingsContext);
};

export const SettingsProvider = ({ children }) => {
    const [units, setUnits] = useState({});
    const [categories, setCategories] = useState({});
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const catchSettings = useCallback(async () => {
        const settings = await settingsService.getSettings();
        setUnits(settings.units);
        setCategories(settings.categories);
    }, []);

    const catchProducts = useCallback(async () => {
        const response = await settingsService.getProducts();
        setProducts(response);
    }, []);

    useEffect(() => {
        catchSettings();
        catchProducts();
        setLoading(false);
    }, [catchSettings, catchProducts]);

    const addProduct = useCallback((newProduct) => {
        setProducts((prev) => [...prev, newProduct]);
    }, []);

    const removeProduct = useCallback((id) => {
        setProducts((prev) => prev.filter((item) => item.id !== id));
    }, []);

    const updateProduct = useCallback((product) => {
        setProducts((prev) =>
            prev.map((item) =>
                item.id !== product.id
                    ? item
                    : { ...item, name: product.name, categoryId: product.categoryId, unitId: product.unitId }
            )
        );
    }, []);

    const getCategoryNameById = useCallback(
        (categoryId) => {
            return categories[categoryId] || NO_NAME;
        },
        [categories]
    );

    const getUnitNameById = useCallback(
        (unitId) => {
            return units[unitId] || NO_NAME;
        },
        [units]
    );

    const value = {
        units,
        categories,
        products,
        getCategoryNameById,
        getUnitNameById,
        addProductToContext: addProduct,
        removeProductFromContext: removeProduct,
        updateProductInContext: updateProduct
    };

    return <SettingsContext.Provider value={value}>{!loading && children}</SettingsContext.Provider>;
};
