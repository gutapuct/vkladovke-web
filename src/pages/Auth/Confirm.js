import {
    Avatar,
    Box,
    Button,
    Container,
    createTheme,
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
import { auth, getErrorMessage } from "../../utils/firebase_firestore";
import { useAuth } from "../../hooks/useAuth";
import { useLoading } from "../../hooks/LoadingContext";

const defaultTheme = createTheme();

const Confirm = () => {
    const { currentUser, logout, emailVerification } = useAuth();
    const { withLoading } = useLoading();

    const navigate = useNavigate();

    const [openModal, setOpenModal] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        await withLoading(async () => {
            try {
                await emailVerification(currentUser);
                setOpenModal(true);
            } catch (error) {
                alert(getErrorMessage(error));
            }
        });
    };

    const handleOpenModal = () => setOpenModal(true);

    const handleCloseModal = async () => {
        setOpenModal(false);
        navigate("/login");
    };

    const handleBack = async () => {
        await withLoading(async () => {
            await logout(auth);
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

                <Dialog
                    open={openModal}
                    onClose={handleOpenModal}
                    aria-labelledby="modal-title"
                    aria-describedby="modal-description"
                >
                    <DialogTitle id="modal-title">Подтвердите регистрацию</DialogTitle>

                    <DialogContent>
                        <DialogContentText id="modal-description" sx={{ mb: 2 }}>
                            На ваш email адрес выслано письмо с подтверждением.
                            <br />
                            Пожалуйста, зайдите в почту и подтвердите регистрацию.
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

export default Confirm;
