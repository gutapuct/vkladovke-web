export const getNow = () => new Date();
export const getNowString = () => new Date().toLocaleString();
export const getTodayString = () => new Date().toLocaleDateString();

export const formatFirebaseTimestamp = (timestamp, options = {}) => {
    if (!timestamp) return "Не указано";

    try {
        const date = timestamp.toDate();

        const defaultOptions = {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        };

        return date.toLocaleString("ru-RU", options ? { ...options } : { ...defaultOptions });
    } catch (error) {
        console.error("Ошибка форматирования даты:", error);
        return "Неверный формат даты";
    }
};

// Дополнительные варианты форматирования
export const dateFormats = {
    short: { year: "numeric", month: "2-digit", day: "2-digit" },
    medium: {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    },
    long: {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    },
    timeOnly: { hour: "2-digit", minute: "2-digit" },
    dateOnly: { year: "numeric", month: "2-digit", day: "2-digit" },
};
