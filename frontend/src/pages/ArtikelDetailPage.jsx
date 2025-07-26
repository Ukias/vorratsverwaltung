import React, { useState, useEffect} from 'react';
import api from "../lib/axios";
import {useParams} from "react-router"
import {Link} from "react-router"

const ArtikelDetailPage = () => {
  const [currentItem, setCurrentItem] = useState({
        name: '',
        stueckzahl: '',
        haltbarkeitsdatum: '',
        image: ''
  });
  const {id} = useParams();

    useEffect(() => {
        const fetchArtikel = async() => {
            try {
                const res = await api.get(`vorratsartikel/${id}`)
                setCurrentItem(res.data)
            } catch(error) {
                console.log("Error in fetching artikel", error)
            }
        };

        fetchArtikel();
    }, [id]);

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

  return (
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
                <Link to={{pathname: "/edit/" + id}}>
                <button
                //   onClick={() => {
                //     setShowDetailView(false);
                //     openEditForm(currentItem);
                //   }}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Bearbeiten
                </button>
                </Link>
                <Link to = {{pathname: "/"}}>
                <button
                //   onClick={() => {
                //     setShowDetailView(false);
                //     setCurrentItem(null);
                //   }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Schließen
                </button>
                </Link>
              </div>
            </div>
          </div>
  )
}

export default ArtikelDetailPage;