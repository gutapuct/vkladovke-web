import { Avatar, Box, Button, Container, createTheme, TextField, Typography, Link, ThemeProvider } from "@mui/material";
import { useState } from "react";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../../utils/firebase_firestore";
import { useAuth } from "../../hooks/useAuth";
import { useLoading } from "../../hooks/LoadingContext";
import AlertDialog from "../../components/AlertDialog";
import { useAlert } from "../../hooks/useAlert";

const defaultTheme = createTheme();

const ForgotPassword = () => {
    const navigate = useNavigate();
    const { alertState, showInfo, showError, hideAlert } = useAlert();

    const [email, setEmail] = useState("");

    const { resetPassword } = useAuth();
    const { withLoading } = useLoading();

    const handleSubmit = async (e) => {
        e.preventDefault();

        await withLoading(async () => {
            try {
                await resetPassword(email);
                showInfo(`На указанный email адрес (${email}) выслано письмо для сброса пароля`);
            } catch (error) {
                showError(getErrorMessage(error));
            }
        });
    };

    const closeModal = () => {
        hideAlert();
        navigate("/login");
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
                            Восстановление пароля
                        </Typography>
                        <Box component="form" noValidate sx={{ mt: 3 }}>
                            <TextField
                                required
                                fullWidth
                                id="email"
                                label="Эл.почта"
                                name="email"
                                autoComplete="email"
                                onChange={(event) => setEmail(event.target.value)}
                                value={email}
                            />

                            <Button
                                disabled={!email}
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3 }}
                                onClick={handleSubmit}
                            >
                                Сбросить пароль
                            </Button>

                            <Box textAlign="right" sx={{ mt: 2, mr: 2 }}>
                                <Link variant="body2" onClick={() => navigate("/login")} sx={{ cursor: "pointer" }}>
                                    Назад
                                </Link>
                            </Box>
                        </Box>
                    </Box>
                </Container>

                <AlertDialog
                    open={alertState.open}
                    onClose={closeModal}
                    title={alertState.title}
                    message={alertState.message}
                    type={alertState.type}
                />
            </ThemeProvider>
        </>
    );
};

export default ForgotPassword;
