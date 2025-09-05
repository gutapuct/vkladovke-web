import { Navigate, Route, Routes } from "react-router-dom";
import Signup from "./pages/Auth/Signup";
import Login from "./pages/Auth/Login";
import Main from "./pages/Main";
import { useAuth } from "./hooks/useAuth";
import Settings from "./pages/Settings";

function App() {
  const PrivateRoute = ({ element }) => {
    const { currentUser } = useAuth();
    return currentUser ? element : <Navigate to="/login" />;
  };

  return (
    <>
      <Routes>
        <Route path="/register" element={<Signup />}></Route>
        <Route path="/login" element={<Login />}></Route>
        <Route path="/" element={<PrivateRoute element={<Main />} />}></Route>
        <Route path="/settings" element={<PrivateRoute element={<Settings />} />}></Route>
      </Routes>
    </>
  );
}

export default App;
