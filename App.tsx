import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import ControlPanel from './components/ControlPanel';
import Dashboard from './components/Dashboard';
import { User, AccessRecord, ViewState } from './types';
import { LogOut, LayoutDashboard, ListTodo, DownloadCloud, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('LOGIN');
  const [records, setRecords] = useState<AccessRecord[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const savedRecords = localStorage.getItem('uag_records');
    if (savedRecords) {
      try {
        setRecords(JSON.parse(savedRecords));
      } catch (e) {
        console.error("Failed to load records", e);
      }
    }

    // Confirmação ao sair
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (records.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [records.length]);

  useEffect(() => {
    localStorage.setItem('uag_records', JSON.stringify(records));
  }, [records]);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    setView('CONTROL');
  };

  const handleLogout = () => {
    if (records.length > 0) {
      if (!confirm("Existem registros pendentes de exportação. Deseja sair mesmo assim?")) return;
    }
    setUser(null);
    setView('LOGIN');
  };

  const addRecord = (record: AccessRecord) => {
    setRecords((prev) => [...prev, record]);
  };

  const exportAllData = async () => {
    if (records.length === 0) return alert("Nenhum registro para exportar.");
    
    if (!confirm(`Deseja exportar ${records.length} registros e suas fotos agora? Isso limpará o banco local após o download.`)) return;

    setIsExporting(true);

    try {
      // 1. Export CSV
      const headers = ["Data/Hora", "Tipo", "Frota", "Colaborador", "Código", "Destino", "Material", "Observação"];
      const rows = records.map(r => [
        new Date(r.timestamp).toLocaleString(),
        r.type,
        `"${r.fleetNumber}"`,
        `"${r.collaboratorName}"`,
        `"${r.collaboratorCode}"`,
        `"${r.destination}"`,
        r.materialExit ? "SIM" : "NÃO",
        `"${r.observation}"`
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const csvLink = document.createElement("a");
      csvLink.setAttribute("href", encodedUri);
      csvLink.setAttribute("download", `UAG_RELATORIO_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(csvLink);
      csvLink.click();
      document.body.removeChild(csvLink);

      // 2. Export Photos
      for (const record of records) {
        if (record.photo) {
          const fileName = `${new Date(record.timestamp).toISOString().replace(/[:.]/g, '-')}_${record.collaboratorName.replace(/\s/g, '_')}_${record.fleetNumber}.png`;
          const photoLink = document.createElement("a");
          photoLink.href = record.photo;
          photoLink.download = fileName;
          document.body.appendChild(photoLink);
          photoLink.click();
          document.body.removeChild(photoLink);
          // Pequeno delay para evitar bloqueio do navegador no download em massa
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      // 3. Clear records after success
      setRecords([]);
      alert("Exportação concluída com sucesso! CSV e fotos baixados.");
    } catch (err) {
      alert("Erro na exportação. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  if (!user || view === 'LOGIN') {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-uag-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-uag-500 p-1.5 rounded text-white font-bold tracking-wider">UAG</div>
            <span className="font-semibold hidden md:block">Controle de Portaria</span>
          </div>

          <nav className="flex items-center space-x-2">
            <button onClick={() => setView('CONTROL')} className={`p-2 rounded-md ${view === 'CONTROL' ? 'bg-uag-700' : 'text-uag-200 hover:bg-uag-800'}`}>
              <ListTodo className="w-5 h-5" />
            </button>
            <button onClick={() => setView('DASHBOARD')} className={`p-2 rounded-md ${view === 'DASHBOARD' ? 'bg-uag-700' : 'text-uag-200 hover:bg-uag-800'}`}>
              <LayoutDashboard className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-uag-700 mx-2"></div>
            <button 
              onClick={exportAllData} 
              disabled={isExporting}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all ${isExporting ? 'opacity-50' : ''}`}
            >
              <DownloadCloud className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
              {isExporting ? 'EXPORTANDO...' : 'FINALIZAR & EXPORTAR'}
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-uag-300">Operador: {user.name}</p>
            </div>
            <button onClick={handleLogout} className="p-2 bg-uag-800 rounded-full hover:bg-red-600 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {records.length > 0 && view === 'CONTROL' && (
        <div className="bg-amber-50 border-b border-amber-100 p-2 flex items-center justify-center gap-2 text-amber-800 text-xs">
          <AlertTriangle className="w-4 h-4" />
          <span>Você possui <b>{records.length}</b> registros não exportados. Clique em "Finalizar & Exportar" antes de sair.</span>
        </div>
      )}

      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
        {view === 'CONTROL' && (
          <ControlPanel user={user} records={records} onAddRecord={addRecord} />
        )}
        {view === 'DASHBOARD' && (
          <Dashboard records={records} />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        UAG Portaria Inteligente &copy; {new Date().getFullYear()} - Sistema Seguro
      </footer>
    </div>
  );
};

export default App;