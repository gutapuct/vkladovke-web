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
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    backdropFilter: "blur(2px)",
                    transition: "opacity 0.3s ease-in-out",
                }}
            >
                <CircularProgress
                    color="inherit"
                    size={60}
                    thickness={4}
                    sx={{
                        animation: "pulse 1.5s ease-in-out infinite",
                        "@keyframes pulse": {
                            "0%": { opacity: 1 },
                            "50%": { opacity: 0.7 },
                            "100%": { opacity: 1 },
                        },
                    }}
                />
                <Typography
                    variant="h6"
                    color="inherit"
                    sx={{
                        fontWeight: 500,
                        letterSpacing: "0.5px",
                    }}
                >
                    Загрузка...
                </Typography>
            </Backdrop>
        </Fade>
    );
};

export default LoadingSpinner;
