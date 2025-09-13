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
import PasswordTextField from "../../components/PasswordTextField";
import { useAuth } from "../../hooks/useAuth";
import GoogleLogin from "./GoogleLogin";
import { useLoading } from "../../hooks/LoadingContext";

const defaultTheme = createTheme();

const Signup = () => {
    const [openModal, setOpenModal] = useState(false);

    const navigate = useNavigate();
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

    const handleOpenModal = () => setOpenModal(true);

    const handleCloseModal = () => {
        setOpenModal(false);
        navigate("/login");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await withLoading(async () => {
                const response = await signup(formData.email, formData.password);
                await emailVerification(response.user);

                setOpenModal(true);
            });
        } catch (error) {
            alert(getErrorMessage(error));
        }
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

                <Dialog
                    open={openModal}
                    onClose={handleOpenModal}
                    aria-labelledby="modal-title"
                    aria-describedby="modal-description"
                >
                    <DialogTitle id="modal-title">Подтвердите регистрацию</DialogTitle>

                    <DialogContent>
                        <DialogContentText id="modal-description" sx={{ mb: 2 }}>
                            На указанный email адрес ({formData.email}) выслано письмо с подтверждением.
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

export default Signup;
