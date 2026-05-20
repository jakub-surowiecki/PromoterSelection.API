import React, { useState } from 'react';

export default function AdminDashboard() {
    const [running, setRunning] = useState(false);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-400 font-bold uppercase">Studenci</p>
                    <h4 className="text-2xl font-bold">124</h4>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-400 font-bold uppercase">Promotorzy</p>
                    <h4 className="text-2xl font-bold">18</h4>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-400 font-bold uppercase">Wolne miejsca</p>
                    <h4 className="text-2xl font-bold">140</h4>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Uruchom Algorytm Przydziału</h3>
                <p className="text-sm text-gray-500 mb-4">Ta akcja nadpisze obecne przydziały i dopasuje studentów wg. średniej (GPA) do wolnych miejsc promotorów.</p>
                <button
                    onClick={() => { setRunning(true); setTimeout(() => setRunning(false), 2000); }}
                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700"
                >
                    {running ? "Przetwarzanie..." : "Uruchom System Przydziału"}
                </button>
            </div>
        </div>
    );
}