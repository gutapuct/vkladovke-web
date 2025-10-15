import { Avatar, Box, Button, Container, TextField, Typography, Link } from "@mui/material";
import { useState } from "react";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../../utils/firebase_firestore";
import PasswordTextField from "../../components/PasswordTextField";
import { useAuth } from "../../hooks/useAuth";
import GoogleLogin from "./GoogleLogin";
import { useLoading } from "../../hooks/LoadingContext";
import AlertDialog from "../../components/AlertDialog";
import { useAlert } from "../../hooks/useAlert";

const Signup = () => {
    const navigate = useNavigate();
    const { alertState, showError, showInfo, hideAlert } = useAlert();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const { signup, emailVerification } = useAuth();
    const { withLoading } = useLoading();

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleCloseModal = () => {
        hideAlert();
        if (alertState.type === "info") {
            navigate("/login");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        await withLoading(async () => {
            try {
                const response = await signup(formData.email, formData.password);
                await emailVerification(response.user);

                showInfo(
                    `На указанный email адрес (${formData.email}) выслано письмо с подтверждением. Пожалуйста, зайдите в почту и подтвердите регистрацию.`,
                    "Подтвердите регистрацию"
                );
            } catch (error) {
                showError(getErrorMessage(error));
            }
        });
    };

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
                        Регистрация
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
                            Создать аккаунт
                        </Button>

                        <GoogleLogin />

                        <Box textAlign="center" sx={{ mt: 2 }}>
                            <Link
                                variant="body2"
                                onClick={() => navigate("/login")}
                                sx={{
                                    cursor: "pointer",
                                    fontSize: "1rem",
                                    fontWeight: 500,
                                }}
                            >
                                Уже имеется аккаунт? Войти
                            </Link>
                        </Box>
                    </Box>
                </Box>
            </Container>

            <AlertDialog
                open={alertState.open}
                onClose={handleCloseModal}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
            />
        </>
    );
};

export default Signup;
