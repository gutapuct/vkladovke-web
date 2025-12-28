import { Avatar, Box, Button, Container, TextField, Typography, Link } from "@mui/material";
import React, { FC, MouseEventHandler, useEffect, useState } from "react";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useNavigate } from "react-router-dom";
import { getErrorMessage, isFirebaseError } from "../../utils/firebase_firestore";
import PasswordTextField from "../../components/PasswordTextField";
import { useAuth } from "../../hooks/useAuth";
import GoogleLogin from "./GoogleLogin";
import { useLoading } from "../../hooks/LoadingContext";
import AlertDialog from "../../components/AlertDialog";
import { useAlert } from "../../hooks/useAlert";

interface FormData {
    email: string;
    password: string;
}

const defaultFormData: FormData = {
    email: "",
    password: "",
};

const Login: FC = () => {
    const navigate = useNavigate();
    const { login, currentUser } = useAuth();
    const { alertState, showError, hideAlert } = useAlert();

    const [formData, setFormData] = useState<FormData>(defaultFormData);

    const { withLoading } = useLoading();

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = event.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit: MouseEventHandler<HTMLButtonElement> = async (e): Promise<void> => {
        e.preventDefault();
        await withLoading(async () => {
            try {
                await login(formData.email, formData.password);
                navigate("/");
            } catch (error) {
                if (isFirebaseError(error)) {
                    showError(getErrorMessage(error));
                } else if (error instanceof Error) {
                    showError(error.message);
                } else {
                    showError(String(error));
                }
            }
        });
    };

    useEffect(() => {
        if (currentUser) {
            navigate("/");
        }
    }, [currentUser, navigate]);

    return (
        <>
            <Container
                component="main"
                maxWidth="sm"
                sx={{
                    px: 3,
                    pb: 3,
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                    <Avatar
                        sx={{
                            m: 2,
                            bgcolor: "primary.main",
                            width: 64,
                            height: 64,
                        }}
                    >
                        <LockOutlinedIcon fontSize="large" />
                    </Avatar>
                    <Typography
                        component="h1"
                        variant="h4"
                        sx={{
                            fontWeight: 600,
                            mb: 3,
                            fontSize: "1.75rem",
                        }}
                    >
                        Вход
                    </Typography>
                    <Box component="form" noValidate sx={{ width: "100%" }}>
                        <TextField
                            required
                            fullWidth
                            id="email"
                            label="Эл.почта"
                            name="email"
                            autoComplete="email"
                            onChange={handleInputChange}
                            value={formData.email}
                            sx={{ mb: 3 }}
                            size="medium"
                            slotProps={{
                                input: {
                                    sx: { fontSize: "16px" },
                                },
                            }}
                        />
                        <PasswordTextField onChange={handleInputChange} value={formData.password} size="medium" />

                        <Button
                            disabled={!formData.email || !formData.password}
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{
                                mt: 3,
                                mb: 2,
                                py: 1.5,
                                fontSize: "1rem",
                                borderRadius: 2,
                            }}
                            onClick={handleSubmit}
                            size="large"
                        >
                            Войти
                        </Button>

                        <GoogleLogin />

                        <Box
                            display="flex"
                            flexDirection="column"
                            justifyContent="space-between"
                            alignItems="stretch"
                            width="100%"
                            mt={3}
                            gap={2}
                        >
                            <Link
                                variant="body2"
                                onClick={() => navigate("/forgot-password")}
                                sx={{
                                    cursor: "pointer",
                                    textAlign: "center",
                                    fontSize: "1rem",
                                    fontWeight: 500,
                                    py: 1,
                                }}
                            >
                                Забыли пароль?
                            </Link>
                            <Link
                                variant="body2"
                                onClick={() => navigate("/register")}
                                sx={{
                                    cursor: "pointer",
                                    textAlign: "center",
                                    fontSize: "1rem",
                                    fontWeight: 500,
                                    py: 1,
                                }}
                            >
                                Нет аккаунта? Зарегистрироваться
                            </Link>
                        </Box>
                    </Box>
                </Box>
            </Container>

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

export default Login;
