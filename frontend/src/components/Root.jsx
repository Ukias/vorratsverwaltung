import {useAuth} from "../context/AuthContext"
import {useNavigate} from "react-router"
import {useEffect} from "react"

const Root = () => {
    const {user} = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if(user) {
            if(user.role === "admin") {
                navigate("/admin/dashboard");
            } else if (user.role === "employee") {
                navigate ("/");
            } else {
                navigate("/login");
            }
        } else {
            navigate("/login");
        }
    }, [user, navigate]);

    return null;
}

export default Root;