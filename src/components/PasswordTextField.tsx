import { TextField, InputAdornment, IconButton } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { ChangeEvent, FC, useState } from "react";

interface Props {
    value: string;
    size: "small" | "medium";
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

const PasswordTextField: FC<Props> = ({ onChange, value, size = "medium" }) => {
    const [showPassword, setShowPassword] = useState(false);

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    return (
        <TextField
            required
            fullWidth
            type={showPassword ? "text" : "password"}
            id="password"
            label="Пароль"
            name="password"
            autoComplete="password"
            onChange={onChange}
            value={value}
            size={size}
            slotProps={{
                input: {
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                onClick={toggleShowPassword}
                                onMouseDown={handleMouseDownPassword}
                                edge="end"
                                size="large"
                            >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    ),
                },
            }}
            sx={{
                "& .MuiInputBase-input": {
                    fontSize: "16px",
                },
            }}
        />
    );
};

export default PasswordTextField;
