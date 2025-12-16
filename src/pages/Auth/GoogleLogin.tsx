import { Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getErrorMessage, isFirebaseError } from "../../utils/firebase_firestore";
import GoogleIcon from "@mui/icons-material/Google";
import { useLoading } from "../../hooks/LoadingContext";
import AlertDialog from "../../components/AlertDialog";
import { useAlert } from "../../hooks/useAlert";
import { FC } from "react";

const GoogleLogin: FC = () => {
    const navigate = useNavigate();
    const { loginWithGoogle } = useAuth();
    const { withLoading } = useLoading();
    const { alertState, showError, hideAlert } = useAlert();

    const handleGoogleSignIn = async (): Promise<void> => {
        await withLoading(async () => {
            try {
                await loginWithGoogle();
                navigate("/");
            } catch (error) {
                if (isFirebaseError(error)) {
                    showError(getErrorMessage(error));
                } else if (error instanceof Error) {
                    showError(error.message);
                } else {
                    showError(String(error));
                }
            }
        });
    };

    return (
        <>
            <Box sx={{ mb: 2 }}>
                <Button
                    variant="outlined"
                    onClick={handleGoogleSignIn}
                    startIcon={<GoogleIcon />}
                    sx={{
                        height: 48,
                        width: "100%",
                        borderRadius: 2,
                        border: "2px solid #4285F4",
                        backgroundColor: "white",
                        color: "#4285F4",
                        textTransform: "none",
                        fontSize: "1rem",
                        fontWeight: 600,
                        "&:hover": {
                            backgroundColor: "#f8f9fa",
                            border: "2px solid #357ae8",
                        },
                        "& .MuiButton-startIcon": {
                            marginRight: 2,
                        },
                    }}
                >
                    Войти через Google
                </Button>
            </Box>

            <AlertDialog
                open={alertState.open}
                onClose={hideAlert}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
            />
        </>
    );
};

export default GoogleLogin;
