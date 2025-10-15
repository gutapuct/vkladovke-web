import { Backdrop, CircularProgress, Typography, Fade } from "@mui/material";
import { useLoading } from "../hooks/LoadingContext";

const LoadingSpinner = () => {
    const { showSpinner } = useLoading();

    if (!showSpinner) return null;

    return (
        <Fade in={showSpinner} timeout={300}>
            <Backdrop
                open={showSpinner}
                sx={{
                    color: "#fff",
                    zIndex: 9999,
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    backdropFilter: "blur(4px)",
                }}
            >
                <CircularProgress color="inherit" size={64} thickness={4} />
                <Typography
                    variant="h6"
                    color="inherit"
                    sx={{
                        fontWeight: 500,
                        fontSize: "1.1rem",
                    }}
                >
                    Загрузка...
                </Typography>
            </Backdrop>
        </Fade>
    );
};

export default LoadingSpinner;
