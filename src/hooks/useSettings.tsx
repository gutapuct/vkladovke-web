import { createContext, FC, useCallback, useContext, useEffect, useState } from "react";
import { settingsService } from "../services/settingsService";
import { DEFAULT_UNIT, NO_NAME } from "../utils/constants";
import { Product } from "../services/settingsService";

const SettingsContext = createContext<SettingsProviderValue | null>(null);

export interface ProductInfo {
    category: string;
    unit: string;
}

interface SettingsProviderValue {
    units: Record<string, string>;
    categories: Record<string, string>;
    products: Product[];
    activeProducts: Product[];
    getProductInfo: (productId: string) => ProductInfo;
    getProductNameById: (id: string) => string;
    addProductToContext: (newProduct: Product) => void;
    removeProductFromContext: (id: string) => void;
    updateProductInContext: (product: Product) => void;
    sortCategories: (groupedItems: Record<string, string>) => string[][];
    sortCategoryEntries: (categoriesEntries: string[][]) => string[][];
}

export const useSettings = () => {
    return useContext(SettingsContext);
};

export const sortCategories = (groupedItems: Record<string, string>): string[][] => {
    return Object.entries(groupedItems).sort(([categoryA], [categoryB]) => {
        const nameA: string = categoryA.toLowerCase();
        const nameB: string = categoryB.toLowerCase();

        // Если одна из категорий "Другое", помещаем её в конец
        if (nameA === "другое") return 1;
        if (nameB === "другое") return -1;

        // Остальные категории сортируем по алфавиту
        return nameA.localeCompare(nameB);
    });
};

export const sortCategoryEntries = (categoriesEntries: string[][]): string[][] => {
    return [...categoriesEntries].sort((a, b) => {
        const nameA: string = a[1].toLowerCase();
        const nameB: string = b[1].toLowerCase();

        // Если одна из категорий "Другое", помещаем её в конец
        if (nameA === "другое") return 1;
        if (nameB === "другое") return -1;

        // Остальные категории сортируем по алфавиту
        return nameA.localeCompare(nameB);
    });
};

interface Props {
    children: React.ReactNode;
}

export const SettingsProvider: FC<Props> = ({ children }) => {
    const [units, setUnits] = useState<Record<string, string>>({});
    const [categories, setCategories] = useState<Record<string, string>>({});
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const catchSettings = useCallback(async (): Promise<void> => {
        const settings = await settingsService.getSettings();
        setUnits(settings.units);
        setCategories(settings.categories);
    }, []);

    const catchProducts = useCallback(async (): Promise<void> => {
        const response = await settingsService.getProducts();
        setProducts(response);
    }, []);

    useEffect(() => {
        const loadData = async (): Promise<void> => {
            try {
                await Promise.all([catchSettings(), catchProducts()]);
            } catch (error) {
                console.error("Ошибка загрузки настроек:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData().then(() => {});
    }, [catchSettings, catchProducts]);

    const addProduct = useCallback((newProduct: Product) => {
        setProducts((prev) => [...prev, newProduct]);
    }, []);

    const removeProduct = useCallback((id: string) => {
        setProducts((prev) => prev.filter((item) => item.id !== id));
    }, []);

    const updateProduct = useCallback((product: Product): void => {
        setProducts((prev) =>
            prev.map((item) =>
                item.id !== product.id
                    ? item
                    : { ...item, name: product.name, categoryId: product.categoryId, unitId: product.unitId }
            )
        );
    }, []);

    const getProductNameById = useCallback((id: string): string => {
        const product = products.find((p) => p.id === id);
        return product ? product.name : NO_NAME;
    }, [products]);

    const getProductInfo = (productId: string): ProductInfo => {
        const product = products.find((p) => p.id === productId);

        if (!product) {
            return { category: NO_NAME, unit: DEFAULT_UNIT };
        }

        return {
            category: categories[product.categoryId] || NO_NAME,
            unit: units[product.unitId] || DEFAULT_UNIT,
        };
    };

    const value: SettingsProviderValue = {
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
