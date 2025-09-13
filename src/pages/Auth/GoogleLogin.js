import { Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getErrorMessage } from "../../utils/firebase_firestore";
import GoogleIcon from "@mui/icons-material/Google";
import { useLoading } from "../../hooks/LoadingContext";

const GoogleLogin = () => {
    const navigate = useNavigate();
    const { loginWithGoogle } = useAuth();
    const { withLoading } = useLoading();

    const handleGoogleSignIn = async () => {
        await withLoading(async () => {
            try {
                await loginWithGoogle();
                navigate("/");
            } catch (error) {
                alert(getErrorMessage(error));
            }
        });
    };

    return (
        <>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    mb: 2,
                }}
            >
                <Button
                    variant="outlined"
                    onClick={handleGoogleSignIn}
                    startIcon={<GoogleIcon />}
                    sx={{
                        height: 48,
                        minWidth: 280,
                        borderRadius: 2,
                        border: "2px solid #4285F4",
                        backgroundColor: "white",
                        color: "#4285F4",
                        textTransform: "none",
                        fontSize: "16px",
                        fontWeight: 600,
                        px: 3,
                        "&:hover": {
                            backgroundColor: "#f8f9fa",
                            border: "2px solid #357ae8",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        },
                        "&:active": {
                            backgroundColor: "#f1f3f4",
                            transform: "translateY(1px)",
                        },
                        "& .MuiButton-startIcon": {
                            marginRight: 2,
                        },
                    }}
                >
                    Войти через Google
                </Button>
            </Box>
        </>
    );
};

export default GoogleLogin;
