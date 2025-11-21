import React, {useState} from 'react';
import {useNavigate} from "react-router"
import api from "../lib/axios";

const Registration = () => {
    const [email, setEmail] = useState("");     
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        if(!email || !password) {
            return;
        }

        try {
            await api.post("/registration", {
                email, 
                password
            })
            navigate("/login")
            
        } catch(error) {
            console.log("Error creating user", error);
        } finally {
            setLoading(false);
        }
    }

  return (
    <div className="flex flex-col items-center h-screen justify-center bg-gradient-to-b from-green-600 from-50% to-gray-100 to-50% space-y-6">
        <h1 className="text-3xl text-white">Registration</h1>
        <div className="border shadow-lg p-6 w-80 bg-white">
            <form className="registration-form" onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700" htmlFor="email">Email</label>
                    <input 
                        className="w-full px-3 py-2 border"
                        type="text"
                        id="email"
                        name="email"
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter Email"
                        required />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700" htmlFor="password">Password</label>
                    <input 
                        className="w-full px-3 py-2 border"
                        type="password"
                        id="password"
                        name="password"
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        required />
                </div>
                <button 
                    type="submit"
                    className="w-full bg-green-600 text-white py-2">
                    {loading ? "Loading..." : "Register"}
                </button>
            </form>
        </div>
    </div>
  )
}

export default Registration;