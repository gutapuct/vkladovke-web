import { Navigate, Route, Routes } from "react-router-dom";
import Signup from "./pages/Auth/Signup";
import Login from "./pages/Auth/Login";
import Main from "./pages/Main";
import History from "./pages/History";
import { useAuth } from "./hooks/useAuth";
import Settings from "./pages/Settings";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import Confirm from "./pages/Auth/Confirm";
import Layout from "./components/Layout";

function App() {
    const PrivateRoute = ({ element }) => {
        const { currentUser } = useAuth();
        console.log("currentUser, ", currentUser);

        if (!currentUser) {
            return <Navigate to="/login" />;
        }

        if (!currentUser.emailVerified) {
            return <Navigate to="/confirm" />;
        }

        return <Layout>{element}</Layout>;
    };

    const NoAccessRoute = ({ element }) => {
        const { currentUser } = useAuth();
        console.log("currentUser, ", currentUser);

        if (!currentUser) {
            return <Navigate to="/login" />;
        }

        if (currentUser && currentUser.emailVerified) {
            return <Navigate to="/" />;
        }

        return element;
    };

    return (
        <>
            <Routes>
                <Route path="/register" element={<Signup />}></Route>
                <Route path="/login" element={<Login />}></Route>
                <Route path="/forgot-password" element={<ForgotPassword />}></Route>
                <Route path="/confirm" element={<NoAccessRoute element={<Confirm />} />}></Route>
                <Route path="/" element={<PrivateRoute element={<Main />} />}></Route>
                <Route path="/settings" element={<PrivateRoute element={<Settings />} />}></Route>
                <Route path="/history" element={<PrivateRoute element={<History />} />}></Route>
            </Routes>
        </>
    );
}

export default App;
