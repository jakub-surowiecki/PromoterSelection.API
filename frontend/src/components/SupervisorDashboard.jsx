import React, { useState, useEffect } from 'react';
import {
    BookOpen, Award, PlusCircle, Info, Edit, Trash2, X, CheckCircle2,
    AlertTriangle, KeyRound, Users, Save, ChevronLeft, ChevronRight, Clock
} from 'lucide-react';
import { apiFetch } from '../api';

/**
 * KOMPONENTY UI
 */

// Modal z animacją wejścia/wyjścia (obsługuje cykl życia poprzez stan render)
const AnimatedModal = ({ isOpen, onClose, children, maxWidth = "max-w-sm", zIndex = "z-[100]" }) => {
    const [render, setRender] = useState(isOpen);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setRender(true);
            const t = setTimeout(() => setVisible(true), 10);
            return () => clearTimeout(t);
        } else {
            setVisible(false);
            const t = setTimeout(() => setRender(false), 300);
            return () => clearTimeout(t);
        }
    }, [isOpen]);

    if (!render) return null;

    return (
        <div className={`fixed top-0 left-0 w-screen h-screen flex items-center justify-center p-4 overflow-hidden ${zIndex}`}>
            <div className={`absolute inset-0 bg-slate-900/30 transition-all duration-300 ${visible ? 'opacity-100 backdrop-blur-md' : 'opacity-0 backdrop-blur-none'}`}></div>
            <div className={`relative bg-white p-8 rounded-[2rem] shadow-2xl w-full ${maxWidth} border border-white/60 transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'}`}>
                {children}
            </div>
        </div>
    );
};

// Komponent stronicowania dla list (tematy/przydziały)
const Pagination = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;
    return (
        <div className="flex justify-between items-center pt-6 mt-4 border-t border-slate-100 w-full">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2.5 rounded-xl hover:bg-slate-100 disabled:opacity-40 text-slate-600 font-bold text-sm flex items-center transition-all active:scale-95"><ChevronLeft className="w-4 h-4 mr-1" /> Poprzednia</button>
            <span className="text-sm text-slate-500 font-bold bg-slate-50 px-4 py-1.5 rounded-lg">Strona {currentPage} z {totalPages}</span>
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2.5 rounded-xl hover:bg-slate-100 disabled:opacity-40 text-slate-600 font-bold text-sm flex items-center transition-all active:scale-95">Następna <ChevronRight className="w-4 h-4 ml-1" /></button>
        </div>
    );
};

/**
 * GŁÓWNY KOMPONENT DASHBOARDU
 */
export default function SupervisorDashboard() {
    // --- STAN DANYCH ---
    const [me, setMe] = useState(null);
    const [myTopics, setMyTopics] = useState([]);
    const [myAssignments, setMyAssignments] = useState([]);
    const [schedule, setSchedule] = useState({ isActive: false, exists: false, utcEnd: null });
    const [loading, setLoading] = useState(true);

    // --- STAN UI / FORMULARZY ---
    const [activeTab, setActiveTab] = useState('topics');
    const [newTopic, setNewTopic] = useState({ title: '', description: '' });
    const [editingTopic, setEditingTopic] = useState(null);
    const [passwords, setPasswords] = useState({ newPass: '', confirmPass: '' });

    // Paginacja tematów
    const [pageTopic, setPageTopic] = useState(1);
    const ITEMS_PER_PAGE = 6;

    // --- STAN OPERACYJNY ---
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Usuń', confirmColor: 'bg-rose-600 hover:bg-rose-700' });
    const [notification, setNotification] = useState({ isOpen: false, title: '', message: '', type: 'success' });

    const confirmAction = (title, message, onConfirm, confirmText = 'Potwierdź', confirmColor = 'bg-rose-600 hover:bg-rose-700') => {
        setConfirmDialog({ isOpen: true, title, message, onConfirm, confirmText, confirmColor });
    };

    const notify = (title, message, type = 'success') => { setNotification({ isOpen: true, title, message, type }); };

    const formatPrettyDate = (utcString) => {
        if (!utcString) return 'Brak daty';
        const str = String(utcString);
        const d = new Date(str.endsWith('Z') ? str : str + 'Z');
        if (isNaN(d.getTime())) return 'Brak daty';
        return d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    };

    // --- EFEKTY ---
    useEffect(() => { loadData(); }, []);

    // --- LOGIKA API ---
    // Pobiera zestaw danych startowych z wielu endpointów
    const loadData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [meData, topicsData, assignmentsData] = await Promise.all([
                apiFetch('/Users/me'), apiFetch('/Topics'), apiFetch('/Assignments').catch(() => [])
            ]);

            setMe(meData);
            setMyTopics(topicsData.filter(t => t.supervisorId === meData.id));
            setMyAssignments(assignmentsData.filter(a => a.supervisorId === meData.id));

            try {
                const sched = await apiFetch('/Schedules/current');
                setSchedule({ isActive: sched.isActive, exists: true, utcEnd: sched.endDate });
            } catch {
                setSchedule({ isActive: false, exists: false, utcEnd: null });
            }
        } catch (error) {
            console.error("Błąd ładowania danych", error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // --- LOGIKA TEMATÓW ---
    const handleAddTopic = async (e) => {
        e.preventDefault();
        try {
            await apiFetch('/Topics', { method: 'POST', body: JSON.stringify(newTopic) });
            setNewTopic({ title: '', description: '' });
            loadData(true);
            notify("Dodano temat", "Propozycja pracy dyplomowej została opublikowana.", "success");
        } catch (err) { notify("Błąd", "Nie udało się dodać tematu.", "error"); }
    };

    const handleDeleteTopic = (id) => {
        confirmAction("Usuwanie tematu", "Czy na pewno chcesz wycofać ten temat? Zniknie on z listy dostępnej dla studentów.", async () => {
            try { await apiFetch(`/Topics/${id}`, { method: 'DELETE' }); loadData(true); notify("Skasowano", "Temat został trwale usunięty.", "success"); }
            catch (err) { notify("Błąd", "Wystąpił problem podczas usuwania.", "error"); }
        });
    };

    const handleEditTopicSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiFetch(`/Topics/${editingTopic.id}`, { method: 'PUT', body: JSON.stringify({ title: editingTopic.title, description: editingTopic.description }) });
            setEditingTopic(null);
            loadData(true);
            notify("Zapisano", "Zmiany w temacie zostały zaktualizowane.", "success");
        } catch (err) { notify("Błąd", "Nie udało się zapisać zmian.", "error"); }
    };

    // --- ZMIANA HASŁA ---
    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwords.newPass !== passwords.confirmPass) return notify("Błąd walidacji", "Podane hasła nie są identyczne.", "error");
        if (passwords.newPass.length < 6) return notify("Błąd bezpieczeństwa", "Hasło musi mieć minimum 6 znaków.", "error");
        try {
            await apiFetch(`/Users/${me.id}`, { method: 'PUT', body: JSON.stringify({ password: passwords.newPass }) });
            notify("Sukces", "Twoje hasło zostało pomyślnie zmienione.", "success");
            setPasswords({ newPass: '', confirmPass: '' });
        } catch (error) { notify("Błąd", "Wystąpił błąd serwera podczas zmiany hasła.", "error"); }
    };

    if (loading || !me) return <div className="text-center mt-32 text-slate-500 font-bold animate-pulse">Ładowanie panelu promocyjnego...</div>;

    // Bezpieczne obliczenia statusu algorytmu i limitów
    const isFinished = !schedule.isActive && myAssignments.length > 0;
    const executionDate = schedule.utcEnd || (myAssignments.length > 0 ? myAssignments[0].assignedAt : null);

    const assignedCount = myAssignments.length;
    const limit = me.maxStudents || 0;
    const fillRate = limit > 0 ? Math.min(Math.round((assignedCount / limit) * 100), 100) : 0;

    const paginatedMyTopics = myTopics.slice((pageTopic - 1) * ITEMS_PER_PAGE, pageTopic * ITEMS_PER_PAGE);

    // --- RENDEROWANIE ---
    return (
        <div className="space-y-6 relative">
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes springPop { 0% { opacity: 0; transform: scale(0.9) translateY(30px); } 60% { opacity: 1; transform: scale(1.02) translateY(-5px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
                @keyframes smoothFade { from { opacity: 0; backdrop-filter: blur(0px); } to { opacity: 1; backdrop-filter: blur(12px); } }
            `}} />

            {/* POWIADOMIENIA */}
            <AnimatedModal isOpen={notification.isOpen} onClose={() => setNotification({ ...notification, isOpen: false })} zIndex="z-[110]">
                <div className="flex justify-center mb-5">
                    <div className={`p-4 rounded-full ring-8 ${notification.type === 'error' ? 'bg-rose-50 text-rose-600 ring-rose-50' : 'bg-emerald-50 text-emerald-600 ring-emerald-50'}`}>
                        {notification.type === 'error' ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
                    </div>
                </div>
                <h3 className="font-black text-xl text-slate-800 leading-tight mb-2 text-center">{notification.title}</h3>
                <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed text-center">{notification.message}</p>
                <button onClick={() => setNotification({ ...notification, isOpen: false })} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/20">Zrozumiałem</button>
            </AnimatedModal>

            {/* OKIENKO POTWIERDZENIA */}
            <AnimatedModal isOpen={confirmDialog.isOpen} onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} zIndex="z-[100]">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="p-4 bg-amber-50 text-amber-500 rounded-full ring-8 ring-amber-50 mb-5"><AlertTriangle className="w-8 h-8" /></div>
                    <h3 className="font-black text-xl text-slate-800 leading-tight">{confirmDialog.title}</h3>
                    <p className="text-sm text-slate-500 mt-3 font-medium leading-relaxed">{confirmDialog.message}</p>
                </div>
                <div className="flex space-x-3">
                    <button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95">Anuluj</button>
                    <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({ ...confirmDialog, isOpen: false }); }} className={`flex-1 py-4 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 ${confirmDialog.confirmColor}`}>{confirmDialog.confirmText}</button>
                </div>
            </AnimatedModal>

            {/* OKNO EDYCJI TEMATU */}
            <AnimatedModal isOpen={!!editingTopic} onClose={() => setEditingTopic(null)} maxWidth="max-w-lg">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                    <h3 className="font-black text-xl text-slate-800">Korekta tematu</h3>
                    <button onClick={() => setEditingTopic(null)} className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-rose-100 hover:text-rose-600 transition-all active:scale-90"><X className="w-5 h-5" /></button>
                </div>
                {editingTopic && (
                    <form onSubmit={handleEditTopicSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">Tytuł tematu</label>
                            <input required value={editingTopic.title} onChange={e => setEditingTopic({ ...editingTopic, title: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">Zarys projektu / Wymagania</label>
                            <textarea required rows="5" value={editingTopic.description} onChange={e => setEditingTopic({ ...editingTopic, description: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none text-sm resize-none font-medium focus:ring-2 focus:ring-indigo-500 transition-all" />
                        </div>
                        <div className="pt-2">
                            <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">Zapisz poprawki</button>
                        </div>
                    </form>
                )}
            </AnimatedModal>

            {/* BANNER INFORMACYJNY */}
            <div className="bg-white p-7 rounded-[2rem] ring-1 ring-slate-900/5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 animate-in fade-in duration-500">
                <div className="flex items-start space-x-5">
                    <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0"><Info className="w-6 h-6" /></div>
                    <div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">Witaj, {me.title} {me.firstName} {me.lastName}!</h3>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-3xl mt-1">System przydzieli studentów do Twoich grup seminaryjnych automatycznie na podstawie średniej ocen oraz preferencji. Możesz zarządzać propozycjami tematów poniżej.</p>
                    </div>
                </div>
                <div className="bg-slate-50 px-6 py-4 rounded-2xl ring-1 ring-slate-200 shrink-0 text-center min-w-[160px]">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Maksymalny Limit Miejsc</span>
                    <span className="text-2xl font-black text-indigo-700">{limit}</span>
                </div>
            </div>

            {/* NAWIGACJA ZAKŁADEK */}
            <div className="mb-8 sticky top-4 z-40">
                <div className="flex bg-white/60 backdrop-blur-2xl p-2 rounded-[2rem] ring-1 ring-slate-900/10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-x-auto w-full gap-2">
                    {[
                        { id: 'topics', icon: BookOpen, label: 'Zgłoszone Tematy' },
                        { id: 'assignments', icon: Award, label: 'Moi Seminarzyści' },
                        { id: 'settings', icon: KeyRound, label: 'Bezpieczeństwo Konta' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative flex-1 flex justify-center items-center space-x-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] whitespace-nowrap 
                            ${activeTab === tab.id ? 'text-indigo-700 bg-white shadow-md scale-100' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40 scale-[0.98] hover:scale-100'}`}
                        >
                            <tab.icon className={`w-5 h-5 transition-transform duration-500 ${activeTab === tab.id ? 'scale-110 text-indigo-600' : 'scale-100'}`} />
                            <span className="relative z-10">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ZAKŁADKA BAZA TEMATÓW */}
            {activeTab === 'topics' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                    <div className="bg-white p-8 rounded-[2rem] ring-1 ring-slate-900/5 shadow-sm h-fit">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><PlusCircle className="w-6 h-6" /></div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Nowy temat pracy</h3>
                        </div>
                        <form onSubmit={handleAddTopic} className="space-y-5">
                            <div>
                                <input required type="text" value={newTopic.title} onChange={e => setNewTopic({ ...newTopic, title: e.target.value })} placeholder="Wpisz tytuł pracy..." className="w-full text-sm bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium" />
                            </div>
                            <div>
                                <textarea required rows="6" value={newTopic.description} onChange={e => setNewTopic({ ...newTopic, description: e.target.value })} placeholder="Szczegóły wymagań technicznych i opis projektu..." className="w-full text-sm bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none font-medium"></textarea>
                            </div>
                            <button type="submit" className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-lg hover:bg-slate-800 transition-all active:scale-95">Zgłoś propozycję</button>
                        </form>
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] ring-1 ring-slate-900/5 shadow-sm lg:col-span-2 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><BookOpen className="w-6 h-6" /></div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Opublikowane Tematy</h3>
                                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Wszystkich propozycji: {myTopics.length}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
                                {paginatedMyTopics.map(topic => (
                                    <div key={topic.id} className="p-5 bg-slate-50/50 rounded-[1.5rem] ring-1 ring-slate-200 hover:bg-white hover:shadow-lg transition-all duration-300 group flex flex-col h-full justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-3">
                                                <h4 className="text-base font-black text-slate-800 group-hover:text-indigo-700 transition-colors pr-2 line-clamp-2">{topic.title}</h4>
                                                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shrink-0">
                                                    <button type="button" onClick={() => setEditingTopic(topic)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit className="w-3.5 h-3.5" /></button>
                                                    <button type="button" onClick={() => handleDeleteTopic(topic.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-600 font-medium leading-relaxed line-clamp-4">{topic.description}</p>
                                        </div>
                                    </div>
                                ))}
                                {myTopics.length === 0 && (
                                    <div className="col-span-full py-16 text-center text-sm font-bold text-slate-400 border-2 border-dashed border-slate-200 rounded-[1.5rem] bg-slate-50/50">Brak opublikowanych propozycji tematów.</div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6">
                            <Pagination currentPage={pageTopic} totalItems={myTopics.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setPageTopic} />
                        </div>
                    </div>
                </div>
            )}

            {/* ZAKŁADKA PRZYDZIELENI STUDENCI */}
            {activeTab === 'assignments' && (
                <div className="bg-white p-8 rounded-[2rem] ring-1 ring-slate-900/5 shadow-sm animate-in fade-in duration-500 min-h-[500px] flex flex-col">
                    <div className="flex justify-between items-end border-b border-slate-100 pb-6 mb-8">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Award className="w-6 h-6" /></div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Przydzieleni Seminarzyści</h3>
                                {isFinished && <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Zakończono: {formatPrettyDate(executionDate)}</p>}
                            </div>
                        </div>
                        {isFinished && (
                            <div className="text-right">
                                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pojemność grupy</span>
                                <div className="flex items-center space-x-3">
                                    <div className="w-24 bg-slate-100 rounded-full h-2.5 overflow-hidden"><div className="bg-amber-500 h-full rounded-full" style={{ width: `${fillRate}%` }}></div></div>
                                    <span className="text-sm font-black text-slate-800">{assignedCount} / {limit}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {!isFinished ? (
                        <div className="flex-grow flex flex-col justify-center items-center text-center p-12 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200 animate-in zoom-in-95 duration-500">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 ring-1 ring-slate-200 shadow-sm"><Clock className="w-10 h-10 text-slate-400 animate-pulse" /></div>
                            <h4 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Algorytm w trakcie oczekiwania</h4>
                            <p className="text-slate-500 font-medium max-w-md leading-relaxed">Studenci pojawią się w tym miejscu, gdy Administrator zamknie harmonogram wyborów i zatwierdzi przydziały.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-[1.5rem] ring-1 ring-slate-200 shadow-sm flex-grow">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200"><tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="px-6 py-5">Dane Studenta (Lidera)</th><th className="px-6 py-5 text-center">Nr Albumu</th><th className="px-6 py-5 text-center">Tryb Projektu</th></tr></thead>
                                <tbody className="divide-y divide-slate-100">
                                    {myAssignments.length === 0 ? (
                                        <tr><td colSpan="3" className="px-6 py-12 text-center text-slate-500 font-bold">W tym semestrze żaden student nie został przydzielony do Twojej grupy.</td></tr>
                                    ) : (
                                        myAssignments.map(a => (
                                            <tr key={a.id} className="hover:bg-amber-50/30 transition-colors group">
                                                <td className="px-6 py-5 font-bold text-slate-800 flex items-center space-x-3"><div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500 ring-1 ring-slate-200 group-hover:ring-amber-200 group-hover:bg-white transition-all"><Users className="w-4 h-4" /></div><span>{a.studentName}</span></td>
                                                <td className="px-6 py-5 text-center text-slate-500 font-mono text-sm">{a.albumNumber}</td>
                                                <td className="px-6 py-5 text-center">{a.isTeamAssignment ? <span className="bg-purple-100 text-purple-700 text-[10px] px-3 py-1.5 rounded-lg font-black uppercase tracking-wider">Grupa Robocza</span> : <span className="bg-slate-100 text-slate-600 text-[10px] px-3 py-1.5 rounded-lg font-black uppercase tracking-wider">Indywidualnie</span>}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ZAKŁADKA BEZPIECZEŃSTWO */}
            {activeTab === 'settings' && (
                <div className="bg-white p-8 rounded-[2rem] ring-1 ring-slate-900/5 shadow-sm max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-500">
                    <h2 className="text-xl font-black text-slate-800 flex items-center mb-6"><KeyRound className="w-6 h-6 mr-3 text-slate-400" /> Profil i Bezpieczeństwo</h2>
                    <div className="bg-slate-50 p-6 rounded-3xl ring-1 ring-slate-200">
                        <h3 className="font-bold text-slate-700 mb-2">Konfiguracja własnego hasła</h3>
                        <p className="text-xs font-medium text-slate-500 mb-6 leading-relaxed">Jeśli Twoje konto zostało utworzone przez Administratora, zalecana jest natychmiastowa zmiana hasła dostępowego do systemu wydziałowego.</p>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div><label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 ml-1">Nowe hasło dostępu</label><input type="password" required minLength="6" value={passwords.newPass} onChange={e => setPasswords({ ...passwords, newPass: e.target.value })} className="w-full bg-white border-0 ring-1 ring-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-slate-500 outline-none transition-all" /></div>
                            <div><label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 ml-1">Potwierdź nowe hasło</label><input type="password" required minLength="6" value={passwords.confirmPass} onChange={e => setPasswords({ ...passwords, confirmPass: e.target.value })} className="w-full bg-white border-0 ring-1 ring-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-slate-500 outline-none transition-all" /></div>
                            <div className="pt-2"><button type="submit" className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg">Zaktualizuj zabezpieczenia</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}