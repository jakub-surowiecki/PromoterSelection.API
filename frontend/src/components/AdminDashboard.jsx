import React, { useState } from 'react';
import { Play, Users, Briefcase, KeySquare, Loader2, FileSpreadsheet, FileText } from 'lucide-react';

export default function AdminDashboard() {
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);

    const runSystem = () => {
        setRunning(true); setDone(false);
        setTimeout(() => { setRunning(false); setDone(true); }, 2500);
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Studenci', val: '124', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Promotorzy', val: '18', icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Pojemność', val: '140', icon: KeySquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Zespoły', val: '12', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map((s, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl ring-1 ring-slate-900/5 shadow-sm flex items-center justify-between group hover:-translate-y-1 transition-transform duration-300">
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                            <h4 className="text-3xl font-extrabold text-slate-800">{s.val}</h4>
                        </div>
                        <div className={`p-4 rounded-2xl ${s.bg} ${s.color} transition-colors`}>
                            <s.icon className="w-6 h-6" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white p-1 rounded-3xl ring-1 ring-slate-900/5 shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-10"></div>
                <div className="relative p-8 sm:p-10 text-center flex flex-col items-center">
                    <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Główny Algorytm Przydziału</h3>
                    <p className="text-slate-500 text-sm max-w-xl mx-auto mb-8 font-medium">
                        System przeanalizuje wagi średnich ocen (GPA) oraz listy preferencji wyborów, dążąc do najbardziej optymalnego zapełnienia wakatów promotorów zgodnie z regulaminem.
                    </p>

                    <button
                        onClick={runSystem}
                        disabled={running || done}
                        className={`relative overflow-hidden w-full max-w-md py-4 rounded-2xl font-bold text-lg text-white shadow-xl transition-all duration-300 transform ${done ? 'bg-emerald-500 cursor-default' :
                                running ? 'bg-slate-400 cursor-wait scale-95' :
                                    'bg-slate-900 hover:bg-slate-800 hover:-translate-y-1 hover:shadow-indigo-500/25 active:scale-95'
                            }`}
                    >
                        <div className="relative z-10 flex items-center justify-center space-x-2">
                            {running ? <Loader2 className="w-6 h-6 animate-spin" /> : done ? <span className="text-2xl leading-none">🎉</span> : <Play className="w-5 h-5 fill-white" />}
                            <span>{running ? 'Przetwarzanie danych...' : done ? 'Przydział zakończony!' : 'Uruchom Algorytm'}</span>
                        </div>
                    </button>

                    {done && (
                        <div className="mt-6 animate-in slide-in-from-top-4 fade-in duration-500 flex space-x-6 text-sm font-bold">
                            <span className="text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">✅ Przypisano: 118</span>
                            <span className="text-rose-600 bg-rose-50 px-3 py-1 rounded-lg">❌ Brak miejsc: 6</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl ring-1 ring-slate-900/5 shadow-sm flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer">
                    <div>
                        <h4 className="font-bold text-slate-800 mb-1">Raport XLSX</h4>
                        <p className="text-xs text-slate-500 font-medium">Arkusz kalkulacyjny (Excel)</p>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <FileSpreadsheet className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl ring-1 ring-slate-900/5 shadow-sm flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer">
                    <div>
                        <h4 className="font-bold text-slate-800 mb-1">Raport PDF</h4>
                        <p className="text-xs text-slate-500 font-medium">Gotowy plik do wydruku</p>
                    </div>
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                        <FileText className="w-6 h-6" />
                    </div>
                </div>
            </div>
        </div>
    );
}