import {
    Avatar,
    Box,
    Button,
    Container,
    createTheme,
    Grid,
    TextField,
    Typography,
    Link,
    ThemeProvider,
} from "@mui/material";
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

const defaultTheme = createTheme();

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
                await signup(formData.email, formData.password);
                await emailVerification();

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
            <ThemeProvider theme={defaultTheme}>
                <Container component="main" maxWidth="xs">
                    <Box
                        sx={{
                            marginTop: 8,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                        }}
                    >
                        <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
                            <LockOutlinedIcon />
                        </Avatar>
                        <Typography component="h1" variant="h4">
                            Регистрация
                        </Typography>
                        <Box component="form" noValidate sx={{ mt: 3 }}>
                            <Grid container spacing={2}>
                                <Grid>
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
                                    />
                                    <PasswordTextField onChange={handleInputChange} value={formData.password} />
                                </Grid>
                            </Grid>
                            <Button
                                disabled={!formData.email || !formData.password}
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2 }}
                                onClick={handleSubmit}
                            >
                                Создать аккаунт
                            </Button>

                            <GoogleLogin />

                            <Grid item textAlign="right">
                                <Link variant="body2" onClick={() => navigate("/login")} sx={{ cursor: "pointer" }}>
                                    Уже имеется аккаунт? Войти
                                </Link>
                            </Grid>
                        </Box>
                    </Box>
                </Container>
            </ThemeProvider>

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
