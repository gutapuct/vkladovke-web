import { Avatar, Box, Button, Container, TextField, Typography, Link } from "@mui/material";
import { useState } from "react";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../../utils/firebase_firestore";
import { useAuth } from "../../hooks/useAuth";
import { useLoading } from "../../hooks/LoadingContext";
import AlertDialog from "../../components/AlertDialog";
import { useAlert } from "../../hooks/useAlert";

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
                            textAlign: "center",
                            fontWeight: 600,
                            mb: 3,
                            fontSize: "1.75rem",
                        }}
                    >
                        Восстановление пароля
                    </Typography>
                    <Box component="form" noValidate sx={{ width: "100%" }}>
                        <TextField
                            required
                            fullWidth
                            id="email"
                            label="Эл.почта"
                            name="email"
                            autoComplete="email"
                            onChange={(event) => setEmail(event.target.value)}
                            value={email}
                            sx={{ mb: 3 }}
                            size="medium"
                            InputProps={{
                                sx: { fontSize: "16px" },
                            }}
                        />

                        <Button
                            disabled={!email}
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{
                                mt: 3,
                                py: 1.5,
                                fontSize: "1rem",
                                borderRadius: 2,
                            }}
                            onClick={handleSubmit}
                            size="large"
                        >
                            Сбросить пароль
                        </Button>

                        <Box textAlign="center" sx={{ mt: 3 }}>
                            <Link
                                variant="body2"
                                onClick={() => navigate("/login")}
                                sx={{
                                    cursor: "pointer",
                                    fontSize: "1rem",
                                    fontWeight: 500,
                                }}
                            >
                                Назад к входу
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
        </>
    );
};

export default ForgotPassword;
