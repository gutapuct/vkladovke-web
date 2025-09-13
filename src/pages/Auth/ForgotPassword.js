import {
    Avatar,
    Box,
    Button,
    Container,
    createTheme,
    TextField,
    Typography,
    Link,
    ThemeProvider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from "@mui/material";
import { useState } from "react";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../../utils/firebase_firestore";
import { useAuth } from "../../hooks/useAuth";
import { useLoading } from "../../hooks/LoadingContext";

const defaultTheme = createTheme();

const ForgotPassword = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [openModal, setOpenModal] = useState(false);

    const { resetPassword } = useAuth();
    const { withLoading } = useLoading();

    const handleSubmit = async (e) => {
        e.preventDefault();

        await withLoading(async () => {
            try {
                await resetPassword(email);
                setOpenModal(true);
            } catch (error) {
                alert(getErrorMessage(error));
            }
        });
    };

    const handleOpenModal = () => setOpenModal(true);

    const handleCloseModal = () => {
        setOpenModal(false);
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

                <Dialog
                    open={openModal}
                    onClose={handleOpenModal}
                    aria-labelledby="modal-title"
                    aria-describedby="modal-description"
                >
                    <DialogTitle id="modal-title">Сброс пароля</DialogTitle>

                    <DialogContent>
                        <DialogContentText id="modal-description" sx={{ mb: 2 }}>
                            На указанный email адрес ({email}) выслано письмо для сброса пароля.
                        </DialogContentText>
                    </DialogContent>

                    <DialogActions>
                        <Button onClick={handleCloseModal}>Закрыть</Button>
                    </DialogActions>
                </Dialog>
            </ThemeProvider>
        </>
    );
};

export default ForgotPassword;
