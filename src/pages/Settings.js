import { useNavigate } from "react-router-dom";

const Settings = () => {
    const navigate = useNavigate();

    return (
        <div>
            <button onClick={() => navigate("/")}>go to Main</button>
            <div>this is Settings</div>
        </div>
    );
};

export default Settings;
