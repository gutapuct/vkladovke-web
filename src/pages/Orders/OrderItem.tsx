import { useState, useRef, useEffect, FC } from "react";
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
    Checkbox,
    Tooltip,
} from "@mui/material";
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    MoreVert as MoreIcon,
    WarningAmber as WarningIcon,
} from "@mui/icons-material";
import { Order, OrderItem as IOrderItem } from "../../services/ordersService";

interface Props {
    item: IOrderItem;
    order: Order;
    onEdit: (item: IOrderItem) => void;
    onDelete: (item: IOrderItem) => void;
    onComplete: (productId: string, complete: boolean) => void;
    getProductNameById: (productId: string) => string;
}

const OrderItem: FC<Props> = ({ item, order, onEdit, onDelete, onComplete, getProductNameById }) => {
    const [showActions, setShowActions] = useState(false);
    const [showComment, setShowComment] = useState(false);
    const commentTimerRef = useRef<NodeJS.Timeout | null>(null);

    const isCompleted = item.isCompleted;

    // Фон для акционных товаров
    const backgroundColor = item.buyOnlyByAction && !isCompleted ? '#ffebee' : 'white';

    const handleAction = (action: "edit" | "delete" | "complete"): void => {
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

    const handleShowComment = (): void => {
        if (!item.comment?.trim()) return;

        setShowComment(true);

        if (commentTimerRef.current) {
            clearTimeout(commentTimerRef.current);
        }

        commentTimerRef.current = setTimeout(() => setShowComment(false), 3000);
    };

    useEffect(() => () => {
        if (commentTimerRef.current) clearTimeout(commentTimerRef.current);
    }, []);

    return (
        <>
            <Box
                sx={{
                    p: 2,
                    borderBottom: "1px solid",
                    borderColor: "grey.100",
                    backgroundColor: backgroundColor,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                    transition: "background-color 0.2s",
                }}
            >
                {/* Чекбокс статуса */}
                <Checkbox
                    checked={isCompleted}
                    onChange={() => handleAction("complete")}
                    sx={{
                        color: isCompleted ? "success.main" : "text.primary",
                        '&.Mui-checked': {
                            color: "success.main",
                        },
                        flexShrink: 0,
                        mt: 0.5,
                    }}
                />

                {/* Информация о товаре */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 0 }}>
                        <Typography
                            variant="body1"
                            onClick={item.comment?.trim() ? handleShowComment : undefined}
                            sx={{
                                fontWeight: 500,
                                wordBreak: "break-word",
                                lineHeight: 1.3,
                                textDecoration: isCompleted ? "line-through" : "none",
                                opacity: isCompleted ? 0.7 : 1,
                                cursor: item.comment?.trim() ? 'pointer' : 'default',
                                flexShrink: 1,
                            }}

                        >
                            {getProductNameById(item.productId)}
                        </Typography>
                        {item.comment?.trim() && (
                            <Tooltip
                                title={item.comment}
                                open={showComment}
                                onClose={() => setShowComment(false)}
                                disableFocusListener
                                disableHoverListener
                                disableTouchListener
                            >
                                <IconButton onClick={handleShowComment}>
                                    <WarningIcon color="warning" fontSize="medium" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                    
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1, flexWrap: "wrap" }}>
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
                        <ListItem onClick={() => handleAction("edit")} sx={{ borderRadius: 2, mb: 1 }}>
                            <ListItemIcon>
                                <EditIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText primary={<Typography sx={{ fontWeight: 500 }}>Редактировать</Typography>} />
                        </ListItem>

                        <ListItem
                            onClick={() => handleAction("complete")}
                            sx={{
                                borderRadius: 2,
                                mb: 1,
                                '&:active': {
                                    backgroundColor: 'transparent'
                                }
                            }}
                        >
                            <ListItemIcon>
                                <Checkbox
                                    checked={isCompleted}
                                    sx={{
                                        color: isCompleted ? "success.main" : "text.primary",
                                        '&.Mui-checked': {
                                            color: "success.main",
                                        },
                                        padding: 0,
                                    }}
                                />
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Typography sx={{ fontWeight: 500 }}>
                                        {isCompleted ? "Вернуть в список" : "Отметить купленным"}
                                    </Typography>
                                }
                            />
                        </ListItem>

                        <ListItem onClick={() => handleAction("delete")} sx={{ borderRadius: 2 }}>
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
