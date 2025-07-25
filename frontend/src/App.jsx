import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Search, ArrowUpDown, Package, Calendar, Hash } from 'lucide-react';
import api from "./lib/axios";
import {Link, BrowserRouter, Route, Routes, useNavigate} from "react-router"
import CreatePage from "./pages/CreatePage";
import HomePage from "./pages/HomePage"
import ArtikelEditPage from './pages/ArtikelEditPage';

const InventoryApp = () => {
  const [items, setItems] = useState([])

    useEffect(() => {
    const fetchVorratsartikel = async () => {
      try {
        const res = await api.get("/vorratsartikel")
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
  },[])

  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetailView, setShowDetailView] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  // const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    stueckzahl: '',
    haltbarkeitsdatum: '',
    image: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      stueckzahl: '',
      haltbarkeitsdatum: '',
      image: ''
    });
  };

  const handleAddItem = async() => {
    if (formData.name && formData.stueckzahl) {
      const newItem = {
        id: Date.now(),
        name: formData.name,
        stueckzahl: parseInt(formData.stueckzahl),
        haltbarkeitsdatum: formData.haltbarkeitsdatum || null,
        image: formData.image || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop'
      };
      setItems([...items, newItem]);
      // save article in database
      try {
        await api.post("/vorratsartikel",newItem, {
          headers: {
            'Content-Type': 'application/json'
          }
        })
      } catch(error) {
        console.log("Error creating vorratsartikel", error)
      }
      resetForm();
      setShowAddForm(false);
    }
  };

  const handleEditItem = async (id) => {
    if (formData.name && formData.stueckzahl) {
      try {
        await api.put(`/vorratsartikel/${id}`, formData)
      } catch(error) {
        console.log("Error saving the note", error)
      }
      const updatedItems = items.map(item => 
        item._id === currentItem._id 
          ? { ...item, name: formData.name, stueckzahl: parseInt(formData.stueckzahl), haltbarkeitsdatum: formData.haltbarkeitsdatum || null, image: formData.image || item.image }
          : item
      );
      setItems(updatedItems);
      resetForm();
      setShowEditForm(false);
      setCurrentItem(null);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await api.delete(`/vorratsartikel/${id}`)
      setItems(items.filter(item => item._id !== id));
    } catch(error) {
      console.log("Error in handleDelete", error)
    }
  };

  const openEditForm = (item) => {
    setCurrentItem(item);
    setFormData({
      _id: item._id,
      name: item.name,
      stueckzahl: item.stueckzahl.toString(),
      haltbarkeitsdatum: item.haltbarkeitsdatum || '',
      image: item.image || ''
    });
    setShowEditForm(true);
  };

  const openDetailView = (item) => {
    setCurrentItem(item);
    setShowDetailView(true);
  };

  const getSortedAndFilteredItems = () => {
    let filtered = items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'stueckzahl':
          aValue = a.stueckzahl;
          bValue = b.stueckzahl;
          break;
        case 'haltbarkeitsdatum':
          aValue = a.haltbarkeitsdatum ? new Date(a.haltbarkeitsdatum) : new Date('2099-12-31');
          bValue = b.haltbarkeitsdatum ? new Date(b.haltbarkeitsdatum) : new Date('2099-12-31');
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Kein Datum';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
  };

  const isExpiringSoon = (dateString) => {
    if (!dateString) return false;
    const expiryDate = new Date(dateString);
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  const isExpired = (dateString) => {
    if (!dateString) return false;
    const expiryDate = new Date(dateString);
    const today = new Date();
    return expiryDate < today;
  };

  const sortedItems = getSortedAndFilteredItems();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage/>} />
          <Route path="/create" element={<CreatePage/>} />
          <Route path="/edit/:id" element={<ArtikelEditPage/>}/>
        </Routes>
      
      <div className="max-w-6xl mx-auto">

        {/* Detail View Modal */}
        {showDetailView && currentItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="text-center">
                {currentItem.image && <img 
                  src={currentItem.image} 
                  alt={currentItem.name}
                  className="w-48 h-48 mx-auto rounded-lg object-cover mb-4"
                />}
                <h2 className="text-2xl font-bold mb-4">{currentItem.name}</h2>
                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Stückzahl:</span>
                    <span>{currentItem.stueckzahl}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Haltbarkeitsdatum:</span>
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      isExpired(currentItem.haltbarkeitsdatum) 
                        ? 'bg-red-100 text-red-800' 
                        : isExpiringSoon(currentItem.haltbarkeitsdatum)
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {formatDate(currentItem.haltbarkeitsdatum)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => {
                    setShowDetailView(false);
                    openEditForm(currentItem);
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Bearbeiten
                </button>
                <button
                  onClick={() => {
                    setShowDetailView(false);
                    setCurrentItem(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </BrowserRouter>
    </div>
  );
};

export default InventoryApp;
