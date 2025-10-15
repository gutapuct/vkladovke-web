import { useState } from "react";
import { Box, Tab, Tabs, AppBar, Toolbar, Typography } from "@mui/material";
import Profile from "./Profile";
import Products from "./Products";
import Users from "./Users";

const Settings = () => {
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const tabLabels = ["Профиль", "Пользователи", "Товары"];

    return (
        <Box sx={{ pb: 8 }}>
            <AppBar position="static" sx={{ bgcolor: "white", color: "text.primary", boxShadow: 1 }}>
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                        Настройки
                    </Typography>
                </Toolbar>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={{
                        borderBottom: 1,
                        borderColor: "divider",
                        "& .MuiTab-root": {
                            fontSize: "0.9rem",
                            fontWeight: 500,
                            minHeight: 48,
                        },
                    }}
                >
                    {tabLabels.map((label, index) => (
                        <Tab key={index} label={label} />
                    ))}
                </Tabs>
            </AppBar>

            <Box sx={{ p: 2 }}>
                {activeTab === 0 && <Profile />}
                {activeTab === 1 && <Users />}
                {activeTab === 2 && <Products />}
            </Box>
        </Box>
    );
};

export default Settings;
