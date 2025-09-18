import {
    Avatar,
    Box,
    Button,
    Container,
    createTheme,
    Typography,
    Link,
    ThemeProvider,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useNavigate } from "react-router-dom";
import { auth, getErrorMessage } from "../../utils/firebase_firestore";
import { useAuth } from "../../hooks/useAuth";
import { useLoading } from "../../hooks/LoadingContext";
import AlertDialog from "../../components/AlertDialog";
import { useAlert } from "../../hooks/useAlert";

const defaultTheme = createTheme();

const Confirm = () => {
    const { currentUser, logout, emailVerification } = useAuth();
    const { withLoading } = useLoading();
    const { alertState, showError, showInfo, hideAlert } = useAlert();

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        await withLoading(async () => {
            try {
                await emailVerification();
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
                            Подтвердите email
                        </Typography>
                        <Box component="form" noValidate sx={{ mt: 3 }}>
                            <Typography component="h3">
                                На ваш email адрес ({currentUser.email}) ранее было выслано письмо с подтверждением.
                                <br />
                                Пожалуйста, зайдите в почту и подтвердите регистрацию.
                            </Typography>
                            <Typography sx={{ mt: 2, fontStyle: "italic" }}>
                                Для повторной отправки письма, воспользуйтесь кнопкой ниже
                            </Typography>

                            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3 }} onClick={handleSubmit}>
                                Отправить письмо с подтверждением
                            </Button>

                            <Box textAlign="right" sx={{ mt: 2, mr: 2 }}>
                                <Link variant="body2" onClick={handleBack} sx={{ cursor: "pointer" }}>
                                    Назад
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
            </ThemeProvider>
        </>
    );
};

export default Confirm;
