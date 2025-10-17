import { Box, IconButton, TextField, Typography } from "@mui/material";
import { Remove as RemoveIcon, Add as AddIcon } from "@mui/icons-material";

const QuantityInput = ({ value, onChange, label }) => {
    const handleInputChange = (e) => {
        const val = e.target.value;

        // Разрешаем пустую строку, чтобы можно было стереть значение
        if (val === "") {
            onChange("");
        } else if (/^\d+$/.test(val)) {
            // Только положительные числа
            onChange(parseInt(val));
        }
    };

    const handleIncrement = () => {
        const current = typeof value === "number" ? value : 1;
        onChange(current + 1);
    };

    const handleDecrement = () => {
        const current = typeof value === "number" ? value : 1;
        onChange(Math.max(current - 1, 1));
    };

    const handleBlur = () => {
        if (value === "" || value < 1) {
            onChange(1);
        }
    };

    return (
        <Box sx={{ width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                <Typography
                    variant="subtitle1"
                    sx={{
                        minWidth: 100,
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "text.primary",
                    }}
                >
                    {label}
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
                    <IconButton
                        onClick={handleDecrement}
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            backgroundColor: "background.paper",
                            "&:active": {
                                backgroundColor: "action.selected",
                                transform: "scale(0.95)",
                            },
                        }}
                    >
                        <RemoveIcon />
                    </IconButton>

                    <TextField
                        value={value}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        slotProps={{
                            htmlInput: {
                                inputMode: "numeric",
                                pattern: "[0-9]*",
                                min: 1,
                            },
                        }}
                        sx={{
                            flex: 1,
                            maxWidth: 120,
                            "& .MuiOutlinedInput-root": {
                                height: 48,
                                borderRadius: 2,
                                "& input": {
                                    textAlign: "center",
                                    fontSize: "18px",
                                    fontWeight: 600,
                                    padding: "0 8px",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                },
                            },
                        }}
                    />

                    <IconButton
                        onClick={handleIncrement}
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            backgroundColor: "background.paper",
                            "&:active": {
                                backgroundColor: "action.selected",
                                transform: "scale(0.95)",
                            },
                        }}
                    >
                        <AddIcon />
                    </IconButton>
                </Box>
            </Box>
        </Box>
    );
};

export default QuantityInput;
