import {createContext, useState, useContext} from "react";

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [user, SetUser] = useState(() => {
        const storedUser = localStorage.getItem("pos-user");
        return storedUser ? JSON.parse(storedUser) : null;
    })

    const login = (userData, token) => {
        SetUser(userData);
        localStorage.setItem("pos-user", JSON.stringify(userData));
        localStorage.setItem("pos-token", token);
    }

    const logout = () => {
        SetUser(null);
        localStorage.removeItem("pos-user");
        localStorage.removeItem("pos-token");
    }

    return(
        <AuthContext.Provider value={{user, login, logout}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden');
    }
    return context;
}
export default AuthProvider;