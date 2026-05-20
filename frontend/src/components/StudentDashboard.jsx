import React, { useState } from 'react';

export default function StudentDashboard() {
    const [prefs, setPrefs] = useState({ p1: '', p2: '', p3: '' });

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">Moje Konto: Katarzyna Lewandowska</h2>
                    <p className="text-sm text-gray-500">Średnia ocen: <span className="font-bold text-gray-800">4.65</span> (Zatwierdzona)</p>
                </div>
                <span className="px-3 py-1 bg-sky-50 text-sky-700 rounded-lg text-sm font-semibold">Zespół: Grupa Projektowa AI</span>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Wybór promotorów (Preferencje)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {[1, 2, 3].map(num => (
                        <div key={num} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <label className="block text-xs font-bold text-gray-500 mb-2">Wybór #{num}</label>
                            <select className="w-full border rounded-lg p-2 text-sm" value={prefs[`p${num}`]} onChange={e => setPrefs({ ...prefs, [`p${num}`]: e.target.value })}>
                                <option value="">Wybierz...</option>
                                <option value="1">Prof. dr hab. Andrzej Nowak</option>
                                <option value="2">Dr inż. Anna Wiśniewska</option>
                            </select>
                        </div>
                    ))}
                </div>
                <button className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700">Zapisz Preferencje</button>
            </div>
        </div>
    );
}