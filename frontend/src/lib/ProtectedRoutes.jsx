import { useAuth } from "../context/AuthContext";
import {useEffect} from "react";
import {useNavigate} from "react-router";
import { Navigate } from "react-router";


const ProtectedRoutes = ({children, requiredRole}) => {
    const {user} = useAuth();
    // const navigate = useNavigate();

    const token = localStorage.getItem('pos-token');

    // Kein User oder Token → Login
    if (!user || !token) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && !requiredRole.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }    

    // useEffect(() => {
    //     if(!user) {
    //         navigate('/login');
    //         return;
    //     }
    //     if(!requiredRole.includes(user.role)) {
    //         navigate('/unauthorized');
    //         return;
    //     }
    // }, [user, navigate, requiredRole])



    if(!user) return null;
    if(!requiredRole.includes(user.role)) return null;

    return children;
}

export default ProtectedRoutes;