import React from 'react';

export default function SupervisorDashboard() {
    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Dodaj nowy temat pracy</h2>
                <div className="space-y-3 max-w-lg">
                    <input type="text" placeholder="Tytuł pracy..." className="w-full border rounded-lg px-3 py-2 text-sm" />
                    <textarea placeholder="Opis..." className="w-full border rounded-lg px-3 py-2 text-sm"></textarea>
                    <button className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg">Publikuj</button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Przypisani studenci po algorytmie</h3>
                <p className="text-sm text-gray-500">Póki co brak przydziałów. Oczekuj na zakończenie tury przez Administratora.</p>
            </div>
        </div>
    );
}