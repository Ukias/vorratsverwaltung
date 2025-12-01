import React, { useState, useEffect } from 'react';
import api from "../lib/axios";
import {Link} from "react-router"
import { Plus, Edit2, Trash2, Search, ArrowUpDown, Package, Hash } from 'lucide-react';

const Kategoriemanagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');    
    const [kategorien, setKategorien] = useState([]);
    const [vorratsartikel, setVorratsartikel] = useState([])

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
            const res2 = await api.get("/vorratsartikelUser", {
                headers: {
                    'Authorization': `Bearer ${token}`, 
                    'Content-Type': 'application/json'
                }
            })
            setVorratsartikel(res2.data)
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
        // finally {
        //     setLoading(false);
        //   }
        };

        fetchKategorien();
    },[])  

    const countArtikelKategorien = () => {
        for(let i=0; i<kategorien.length; i++) {
            let num = countArtikelMitKategorie(kategorien[i].name)
            kategorien[i].stueckzahl = num
        }
    }
    
    const countArtikelMitKategorie = (kategorieSearch) => {
        let filtered = vorratsartikel.filter(item => item.kategorie === kategorieSearch)
        return filtered.length;
    }

    const getSortedAndFilteredKategorien = () => {
        let filtered = kategorien.filter(item => 
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
    
    const handleDeleteKategorie = async (id) => {
        if(!window.confirm("Sind Sie sicher, dass Sie diese Kategorie löschen möchten? Beachten Sie, dass alle Artikel mit dieser Kategorie anschließend kategorielos sind.")) {
            return;
        }
        try {
            const res = await api.get(`/kategorie/${id}`)
            const oldName = res.data.name;
            await api.delete(`/kategorie/${id}`)
            // delete Kategorie for all articles with this Kategorie
            for(let i=0; i<vorratsartikel.length; i++) {
                if(vorratsartikel[i].kategorie === oldName) {
                    const newItem = {
                        name:vorratsartikel[i].name,
                        stueckzahl: vorratsartikel[i].stueckzahl,
                        haltbarkeitsdatum: vorratsartikel[i].haltbarkeitsdatum,
                        kategorie: ''
                    }
                    await api.put(`/vorratsartikel/${vorratsartikel[i]._id}`, newItem)
                }
            }
            setKategorien(kategorien.filter(item => item._id !== id));
        } catch(error) {
            console.log("Error in handleDelete", error)
        }
    };    

    countArtikelKategorien();
    const sortedKategorien = getSortedAndFilteredKategorien();    

    return(
        <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <h1 className="text-3xl font-bold text-gray-800">Kategorien</h1>
                    </div>
                    <div className="flex gap-2">
                        <Link to={"/"}>
                            <button 
                                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                            >
                                <span>Vorratsverwaltung</span>
                            </button>
                        </Link>
                        <Link to={"/createKategorie"}>
                            <button
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                            >
                                <Plus className="h-5 w-5" />
                                <span>Kategorie hinzufügen</span>
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Kategorie suchen..."
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
                                    Aktionen
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedKategorien.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-3">
                                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{item.stueckzahl}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-2">
                                        <Link to={`/editKategorie/${item._id}`}>
                                            <button
                                            className="text-green-600 hover:text-green-800 p-1 hover:bg-green-50 rounded"
                                            >  
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteKategorie(item._id)}
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
            
                {sortedKategorien.length === 0 && (
                    <div className="text-center py-12">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Keine Kategorien gefunden</p>
                    </div>
                )}
            </div>                      
        </>
    )
}

export default Kategoriemanagement;