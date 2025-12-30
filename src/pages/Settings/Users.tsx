import { FC, useCallback, useEffect, useState } from "react";
import { Invitation, userService } from "../../services/userService";
import { useAuth } from "../../hooks/useAuth";
import { useLoading } from "../../hooks/LoadingContext";
import { Box, Button, TextField, Typography, Card, CardContent, Chip } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { getErrorMessage, isFirebaseError } from "../../utils/firebase_firestore";
import AlertDialog from "../../components/AlertDialog";
import { useAlert } from "../../hooks/useAlert";

const Users: FC = () => {
    const currentUser = useAuth().getVerifiedCurrentUser();
    const { withLoading } = useLoading();
    const { alertState, showError, showSuccess, hideAlert } = useAlert();

    const [invitation, setInvitation] = useState<Invitation | null>();
    const [emailToInvite, setEmailToInvite] = useState("");

    const catchInvitation = useCallback(async () => {
        const response = await userService.getInvitationToApply(currentUser);
        setInvitation(response);
    }, [currentUser]);

    useEffect(() => {
        void catchInvitation();
    }, [catchInvitation]);

    const sendInvitation = async () => {
        try {
            await withLoading(async () => {
                await userService.inviteUser(currentUser, emailToInvite);
                setEmailToInvite("");
                showSuccess("Приглашение отправлено!");
            });
        } catch (error) {
            if (isFirebaseError(error)) {
                showError(getErrorMessage(error));
            } else if (error instanceof Error) {
                showError(error.message);
            } else {
                showError(String(error));
            }
        }
    };

    const applyInvitation = async (): Promise<void> => {
        try {
            await withLoading(async (): Promise<void> => {
                await userService.applyInvitation(currentUser);
                setInvitation(null);
                showSuccess("Приглашение принято!");
            });
        } catch (error) {
            if (isFirebaseError(error)) {
                showError(getErrorMessage(error));
            } else if (error instanceof Error) {
                showError(error.message);
            } else {
                showError(String(error));
            }
        }
    };

    const declineInvitation = async (): Promise<void> => {
        try {
            await withLoading(async (): Promise<void> => {
                await userService.cancelInvitation(currentUser);
                setInvitation(null);
                showSuccess("Приглашение отклонено!");
            });
        } catch (error) {
            if (isFirebaseError(error)) {
                showError(getErrorMessage(error));
            } else if (error instanceof Error) {
                showError(error.message);
            } else {
                showError(String(error));
            }
        }
    };

    return (
        <Box>
            {/* Приглашение */}
            {invitation?.name && (
                <Card sx={{ borderRadius: 3, mb: 3, border: "2px solid", borderColor: "primary.main" }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Новое приглашение
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            Пользователь <strong>{invitation.name}</strong> ({invitation.email}) пригласил вас в общую
                            группу!
                        </Typography>
                        <Box sx={{ display: "flex", gap: 2 }}>
                            <Button
                                variant="contained"
                                onClick={applyInvitation}
                                fullWidth
                                size="large"
                                sx={{ borderRadius: 2 }}
                            >
                                Принять
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={declineInvitation}
                                fullWidth
                                size="large"
                                sx={{ borderRadius: 2 }}
                            >
                                Отклонить
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            )}

            {/* Приглашение пользователя */}
            <Card sx={{ borderRadius: 3, mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        Пригласить пользователя
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <TextField
                            label="Эл.почта"
                            onChange={(e) => setEmailToInvite(e.target.value)}
                            value={emailToInvite}
                            placeholder="Введите email пользователя"
                            size="medium"
                        />
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={sendInvitation}
                            disabled={emailToInvite.length === 0}
                            size="large"
                            sx={{ borderRadius: 2 }}
                        >
                            Добавить пользователя в группу
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* Информация о группе */}
            <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        Ваша группа
                    </Typography>

                    <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Typography variant="body2" color="textSecondary">
                            ID группы:
                        </Typography>
                        <Chip label={currentUser.groupId} size="small" variant="outlined" />
                    </Box>

                    <Typography variant="body2" color="textSecondary">
                        Все пользователи в вашей группе имеют доступ к общим спискам покупок.
                    </Typography>
                </CardContent>
            </Card>

            <AlertDialog
                open={alertState.open}
                onClose={hideAlert}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
                autoClose={alertState.autoClose}
            />
        </Box>
    );
};

export default Users;
