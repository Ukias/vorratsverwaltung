import React from 'react'
import {useNavigate} from "react-router"
import {useState, useEffect} from "react"
import {Link} from "react-router"
import api from "../lib/axios";
import toast, { Toaster } from "react-hot-toast"

const CreatePage = () => {
  const [formData, setFormData] = useState({
    name: '',
    stueckzahl: '',
    haltbarkeitsdatum: '',
    kategorie: '',
    image: ''
  });
  const navigate = useNavigate()
  const [kategorien, setKategorien] = useState([]);

  const resetForm = () => {
    setFormData({
      name: '',
      stueckzahl: '',
      haltbarkeitsdatum: '',
      kategorie: '',
      image: ''
    });
  };

  useEffect(() => {
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
  },[]);

  const handleAddItem = async(e) => {
    e.preventDefault();
    if (!formData.name || !formData.stueckzahl) {
      toast.error("Name und Stückzahl müssen ausgefüllt werden");
      return;
    }    
    if (formData.name && formData.stueckzahl) {
      const newItem = {
        id: Date.now(),
        name: formData.name,
        stueckzahl: parseInt(formData.stueckzahl),
        haltbarkeitsdatum: formData.haltbarkeitsdatum || null,
        kategorie: formData.kategorie,
        image: formData.image || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop'
      };
      const token = localStorage.getItem('token');
      // setItems([...items, newItem]);
      // save article in database
      try {
        await api.post("/vorratsartikel",newItem, {
          headers: {
            'Authorization': `Bearer ${token}`, // Nur Token senden
            'Content-Type': 'application/json'
          }
        })
        toast.success("Artikel erfolgreich erstellt!");
        navigate("/")
      } catch(error) {
        console.log("Error creating vorratsartikel", error)
        if(error.response.status === 429) {
          toast.error("Mach langsam. Du erstellst zu viele Vorratsartikel in zu kurzer Zeit", {
            duration:4000,
            icon:"no"
          });
        }        
      }
      resetForm();
    }

  };

  return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Neuen Artikel hinzufügen</h2>
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
                    value={formData.haltbarkeitsdatum}
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
                    onClick={handleAddItem}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Hinzufügen
                  </button>
                  <Link to={"/"}>
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
  )
}

export default CreatePage;