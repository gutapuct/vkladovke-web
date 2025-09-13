import { useState } from "react";
import {
    Box,
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    BottomNavigation,
    BottomNavigationAction,
    useTheme,
    useMediaQuery,
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

const Layout = ({ children }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const { logout } = useAuth();
    const { withLoading } = useLoading();

    const menuItems = [
        { text: "Главная", icon: <HomeIcon />, path: "/" },
        { text: "История", icon: <HistoryIcon />, path: "/history" },
        { text: "Настройки", icon: <SettingsIcon />, path: "/settings" },
    ];

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleNavigation = (path) => {
        navigate(path);
        setMobileOpen(false);
    };

    const GetCurrentYear = () => new Date().getFullYear();

    const handleConfirmLogout = async () => {
        await withLoading(async () => {
            try {
                await logout();
                setMobileOpen(false);
            } catch (error) {
                alert(getErrorMessage(error));
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
        <Box sx={{ width: 250, height: "100%", display: "flex", flexDirection: "column" }} role="presentation">
            {/* Main Menu Items */}
            <List sx={{ flex: 1 }}>
                {menuItems.map((item) => (
                    <ListItem
                        button="true"
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
                        }}
                    >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItem>
                ))}
            </List>

            {/* Logout Section */}
            <Box sx={{ mt: "auto" }}>
                <Divider />
                <List>
                    <ListItem
                        button="true"
                        onClick={handleOpenLogoutDialog}
                        sx={{
                            color: "error.main",
                            cursor: "pointer",
                            "&:hover": {
                                backgroundColor: "error.light",
                                color: "white",
                            },
                        }}
                    >
                        <ListItemIcon sx={{ color: "inherit" }}>
                            <LogoutIcon />
                        </ListItemIcon>
                        <ListItemText primary="Выйти" />
                    </ListItem>
                </List>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            {/* Header */}
            <AppBar position="sticky" sx={{ bgcolor: "white", color: "text.primary", boxShadow: 1 }}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        В Кладовке
                    </Typography>
                </Toolbar>
            </AppBar>

            {/* Sidebar Drawer */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    "& .MuiDrawer-paper": {
                        boxSizing: "border-box",
                        width: 250,
                        display: "flex",
                        flexDirection: "column",
                    },
                }}
            >
                {drawer}
            </Drawer>

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flex: 1,
                    p: 2,
                    width: "100%",
                    maxWidth: "100%",
                    boxSizing: "border-box",
                    ...(isMobile && { pb: 8 }),
                }}
            >
                {children}
            </Box>

            {/* Bottom Navigation for Mobile */}
            {isMobile && (
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
                                "&.Mui-selected": {
                                    color: "primary.main",
                                },
                            }}
                        />
                    ))}
                </BottomNavigation>
            )}

            {/* Footer */}
            <Box
                component="footer"
                sx={{
                    bgcolor: "grey.100",
                    py: 1,
                    mt: "auto",
                    textAlign: "center",
                    ...(isMobile && { pb: 7 }),
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    © {GetCurrentYear()} В Кладовке. Все права защищены.
                </Typography>
            </Box>

            <ConfirmDialog
                open={logoutDialogOpen}
                onClose={handleCloseLogoutDialog}
                onConfirm={handleConfirmLogout}
                title="Выход из аккаунта"
                message="Вы уверены, что хотите выйти из своего аккаунта?"
                confirmText="Выйти"
                cancelText="Отмена"
            />
        </Box>
    );
};

export default Layout;
