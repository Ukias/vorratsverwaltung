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
            <h1 className="text-4xl dark:text-white max-w-sm mx-auto my-7">Login</h1>
            {error && (
                <div className="bg-red-200 text-red-700 p-2 mb-4 rounded">
                    {error}
                </div>
            )}
            <form className="max-w-sm mx-auto" onSubmit={handleSubmit}>
                <div className="mb-5">
                    <label htmlFor="email" className="block mb-2.5 text-sm font-medium text-heading">Email</label>
                    <input 
                        className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body"
                        type="text"
                        id="email"
                        name="email"
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter Email"
                        required />
                </div>
                <div className="mb-5">
                    <label htmlFor="password" className="block mb-2.5 text-sm font-medium text-heading">Password</label>
                    <input 
                        className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body"
                        type="password"
                        id="password"
                        name="password"
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        required />
                </div>
                <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                    {loading ? "Loading..." : "Login"}
                </button>
            </form>
        </div>
    )
}

export default Login;