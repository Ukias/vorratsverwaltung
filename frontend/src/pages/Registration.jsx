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
    <div className="registration-container">
        <h1>Registration</h1>
        <form className="registration-form" onSubmit={handleSubmit}>
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
                {loading ? "Loading..." : "Register"}
            </button>
        </form>
    </div>
  )
}

export default Registration;