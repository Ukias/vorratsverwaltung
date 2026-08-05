import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, ScanLine, Plus, X, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import api from '../lib/axios';
import toast, { Toaster } from 'react-hot-toast';

const KassenzettelScanPage = () => {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [erkannteArtikel, setErkannteArtikel] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentErrorMessage, setPaymentErrorMessage] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErkannteArtikel([]);
    if (cameraActive) stopCamera();
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });
      setStream(mediaStream);
      setCameraActive(true);
      setImagePreview(null);
      setImageFile(null);
      setErkannteArtikel([]);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      toast.error('Kamera konnte nicht gestartet werden: ' + err.message);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  // Attach stream to video element once camera is active
  useEffect(() => {
    if (cameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [cameraActive, stream]);

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], 'kassenzettel.jpg', { type: 'image/jpeg' });
      setImageFile(file);
      setImagePreview(URL.createObjectURL(blob));
      stopCamera();
    }, 'image/jpeg', 0.95);
  };

  const handleScan = async () => {
    if (!imageFile) {
      toast.error('Bitte zuerst ein Bild auswählen oder aufnehmen.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('bild', imageFile);

      const res = await api.post('/kassenzettel/scan', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      // führe Fuzzy-Matching durch:
      // modifiziere Liste, sodass artikel_post nur den Produkt-Namen und eine tempId enthält
      let artikel_post = [];
      for(let i=0; i<res.data.artikel.length; i++) {
        const current_artikel = {tempId: i+1, name: res.data.artikel[i].name, stueckzahl: res.data.artikel[i].stueckzahl};
        artikel_post = [...artikel_post, current_artikel];
      }
      // API-Call zu Fuzzy-Matching
      const res2 = await api.post("/artikel/fuzzy-matching",artikel_post, {
        headers: {
          'Authorization': `Bearer ${token}`, // Nur Token senden
          'Content-Type': 'application/json'
        }
      })
      // füge Matches aus res2.data in die erkannten Artikel ein, setze erkannteArtikel auf Artikel mit Matches
      let artikel_mit_matches = [];
      for(let i=0; i<res2.data.length; i++) {
        let index_post = -1;
        // finde korrespondierenden Artikel zu res2.data[i] in artikel_post
        for(let j=0; j<artikel_post.length; j++) {
          if(res2.data[i]["tempId"] === artikel_post[j]["tempId"]) {
            index_post = j;
            break;
          }
        }
        artikel_mit_matches.push({_id : undefined, name : artikel_post[index_post]["name"], stueckzahl : artikel_post[index_post]["stueckzahl"], 
                                  matches: res2.data[i]["matches"]
        });
        /* füge Attribut "name_drop_down" in die Match-Artikel ein, für Vermeidung doppelter Einträge in Drop-Down, wenn Artikel mit selbem Namen
        /* beim fuzzy Matching in der Datenbank gefunden wird*/
        for(let j=0; j < artikel_mit_matches[i].matches.length; j++) {
          artikel_mit_matches[i].matches[j]["name_drop_down"] = artikel_mit_matches[i].matches[j]["name"];
        }
        // füge Artikel selber in die Liste der Matches ein mit dem Attribut "name_drop_down" auf "Neuer Artikel" gesetzt
        const newMatch = {_id: undefined, name: artikel_mit_matches[i]["name"], name_drop_down: "Neuer Artikel", stueckzahl: artikel_mit_matches[i]["stueckzahl"]};
        artikel_mit_matches[i]["matches"] = [newMatch, ...artikel_mit_matches[i]["matches"]];
      }      

      setErkannteArtikel(artikel_mit_matches);
      toast.success(`${res.data.artikel.length} Artikel erkannt`);
    } catch (error) {
      toast.error('Fehler beim Einlesen: ' + (error.response?.data?.message || error.message));
      // behandle Fehlerfall, dass nicht genügend Guthaben für einen Kassenzettel-Scan vorhanden ist
      if (error.response?.status == 402) {
        setPaymentErrorMessage("Nicht genügend Guthaben für einen Kassenzettel-Scan.");
      }
    } finally {
      setLoading(false);
    }
  };

  const entwicklungsScan = async () => {
    const artikel = [{_id : undefined, name : "Avocado Bio", stueckzahl : 3, matches : [{name: "Avocado", stueckzahl: 3}, {name: "Avocado unreif", stueckzahl: 2}]},
                     {_id : undefined, name : "Milch Bio 1L", stueckzahl : 4, matches: [{name: "H-Milch 3,5%", stueckzahl: 1}, {name: "Vollmilch 3,5%", stueckzahl: 2}]}]
    // füge artikel selber in die Liste der Matches hinzu
    for (let i=0; i<artikel.length; i++) {
      const newMatch = {name: artikel[i].name, stueckzahl: artikel[i].stueckzahl};
      artikel[i].matches = [newMatch, ...artikel[i].matches];
    }
    setErkannteArtikel(artikel)
    // modifiziere Liste, sodass artikel_post nur den Produkt-Namen und eine tempId enthält
    let artikel_post = [];
    for(let i=0; i<artikel.length; i++) {
      const current_artikel = {tempId: i+1, name: artikel[i].name, stueckzahl: artikel[i].stueckzahl};
      artikel_post = [...artikel_post, current_artikel];
    }

    // stelle Post-Anfrage an fuzzy-matching, um Matches der Artikel zu bestimmen
    const token = localStorage.getItem('token');
    try {
      const res = await api.post("/artikel/fuzzy-matching",artikel_post, {
        headers: {
          'Authorization': `Bearer ${token}`, // Nur Token senden
          'Content-Type': 'application/json'
        }
      })
      // füge Matches aus res.data in die erkannten Artikel ein
      let artikel_mit_matches = [];
      for(let i=0; i<res.data.length; i++) {
        let index_post = -1;
        for(let j=0; j<artikel_post.length; j++) {
          if(res.data[i]["tempId"] === artikel_post[j]["tempId"]) {
            index_post = j;
            break;
          }
        }
        // finde korrespondierenden Artikel zu res.data[i] in artikel_post
        artikel_mit_matches.push({_id : undefined, name : artikel_post[index_post]["name"],
                                  stueckzahl : artikel_post[index_post]["stueckzahl"], 
                                  matches: res.data[i]["matches"]
        });
        /* füge Attribut "name_drop_down" in die Match-Artikel ein, für Vermeidung doppelter Einträge in Drop-Down, wenn Artikel mit selbem Namen
        /* beim fuzzy Matching in der Datenbank gefunden wird*/
        for(let j=0; j < artikel_mit_matches[i].matches.length; j++) {
          artikel_mit_matches[i].matches[j]["name_drop_down"] = artikel_mit_matches[i].matches[j]["name"];
        }
        // füge Artikel selber in die Liste der Matches ein mit dem Attribut "name_drop_down" auf "Neuer Artikel" gesetzt
        const newMatch = {_id: undefined, name: artikel_mit_matches[i]["name"], name_drop_down: "Neuer Artikel", stueckzahl: artikel_mit_matches[i]["stueckzahl"]};
        artikel_mit_matches[i]["matches"] = [newMatch, ...artikel_mit_matches[i]["matches"]];
      }
      console.log("Artikel mit Matches: ", artikel_mit_matches);
      setErkannteArtikel(artikel_mit_matches);
      // console.log(res.data);
    } catch(error) {
      console.log("Error determining fuzzy matches", error)
      if(error.response.status === 429) {
        toast.error("Mach langsam. Du scanst zu viele Kassenzettel in zu kurzer Zeit!", {
          duration:4000,
          icon:"no"
        });
      }        
    }
  }

  const determineStueckzahlMatch = (matches, nameMatch) => {
    for (let i=0; i < matches.length; i++) {
      if (matches[i].name == nameMatch) {
        return matches[i].stueckzahl;
      }
    }
  }

  const determineIdMatch = (matches, nameMatch) => {
    // entferne ersten Match aus der Liste der Matches, um bei gleichlautendem Namen eines in der DB enthaltenen Artikels, den DB-Artikel auszuwählen
    const matches_modified = matches.toSpliced(0,1);
    // suche erste Übereinstimmung des Namens in der Liste der modifizierten Matches
    for (let i=0; i < matches_modified.length; i++) {
      if (matches_modified[i].name == nameMatch) {
        return matches_modified[i]._id;
      }
    }
  }

  const handleArtikelChange = (index, field, value) => {
    const updated = [...erkannteArtikel];
    updated[index] = { ...updated[index], [field]: value };
    setErkannteArtikel(updated);
  };

  const handleArtikelChangeNameStueckzahlId = (index, artikelName, artikelStueckzahl, artikelId) => {
      const updated = [...erkannteArtikel];
      // update name und stueckzahl
      updated[index] = {...updated[index], _id: artikelId, name: artikelName, stueckzahl: artikelStueckzahl };
      setErkannteArtikel(updated);
  };

  const handleRemoveArtikel = (index) => {
    setErkannteArtikel(erkannteArtikel.filter((_, i) => i !== index));
  };

  const handleAddAll = async () => {
    const token = localStorage.getItem('token');
    let successCount = 0;
    let errorCount = 0;

    for (const artikel of erkannteArtikel) {
      if (!artikel.name || artikel.name.trim() === '') continue;
      try {
        if (artikel._id === undefined) {
          await api.post(
            '/vorratsartikel',
            {
              name: artikel.name.trim(),
              stueckzahl: Number(artikel.stueckzahl) || 1,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );
        } else {
          await api.put(
            `/vorratsartikeladd/${artikel._id}`, 
            {
              name: artikel.name.trim(),
              stueckzahl: Number(artikel.stueckzahl)
            }, 
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          )
        }
        successCount++;
      } catch {
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} Artikel hinzugefügt`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} Artikel konnten nicht hinzugefügt werden`);
    }
    if (successCount > 0) {
      setTimeout(() => navigate('/'), 1200);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Toaster />
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <button className="text-gray-500 hover:text-gray-800 p-1 rounded hover:bg-gray-100">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <div className="flex items-center gap-3">
              <ScanLine className="h-7 w-7 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-800">Kassenzettel einlesen</h1>
            </div>
          </div>
        </div>

        {/* Image Source */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Bild auswählen</h2>

          <div className="flex gap-3 mb-5">
            {/* File Upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex flex-col items-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <Upload className="h-8 w-8 text-blue-500" />
              <span className="text-sm font-medium text-gray-600">Datei auswählen</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Camera Button */}
            <button
              onClick={cameraActive ? stopCamera : startCamera}
              className={`flex-1 flex flex-col items-center gap-2 rounded-lg p-4 transition-colors cursor-pointer border-2 ${
                cameraActive
                  ? 'bg-red-500 border-red-500 text-white hover:bg-red-600'
                  : 'border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50'
              }`}
            >
              <Camera className={`h-8 w-8 ${cameraActive ? 'text-white' : 'text-green-500'}`} />
              <span className={`text-sm font-medium ${cameraActive ? 'text-white' : 'text-gray-600'}`}>
                {cameraActive ? 'Kamera stoppen' : 'Kamera öffnen'}
              </span>
            </button>
          </div>

          {/* Camera View */}
          {cameraActive && (
            <div className="mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-lg bg-black"
                style={{ maxHeight: '350px', objectFit: 'contain' }}
              />
              <button
                onClick={capturePhoto}
                className="mt-3 w-full bg-green-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <Camera className="h-6 w-6" />
                Foto aufnehmen
              </button>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />

          {/* Image Preview */}
          {imagePreview && !cameraActive && (
            <div className="mb-4">
              <img
                src={imagePreview}
                alt="Kassenzettel Vorschau"
                className="w-full rounded-lg object-contain max-h-80 border border-gray-200"
              />
            </div>
          )}

          {/* Scan Button */}
          <button
            onClick={handleScan}
            disabled={!imageFile || loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Kassenzettel wird eingelesen...
              </>
            ) : (
              <>
                <ScanLine className="h-5 w-5" />
                Kassenzettel einlesen
              </>
            )}
          </button>
          {/*<button 
            onClick={entwicklungsScan}
            className="w-full bg-yellow-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <>
              Entwicklungstest
            </>
          </button> */}
          {paymentErrorMessage != "" && (
            <div className="text-red-600">
              {paymentErrorMessage}
            </div>
          )}          
        </div>

        {/* Erkannte Artikel */}
        {erkannteArtikel.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Erkannte Artikel ({erkannteArtikel.length})
            </h2>

            <div className="space-y-3 mb-6">
              {erkannteArtikel.map((artikel, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-3 flex gap-3 items-start"
                >
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={artikel.name}
                      onChange={(e) => handleArtikelChange(index, 'name', e.target.value)}
                      placeholder="Artikelname"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      value={artikel.stueckzahl}
                      min="1"
                      onChange={(e) => handleArtikelChange(index, 'stueckzahl', e.target.value)}
                      placeholder="Stückzahl"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      // onChange={(e) => {handleArtikelChange(index, 'stueckzahl', artikel.stueckzahl + determineStueckzahlMatch(artikel.matches, e.target.value)); 
                      //               handleArtikelChange(index, 'name', e.target.value);}}
                      onChange = {(e) => handleArtikelChangeNameStueckzahlId(index, e.target.value, determineStueckzahlMatch(artikel.matches, e.target.value),
                                                                            determineIdMatch(artikel.matches, e.target.value) )}
                                 >
                      {
                        artikel.matches.map((match) => 
                          <option value={match.name}>{match.name_drop_down}</option>)
                      }
                    </select>
                  </div>
                  <button
                    onClick={() => handleRemoveArtikel(index)}
                    className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded mt-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddAll}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Alle Artikel hinzufügen
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default KassenzettelScanPage;
