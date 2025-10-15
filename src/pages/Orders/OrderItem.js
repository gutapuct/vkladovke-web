import { useState } from "react";
import {
    Box,
    Typography,
    IconButton,
    Button,
    Chip,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from "@mui/material";
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    RadioButtonUnchecked,
    RadioButtonChecked,
    MoreVert as MoreIcon,
} from "@mui/icons-material";

const OrderItem = ({ item, order, onEdit, onDelete, onComplete, getProductNameById, getProductInfo }) => {
    const [showActions, setShowActions] = useState(false);
    const { unit } = getProductInfo(item.productId);
    const isCompleted = item.isCompleted;

    const handleAction = (action) => {
        setShowActions(false);
        switch (action) {
            case "edit":
                onEdit(item);
                break;
            case "delete":
                onDelete(item);
                break;
            case "complete":
                onComplete(item.productId, !isCompleted);
                break;
            default:
                break;
        }
    };

    return (
        <>
            <Box
                sx={{
                    p: 2,
                    borderBottom: "1px solid",
                    borderColor: "grey.100",
                    backgroundColor: "white",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                }}
            >
                {/* Кнопка статуса */}
                <IconButton
                    onClick={() => handleAction("complete")}
                    size="medium"
                    sx={{
                        backgroundColor: isCompleted ? "success.main" : "primary.main",
                        color: "white",
                        "&:hover": {
                            backgroundColor: isCompleted ? "success.dark" : "primary.dark",
                        },
                        flexShrink: 0,
                        mt: 0.5,
                    }}
                >
                    {isCompleted ? <RadioButtonChecked /> : <RadioButtonUnchecked />}
                </IconButton>

                {/* Информация о товаре */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        variant="body1"
                        sx={{
                            fontWeight: 500,
                            wordBreak: "break-word",
                            lineHeight: 1.3,
                            textDecoration: isCompleted ? "line-through" : "none",
                            opacity: isCompleted ? 0.7 : 1,
                        }}
                    >
                        {getProductNameById(item.productId)}
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1, flexWrap: "wrap" }}>
                        <Typography
                            variant="body2"
                            color="textSecondary"
                            sx={{ textDecoration: isCompleted ? "line-through" : "none" }}
                        >
                            {item.quantity} {unit}
                        </Typography>

                        {item.buyOnlyByAction && (
                            <Chip
                                label="по акции"
                                size="small"
                                variant="outlined"
                                sx={{ color: "red", borderColor: "red" }}
                            />
                        )}
                    </Box>
                </Box>

                {/* Кнопка меню действий */}
                {!order.isCompleted && (
                    <IconButton onClick={() => setShowActions(true)} size="small" sx={{ flexShrink: 0, mt: 0.5 }}>
                        <MoreIcon />
                    </IconButton>
                )}
            </Box>

            {/* Меню действий - Drawer снизу */}
            <Drawer
                anchor="bottom"
                open={showActions}
                onClose={() => setShowActions(false)}
                sx={{
                    "& .MuiPaper-root": {
                        borderTopLeftRadius: 12,
                        borderTopRightRadius: 12,
                        maxHeight: "50vh",
                    },
                }}
            >
                <Box sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ textAlign: "center", mb: 2, fontWeight: 600 }}>
                        Действия с товаром
                    </Typography>

                    <List>
                        <ListItem button onClick={() => handleAction("edit")} sx={{ borderRadius: 2, mb: 1 }}>
                            <ListItemIcon>
                                <EditIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText primary={<Typography sx={{ fontWeight: 500 }}>Редактировать</Typography>} />
                        </ListItem>

                        <ListItem button onClick={() => handleAction("complete")} sx={{ borderRadius: 2, mb: 1 }}>
                            <ListItemIcon>
                                {isCompleted ? (
                                    <RadioButtonUnchecked color="primary" />
                                ) : (
                                    <RadioButtonChecked color="primary" />
                                )}
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Typography sx={{ fontWeight: 500 }}>
                                        {isCompleted ? "Вернуть в список" : "Отметить купленным"}
                                    </Typography>
                                }
                            />
                        </ListItem>

                        <ListItem button onClick={() => handleAction("delete")} sx={{ borderRadius: 2 }}>
                            <ListItemIcon>
                                <DeleteIcon color="error" />
                            </ListItemIcon>
                            <ListItemText
                                primary={<Typography sx={{ color: "error.main", fontWeight: 500 }}>Удалить</Typography>}
                            />
                        </ListItem>
                    </List>

                    <Button
                        onClick={() => setShowActions(false)}
                        variant="outlined"
                        fullWidth
                        size="large"
                        sx={{ mt: 2, borderRadius: 2 }}
                    >
                        Отмена
                    </Button>
                </Box>
            </Drawer>
        </>
    );
};

export default OrderItem;
