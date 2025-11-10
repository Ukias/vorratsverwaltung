import React, {useState} from 'react';
import {useAuth} from "../context/AuthContext"
import {useNavigate} from "react-router"
import api from "../lib/axios";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const {login} = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await api.post("/login", {
                email, password 
            });

            console.log(response.data)

            if(response.data.success) {
                await login(response.data.user, response.data.token);
                if(response.data.user.role === "admin") {
                    navigate("/admin/dashboard");
                } else {
                    navigate("/");
                }
                // Token speichern
                if (response.data.token) {
                    localStorage.setItem('token', response.data.token);
                    // console.log('Token saved:', localStorage.getItem('token')); // Debug
                } else {
                    console.error('No token in response');
                }
            } else {
                alert(response.data.error);
            }

        } catch(error) {
            if(error.response) {
                setError(error.response.data.message)
            }
        } finally {
            setLoading(false);
        }
    }

    return(
        <div className="login-container">
            <h1>Login</h1>
            {error && (
                <div className="bg-red-200 text-red-700 p-2 mb-4 rounded">
                    {error}
                </div>
            )}
            <form className="login-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input 
                        type="text"
                        id="email"
                        name="email"
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter Email"
                        required />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input 
                        type="password"
                        id="password"
                        name="password"
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        required />
                </div>
                <button type="submit">
                    {loading ? "Loading..." : "Login"}
                </button>
            </form>
        </div>
    )
}

export default Login;