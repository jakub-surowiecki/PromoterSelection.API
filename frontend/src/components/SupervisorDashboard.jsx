import React from 'react';
import { BookOpen, Award, PlusCircle, Info } from 'lucide-react';

export default function SupervisorDashboard() {
    return (
        <div className="space-y-8">
            <div className="bg-indigo-50/50 p-6 rounded-3xl ring-1 ring-indigo-100 flex items-start space-x-4">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full shrink-0">
                    <Info className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-indigo-900 mb-1">Informacja o systemie przydziałów</h3>
                    <p className="text-sm text-indigo-700/80 leading-relaxed max-w-4xl">
                        Proces przypisania studentów opiera się na algorytmie uwzględniającym średnią ocen (GPA), deklaracje studentów oraz przypisany Panu/Pani limit miejsc. Po zatwierdzeniu wyników przez Administrację, ostateczna lista studentów pojawi się w panelu poniżej.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-7 rounded-3xl ring-1 ring-slate-900/5 shadow-sm h-fit">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                            <PlusCircle className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Nowy temat pracy</h3>
                    </div>
                    <form className="space-y-5">
                        <div>
                            <input type="text" placeholder="Tytuł pracy dyplomowej" className="w-full text-sm bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium" />
                        </div>
                        <div>
                            <textarea rows="4" placeholder="Opis wymagań i wykorzystywanych technologii..." className="w-full text-sm bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 resize-none font-medium"></textarea>
                        </div>
                        <button type="button" className="w-full py-3 bg-slate-900 text-white font-semibold text-sm rounded-xl shadow-md hover:bg-slate-800 transition-all active:scale-95">
                            Zgłoś i publikuj
                        </button>
                    </form>
                </div>

                <div className="bg-white p-7 rounded-3xl ring-1 ring-slate-900/5 shadow-sm lg:col-span-2 space-y-6">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Moje aktywne propozycje (2)</h3>
                    </div>

                    <div className="space-y-4">
                        {[
                            { t: "Optymalizacja algorytmów rozproszonych w chmurze", d: "Analiza wydajności klastrów Kubernetes." },
                            { t: "System detekcji anomalii w czasie rzeczywistym", d: "Wykorzystanie sieci neuronowych do monitorowania logów serwerowych." }
                        ].map((topic, i) => (
                            <div key={i} className="p-5 bg-white rounded-2xl ring-1 ring-slate-200 hover:ring-indigo-200 hover:shadow-md transition-all group cursor-default">
                                <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{topic.t}</h4>
                                <p className="text-sm text-slate-500 mt-2">{topic.d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white p-7 rounded-3xl ring-1 ring-slate-900/5 shadow-sm">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                        <Award className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Moi Seminarzyści (Przydział 2026)</h3>
                </div>
                <div className="p-12 border-2 border-dashed border-slate-200 rounded-2xl text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 ring-1 ring-slate-100">
                        <span className="text-2xl">⏳</span>
                    </div>
                    <h4 className="text-slate-800 font-bold mb-1">Algorytm jeszcze nie zakończył pracy</h4>
                    <p className="text-sm text-slate-500 max-w-sm">Studenci pojawią się w tym miejscu, gdy Administrator zamknie harmonogram i uruchomi system przydziału.</p>
                </div>
            </div>
        </div>
    );
}