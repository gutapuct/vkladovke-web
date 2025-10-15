import { TextField, InputAdornment, IconButton } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useState } from "react";

const PasswordTextField = ({ onChange, value, size = "medium" }) => {
    const [showPassword, setShowPassword] = useState(false);

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleMouseDownPassword = (event) => {
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
