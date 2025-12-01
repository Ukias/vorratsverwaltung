import React, { useState, useEffect} from 'react';
import {useNavigate, useParams} from "react-router"
import api from "../lib/axios";
import {Link} from "react-router"
import toast from "react-hot-toast";

const ArtikelEditPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        stueckzahl: '',
        haltbarkeitsdatum: '',
        kategorie: '',
        image: ''
      });
      const [showEditForm, setShowEditForm] = useState(false);
      const [currentItem, setCurrentItem] = useState(null);
      const [kategorien, setKategorien] = useState([]);
      const {id} = useParams();
      const navigate = useNavigate()

    useEffect(() => {
        const fetchArtikel = async() => {
            try {
                const res = await api.get(`vorratsartikel/${id}`)
                setFormData(res.data)
            } catch(error) {
                console.log("Error in fetching artikel", error)
            }
        };
        const fetchKategorien = async () => {
          try {
              const token = localStorage.getItem('token');
              const res = await api.get("/kategorienUser", {
              headers: {
                  'Authorization': `Bearer ${token}`, // Nur Token senden
                  'Content-Type': 'application/json'
                }
              })
              setKategorien(res.data);
              // setIsRateLimited(false);
          } catch(error) {
              console.log("Error fetching categories");
              console.log(error);
              // if(error.response?.status === 429) {
              //   setIsRateLimited(true);
              // } else {
              //   toast.error("Failed to load notes.")
              // } 
          } 
        };  

        fetchKategorien();
        fetchArtikel();
    }, [id]);

    const resetForm = () => {
        setFormData({
            name: '',
            stueckzahl: '',
            haltbarkeitsdatum: '',
            kategorie: '',
            image: ''
        });
    };

    const handleEditItem = async (id) => {
        if (!formData.name || !formData.stueckzahl) {
          toast.error("Name und Stückzahl müssen ausgefüllt werden");
        }
        if (formData.name && formData.stueckzahl) {
        try {
            await api.put(`/vorratsartikel/${id}`, formData)
            toast.success("Artikel erfolgreich bearbeitet")
        } catch(error) {
            console.log("Error saving the note", error)
        }
        resetForm();
        setShowEditForm(false);
        setCurrentItem(null);
        navigate("/");
        }
  };
  const formatDate = (dateString) => {
    if (!dateString) return 'Kein Datum';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Artikel bearbeiten</h2>
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
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stückzahl *
                  </label>
                  <input
                    type="number"
                    value={formData.stueckzahl}
                    onChange={(e) => setFormData({...formData, stueckzahl: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Haltbarkeitsdatum
                  </label>
                  <input
                    type="date"
                    value={formatDate(formData.haltbarkeitsdatum)}
                    onChange={(e) => setFormData({...formData, haltbarkeitsdatum: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategorie
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          onChange={(e) => setFormData({...formData, kategorie: e.target.value})}>
                    <option val=""></option>
                    {kategorien.map((kategorie) => 
                      <option val={kategorie.name}>{kategorie.name}</option>
                    )}
                  </select>                  
                </div>                
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleEditItem(formData._id)}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Speichern
                  </button>
                  <Link to={{pathname: "/"}}>
                  <button
                    onClick={() => {
                      setShowEditForm(false);
                      setCurrentItem(null);
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
  )
}

export default ArtikelEditPage