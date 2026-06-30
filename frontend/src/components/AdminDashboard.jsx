import React, { useState, useEffect, useRef } from 'react';
import {
    Calendar, Users, Briefcase, Save, Clock, FileSpreadsheet, FileText, Upload,
    CheckCircle2, Trash2, UserPlus, PlusCircle, LayoutDashboard, ListChecks,
    Search, ChevronLeft, ChevronRight, Edit, RefreshCw, UserCheck, X, UserMinus,
    BookOpen, AlertTriangle
} from 'lucide-react';
import { apiFetch } from '../api';

const BASE_URL = 'https://localhost:7094/api';

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

// Komponent stronicowania dla list (użytkownicy/zespoły/tematy/przydziały)
const Pagination = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;
    return (
        <div className="flex justify-between items-center pt-6 mt-4 border-t border-slate-100">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2.5 rounded-xl hover:bg-slate-100 disabled:opacity-40 text-slate-600 font-bold text-sm flex items-center transition-all active:scale-95"><ChevronLeft className="w-4 h-4 mr-1" /> Poprzednia</button>
            <span className="text-sm text-slate-500 font-bold bg-slate-50 px-4 py-1.5 rounded-lg">Strona {currentPage} z {totalPages}</span>
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2.5 rounded-xl hover:bg-slate-100 disabled:opacity-40 text-slate-600 font-bold text-sm flex items-center transition-all active:scale-95">Następna <ChevronRight className="w-4 h-4 ml-1" /></button>
        </div>
    );
};

/**
 * GŁÓWNY KOMPONENT DASHBOARDU
 */
export default function AdminDashboard() {
    // --- STAN DANYCH ---
    const [schedule, setSchedule] = useState({ startDateInput: '', endDateInput: '', utcStart: '', utcEnd: '', isActive: false, exists: false });
    const [isEditingSchedule, setIsEditingSchedule] = useState(false);

    const [supervisorsList, setSupervisorsList] = useState([]);
    const [studentsList, setStudentsList] = useState([]);
    const [teamsList, setTeamsList] = useState([]);
    const [topicsList, setTopicsList] = useState([]);
    const [assignmentsList, setAssignmentsList] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- STAN UI / FORMULARZY ---
    const [activeTab, setActiveTab] = useState('overview');
    const [userSubTab, setUserSubTab] = useState('students');
    const fileInputRef = useRef(null);

    const [editingUser, setEditingUser] = useState(null);
    const [editingTeam, setEditingTeam] = useState(null);
    const [editingTopic, setEditingTopic] = useState(null);

    // --- STAN OPERACYJNY ---
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Usuń', confirmColor: 'bg-rose-600 hover:bg-rose-700' });
    const [notification, setNotification] = useState({ isOpen: false, title: '', message: '', type: 'success' });

    const [searchSup, setSearchSup] = useState(''); const [pageSup, setPageSup] = useState(1);
    const [searchStu, setSearchStu] = useState(''); const [pageStu, setPageStu] = useState(1);
    const [searchTeam, setSearchTeam] = useState(''); const [pageTeam, setPageTeam] = useState(1);
    const [searchAssign, setSearchAssign] = useState(''); const [pageAssign, setPageAssign] = useState(1);
    const [searchTopic, setSearchTopic] = useState(''); const [pageTopic, setPageTopic] = useState(1);
    const ITEMS_PER_PAGE = 8;

    const [newSupervisor, setNewSupervisor] = useState({ title: '', firstName: '', lastName: '', email: '', password: '', maxStudents: 5 });
    const [newStudent, setNewStudent] = useState({ firstName: '', lastName: '', email: '', albumNumber: '', gpa: '', password: '' });
    const [newTeamName, setNewTeamName] = useState('');
    const [selectedStudentForTeam, setSelectedStudentForTeam] = useState({});

    const confirmAction = (title, message, onConfirm, confirmText = 'Potwierdź', confirmColor = 'bg-rose-600 hover:bg-rose-700') => {
        setConfirmDialog({ isOpen: true, title, message, onConfirm, confirmText, confirmColor });
    };

    const notify = (title, message, type = 'success') => { setNotification({ isOpen: true, title, message, type }); };

    const toLocalDatetimeLocal = (utcString) => {
        if (!utcString) return '';
        const str = String(utcString);
        const d = new Date(str.endsWith('Z') ? str : str + 'Z');
        if (isNaN(d.getTime())) return '';
        const pad = (n) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const formatPrettyDate = (utcString) => {
        if (!utcString) return 'Brak daty';
        const str = String(utcString);
        const d = new Date(str.endsWith('Z') ? str : str + 'Z');
        if (isNaN(d.getTime())) return 'Brak daty';
        return d.toLocaleDateString('pl-PL', { weekday: 'short', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' });
    };

    const formatFullDate = (utcString) => {
        if (!utcString) return 'Brak daty';
        const str = String(utcString);
        const d = new Date(str.endsWith('Z') ? str : str + 'Z');
        if (isNaN(d.getTime())) return 'Brak daty';
        return d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // --- EFEKTY ---
    useEffect(() => {
        loadData();
        const interval = setInterval(() => loadData(true), 15000);
        return () => clearInterval(interval);
    }, []);

    // --- LOGIKA API ---
    // Pobiera zestaw danych startowych z wielu endpointów
    const loadData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [students, supervisors, teams, assignments, topicsData] = await Promise.all([
                apiFetch('/Users/students'), apiFetch('/Users/supervisors'), apiFetch('/Teams'), apiFetch('/Assignments'), apiFetch('/Topics')
            ]);
            setStudentsList(students); setSupervisorsList(supervisors); setTeamsList(teams); setAssignmentsList(assignments); setTopicsList(topicsData);

            try {
                const scheduleData = await apiFetch('/Schedules/current');
                setSchedule(prev => ({
                    startDateInput: prev.startDateInput || toLocalDatetimeLocal(scheduleData.startDate),
                    endDateInput: prev.endDateInput || toLocalDatetimeLocal(scheduleData.endDate),
                    utcStart: scheduleData.startDate, utcEnd: scheduleData.endDate,
                    isActive: scheduleData.isActive, exists: true
                }));
            } catch (err) {
                if (!silent) { setSchedule({ startDateInput: '', endDateInput: '', utcStart: '', utcEnd: '', isActive: false, exists: false }); setIsEditingSchedule(true); }
            }
        } catch (error) { console.error("Błąd", error); } finally { if (!silent) setLoading(false); }
    };

    // --- LOGIKA HARMONOGRAMU ---
    const handleSaveSchedule = async () => {
        if (!schedule.startDateInput || !schedule.endDateInput) return notify("Wymagane dane", "Proszę uzupełnić obie daty harmonogramu.", "error");
        try {
            const newStartUtc = new Date(schedule.startDateInput).toISOString();
            const newEndUtc = new Date(schedule.endDateInput).toISOString();
            setSchedule({ ...schedule, utcStart: newStartUtc, utcEnd: newEndUtc, exists: true });
            setIsEditingSchedule(false);
            await apiFetch('/Schedules', { method: 'POST', body: JSON.stringify({ startDate: newStartUtc, endDate: newEndUtc, isActive: schedule.isActive }) });
            loadData(true);
            notify("Sukces", "Harmonogram wyborów został zapisany.", "success");
        } catch (error) { notify("Błąd", "Wystąpił błąd podczas zapisywania harmonogramu.", "error"); loadData(true); }
    };

    const handleResetSystem = () => {
        confirmAction("Reset Algorytmu", "Czy na pewno chcesz wyzerować wszystkie wyniki przydziałów i rozpocząć nową turę? Ta operacja jest nieodwracalna.", async () => {
            try { await apiFetch('/Schedules/reset', { method: 'DELETE' }); setSchedule({ startDateInput: '', endDateInput: '', utcStart: '', utcEnd: '', isActive: false, exists: false }); setIsEditingSchedule(true); loadData(true); notify("Sukces", "System został zresetowany, gotowy na nowe wybory.", "success"); }
            catch (e) { notify("Błąd", "Nie udało się zresetować systemu.", "error"); }
        }, "Wyzeruj system", "bg-rose-600 hover:bg-rose-700 text-white");
    };

    // --- LOGIKA UŻYTKOWNIKÓW ---
    const handleAddSupervisor = async (e) => { e.preventDefault(); try { await apiFetch('/Users', { method: 'POST', body: JSON.stringify({ ...newSupervisor, role: 'Supervisor' }) }); setNewSupervisor({ title: '', firstName: '', lastName: '', email: '', password: '', maxStudents: 5 }); loadData(true); notify("Sukces", "Utworzono nowe konto promotora.", "success"); } catch (err) { notify("Błąd", err.message, "error"); } };
    const handleAddStudent = async (e) => { e.preventDefault(); try { await apiFetch('/Users', { method: 'POST', body: JSON.stringify({ ...newStudent, role: 'Student', gpa: newStudent.gpa ? parseFloat(newStudent.gpa) : null }) }); setNewStudent({ firstName: '', lastName: '', email: '', albumNumber: '', gpa: '', password: '' }); loadData(true); notify("Sukces", "Pomyślnie dodano studenta.", "success"); } catch (err) { notify("Błąd", err.message, "error"); } };
    const handleDeleteUser = (id) => { confirmAction("Usuwanie konta", "Czy na pewno chcesz usunąć tego użytkownika? Wszelkie jego dane znikną z systemu.", async () => { try { await apiFetch(`/Users/${id}`, { method: 'DELETE' }); loadData(true); notify("Sukces", "Użytkownik został usunięty.", "success"); } catch (err) { notify("Błąd", "Wystąpił błąd podczas usuwania.", "error"); } }); };

    const handleEditUserSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiFetch(`/Users/${editingUser.id}`, { method: 'PUT', body: JSON.stringify({ firstName: editingUser.firstName, lastName: editingUser.lastName, email: editingUser.email, albumNumber: editingUser.albumNumber, title: editingUser.title, gpa: editingUser.gpa ? parseFloat(editingUser.gpa) : null, maxStudents: editingUser.maxStudents ? parseInt(editingUser.maxStudents) : null }) });
            setEditingUser(null); loadData(true); notify("Sukces", "Zmiany na profilu zapisane.", "success");
        } catch (err) { notify("Błąd", "Problem z zapisem.", "error"); }
    };

    // --- LOGIKA ZESPOŁÓW ---
    const handleCreateTeam = async (e) => { e.preventDefault(); try { await apiFetch('/Teams', { method: 'POST', body: JSON.stringify({ name: newTeamName }) }); setNewTeamName(''); loadData(true); notify("Sukces", "Utworzono zespół.", "success"); } catch (err) { notify("Błąd", err.message, "error"); } };
    const handleDeleteTeam = (id) => { confirmAction("Rozwiązanie zespołu", "Czy na pewno chcesz usunąć zespół? Członkowie wrócą do puli indywidualnej.", async () => { try { await apiFetch(`/Teams/${id}`, { method: 'DELETE' }); loadData(true); notify("Sukces", "Zespół rozwiązany.", "success"); } catch (err) { notify("Błąd", "Nie usunięto zespołu.", "error"); } }); };
    const handleEditTeamSubmit = async (e) => { e.preventDefault(); try { await apiFetch(`/Teams/${editingTeam.id}`, { method: 'PUT', body: JSON.stringify({ name: editingTeam.name }) }); setEditingTeam(null); loadData(true); notify("Sukces", "Nazwa zmieniona.", "success"); } catch (err) { notify("Błąd", "Błąd zmiany.", "error"); } };
    const handleAddStudentToTeam = async (teamId) => { const studentId = selectedStudentForTeam[teamId]; if (!studentId) return; try { await apiFetch(`/Teams/${teamId}/members`, { method: 'POST', body: JSON.stringify({ studentId: parseInt(studentId) }) }); setSelectedStudentForTeam({ ...selectedStudentForTeam, [teamId]: '' }); loadData(true); notify("Sukces", "Student dołączył do grupy.", "success"); } catch (err) { notify("Błąd", err.message, "error"); } };
    const handleRemoveStudentFromTeam = (teamId, studentId) => { confirmAction("Wyrzucenie z grupy", "Czy na pewno chcesz usunąć studenta z tego zespołu?", async () => { try { await apiFetch(`/Teams/${teamId}/members/${studentId}`, { method: 'DELETE' }); loadData(true); notify("Sukces", "Usunięto studenta.", "success"); } catch (err) { notify("Błąd", "Błąd podczas wyrzucania.", "error"); } }); };

    // --- LOGIKA TEMATÓW ---
    const handleDeleteTopic = (id) => { confirmAction("Usuwanie tematu", "Czy na pewno chcesz skasować ten temat z bazy ogólnodostępnej?", async () => { try { await apiFetch(`/Topics/${id}`, { method: 'DELETE' }); loadData(true); notify("Sukces", "Skasowano temat.", "success"); } catch (err) { notify("Błąd", "Nie usunięto tematu.", "error"); } }); };
    const handleEditTopicSubmit = async (e) => { e.preventDefault(); try { await apiFetch(`/Topics/${editingTopic.id}`, { method: 'PUT', body: JSON.stringify({ title: editingTopic.title, description: editingTopic.description }) }); setEditingTopic(null); loadData(true); notify("Sukces", "Zaktualizowano treść tematu.", "success"); } catch (err) { notify("Błąd", "Błąd zapisu tematu.", "error"); } };

    // --- CSV I RAPORTY ---
    const handleCsvUpload = async (e) => {
        const file = e.target.files[0]; if (!file) return; const formData = new FormData(); formData.append("file", file);
        try {
            const res = await fetch(`${BASE_URL}/Users/import/students`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: formData });
            if (res.ok) { const result = await res.json(); notify("Import zakończony", `Dodano ${result.imported} studentów z pliku.`, "success"); loadData(true); }
            else { notify("Błąd w pliku CSV", "Sprawdź wymagane nagłówki pliku.", "error"); }
        } catch (err) { notify("Błąd serwera", "Problem z wgraniem pliku.", "error"); }
        e.target.value = null;
    };

    const downloadReport = async (type) => {
        try {
            const response = await fetch(`${BASE_URL}/Reports/${type}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
            if (!response.ok) throw new Error(); const blob = await response.blob(); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `Raport_Przydzialow.${type}`; document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
        } catch (err) { notify("Błąd pobierania", "Raport nie jest gotowy.", "error"); }
    };

    const paginatedSupervisors = supervisorsList.filter(s => `${s.firstName} ${s.lastName} ${s.email || ''}`.toLowerCase().includes(searchSup.toLowerCase())).slice((pageSup - 1) * ITEMS_PER_PAGE, pageSup * ITEMS_PER_PAGE);
    const paginatedStudents = studentsList.filter(s => `${s.firstName} ${s.lastName} ${s.albumNumber || ''} ${s.email || ''}`.toLowerCase().includes(searchStu.toLowerCase())).slice((pageStu - 1) * ITEMS_PER_PAGE, pageStu * ITEMS_PER_PAGE);
    const paginatedTeams = teamsList.filter(t => (t.name || '').toLowerCase().includes(searchTeam.toLowerCase())).slice((pageTeam - 1) * ITEMS_PER_PAGE, pageTeam * ITEMS_PER_PAGE);
    const paginatedAssignments = assignmentsList.filter(a => `${a.studentName} ${a.supervisorName} ${a.albumNumber || ''}`.toLowerCase().includes(searchAssign.toLowerCase())).slice((pageAssign - 1) * ITEMS_PER_PAGE, pageAssign * ITEMS_PER_PAGE);

    const now = new Date();
    const isFinished = !schedule.isActive && assignmentsList.length > 0;
    const executionDate = schedule.utcEnd || (assignmentsList.length > 0 ? assignmentsList[0].assignedAt : null);
    if (loading && supervisorsList.length === 0) return <div className="text-center mt-32 text-slate-500 font-bold animate-pulse">Inicjalizacja środowiska administratora...</div>;

    const totalCapacity = supervisorsList.reduce((sum, sup) => sum + (sup.maxStudents || 0), 0);
    const assignedStudentsCount = assignmentsList.length;
    const fillRate = totalCapacity > 0 ? Math.round((assignedStudentsCount / totalCapacity) * 100) : 0;
    const studentAssignedRate = studentsList.length > 0 ? Math.round((assignedStudentsCount / studentsList.length) * 100) : 0;

    // --- RENDEROWANIE ---
    return (
        <div className="space-y-6 relative">

            {/* POWIADOMIENIA */}
            <AnimatedModal isOpen={notification.isOpen} onClose={() => setNotification({ ...notification, isOpen: false })} zIndex="z-[110]">
                <div className="flex justify-center mb-5">
                    <div className={`p-4 rounded-full ring-8 ${notification.type === 'error' ? 'bg-rose-50 text-rose-600 ring-rose-50' : 'bg-emerald-50 text-emerald-600 ring-emerald-50'}`}>
                        {notification.type === 'error' ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
                    </div>
                </div>
                <h3 className="font-black text-xl text-slate-800 leading-tight mb-2 text-center">{notification.title}</h3>
                <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed text-center">{notification.message}</p>
                <button onClick={() => setNotification({ ...notification, isOpen: false })} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/20">
                    Zrozumiałem
                </button>
            </AnimatedModal>

            {/* OKIENKO POTWIERDZENIA */}
            <AnimatedModal isOpen={confirmDialog.isOpen} onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} zIndex="z-[100]">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="p-4 bg-amber-50 text-amber-500 rounded-full ring-8 ring-amber-50 mb-5">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h3 className="font-black text-xl text-slate-800 leading-tight">{confirmDialog.title}</h3>
                    <p className="text-sm text-slate-500 mt-3 font-medium leading-relaxed">{confirmDialog.message}</p>
                </div>
                <div className="flex space-x-3">
                    <button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95">
                        Anuluj
                    </button>
                    <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({ ...confirmDialog, isOpen: false }); }} className={`flex-1 py-4 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 ${confirmDialog.confirmColor}`}>
                        {confirmDialog.confirmText}
                    </button>
                </div>
            </AnimatedModal>

            {/* OKNO EDYCJI UŻYTKOWNIKA */}
            <AnimatedModal isOpen={!!editingUser} onClose={() => setEditingUser(null)} maxWidth="max-w-md">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                    <h3 className="font-black text-xl text-slate-800">Edytuj {editingUser?.role === 'Student' ? 'Studenta' : 'Promotora'}</h3>
                    <button onClick={() => setEditingUser(null)} className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-rose-100 hover:text-rose-600 transition-all active:scale-90"><X className="w-5 h-5" /></button>
                </div>
                {editingUser && (
                    <form onSubmit={handleEditUserSubmit} className="space-y-4">
                        {editingUser.role === 'Supervisor' && (<input placeholder="Tytuł (np. Dr)" value={editingUser.title || ''} onChange={e => setEditingUser({ ...editingUser, title: e.target.value })} className="w-full p-3.5 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all" />)}
                        <div className="flex space-x-3">
                            <input placeholder="Imię" required value={editingUser.firstName} onChange={e => setEditingUser({ ...editingUser, firstName: e.target.value })} className="w-1/2 p-3.5 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all" />
                            <input placeholder="Nazwisko" required value={editingUser.lastName} onChange={e => setEditingUser({ ...editingUser, lastName: e.target.value })} className="w-1/2 p-3.5 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all" />
                        </div>
                        <input placeholder="E-mail" required type="email" value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} className="w-full p-3.5 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all" />
                        {editingUser.role === 'Student' && (
                            <div className="flex space-x-3">
                                <input placeholder="Nr Albumu" required value={editingUser.albumNumber || ''} onChange={e => setEditingUser({ ...editingUser, albumNumber: e.target.value })} className="w-1/2 p-3.5 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all" />
                                <input placeholder="GPA" type="number" step="0.01" min="2.0" max="5.0" value={editingUser.gpa || ''} onChange={e => setEditingUser({ ...editingUser, gpa: e.target.value })} className="w-1/2 p-3.5 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all" />
                            </div>
                        )}
                        {editingUser.role === 'Supervisor' && (
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-2 block ml-1">Limit Miejsc</label>
                                <input type="number" min="0" required value={editingUser.maxStudents || 0} onChange={e => setEditingUser({ ...editingUser, maxStudents: e.target.value })} className="w-full p-3.5 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all" />
                            </div>
                        )}
                        <div className="pt-2">
                            <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">Zapisz Zmiany</button>
                        </div>
                    </form>
                )}
            </AnimatedModal>

            {/* OKNO EDYCJI ZESPOŁU */}
            <AnimatedModal isOpen={!!editingTeam} onClose={() => setEditingTeam(null)}>
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                    <h3 className="font-black text-xl text-slate-800">Zmiana nazwy</h3>
                    <button onClick={() => setEditingTeam(null)} className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-rose-100 hover:text-rose-600 transition-all active:scale-90"><X className="w-5 h-5" /></button>
                </div>
                {editingTeam && (
                    <form onSubmit={handleEditTeamSubmit} className="space-y-5">
                        <input placeholder="Nowa nazwa zespołu" required value={editingTeam.name} onChange={e => setEditingTeam({ ...editingTeam, name: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none text-sm font-medium focus:ring-2 focus:ring-purple-500 transition-all" />
                        <button type="submit" className="w-full py-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all active:scale-95">Zatwierdź</button>
                    </form>
                )}
            </AnimatedModal>

            {/* OKNO EDYCJI TEMATU */}
            <AnimatedModal isOpen={!!editingTopic} onClose={() => setEditingTopic(null)} maxWidth="max-w-lg">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                    <h3 className="font-black text-xl text-slate-800">Moderacja Tematu</h3>
                    <button onClick={() => setEditingTopic(null)} className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-rose-100 hover:text-rose-600 transition-all active:scale-90"><X className="w-5 h-5" /></button>
                </div>
                {editingTopic && (
                    <form onSubmit={handleEditTopicSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">Tytuł tematu</label>
                            <input required value={editingTopic.title} onChange={e => setEditingTopic({ ...editingTopic, title: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">Opis / Wymagania</label>
                            <textarea required rows="5" value={editingTopic.description} onChange={e => setEditingTopic({ ...editingTopic, description: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200 outline-none text-sm resize-none font-medium focus:ring-2 focus:ring-indigo-500 transition-all" />
                        </div>
                        <div className="pt-2">
                            <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">Zapisz korektę</button>
                        </div>
                    </form>
                )}
            </AnimatedModal>

            {/* NAWIGACJA ZAKŁADEK */}
            <div className="flex justify-center mb-8 sticky top-4 z-40">
                <div className="flex space-x-2 bg-white/60 backdrop-blur-2xl p-2 rounded-[2rem] ring-1 ring-slate-900/10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-x-auto w-full max-w-fit">
                    {[
                        { id: 'overview', icon: LayoutDashboard, label: 'Pulpit i System' },
                        { id: 'users', icon: Users, label: 'Zarządzanie Użytkownikami' },
                        { id: 'teams', icon: Briefcase, label: 'Zespoły Projektowe' },
                        { id: 'topics', icon: BookOpen, label: 'Proponowane Tematy' },
                        { id: 'assignments', icon: ListChecks, label: 'Wyniki Przydziałów' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative flex items-center space-x-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] whitespace-nowrap
                            ${activeTab === tab.id ? 'text-indigo-700 bg-white shadow-md scale-100' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40 scale-95 hover:scale-100'}`}
                        >
                            <tab.icon className={`w-4 h-4 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${activeTab === tab.id ? 'scale-110 text-indigo-600' : 'scale-100'}`} />
                            <span className="relative z-10">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ZAKŁADKA PULPIT I SYSTEM */}
            {activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Wszyscy Studenci', val: studentsList.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { label: 'Promotorzy', val: supervisorsList.length, icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                            { label: 'Przydzieleni', val: assignedStudentsCount, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: 'Zespoły', val: teamsList.length, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
                        ].map((s, i) => (
                            <div key={i} className="bg-white p-7 rounded-[2rem] ring-1 ring-slate-900/5 shadow-sm hover:shadow-lg transition-all duration-300 flex items-center justify-between group">
                                <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p><h4 className="text-4xl font-black text-slate-800 tracking-tight">{s.val}</h4></div>
                                <div className={`p-4 rounded-2xl ${s.bg} ${s.color} group-hover:scale-110 transition-transform duration-300`}><s.icon className="w-7 h-7" /></div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-white p-7 rounded-[2rem] ring-1 ring-slate-900/5 shadow-sm hover:shadow-md transition-all duration-300">
                            <h4 className="text-sm font-bold text-slate-800 mb-5">Postęp przydziałów studentów</h4>
                            <div className="flex justify-between text-xs font-bold text-slate-500 mb-3"><span>Przydzielono: {assignedStudentsCount}</span><span>Brak przydziału: {studentsList.length - assignedStudentsCount}</span></div>
                            <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden"><div className="bg-blue-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${studentAssignedRate}%` }}></div></div>
                            <p className="text-right text-xs font-bold text-blue-600 mt-3">{studentAssignedRate}% wykonania</p>
                        </div>
                        <div className="bg-white p-7 rounded-[2rem] ring-1 ring-slate-900/5 shadow-sm hover:shadow-md transition-all duration-300">
                            <h4 className="text-sm font-bold text-slate-800 mb-5">Zajęte miejsca u promotorów</h4>
                            <div className="flex justify-between text-xs font-bold text-slate-500 mb-3"><span>Zajęte w sumie: {assignedStudentsCount}</span><span>Łączny limit uczelni: {totalCapacity}</span></div>
                            <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden"><div className="bg-indigo-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${fillRate}%` }}></div></div>
                            <p className="text-right text-xs font-bold text-indigo-600 mt-3">Obłożenie wydziału: {fillRate}%</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Stan po zakończeniu algorytmu zamiast formularza harmonogramu */}
                        <div className={`p-8 rounded-[2rem] ring-1 shadow-xl relative overflow-hidden transition-all duration-500 flex flex-col ${isFinished ? 'bg-emerald-50 ring-emerald-200' : 'bg-white ring-slate-900/5'}`}>
                            {isFinished ? (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-6 my-auto animate-in fade-in zoom-in-95 duration-500">
                                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center shadow-inner">
                                        <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-slate-800 tracking-tight">Algorytm Zakończył Pracę</h3>
                                        <p className="text-slate-600 mt-2 text-sm font-medium">Przydział promotorów został wykonany i zapisany w systemie.</p>
                                    </div>
                                    <div className="bg-white/60 px-8 py-5 rounded-2xl ring-1 ring-emerald-200 w-full max-w-sm backdrop-blur-sm">
                                        <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1.5">Zanotowana data wykonania</span>
                                        <span className="text-lg font-black text-emerald-900 capitalize">{formatFullDate(executionDate)}</span>
                                    </div>
                                    <div className="pt-4 w-full max-w-sm mt-2">
                                        <button onClick={handleResetSystem} className="w-full px-6 py-4 bg-white text-rose-600 font-bold rounded-2xl ring-1 ring-rose-200 hover:bg-rose-600 hover:text-white hover:ring-rose-600 flex justify-center items-center shadow-sm transition-all duration-300 active:scale-95 group">
                                            <RefreshCw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" /> Zresetuj system i ponów wybory
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative h-full flex flex-col">
                                    <h3 className="text-xl font-bold text-slate-900 mb-1 relative">Harmonogram Wyborów</h3>
                                    <p className="text-slate-500 text-sm mb-6 relative">Zarządzaj czasem trwania procesu wyboru promotorów.</p>
                                    {!isEditingSchedule && schedule.exists ? (
                                        <div className="flex-grow flex flex-col justify-center space-y-6 relative">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="bg-white p-5 rounded-2xl ring-1 ring-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"><div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Początek Wyborów</p><h4 className="text-sm font-bold text-slate-800 capitalize">{formatPrettyDate(schedule.utcStart)}</h4></div><div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 shrink-0 ml-2"><Calendar className="w-5 h-5" /></div></div>
                                                <div className="bg-white p-5 rounded-2xl ring-1 ring-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"><div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Zakończenie (Algorytm)</p><h4 className="text-sm font-bold text-slate-800 capitalize">{formatPrettyDate(schedule.utcEnd)}</h4></div><div className="p-3 rounded-xl bg-purple-50 text-purple-600 shrink-0 ml-2"><Clock className="w-5 h-5" /></div></div>
                                            </div>
                                            <div className="flex justify-between items-center pt-4">
                                                <span className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center ${schedule.isActive ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-200' : 'bg-slate-50 text-slate-500 ring-1 ring-slate-200'}`}>{schedule.isActive ? <><Clock className="w-4 h-4 mr-2 animate-pulse" /> Zapisy Aktywne</> : 'Proces wstrzymany'}</span>
                                                <button onClick={() => setIsEditingSchedule(true)} className="flex items-center space-x-2 px-5 py-2.5 bg-white text-slate-600 font-bold rounded-xl ring-1 ring-slate-200 hover:bg-slate-50 hover:text-indigo-600 hover:ring-indigo-200 transition-all shadow-sm active:scale-95"><Edit className="w-4 h-4" /> <span>Edytuj Ramy</span></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white p-6 rounded-[1.5rem] ring-1 ring-slate-200 shadow-sm relative flex-grow flex flex-col justify-between animate-in fade-in duration-300">
                                            <div className="space-y-5">
                                                <div><label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 ml-1">Początek Wyborów</label><input type="datetime-local" value={schedule.startDateInput} onChange={e => setSchedule({ ...schedule, startDateInput: e.target.value })} className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 transition-all outline-none" /></div>
                                                <div><label className="block text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2 ml-1"><Clock className="w-3.5 h-3.5 inline mr-1" /> Koniec i Uruchomienie Algorytmu</label><input type="datetime-local" value={schedule.endDateInput} onChange={e => setSchedule({ ...schedule, endDateInput: e.target.value })} className="w-full bg-indigo-50/40 border-0 ring-1 ring-indigo-200 rounded-2xl p-4 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 transition-all outline-none" /></div>
                                                <div className="pt-2"><label className="flex items-start space-x-4 cursor-pointer p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-200 hover:bg-slate-100 transition-colors"><input type="checkbox" checked={schedule.isActive} onChange={e => setSchedule({ ...schedule, isActive: e.target.checked })} className="mt-1 w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all" /><div><span className="text-sm font-bold text-slate-800 block">Aktywuj system dla studentów</span><span className="text-xs text-slate-500 block mt-1 leading-relaxed">Gdy odznaczysz, studenci nie będą mogli dokonywać zmian (wstrzymanie wyborów).</span></div></label></div>
                                            </div>
                                            <div className="flex space-x-3 mt-6 pt-5 border-t border-slate-100">
                                                {schedule.exists && (<button onClick={() => setIsEditingSchedule(false)} className="flex-1 py-3.5 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all active:scale-95">Anuluj</button>)}
                                                <button onClick={handleSaveSchedule} className="flex-1 py-3.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center active:scale-95"><Save className="w-5 h-5 mr-2" /> Zapisz</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* RAPORTY */}
                        <div className="bg-white p-8 rounded-[2rem] ring-1 ring-slate-900/5 shadow-sm h-full flex flex-col justify-center">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center mb-6"><FileText className="w-6 h-6 mr-3 text-emerald-500" /> Oficjalne Raporty z Systemu</h2>
                            <p className="text-slate-500 text-sm mb-8 font-medium">Pobierz gotowe zestawienia przypisań wygenerowane przez algorytm.</p>
                            <div className="space-y-4">
                                <button onClick={() => downloadReport('xlsx')} className="w-full bg-emerald-50 text-emerald-700 p-5 rounded-2xl ring-1 ring-emerald-200 shadow-sm flex items-center justify-between hover:bg-emerald-600 hover:text-white hover:ring-emerald-600 transition-all group active:scale-95 duration-300">
                                    <div className="flex items-center"><FileSpreadsheet className="w-7 h-7 mr-4 text-emerald-500 group-hover:text-emerald-200 group-hover:scale-110 transition-all duration-300" /> <div className="text-left"><h4 className="font-bold">Baza Excel (XLSX)</h4><p className="text-xs opacity-80 mt-1">Pełne dane do analizy statystycznej</p></div></div>
                                    <CheckCircle2 className="w-6 h-6 opacity-30 group-hover:opacity-100 transition-opacity" />
                                </button>
                                <button onClick={() => downloadReport('pdf')} className="w-full bg-rose-50 text-rose-700 p-5 rounded-2xl ring-1 ring-rose-200 shadow-sm flex items-center justify-between hover:bg-rose-600 hover:text-white hover:ring-rose-600 transition-all group active:scale-95 duration-300">
                                    <div className="flex items-center"><FileText className="w-7 h-7 mr-4 text-rose-500 group-hover:text-rose-200 group-hover:scale-110 transition-all duration-300" /> <div className="text-left"><h4 className="font-bold">Dokument do druku (PDF)</h4><p className="text-xs opacity-80 mt-1">Sformatowany raport na uczelnię</p></div></div>
                                    <CheckCircle2 className="w-6 h-6 opacity-30 group-hover:opacity-100 transition-opacity" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ZAKŁADKA UŻYTKOWNICY (Z PODZAKŁADKAMI) */}
            {activeTab === 'users' && (
                <div className="bg-white p-8 rounded-[2rem] ring-1 ring-slate-900/5 shadow-sm animate-in fade-in duration-500 min-h-[700px] flex flex-col">
                    <div className="flex space-x-8 border-b border-slate-100 mb-8 px-2">
                        <button onClick={() => setUserSubTab('students')} className={`pb-4 text-sm font-bold transition-all duration-300 border-b-2 ${userSubTab === 'students' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}><Users className="w-4 h-4 inline mr-2" />Baza Studentów ({studentsList.length})</button>
                        <button onClick={() => setUserSubTab('supervisors')} className={`pb-4 text-sm font-bold transition-all duration-300 border-b-2 ${userSubTab === 'supervisors' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}><Briefcase className="w-4 h-4 inline mr-2" />Promotorzy ({supervisorsList.length})</button>
                    </div>

                    {userSubTab === 'students' && (
                        <div className="flex flex-col flex-grow animate-in slide-in-from-left-4 duration-500 ease-out">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <form onSubmit={handleAddStudent} className="bg-blue-50/50 p-6 rounded-3xl ring-1 ring-blue-100/50 hover:shadow-md transition-shadow duration-300">
                                    <h4 className="text-sm font-bold text-blue-800 mb-5 flex items-center"><UserPlus className="w-5 h-5 mr-2" /> Ręczne dodanie studenta</h4>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <input placeholder="Imię" required value={newStudent.firstName} onChange={e => setNewStudent({ ...newStudent, firstName: e.target.value })} className="p-3.5 text-sm rounded-2xl ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                                        <input placeholder="Nazwisko" required value={newStudent.lastName} onChange={e => setNewStudent({ ...newStudent, lastName: e.target.value })} className="p-3.5 text-sm rounded-2xl ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                                        <input placeholder="E-mail" type="email" required value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} className="p-3.5 text-sm rounded-2xl ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                                        <input placeholder="Nr Albumu" required value={newStudent.albumNumber} onChange={e => setNewStudent({ ...newStudent, albumNumber: e.target.value })} className="p-3.5 text-sm rounded-2xl ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                                        <input placeholder="Hasło" type="password" required value={newStudent.password} onChange={e => setNewStudent({ ...newStudent, password: e.target.value })} className="col-span-2 p-3.5 text-sm rounded-2xl ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800" />
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <input placeholder="GPA (opcj.)" type="number" step="0.01" min="2.0" max="5.0" value={newStudent.gpa} onChange={e => setNewStudent({ ...newStudent, gpa: e.target.value })} className="w-1/3 p-3.5 text-sm rounded-2xl ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                                        <button type="submit" className="flex-grow bg-blue-600 text-white font-bold rounded-2xl text-sm py-3.5 hover:bg-blue-700 shadow-md shadow-blue-200 transition-all active:scale-95">Utwórz Konto</button>
                                    </div>
                                </form>
                                <div className="bg-sky-50/50 p-6 rounded-3xl ring-1 ring-sky-100/50 flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow duration-300">
                                    <h4 className="text-sm font-bold text-sky-800 mb-3">Zasilenie bazy (Import CSV)</h4>
                                    <p className="text-xs text-sky-600/80 mb-6 px-6 leading-relaxed">System zaciągnie konta automatycznie. Wymagane nagłówki pliku: <br /><strong className="text-sky-700">AlbumNumber, FirstName, LastName, Email, GPA, Password</strong>.</p>
                                    <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleCsvUpload} />
                                    <button onClick={() => fileInputRef.current.click()} className="w-full max-w-[220px] flex justify-center items-center space-x-2 py-4 bg-white text-sky-700 font-bold rounded-2xl ring-1 ring-sky-200 shadow-sm hover:bg-sky-600 hover:text-white transition-all active:scale-95 group">
                                        <Upload className="w-5 h-5 group-hover:-translate-y-1 transition-transform" /> <span>Wgraj plik CSV</span>
                                    </button>
                                </div>
                            </div>

                            <div className="relative mb-5 shrink-0">
                                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                <input placeholder="Szukaj po danych studenta..." value={searchStu} onChange={e => { setSearchStu(e.target.value); setPageStu(1); }} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
                            </div>
                            <div className="overflow-y-auto space-y-3 pr-2 flex-grow">
                                {paginatedStudents.map(stu => (
                                    <div key={stu.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md hover:ring-1 hover:ring-slate-200 transition-all duration-300 group">
                                        <div><h4 className="text-sm font-bold text-slate-800">{stu.firstName} {stu.lastName} <span className="text-slate-400 font-normal ml-1">({stu.albumNumber})</span></h4><p className="text-xs text-slate-500 mt-0.5">{stu.email}</p></div>
                                        <div className="flex items-center space-x-6">
                                            <div className="text-right"><span className="text-xs font-bold text-slate-400 block mb-0.5">Średnia (GPA)</span><span className={`text-sm font-black ${stu.isGPAConfirmed ? 'text-emerald-600' : 'text-slate-700'}`}>{stu.gpa || '-'}</span></div>
                                            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <button onClick={() => setEditingUser(stu)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors active:scale-90"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteUser(stu.id)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors active:scale-90"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Pagination currentPage={pageStu} totalItems={studentsList.filter(s => `${s.firstName} ${s.lastName} ${s.albumNumber} ${s.email}`.toLowerCase().includes(searchStu.toLowerCase())).length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setPageStu} />
                        </div>
                    )}

                    {userSubTab === 'supervisors' && (
                        <div className="flex flex-col flex-grow animate-in slide-in-from-right-4 duration-500 ease-out">
                            <form onSubmit={handleAddSupervisor} className="bg-indigo-50/50 p-6 rounded-3xl mb-8 ring-1 ring-indigo-100/50 shrink-0 hover:shadow-md transition-shadow duration-300">
                                <h4 className="text-sm font-bold text-indigo-800 mb-5 flex items-center"><UserPlus className="w-5 h-5 mr-2" /> Rejestracja wykładowcy</h4>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                    <input required placeholder="Tytuł" value={newSupervisor.title} onChange={e => setNewSupervisor({ ...newSupervisor, title: e.target.value })} className="p-3.5 text-sm rounded-2xl ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                                    <input required placeholder="Imię" value={newSupervisor.firstName} onChange={e => setNewSupervisor({ ...newSupervisor, firstName: e.target.value })} className="p-3.5 text-sm rounded-2xl ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                                    <input required placeholder="Nazwisko" value={newSupervisor.lastName} onChange={e => setNewSupervisor({ ...newSupervisor, lastName: e.target.value })} className="p-3.5 text-sm rounded-2xl ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                                    <input required type="email" placeholder="E-mail" value={newSupervisor.email} onChange={e => setNewSupervisor({ ...newSupervisor, email: e.target.value })} className="p-3.5 text-sm rounded-2xl ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                                </div>
                                <div className="flex items-center space-x-4">
                                    <input required type="password" placeholder="Hasło logowania" value={newSupervisor.password} onChange={e => setNewSupervisor({ ...newSupervisor, password: e.target.value })} className="flex-grow p-3.5 text-sm rounded-2xl ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800" />
                                    <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-2xl ring-1 ring-slate-200">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Limit:</span>
                                        <input type="number" min="1" max="50" value={newSupervisor.maxStudents} onChange={e => setNewSupervisor({ ...newSupervisor, maxStudents: e.target.value })} className="w-16 p-1 text-center text-lg font-black text-indigo-700 outline-none" />
                                    </div>
                                    <button type="submit" className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all active:scale-95">Utwórz Promotora</button>
                                </div>
                            </form>
                            <div className="relative mb-5 shrink-0">
                                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                <input placeholder="Szukaj promotora w systemie..." value={searchSup} onChange={e => { setSearchSup(e.target.value); setPageSup(1); }} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all outline-none" />
                            </div>
                            <div className="overflow-y-auto space-y-3 pr-2 flex-grow">
                                {paginatedSupervisors.map(sup => (
                                    <div key={sup.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md hover:ring-1 hover:ring-slate-200 transition-all duration-300 group">
                                        <div><h4 className="text-sm font-bold text-slate-800">{sup.title} {sup.firstName} {sup.lastName}</h4><p className="text-xs text-slate-500 mt-0.5">{sup.email}</p></div>
                                        <div className="flex items-center space-x-6">
                                            <div className="flex items-center space-x-3">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Limit Miejsc:</span>
                                                <span className="w-12 text-center bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 rounded-xl p-2 text-sm font-black">{sup.maxStudents || 0}</span>
                                            </div>
                                            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <button onClick={() => setEditingUser(sup)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors active:scale-90"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteUser(sup.id)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors active:scale-90"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Pagination currentPage={pageSup} totalItems={supervisorsList.filter(s => `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(searchSup.toLowerCase())).length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setPageSup} />
                        </div>
                    )}
                </div>
            )}

            {/* ZAKŁADKA ZESPOŁY */}
            {activeTab === 'teams' && (
                <div className="bg-white p-8 rounded-[2rem] ring-1 ring-slate-900/5 shadow-sm animate-in fade-in duration-500 min-h-[700px] flex flex-col">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-100 pb-6 gap-4">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center m-0"><Briefcase className="w-6 h-6 mr-3 text-purple-500" /> Zarządzanie Zespołami Projektowymi</h2>
                        <div className="relative w-full md:w-80 shrink-0">
                            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                            <input placeholder="Filtruj listę zespołów..." value={searchTeam} onChange={e => { setSearchTeam(e.target.value); setPageTeam(1); }} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-purple-500 transition-all outline-none" />
                        </div>
                    </div>
                    <form onSubmit={handleCreateTeam} className="flex space-x-4 mb-8">
                        <input required placeholder="Podaj unikalną nazwę dla nowej grupy..." value={newTeamName} onChange={e => setNewTeamName(e.target.value)} className="flex-grow p-4 text-sm font-medium rounded-2xl ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-inner" />
                        <button type="submit" className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-sm font-bold hover:bg-slate-800 flex items-center shrink-0 shadow-lg transition-all active:scale-95"><PlusCircle className="w-5 h-5 mr-2" /> Stwórz Grupe</button>
                    </form>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 flex-grow items-stretch">
                        {paginatedTeams.map(team => (
                            <div key={team.id} className="p-6 rounded-3xl ring-1 ring-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xl transition-all duration-300 shadow-sm group flex flex-col h-full">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center space-x-3">
                                        <h3 className="font-black text-slate-800 text-xl tracking-tight">{team.name}</h3>
                                        <span className="text-[10px] font-bold px-3 py-1 bg-white text-slate-500 rounded-full ring-1 ring-slate-200 uppercase tracking-widest">{team.members.length} Studentów</span>
                                    </div>
                                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <button onClick={() => setEditingTeam(team)} className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors active:scale-90"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteTeam(team.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors active:scale-90"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                <div className="space-y-3 mb-6 flex-grow">
                                    {team.members.map(m => (
                                        <div key={m.id} className="flex justify-between items-center p-3.5 bg-white rounded-xl shadow-sm ring-1 ring-slate-100 text-sm group/member hover:ring-purple-200 transition-colors">
                                            <div className="flex items-center">
                                                <button onClick={() => handleRemoveStudentFromTeam(team.id, m.id)} className="mr-3 p-1.5 rounded-lg bg-rose-50 text-rose-400 hover:text-white hover:bg-rose-500 opacity-0 group-hover/member:opacity-100 transition-all active:scale-90"><UserMinus className="w-4 h-4" /></button>
                                                <span className="font-bold text-slate-700">{m.fullName} <span className="text-slate-400 font-medium ml-1">({m.albumNumber})</span></span>
                                            </div>
                                            {team.leaderId === m.id ? <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-3 py-1 rounded-lg uppercase tracking-wider">Lider (GPA {m.gpa})</span> : <span className="text-xs font-bold text-slate-400">GPA {m.gpa}</span>}
                                        </div>
                                    ))}
                                    {team.members.length === 0 && <div className="h-full flex items-center justify-center p-6 text-sm text-slate-400 italic border-2 border-dashed border-slate-200 rounded-xl bg-white/50">Zespół nie posiada jeszcze członków.</div>}
                                </div>
                                <div className="flex space-x-3 pt-4 border-t border-slate-100">
                                    <select value={selectedStudentForTeam[team.id] || ''} onChange={e => setSelectedStudentForTeam({ ...selectedStudentForTeam, [team.id]: e.target.value })} className="flex-grow text-sm p-3 font-medium rounded-xl border-0 ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-purple-400 transition-all cursor-pointer">
                                        <option value="">-- Dobierz wolnego studenta z bazy --</option>
                                        {studentsList.filter(s => !s.teamId).map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.albumNumber})</option>)}
                                    </select>
                                    <button onClick={() => handleAddStudentToTeam(team.id)} className="px-6 py-3 bg-purple-100 text-purple-700 font-black text-sm rounded-xl hover:bg-purple-600 hover:text-white transition-all active:scale-95 shadow-sm">Dołącz</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Pagination currentPage={pageTeam} totalItems={teamsList.filter(t => (t.name || '').toLowerCase().includes(searchTeam.toLowerCase())).length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setPageTeam} />
                </div>
            )}

            {/* ZAKŁADKA BAZA TEMATÓW (ZARZĄDZANIE) */}
            {activeTab === 'topics' && (
                <div className="bg-white p-8 rounded-[2rem] ring-1 ring-slate-900/5 shadow-sm animate-in fade-in duration-500 min-h-[700px] flex flex-col">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-100 pb-6 gap-4">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center m-0"><BookOpen className="w-6 h-6 mr-3 text-indigo-500" /> Moderacja Tematów Wydziałowych</h2>
                        <div className="relative w-full md:w-80 shrink-0">
                            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                            <input placeholder="Szukaj tematu w bazie..." value={searchTopic} onChange={e => { setSearchTopic(e.target.value); setPageTopic(1); }} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all outline-none" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 flex-grow items-stretch">
                        {topicsList.filter(t => `${t.title} ${t.supervisorName} ${t.description}`.toLowerCase().includes(searchTopic.toLowerCase())).slice((pageTopic - 1) * ITEMS_PER_PAGE, pageTopic * ITEMS_PER_PAGE).map(topic => (
                            <div key={topic.id} className="p-7 rounded-3xl ring-1 ring-slate-200 bg-white hover:bg-slate-50 hover:shadow-xl transition-all duration-300 shadow-sm group flex flex-col h-full">
                                <div className="flex justify-between items-start mb-5">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2.5 bg-indigo-50 rounded-xl"><Briefcase className="w-4 h-4 text-indigo-600" /></div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{topic.supervisorName}</span>
                                    </div>
                                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <button onClick={() => setEditingTopic(topic)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-xl transition-colors active:scale-90"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteTopic(topic.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-xl transition-colors active:scale-90"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                <h3 className="font-black text-slate-800 text-xl leading-snug mb-3 tracking-tight">{topic.title}</h3>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium flex-grow">{topic.description}</p>
                            </div>
                        ))}
                        {topicsList.length === 0 && <div className="col-span-full flex justify-center items-center p-12 text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">Baza tematów jest pusta.</div>}
                    </div>
                    <Pagination currentPage={pageTopic} totalItems={topicsList.filter(t => `${t.title} ${t.supervisorName} ${t.description}`.toLowerCase().includes(searchTopic.toLowerCase())).length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setPageTopic} />
                </div>
            )}

            {/* ZAKŁADKA PRZYDZIAŁY (WYNIKI) */}
            {activeTab === 'assignments' && (
                <div className="bg-white p-8 rounded-[2rem] ring-1 ring-slate-900/5 shadow-sm animate-in fade-in duration-500 min-h-[700px] flex flex-col">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-100 pb-6 gap-4">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center m-0"><ListChecks className="w-6 h-6 mr-3 text-emerald-500" /> Tabela Ostatecznych Przydziałów</h2>
                        <div className="relative w-full md:w-80 shrink-0">
                            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                            <input placeholder="Szukaj po nazwisku studenta lub promotora..." value={searchAssign} onChange={e => { setSearchAssign(e.target.value); setPageAssign(1); }} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 transition-all outline-none" />
                        </div>
                    </div>
                    {assignmentsList.length === 0 ? (
                        <div className="text-center flex-grow flex flex-col justify-center items-center p-12 text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">Algorytm nie dokonał jeszcze przypisań. Wymagane jest zakończenie czasu trwania harmonogramu.</div>
                    ) : (
                        <>
                            <div className="overflow-x-auto rounded-3xl ring-1 ring-slate-200 flex-grow shadow-sm">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200"><tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="px-6 py-5">Student / Zespół</th><th className="px-6 py-5">Nr Albumu</th><th className="px-6 py-5">Przypisany Promotor</th><th className="px-6 py-5">Systemowa Data Przydziału</th></tr></thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedAssignments.map(a => (
                                            <tr key={a.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-5 font-bold text-slate-800 flex items-center space-x-3"><span>{a.studentName}</span>{a.isTeamAssignment && <span className="bg-purple-100 text-purple-700 text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider">W Zespole</span>}</td>
                                                <td className="px-6 py-5 text-slate-500 font-mono text-xs">{a.albumNumber}</td>
                                                <td className="px-6 py-5 font-black text-indigo-700">{a.supervisorName}</td>
                                                <td className="px-6 py-5 text-slate-400 text-xs font-medium">{formatPrettyDate(a.assignedAt)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination currentPage={pageAssign} totalItems={assignmentsList.filter(a => `${a.studentName} ${a.supervisorName} ${a.albumNumber || ''}`.toLowerCase().includes(searchAssign.toLowerCase())).length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setPageAssign} />
                        </>
                    )}
                </div>
            )}
        </div>
    );
}