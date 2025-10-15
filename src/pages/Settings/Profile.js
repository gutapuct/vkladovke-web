import { Box, Button, IconButton, TextField, Typography, Card, CardContent } from "@mui/material";
import { Edit as EditIcon, Save as SaveIcon } from "@mui/icons-material";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { userService } from "../../services/userService";
import { useLoading } from "../../hooks/LoadingContext";
import { getErrorMessage } from "../../utils/firebase_firestore";
import AlertDialog from "../../components/AlertDialog";
import { useAlert } from "../../hooks/useAlert";

const Profile = () => {
    const [canChangeName, setCanChangeName] = useState(false);
    const { currentUser, changeDisplayName } = useAuth();
    const [tempName, setTempName] = useState("");
    const { withLoading } = useLoading();
    const { alertState, showError, hideAlert } = useAlert();

    const openEditName = () => {
        setTempName(currentUser.displayName || currentUser.email);
        setCanChangeName(true);
    };

    const closeEditName = () => {
        setTempName("");
        setCanChangeName(false);
    };

    const handleChangeDisplayName = async () => {
        await withLoading(async () => {
            try {
                await userService.updateUser(currentUser.email, { displayName: tempName });
                changeDisplayName(tempName);
                closeEditName();
            } catch (error) {
                showError(getErrorMessage(error));
            }
        });
    };

    return (
        <Box>
            <Card sx={{ borderRadius: 3, mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        Профиль пользователя
                    </Typography>

                    {canChangeName ? (
                        <>
                            <TextField
                                label="Отображаемое имя"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                variant="outlined"
                                fullWidth
                                autoFocus
                                sx={{ mb: 2 }}
                                size="medium"
                            />
                            <Box sx={{ display: "flex", gap: 2 }}>
                                <Button
                                    variant="contained"
                                    onClick={handleChangeDisplayName}
                                    startIcon={<SaveIcon />}
                                    fullWidth
                                    size="large"
                                    sx={{ borderRadius: 2 }}
                                >
                                    Сохранить
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={closeEditName}
                                    fullWidth
                                    size="large"
                                    sx={{ borderRadius: 2 }}
                                >
                                    Отмена
                                </Button>
                            </Box>
                        </>
                    ) : (
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    {currentUser.displayName || currentUser.email}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {currentUser.email}
                                </Typography>
                            </Box>
                            <IconButton onClick={openEditName} color="primary" size="large">
                                <EditIcon />
                            </IconButton>
                        </Box>
                    )}
                </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        Информация
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="body2" color="textSecondary">
                                Email:
                            </Typography>
                            <Typography variant="body2">{currentUser.email}</Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="body2" color="textSecondary">
                                ID пользователя:
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                                {currentUser.uid}
                            </Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography variant="body2" color="textSecondary">
                                ID группы:
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                                {currentUser.groupId}
                            </Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            <AlertDialog
                open={alertState.open}
                onClose={hideAlert}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
            />
        </Box>
    );
};

export default Profile;
