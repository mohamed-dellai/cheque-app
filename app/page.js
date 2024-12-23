'use client'

import React, { useState, useEffect } from 'react'
import { Pencil, Trash2, Save, X, Scan, Loader, Printer } from 'lucide-react'
import axios from 'axios'

// Utility functions
const formatDate = (dateString) => {
  if (!dateString) return ''
  const [year, month, day] = dateString.split('-')
  return `${day}/${month}/${year}`
}

const createEmptyRow = () => ({
  id: Date.now().toString(),
  chequeNumber: '',
  bankName: '',
  date: '',
  ownerName: '',
  amount: '',
  photo: '',
  saveDate: new Date().toISOString().split('T')[0],
  isNew: true
})

// API
const scanCheque = async (chequeNum) => {
  const response = await axios.post("/api/savePhoto", { chequeNum })
  return response.data
}

export default function BankChequeApp() {
  const [cheques, setCheques] = useState([])
  const [editId, setEditId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [filter, setFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')
  const [enlargedImage, setEnlargedImage] = useState(null)

  useEffect(() => {
    const savedCheques = localStorage.getItem('cheques')
    if (savedCheques) {
      const parsedCheques = JSON.parse(savedCheques)
      setCheques([...parsedCheques, createEmptyRow()])
    } else {
      setCheques([createEmptyRow()])
    }
  }, [])

  useEffect(() => {
    const chequesToSave = cheques.filter(cheque => !cheque.isNew)
    localStorage.setItem('cheques', JSON.stringify(chequesToSave))
  }, [cheques])

  const handleEdit = (id) => setEditId(id)

  const handleSave = (id) => {
    const chequeToSave = cheques.find(cheque => cheque.id === id)
    if (chequeToSave && 
        chequeToSave.chequeNumber && 
        chequeToSave.bankName && 
        chequeToSave.date && 
        chequeToSave.ownerName && 
        chequeToSave.amount && 
        chequeToSave.photo) {
      setCheques(prevCheques => {
        const updatedCheques = prevCheques.map(cheque => 
          cheque.id === id ? { ...cheque, isNew: false, saveDate: new Date().toISOString().split('T')[0] } : cheque
        )
        if (!updatedCheques.some(cheque => cheque.isNew)) {
          updatedCheques.push(createEmptyRow())
        }
        return updatedCheques
      })
      setEditId(null)
      setMessage({ type: 'success', text: 'Chèque enregistré avec succès!' })
    } else {
      setMessage({ type: 'error', text: 'Veuillez remplir tous les champs avant d\'enregistrer.' })
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const handleCancel = (id) => {
    setCheques(prevCheques => {
      const updatedCheques = prevCheques.filter(cheque => cheque.id !== id || !cheque.isNew)
      if (!updatedCheques.some(cheque => cheque.isNew)) {
        updatedCheques.push(createEmptyRow())
      }
      return updatedCheques
    })
    setEditId(null)
  }

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce chèque ?')) {
      setCheques(prevCheques => {
        const updatedCheques = prevCheques.filter(cheque => cheque.id !== id)
        if (!updatedCheques.some(cheque => cheque.isNew)) {
          updatedCheques.push(createEmptyRow())
        }
        return updatedCheques
      })
      setMessage({ type: 'success', text: 'Chèque supprimé avec succès!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  const handleChange = (id, field, value) => {
    setCheques(cheques.map(cheque =>
      cheque.id === id ? { ...cheque, [field]: value } : cheque
    ))
  }

  const handlePhotoChange = async (id) => {
    setIsLoading(true)
    try {
      const resIjson = await scanCheque(id)
      const updatedCheques = cheques.map((cheque) => {
        if (cheque.id === id) {
          return {
            ...cheque,
            amount: resIjson.amount,
            date: resIjson.date,
            ownerName: resIjson.owner,
            chequeNumber: resIjson.chequeNum,
            bankName: resIjson.BankName,
            photo: `/scanned/${resIjson.path}`
          };
        }
        return cheque;
      });
      setCheques(updatedCheques);
      setMessage({ type: 'success', text: 'Chèque scanné avec succès!' })
    } catch (error) {
      console.error(error)
      setMessage({ type: 'error', text: 'Erreur lors du scan du chèque. Veuillez réessayer.' })
    } finally {
      setIsLoading(false)
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  const filteredCheques = cheques.filter(cheque => {
    if (cheque.isNew) return true; // Always show the new empty row
    
    const chequeDate = new Date(cheque.date);
    const today = new Date();
    
    switch(filter) {
      case 'pastDue':
        return chequeDate < today;
      case 'today':
        return chequeDate.toDateString() === today.toDateString();
      case 'month':
        return chequeDate.getMonth() + 1 === parseInt(monthFilter);
      case 'year':
        return chequeDate.getFullYear() === parseInt(yearFilter);
      case 'dateRange':
        const start = startDateFilter ? new Date(startDateFilter) : new Date(0);
        const end = endDateFilter ? new Date(endDateFilter) : new Date();
        return chequeDate >= start && chequeDate <= end;
      default:
        return true;
    }
  })

  const totalAmount = filteredCheques.reduce((sum, cheque) => sum + parseFloat(cheque.amount || '0'), 0)

  const handleImageClick = (photo) => setEnlargedImage(photo)

  const handlePrint = () => {
    if (enlargedImage) {
      const printWindow = window.open('', '_blank')
      printWindow.document.write(`<html><head><title>Chèque</title></head><body>`)
      printWindow.document.write(`<img src="${enlargedImage}" style="max-width: 100%;" />`)
      printWindow.document.write(`</body></html>`)
      printWindow.document.close()
    }
  }

  return (
    <div className="container mx-auto p-4 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Gestion des Chèques</h1>
      {message.text && (
        <div className={`mb-4 p-2 text-center rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}
      <div className="mb-4 flex flex-wrap justify-between items-center">
        <div className="w-full md:w-auto mb-2 md:mb-0">
          <label htmlFor="filter" className="mr-2 text-gray-700">Filtre:</label>
          <select
            id="filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="p-2 border rounded bg-white text-gray-800"
          >
            <option value="all">Tous les chèques</option>
            <option value="pastDue">Chèques échus</option>
            <option value="today">Chèques d'aujourd'hui</option>
            <option value="month">Par mois</option>
            <option value="year">Par année</option>
            <option value="dateRange">Plage de dates</option>
          </select>
        </div>
        {filter === 'month' && (
          <div className="w-full md:w-auto mb-2 md:mb-0">
            <label htmlFor="monthFilter" className="mr-2 text-gray-700">Mois:</label>
            <select
              id="monthFilter"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="p-2 border rounded bg-white text-gray-800"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
          </div>
        )}
        {filter === 'year' && (
          <div className="w-full md:w-auto mb-2 md:mb-0">
            <label htmlFor="yearFilter" className="mr-2 text-gray-700">Année:</label>
            <input
              type="number"
              id="yearFilter"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="p-2 border rounded bg-white text-gray-800"
              min="1900"
              max="2099"
            />
          </div>
        )}
        {filter === 'dateRange' && (
          <>
            <div className="w-full md:w-auto mb-2 md:mb-0">
              <label htmlFor="startDate" className="mr-2 text-gray-700">Date de début:</label>
              <input
                type="date"
                id="startDate"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="p-2 border rounded bg-white text-gray-800"
              />
            </div>
            <div className="w-full md:w-auto mb-2 md:mb-0">
              <label htmlFor="endDate" className="mr-2 text-gray-700">Date de fin:</label>
              <input
                type="date"
                id="endDate"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="p-2 border rounded bg-white text-gray-800"
              />
            </div>
          </>
        )}
        <div className="w-full md:w-auto text-xl font-bold text-gray-800">
          Total: {totalAmount.toFixed(3)} TND
        </div>
      </div>
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full">
          <thead>
            <tr className="bg-blue-800 text-white uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Numéro de Chèque</th>
              <th className="py-3 px-6 text-left">Nom de la Banque</th>
              <th className="py-3 px-6 text-left">Date</th>
              <th className="py-3 px-6 text-left">Nom du Propriétaire</th>
              <th className="py-3 px-6 text-left">Montant</th>
              <th className="py-3 px-6 text-left">Photo</th>
              <th className="py-3 px-6 text-left">Date de Sauvegarde</th>
              <th className="py-3 px-6 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm font-light">
            {filteredCheques.map((cheque) => (
              <tr key={cheque.id} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-3 px-6">
                  <input
                    value={cheque.chequeNumber}
                    onChange={(e) => handleChange(cheque.id, 'chequeNumber', e.target.value)}
                    className="w-full p-1 border rounded"
                    disabled={!cheque.isNew && cheque.id !== editId}
                  />
                </td>
                <td className="py-3 px-6">
                  <input
                    value={cheque.bankName}
                    onChange={(e) => handleChange(cheque.id, 'bankName', e.target.value)}
                    className="w-full p-1 border rounded"
                    disabled={!cheque.isNew && cheque.id !== editId}
                  />
                </td>
                <td className="py-3 px-6">
                  <input
                    type="date"
                    value={cheque.date}
                    onChange={(e) => handleChange(cheque.id, 'date', e.target.value)}
                    className="w-full p-1 border rounded"
                    disabled={!cheque.isNew && cheque.id !== editId}
                  />
                </td>
                <td className="py-3 px-6">
                  <input
                    value={cheque.ownerName}
                    onChange={(e) => handleChange(cheque.id, 'ownerName', e.target.value)}
                    className="w-full p-1 border rounded"
                    disabled={!cheque.isNew && cheque.id !== editId}
                  />
                </td>
                <td className="py-3 px-6">
                  <input
                    type="number"
                    value={cheque.amount}
                    onChange={(e) => handleChange(cheque.id, 'amount', e.target.value)}
                    className="w-full p-1 border rounded"
                    disabled={!cheque.isNew && cheque.id !== editId}
                  />
                </td>
                <td className="py-3 px-6">
                  {cheque.photo && (cheque.id !== editId) ? (
                    <img 
                      src={cheque.photo} 
                      alt="Chèque" 
                      className="w-25 h-16 object-cover rounded cursor-pointer" 
                      onClick={() => handleImageClick(cheque.photo)}
                    />
                  ) : (
                    <button
                      disabled={isLoading}
                      onClick={() => handlePhotoChange(cheque.id)}
                      className={`flex items-center justify-center p-2 rounded ${isLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                      {isLoading ? <Loader className="h-5 w-5 animate-spin" /> : <><Scan className="h-5 w-5 mr-2" /> Scanner</>}
                    </button>
                  )}
                </td>
                <td className="py-3 px-6">
                  {cheque.isNew ? (
                    <input
                      type="date"
                      value={cheque.saveDate}
                      onChange={(e) => handleChange(cheque.id, 'saveDate', e.target.value)}
                      className="w-full p-1 border rounded"
                    />
                  ) : (
                    formatDate(cheque.saveDate)
                  )}
                </td>
                <td className="py-3 px-6">
                  {cheque.isNew || cheque.id === editId ? (
                    <>
                      <button onClick={() => handleSave(cheque.id)} className="p-1 mr-1 text-green-600 hover:text-green-800">
                        <Save className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleCancel(cheque.id)} className="p-1 text-red-600 hover:text-red-800">
                        <X className="h-5 w-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEdit(cheque.id)} className="p-1 mr-1 text-blue-600 hover:text-blue-800">
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleDelete(cheque.id)} className="p-1 text-red-600 hover:text-red-800">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {enlargedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-3xl max-h-full overflow-auto">
            <img src={enlargedImage} alt="Chèque agrandi" className="max-w-full h-auto" />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handlePrint}
                className="mr-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded flex items-center"
              >
                <Printer className="h-5 w-5 mr-2" /> Imprimer
              </button>
              <button
                onClick={() => setEnlargedImage(null)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}