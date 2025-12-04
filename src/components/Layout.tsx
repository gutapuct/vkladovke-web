import { useState, useCallback, FC } from "react";
import {
    Box,
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    BottomNavigation,
    BottomNavigationAction,
    Divider,
} from "@mui/material";
import {
    Menu as MenuIcon,
    Home as HomeIcon,
    Settings as SettingsIcon,
    History as HistoryIcon,
    ExitToApp as LogoutIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/firebase_firestore";
import ConfirmDialog from "./ConfirmDialog";
import { useLoading } from "../hooks/LoadingContext";
import AlertDialog from "./AlertDialog";
import { useAlert } from "../hooks/useAlert";
import { NavigationGuardContext } from "../contexts/NavigationGuardContext";

type FirebaseErrorLike = { code: string; message: string };
const isFirebaseError = (e: unknown): e is FirebaseErrorLike =>
    typeof e === "object" && e !== null && "code" in e && "message" in e;

interface Props {
    children: React.ReactNode;
}

const Layout: FC<Props> = ({ children }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();
    const { withLoading } = useLoading();
    const { alertState, showError, hideAlert } = useAlert();
    const [navGuardOpen, setNavGuardOpen] = useState(false);
    const [shouldBlock, setShouldBlock] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    const menuItems = [
        { text: "Списки", icon: <HomeIcon />, path: "/" },
        { text: "История", icon: <HistoryIcon />, path: "/history" },
        { text: "Настройки", icon: <SettingsIcon />, path: "/settings" },
    ];

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const confirmIfNeeded = useCallback((action: () => void) => {
        if (shouldBlock) {
            setPendingAction(action);
            setNavGuardOpen(true);
        } else {
            action && action();
        }
    }, [shouldBlock]);

    const handleNavigation = (path: string) => {
        confirmIfNeeded(() => {
            navigate(path);
            setMobileOpen(false);
        });
    };

    const handleConfirmNavigation = () => {
        setNavGuardOpen(false);
        const act = pendingAction;
        setPendingAction(null);
        setShouldBlock(false);
        act && act();
    };

    const handleCancelNavigation = () => {
        setNavGuardOpen(false);
        setPendingAction(null);
    };

    const handleConfirmLogout = async () => {
        await withLoading(async () => {
            try {
                await logout();
                setMobileOpen(false);
            } catch (error) {
                if (isFirebaseError(error)) {
                    showError(getErrorMessage(error));
                } else if (error instanceof Error) {
                    showError(error.message);
                } else {
                    showError(String(error));
                }
            }
        });
    };

    const handleOpenLogoutDialog = () => {
        setLogoutDialogOpen(true);
        setMobileOpen(false);
    };

    const handleCloseLogoutDialog = () => {
        setLogoutDialogOpen(false);
    };

    const drawer = (
        <Box
            sx={{
                width: 280,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                background: "white",
            }}
            role="presentation"
        >
            <Box
                sx={{
                    p: 2,
                    borderBottom: 1,
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                }}
            >
                <img
                    src={`${process.env.PUBLIC_URL}/logo192.png`}
                    alt="Логотип"
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                    }}
                />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Меню
                </Typography>
            </Box>

            <List sx={{ flex: 1, pt: 1 }}>
                {menuItems.map((item) => (
                    <ListItemButton
                        key={item.text}
                        onClick={() => handleNavigation(item.path)}
                        selected={location.pathname === item.path}
                        sx={{
                            "&.Mui-selected": {
                                backgroundColor: "primary.main",
                                color: "white",
                                "&:hover": {
                                    backgroundColor: "primary.dark",
                                },
                                "& .MuiListItemIcon-root": {
                                    color: "inherit",
                                },
                            },
                            cursor: "pointer",
                            py: 2.5,
                            px: 3,
                            borderBottom: "1px solid",
                            borderColor: "divider",
                        }}
                    >
                        <ListItemIcon
                            sx={{
                                minWidth: 48,
                                fontSize: "1.5rem",
                            }}
                        >
                            {item.icon}
                        </ListItemIcon>
                        <ListItemText
                            primary={
                                <Typography
                                    sx={{
                                        fontSize: "1.1rem",
                                        fontWeight: 500,
                                    }}
                                >
                                    {item.text}
                                </Typography>
                            }
                        />
                    </ListItemButton>
                ))}
            </List>

            <Box sx={{ mt: "auto" }}>
                <Divider />
                <List>
                    <ListItemButton
                        onClick={handleOpenLogoutDialog}
                        sx={{
                            color: "error.main",
                            cursor: "pointer",
                            "&:hover": {
                                backgroundColor: "error.light",
                                color: "white",
                            },
                            py: 2.5,
                            px: 3,
                        }}
                    >
                        <ListItemIcon sx={{ color: "inherit", minWidth: 48 }}>
                            <LogoutIcon />
                        </ListItemIcon>
                        <ListItemText
                            primary={
                                <Typography
                                    sx={{
                                        fontSize: "1.1rem",
                                        fontWeight: 500,
                                    }}
                                >
                                    Выйти
                                </Typography>
                            }
                        />
                    </ListItemButton>
                </List>
            </Box>
        </Box>
    );

    return (
        <NavigationGuardContext.Provider value={{ shouldBlock, setShouldBlock, confirmIfNeeded }}>
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <AppBar
                position="sticky"
                sx={{
                    bgcolor: "white",
                    color: "text.primary",
                    boxShadow: 2,
                }}
            >
                <Toolbar sx={{ minHeight: 48, px: 2 }}>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2 }}
                        size="large"
                    >
                        <MenuIcon />
                    </IconButton>

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            flexGrow: 1,
                        }}
                    >
                        <img
                            src={`${process.env.PUBLIC_URL}/logo192.png`}
                            alt="В Кладовке"
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 6,
                                objectFit: "contain",
                            }}
                        />
                        <Typography
                            variant="h6"
                            component="div"
                            sx={{
                                fontSize: "1.25rem",
                                fontWeight: 600,
                            }}
                        >
                            В Кладовке
                        </Typography>
                    </Box>
                </Toolbar>
            </AppBar>

            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    "& .MuiDrawer-paper": {
                        boxSizing: "border-box",
                        width: 280,
                        display: "flex",
                        flexDirection: "column",
                    },
                }}
            >
                {drawer}
            </Drawer>

            <Box
                component="main"
                sx={{
                    flex: 1,
                    width: "100%",
                    maxWidth: "100%",
                    boxSizing: "border-box",
                    pb: 8,
                    background: "#f5f5f5",
                    minHeight: "calc(100vh - 56px)",
                }}
            >
                {children}
            </Box>

            <BottomNavigation
                showLabels
                value={location.pathname}
                sx={{
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    bgcolor: "background.paper",
                    borderTop: 1,
                    borderColor: "divider",
                    zIndex: 1000,
                    height: 48,
                }}
            >
                {menuItems.map((item) => (
                    <BottomNavigationAction
                        key={item.text}
                        label={item.text}
                        icon={item.icon}
                        value={item.path}
                        onClick={() => handleNavigation(item.path)}
                        sx={{
                            minWidth: "auto",
                            px: 1,
                            minHeight: 48,
                            "& .MuiBottomNavigationAction-label": {
                                fontSize: "0.75rem",
                                mt: 0.5,
                            },
                            "&.Mui-selected": {
                                color: "primary.main",
                                "& .MuiBottomNavigationAction-label": {
                                    fontSize: "0.75rem",
                                },
                            },
                        }}
                    />
                ))}
            </BottomNavigation>

            <ConfirmDialog
                open={logoutDialogOpen}
                onClose={handleCloseLogoutDialog}
                onConfirm={handleConfirmLogout}
                title="Выход из аккаунта"
                message="Вы уверены, что хотите выйти из своего аккаунта?"
                confirmText="Выйти"
                cancelText="Отмена"
            />

            <AlertDialog
                open={alertState.open}
                onClose={hideAlert}
                title={alertState.title}
                message={alertState.message}
                // TODO: исправить это после изменения хука
                type={alertState.type as "success" | "error" | "warning" | "info"}
            />
            <ConfirmDialog
                open={navGuardOpen}
                onClose={handleCancelNavigation}
                onConfirm={handleConfirmNavigation}
                title="Несохранённые изменения"
                message="Все несохранённые изменения будут потеряны. Продолжить?"
                confirmText="Выйти"
                cancelText="Отмена"
            />
        </Box>
        </NavigationGuardContext.Provider>
    );
};

export default Layout;
