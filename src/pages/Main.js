import { useNavigate } from "react-router-dom";

const Main = () => {
    const navigate = useNavigate();
    return (
        <div>
            <button onClick={() => navigate("/settings")}>go to settings</button>
            <div>this is Main</div>
        </div>
    );
};

export default Main;
