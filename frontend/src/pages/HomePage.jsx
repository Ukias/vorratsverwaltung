import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Search, ArrowUpDown, Package, Calendar, Hash } from 'lucide-react';
import {Link} from "react-router"
import api from "../lib/axios";

const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
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


  const handleDeleteItem = async (id) => {
    try {
      await api.delete(`/vorratsartikel/${id}`)
      setItems(items.filter(item => item._id !== id));
    } catch(error) {
      console.log("Error in handleDelete", error)
    }
  };

  const openDetailView = (item) => {
    setCurrentItem(item);
    setShowDetailView(true);
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
    <>
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Package className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-800">Vorratsverwaltung</h1>
            </div>
            <Link to={"/create"}>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Artikel hinzufügen</span>
            </button>
            </Link>
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
                        <Link to={`edit/${item._id}`}>
                        <button
                          className="text-green-600 hover:text-green-800 p-1 hover:bg-green-50 rounded"
                        >  
                          <Edit2 className="h-4 w-4" />
                        </button>
                        </Link>
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
    </>
  )
}

export default HomePage