import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Search, ArrowUpDown, Package, Calendar, Hash } from 'lucide-react';
import api from "./lib/axios";
import {Link, BrowserRouter, Route, Routes} from "react-router"
import CreatePage from "./pages/CreatePage";
import HomePage from "./pages/HomePage"

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
        </Routes>
      </BrowserRouter>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Package className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-800">Vorratsverwaltung</h1>
            </div>
            <BrowserRouter>
            <Link to={"/create"}>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Artikel hinzufügen</span>
            </button>
            </Link>
            </BrowserRouter>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Artikel suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSort('name')}
                className={`px-4 py-2 rounded-lg border transition-colors flex items-center space-x-2 ${
                  sortBy === 'name' ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Hash className="h-4 w-4" />
                <span>Name</span>
                {sortBy === 'name' && <ArrowUpDown className="h-4 w-4" />}
              </button>
              <button
                onClick={() => handleSort('stueckzahl')}
                className={`px-4 py-2 rounded-lg border transition-colors flex items-center space-x-2 ${
                  sortBy === 'stueckzahl' ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Package className="h-4 w-4" />
                <span>Anzahl</span>
                {sortBy === 'stueckzahl' && <ArrowUpDown className="h-4 w-4" />}
              </button>
              <button
                onClick={() => handleSort('haltbarkeitsdatum')}
                className={`px-4 py-2 rounded-lg border transition-colors flex items-center space-x-2 ${
                  sortBy === 'haltbarkeitsdatum' ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>Haltbarkeit</span>
                {sortBy === 'haltbarkeitsdatum' && <ArrowUpDown className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stückzahl
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Haltbarkeitsdatum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {item.image && <img 
                          src={item.image} 
                          alt={item.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />}
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.stueckzahl}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm px-2 py-1 rounded-full inline-block ${
                        isExpired(item.haltbarkeitsdatum) 
                          ? 'bg-red-100 text-red-800' 
                          : isExpiringSoon(item.haltbarkeitsdatum)
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {formatDate(item.haltbarkeitsdatum)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openDetailView(item)}
                          className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditForm(item)}
                          className="text-green-600 hover:text-green-800 p-1 hover:bg-green-50 rounded"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item._id)}
                          className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {sortedItems.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Keine Artikel gefunden</p>
            </div>
          )}
        </div>

        {/* Add Form Modal */}
        {showAddForm && (
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
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bild URL
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({...formData, image: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleAddItem}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Hinzufügen
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Form Modal */}
        {showEditForm && currentItem && (
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
                    value={formData.haltbarkeitsdatum}
                    onChange={(e) => setFormData({...formData, haltbarkeitsdatum: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bild URL
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({...formData, image: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleEditItem(formData._id)}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Speichern
                  </button>
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
                </div>
              </div>
            </div>
          </div>
        )}

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
    </div>
  );
};

export default InventoryApp;
