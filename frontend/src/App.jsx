import React, { useState } from 'react';
import StudentDashboard from './components/StudentDashboard';
import SupervisorDashboard from './components/SupervisorDashboard';
import AdminDashboard from './components/AdminDashboard';
import { User, GraduationCap, Settings, Sparkles } from 'lucide-react';

export default function App() {
    const [role, setRole] = useState('student');

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
            <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-lg border-b border-slate-200/80 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center h-20">
                    <div className="flex items-center space-x-3 mb-4 sm:mb-0">
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900">Promoter<span className="text-indigo-600">Selection</span></h1>
                            <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">Wydziałowy System Przydziału</p>
                        </div>
                    </div>

                    <div className="flex items-center p-1.5 bg-slate-100/80 rounded-2xl ring-1 ring-slate-200/50">
                        {[
                            { id: 'student', icon: User, label: 'Student' },
                            { id: 'supervisor', icon: GraduationCap, label: 'Promotor' },
                            { id: 'admin', icon: Settings, label: 'Administrator' }
                        ].map((r) => (
                            <button
                                key={r.id}
                                onClick={() => setRole(r.id)}
                                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center space-x-2 ${role === r.id
                                        ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/50 scale-100'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 scale-95'
                                    }`}
                            >
                                <r.icon className={`w-4 h-4 ${role === r.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                                <span>{r.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                    {role === 'student' && <StudentDashboard />}
                    {role === 'supervisor' && <SupervisorDashboard />}
                    {role === 'admin' && <AdminDashboard />}
                </div>
            </main>
        </div>
    );
}