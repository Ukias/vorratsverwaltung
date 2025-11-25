import React from 'react'
import {useNavigate} from "react-router"
import api from "../lib/axios";

const LogoutButton = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const handleLogout = async () => {
        try {     
            // API-Aufruf zum Backend, um den Benutzer auszuloggen
            const response = await api.post('/logout', {
                headers: {
                    'Authorization': `Bearer ${token}`, // Nur Token senden
                    'Content-Type': 'application/json'
                }
            });  

            if (response.ok) {
                // Lokalen Storage bereinigen (falls JWT im localStorage gespeichert ist)
                localStorage.removeItem('pos-token');
                localStorage.removeItem('pos-user');
                
                // Zur Login-Seite weiterleiten
                navigate('/login');
            } else {
                console.error('Logout fehlgeschlagen');
        }
        } catch (error) {
            console.error('Fehler beim Logout:', error);
        }
    }
    return (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px' }}>
            <button
                onClick={handleLogout}
                style={{
                    padding: '10px 20px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
            >
                Abmelden
            </button>
        </div>
    )
}

export default LogoutButton;