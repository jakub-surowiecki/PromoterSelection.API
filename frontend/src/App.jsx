import React, { useState } from 'react';
import StudentDashboard from './components/StudentDashboard';
import SupervisorDashboard from './components/SupervisorDashboard';
import AdminDashboard from './components/AdminDashboard';
import { User, GraduationCap, Settings } from 'lucide-react';

export default function App() {
    const [role, setRole] = useState('student');

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="bg-indigo-900 text-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
                    <div className="flex items-center space-x-3">
                        <GraduationCap className="h-8 w-8 text-indigo-300" />
                        <span className="text-xl font-bold tracking-tight">PromoterSelection <span className="text-indigo-300 text-sm font-normal">v2.0 Mock</span></span>
                    </div>

                    <div className="flex space-x-2 bg-indigo-950 p-1.5 rounded-lg border border-indigo-700">
                        <span className="text-xs text-indigo-200 px-2 flex items-center uppercase tracking-wider">Widok:</span>
                        <button onClick={() => setRole('student')} className={`px-3 py-1 text-sm font-medium rounded-md flex items-center space-x-1 ${role === 'student' ? 'bg-indigo-600 text-white' : 'text-indigo-200 hover:text-white hover:bg-indigo-800'}`}><User className="w-4 h-4" /><span>Student</span></button>
                        <button onClick={() => setRole('supervisor')} className={`px-3 py-1 text-sm font-medium rounded-md flex items-center space-x-1 ${role === 'supervisor' ? 'bg-indigo-600 text-white' : 'text-indigo-200 hover:text-white hover:bg-indigo-800'}`}><GraduationCap className="w-4 h-4" /><span>Promotor</span></button>
                        <button onClick={() => setRole('admin')} className={`px-3 py-1 text-sm font-medium rounded-md flex items-center space-x-1 ${role === 'admin' ? 'bg-indigo-600 text-white' : 'text-indigo-200 hover:text-white hover:bg-indigo-800'}`}><Settings className="w-4 h-4" /><span>Admin</span></button>
                    </div>
                </div>
            </header>

            <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8">
                {role === 'student' && <StudentDashboard />}
                {role === 'supervisor' && <SupervisorDashboard />}
                {role === 'admin' && <AdminDashboard />}
            </main>
        </div>
    );
}