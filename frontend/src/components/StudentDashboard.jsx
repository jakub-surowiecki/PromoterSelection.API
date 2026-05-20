import React, { useState } from 'react';
import { User, Users, CheckCircle, AlertTriangle, Save, Star, BadgeCheck, Compass } from 'lucide-react';

export default function StudentDashboard() {
    const [prefs, setPrefs] = useState({ p1: '', p2: '', p3: '' });
    const [members, setMembers] = useState([
        { id: 1, name: "Piotr Zając", album: "123456", gpa: 4.5 },
        { id: 2, name: "Katarzyna Lewandowska", album: "123457", gpa: 4.65 },
        { id: 3, name: "Marek Wróbel", album: "123458", gpa: 4.0 }
    ]);
    const leader = [...members].sort((a, b) => b.gpa - a.gpa)[0];

    const supervisors = [
        { id: 1, title: "Prof. dr hab.", name: "Andrzej Nowak", max: 1, current: 0 },
        { id: 2, title: "Dr inż.", name: "Anna Wiśniewska", max: 4, current: 1 },
        { id: 3, title: "Dr", name: "Tomasz Maj", max: 6, current: 2 },
        { id: 4, title: "Prof. dr hab.", name: "Maria Kowal", max: 3, current: 3 }
    ];

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-7 rounded-3xl ring-1 ring-slate-900/5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 p-32 bg-gradient-to-br from-indigo-50 to-white rounded-full -mr-20 -mt-20 opacity-50 transition-transform group-hover:scale-110 duration-700"></div>
                    <div className="relative">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl ring-1 ring-indigo-100">
                                <User className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Katarzyna Lewandowska</h2>
                                <p className="text-sm font-medium text-slate-500 flex items-center mt-1">
                                    <BadgeCheck className="w-4 h-4 mr-1 text-emerald-500" /> Studentka zweryfikowana
                                </p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-slate-500 font-medium">Nr albumu</span>
                                <span className="font-bold text-slate-800">123457</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-slate-500 font-medium">Średnia (GPA)</span>
                                <span className="font-bold text-indigo-600 text-lg">4.65</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-7 rounded-3xl ring-1 ring-slate-900/5 shadow-sm lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl ring-1 ring-sky-100">
                                <Users className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800">Grupa Projektowa AI</h2>
                        </div>
                        <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-600 rounded-full ring-1 ring-slate-200">
                            Rozmiar: {members.length}/3
                        </span>
                    </div>

                    <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200/60">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="px-4 py-3">Student</th>
                                    <th className="px-4 py-3 text-right">GPA</th>
                                    <th className="px-4 py-3 text-center">Rola w grupie</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-sm">
                                {members.map(m => (
                                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-700">{m.name}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-slate-600">{m.gpa.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-center">
                                            {leader.id === m.id ? (
                                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 ring-1 ring-amber-200/50">
                                                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                                    <span>Lider Zespołu</span>
                                                </span>
                                            ) : (
                                                <span className="text-xs font-medium text-slate-400">Członek</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="bg-white p-7 rounded-3xl ring-1 ring-slate-900/5 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
                            <Compass className="w-5 h-5 text-indigo-500" />
                            <span>Deklaracja Preferencji Promotora</span>
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">Ustal priorytety przydziału. Zostaną uwzględnione przez algorytm systemowy.</p>
                    </div>
                    <button className="flex items-center space-x-2 px-6 py-2.5 bg-slate-900 text-white font-semibold rounded-xl text-sm hover:bg-slate-800 shadow-md transition-all active:scale-95">
                        <Save className="w-4 h-4" />
                        <span>Zapisz preferencje</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {[1, 2, 3].map((num) => (
                        <div key={num} className="p-5 bg-slate-50/50 rounded-2xl ring-1 ring-slate-200/60 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                                Wybór priorytetowy #{num}
                            </label>
                            <select
                                value={prefs[`p${num}`]}
                                onChange={(e) => setPrefs({ ...prefs, [`p${num}`]: e.target.value })}
                                className="w-full bg-white border-0 ring-1 ring-slate-200 rounded-xl p-3 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm cursor-pointer"
                            >
                                <option value="">Wybierz promotora...</option>
                                {supervisors.map(s => <option key={s.id} value={s.id}>{s.title} {s.name}</option>)}
                            </select>
                        </div>
                    ))}
                </div>

                <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Dostępność promotorów na wydziale</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {supervisors.map(s => {
                            const free = s.max - s.current;
                            return (
                                <div key={s.id} className="p-4 bg-white rounded-2xl ring-1 ring-slate-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between">
                                    <div>
                                        <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider">{s.title}</span>
                                        <h5 className="text-sm font-bold text-slate-800 mt-1">{s.name}</h5>
                                    </div>
                                    <div className="mt-4 flex justify-between items-center">
                                        <div className="flex space-x-1">
                                            {[...Array(s.max)].map((_, i) => (
                                                <div key={i} className={`w-2 h-4 rounded-sm ${i < s.current ? 'bg-slate-200' : 'bg-emerald-400'}`}></div>
                                            ))}
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${free > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                            {free} wolne
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}