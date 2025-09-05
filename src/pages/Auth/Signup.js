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
import React, { useState } from "react";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useNavigate } from "react-router-dom";
import { auth } from "../../utils/firebase_firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

const defaultTheme = createTheme();

const Signup = () => {
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
      const response = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      console.log("Signup successful: ", response);
      navigate("/login")
    } catch (error) {
      console.log(error.message);
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
                <Grid itm xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="email"
                    label="Эл.почта"
                    name="email"
                    autoComplete="email"
                    onChange={handleInputChange}
                    value={formData.email}
                  />
                  <TextField
                    required
                    fullWidth
                    id="password"
                    label="Пароль"
                    name="password"
                    autoComplete="password"
                    onChange={handleInputChange}
                    value={formData.password}
                  />
                </Grid>
              </Grid>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                onClick={handleSubmit}
              >
                Создать аккаунт
              </Button>
              <Grid item textAlign="right">
                <Link
                  variant="body2"
                  onClick={() => navigate("/login")}
                  sx={{ cursor: "pointer" }}
                >
                  Уже имеется аккаунт? Войти
                </Link>
              </Grid>
            </Box>
          </Box>
        </Container>
      </ThemeProvider>
    </>
  );
};

export default Signup;
