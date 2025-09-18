import { Box, Button, IconButton, TextField, Typography } from "@mui/material";
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
            {canChangeName ? (
                <>
                    <TextField
                        label="Отображаемое имя"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        variant="outlined"
                        fullWidth
                        autoFocus
                    />
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
                        <Button variant="contained" onClick={handleChangeDisplayName} startIcon={<SaveIcon />}>
                            Сохранить
                        </Button>
                        <Button variant="outlined" onClick={closeEditName} size="small">
                            Отмена
                        </Button>
                    </Box>
                </>
            ) : (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography variant="h6">{currentUser.displayName || currentUser.email}</Typography>
                    <IconButton onClick={openEditName} color="primary">
                        <EditIcon />
                    </IconButton>
                </Box>
            )}

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
