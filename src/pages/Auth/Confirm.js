import { Avatar, Box, Button, Container, Typography, Link } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useNavigate } from "react-router-dom";
import { auth, getErrorMessage } from "../../utils/firebase_firestore";
import { useAuth } from "../../hooks/useAuth";
import { useLoading } from "../../hooks/LoadingContext";
import AlertDialog from "../../components/AlertDialog";
import { useAlert } from "../../hooks/useAlert";

const Confirm = () => {
    const { currentUser, logout, emailVerification } = useAuth();
    const { withLoading } = useLoading();
    const { alertState, showError, showInfo, hideAlert } = useAlert();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        await withLoading(async () => {
            try {
                await emailVerification(currentUser.auth.currentUser);
                showInfo(
                    "На ваш email адрес выслано письмо с подтверждением. Пожалуйста, зайдите в почту и подтвердите регистрацию.",
                    "Подтвердите регистрацию"
                );
            } catch (error) {
                showError(getErrorMessage(error));
            }
        });
    };

    const handleCloseModal = async () => {
        hideAlert();
        await logout();
        if (alertState.type === "info") {
            navigate("/login");
        }
    };

    const handleBack = async () => {
        await withLoading(async () => {
            await logout(auth);
            hideAlert();
            navigate("/login");
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
                    height: "100vh",
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
                        Подтвердите email
                    </Typography>
                    <Box component="form" noValidate sx={{ width: "100%" }}>
                        <Typography
                            variant="body1"
                            sx={{
                                textAlign: "center",
                                lineHeight: 1.6,
                                mb: 3,
                                fontSize: "1rem",
                            }}
                        >
                            На ваш email адрес <strong>{currentUser.email}</strong> ранее было выслано письмо с
                            подтверждением. Пожалуйста, зайдите в почту и подтвердите регистрацию.
                        </Typography>
                        <Typography
                            sx={{
                                textAlign: "center",
                                color: "text.secondary",
                                mb: 3,
                                fontSize: "0.95rem",
                            }}
                        >
                            Для повторной отправки письма, воспользуйтесь кнопкой ниже
                        </Typography>

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{
                                mb: 2,
                                py: 1.5,
                                fontSize: "1rem",
                                borderRadius: 2,
                            }}
                            onClick={handleSubmit}
                            size="large"
                        >
                            Отправить письмо с подтверждением
                        </Button>

                        <Box textAlign="center">
                            <Link
                                variant="body2"
                                onClick={handleBack}
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
                onClose={handleCloseModal}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
            />
        </>
    );
};

export default Confirm;
