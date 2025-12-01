import React from 'react'
import {useNavigate, useParams} from "react-router"
import {useState, useEffect} from "react"
import api from "../lib/axios";
import {Link} from "react-router"
import toast, { Toaster } from "react-hot-toast"

const KategorieEditPage = () => {
    const [formData, setFormData] = useState({
        name: ''
    });
    const navigate = useNavigate()
    const {id} = useParams();
    const [items, setItems] = useState([])
    const [oldName, setOldName] = useState('');

    const resetForm = () => {
        setFormData({
            name: ''
        });
    }   

    useEffect(() => {
        const fetchKategorie = async() => { 
            try {
                const res = await api.get(`kategorie/${id}`)
                setFormData(res.data)
                setOldName(res.data.name)
            } catch(error) {
                console.log("Error in fetching Kategorie", error)
            }                   
        }

        const fetchVorratsartikel = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await api.get("/vorratsartikelUser", {
                    headers: {
                        'Authorization': `Bearer ${token}`, // Nur Token senden
                        'Content-Type': 'application/json'
                    }
                })
                // console.log(res.data);
                setItems(res.data);
                // setIsRateLimited(false);
            } catch(error) {
                console.log("Error fetching notes");
                console.log(error);
                // if(error.response?.status === 429) {
                //   setIsRateLimited(true);
                // } else {
                //   toast.error("Failed to load notes.")
                // } 
            } 
            // finally {
            //     setLoading(false);
            //   }
        }; 
        
        fetchVorratsartikel();
        fetchKategorie();
    },[]); 
    
    const handleEditKategorie = async (id) => {
        if (!formData.name) {
          toast.error("Name muss ausgefüllt werden");
        }
        if (formData.name) {
            try {
                await api.put(`/kategorie/${id}`, formData)
                for(let i=0; i<items.length; i++) {
                    if(oldName === items[i].kategorie) {
                        const newItem = {
                            name: items[i].name, 
                            stueckzahl: items[i].stueckzahl,
                            haltbarkeitsdatum: items[i].haltbarkeitsdatum,
                            kategorie: formData.name
                        }
                        await api.put(`/vorratsartikel/${items[i]._id}`, newItem)
                    }
                }
                toast.success("Artikel erfolgreich bearbeitet")                
            } catch(error) {
                console.log("Error saving the Kategorie", error)
            }
            resetForm();
            navigate("/kategorien");
        }
    };    

    return(
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Kategorie bearbeiten</h2>
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleEditKategorie(formData._id)}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Hinzufügen
                  </button>
                  <Link to={"/kategorien"}>
                    <button
                        onClick={() => {
                        resetForm();
                        }}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                        Abbrechen
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>        
        </>
    );  
};

export default KategorieEditPage;