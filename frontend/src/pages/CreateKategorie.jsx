import React from 'react'
import {useNavigate} from "react-router"
import {useState} from "react"
import api from "../lib/axios";
import {Link} from "react-router"
import toast, { Toaster } from "react-hot-toast"

const CreateKategorie = () => {
  const [formData, setFormData] = useState({
    name: '',
    stueckzahl: '',
    haltbarkeitsdatum: '',
    image: ''
  });
  const navigate = useNavigate()

    const resetForm = () => {
    setFormData({
      name: '',
      stueckzahl: '',
      haltbarkeitsdatum: '',
      image: ''
    });
  };

  const handleAddKategorie = async(e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Name muss ausgefüllt werden");
      return;
    }    
    if (formData.name) {
        const newItem = {
            id: Date.now(),
            name: formData.name,
        };
        const token = localStorage.getItem('token');
        // setItems([...items, newItem]);
        // save article in database
        try {
            await api.post("/kategorie",newItem, {
            headers: {
                'Authorization': `Bearer ${token}`, // Nur Token senden
                'Content-Type': 'application/json'
            }
            })
            toast.success("Kategorie erfolgreich erstellt!");
            navigate("/kategorien")
        } catch(error) {
            console.log("Error creating kategorie", error)
            if(error.response.status === 429) {
            toast.error("Mach langsam. Du erstellst zu viele Kategorien in zu kurzer Zeit", {
                duration:4000,
                icon:"no"
            });
            }        
        }
        resetForm();
        }
    };  

    return(
        <>
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
                <div className="flex space-x-3">
                  <button
                    onClick={handleAddKategorie}
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
}

export default CreateKategorie;