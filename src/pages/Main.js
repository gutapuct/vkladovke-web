import { useNavigate } from "react-router-dom";
import { ordersService } from "../services/ordersService";
import { useAuth } from "../hooks/useAuth";
import { Box, Button } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import AlertDialog from "../components/AlertDialog";
import { useAlert } from "../hooks/useAlert";
import { useLoading } from "../hooks/LoadingContext";
import { getErrorMessage } from "../utils/firebase_firestore";
import { formatFirebaseTimestamp, dateFormats } from "../utils/datetimeHelper";

const Main = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { alertState, showError, hideAlert } = useAlert();
    const { withLoading } = useLoading();
    const [orders, setOrders] = useState([]);

    const handleCreateOrder = () => {
        navigate("/create-order");
    };

    const catchOrders = useCallback(async () => {
        await withLoading(async () => {
            try {
                const response = await ordersService.getActiveOrders(currentUser.groupId);
                setOrders(response);
            } catch (error) {
                showError(getErrorMessage(error));
            }
        });
    }, [currentUser, withLoading, showError]);

    useEffect(() => {
        catchOrders();
    }, [catchOrders]);

    return (
        <>
            {orders.map((order) => (
                <Box key={order.id}>
                    <Button onClick={() => navigate(`/order-details/${order.id}`)}>
                        {order.title} от {formatFirebaseTimestamp(order.createdAt, dateFormats.dateOnly)}
                    </Button>
                </Box>
            ))}

            <Button onClick={handleCreateOrder}>Создать новый заказ!</Button>

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

export default Main;
