import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { settingsService } from "../services/settingsService";
import { DEFAULT_UNIT, NO_NAME } from "../utils/constants";

const SettingsContext = createContext();

export const useSettings = () => {
    return useContext(SettingsContext);
};

export const sortCategories = (groupedItems) => {
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

export const sortCategoryEntries = (categoriesEntries) => {
    return [...categoriesEntries].sort((a, b) => {
        const nameA = a[1].toLowerCase();
        const nameB = b[1].toLowerCase();

        // Если одна из категорий "Другое", помещаем её в конец
        if (nameA === "другое") return 1;
        if (nameB === "другое") return -1;

        // Остальные категории сортируем по алфавиту
        return nameA.localeCompare(nameB);
    });
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
        const loadData = async () => {
            try {
                await Promise.all([catchSettings(), catchProducts()]);
            } catch (error) {
                console.error("Ошибка загрузки настроек:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
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

    const getProductNameById = useCallback(
        (id) => {
            const product = products.find((p) => p.id === id);
            return product ? product.name : NO_NAME;
        },
        [products]
    );

    const getProductInfo = (productId) => {
        const product = products.find((p) => p.id === productId);

        if (!product) {
            return { category: NO_NAME, unit: DEFAULT_UNIT };
        }

        return {
            category: categories[product.categoryId] || NO_NAME,
            unit: units[product.unitId] || DEFAULT_UNIT,
        };
    };

    const value = {
        units,
        categories,
        products,
        activeProducts: products.filter((x) => !x.isDeleted),
        getProductInfo,
        getProductNameById,
        addProductToContext: addProduct,
        removeProductFromContext: removeProduct,
        updateProductInContext: updateProduct,
        sortCategories,
        sortCategoryEntries,
    };

    return <SettingsContext.Provider value={value}>{!loading && children}</SettingsContext.Provider>;
};
