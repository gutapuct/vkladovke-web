import { Backdrop, CircularProgress, Typography } from "@mui/material";
import { useLoading } from "../hooks/LoadingContext";

const LoadingSpinner = () => {
    const { loading } = useLoading();

    if (!loading) return null;

    return (
        <Backdrop
            open={loading}
            sx={{
                color: "#fff",
                zIndex: 9999,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                flexDirection: "column",
                gap: 2,
            }}
        >
            <CircularProgress color="inherit" size={60} />
            <Typography variant="h6" color="inherit">
                Загрузка...
            </Typography>
        </Backdrop>
    );
};

export default LoadingSpinner;
