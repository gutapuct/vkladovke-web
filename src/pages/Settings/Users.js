import React, { useCallback, useEffect, useState } from "react";
import { userService } from "../../services/userService";
import { useAuth } from "../../hooks/useAuth";
import { useLoading } from "../../hooks/LoadingContext";
import { Box, Button, TextField, Typography } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { getErrorMessage } from "../../utils/firebase_firestore";
import AlertDialog from "../../components/AlertDialog";
import { useAlert } from "../../hooks/useAlert";

const Users = () => {
    const { currentUser } = useAuth();
    const { withLoading } = useLoading();

    const { alertState, showError, showSuccess, hideAlert } = useAlert();

    const [invitation, setInvitation] = useState({});
    const [emailToInvite, setEmailToInvite] = useState("");

    const catchInvitation = useCallback(async () => {
        const response = await userService.getInvitationToApply(currentUser);
        setInvitation(response);
    }, [currentUser]);

    useEffect(() => {
        catchInvitation();
    }, [catchInvitation]);

    const sendInvitation = async () => {
        try {
            await withLoading(async () => {
                await userService.inviteUser(currentUser, emailToInvite);
                setEmailToInvite("");
                showSuccess("Приглашение отправлено!");
            });
        } catch (error) {
            showError(getErrorMessage(error));
        }
    };

    const applyInvitation = async () => {
        try {
            await withLoading(async () => {
                await userService.applyInvitation(currentUser);
                setInvitation({});
            });
        } catch (error) {
            showError(getErrorMessage(error));
        }
    };

    const declineInvitation = async () => {
        try {
            await withLoading(async () => {
                await userService.cancelInvitation(currentUser);
                setInvitation({});
            });
        } catch (error) {
            showError(getErrorMessage(error));
        }
    };

    return (
        <>
            {invitation?.name && (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "left" }}>
                    <Typography variant="h6">
                        Пользователь "{invitation.name} ({invitation.email})" пригласил вас в общую группу!
                    </Typography>
                    <Button variant="contained" onClick={applyInvitation} sx={{ mx: 3 }}>
                        Принять
                    </Button>
                    <Button variant="outlined" onClick={declineInvitation} size="small">
                        Отклонить
                    </Button>
                </Box>
            )}

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "left" }}>
                <TextField
                    label="Эл.почта"
                    onChange={(e) => setEmailToInvite(e.target.value)}
                    value={emailToInvite}
                    sx={{ minWidth: "100vh" }}
                />
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={sendInvitation}
                    disabled={emailToInvite.length === 0}
                    sx={{ ml: 3 }}
                >
                    Добавить пользователя в группу
                </Button>

                <AlertDialog
                    open={alertState.open}
                    onClose={hideAlert}
                    title={alertState.title}
                    message={alertState.message}
                    type={alertState.type}
                    autoClose={alertState.autoClose}
                />
            </Box>
        </>
    );
};

export default Users;
