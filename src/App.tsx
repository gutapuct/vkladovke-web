import { Navigate, Route, Routes } from "react-router-dom";
import Signup from "./pages/Auth/Signup";
import Login from "./pages/Auth/Login";
import Main from "./pages/Main";
import History from "./pages/Orders/History";
import { useAuth } from "./hooks/useAuth";
import Settings from "./pages/Settings/Settings";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import Confirm from "./pages/Auth/Confirm";
import Layout from "./components/Layout";
import LoadingSpinner from "./components/LoadingSpinner";
import OrderDetails from "./pages/Orders/OrderDetails";
import CreateOrder from "./pages/Orders/CreateOrder";
import { FC, JSX } from "react";

const AppContent: FC = () => {
    const PrivateRoute = ({ element }: { element: JSX.Element }): JSX.Element => {
        const { currentUser } = useAuth();

        if (!currentUser) {
            return <Navigate to="/login" />;
        }

        if (!currentUser.emailVerified) {
            return <Navigate to="/confirm" />;
        }

        return <Layout>{element}</Layout>;
    };

    const NoAccessRoute = ({ element }: { element: JSX.Element }): JSX.Element => {
        const { currentUser } = useAuth();

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
            <LoadingSpinner />
            <Routes>
                <Route path="/register" element={<Signup />}></Route>
                <Route path="/login" element={<Login />}></Route>
                <Route path="/forgot-password" element={<ForgotPassword />}></Route>
                <Route path="/confirm" element={<NoAccessRoute element={<Confirm />} />}></Route>
                <Route path="/" element={<PrivateRoute element={<Main />} />}></Route>
                <Route path="/settings" element={<PrivateRoute element={<Settings />} />}></Route>
                <Route path="/history" element={<PrivateRoute element={<History />} />}></Route>
                <Route path="/create-order" element={<PrivateRoute element={<CreateOrder />} />}></Route>
                <Route path="/edit-order/:orderId" element={<PrivateRoute element={<CreateOrder />} />}></Route>
                <Route path="/order-details/:orderId" element={<PrivateRoute element={<OrderDetails />} />}></Route>
            </Routes>
        </>
    );
};

const App = () => {
    return <AppContent />;
};

export default App;
