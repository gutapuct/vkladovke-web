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
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, getErrorMessage } from "../../utils/firebase_firestore";
import PasswordTextField from "../../components/PasswordTextField";

const defaultTheme = createTheme();

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await signInWithEmailAndPassword(auth, formData.email, formData.password);
            navigate("/");
        } catch (error) {
            alert(getErrorMessage(error.code));
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
                            Вход
                        </Typography>
                        <Box component="form" noValidate sx={{ mt: 3 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
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
                                    <PasswordTextField
                                        onChange={handleInputChange}
                                        value={formData.password}
                                    />
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
                                Войти
                            </Button>
                            <Box display="flex" justifyContent="space-between" alignItems="center" width="100%" mt={2}>
                                <Link variant="body2" onClick={() => navigate("/forgot-password")} sx={{ cursor: "pointer" }}>
                                    Забыли пароль?
                                </Link>
                                <Link variant="body2" onClick={() => navigate("/register")} sx={{ cursor: "pointer" }}>
                                    Нет аккаунта? Зарегистрироваться
                                </Link>
                            </Box>
                        </Box>
                    </Box>
                </Container>
            </ThemeProvider>
        </>
    );
};

export default Login;
