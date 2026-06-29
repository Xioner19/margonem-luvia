import { useState, useEffect } from 'react';
import type { RankedPlayer } from './types';
import { Trophy, Clock, Users, RefreshCw } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { pl } from 'date-fns/locale';

function App() {
  const world = 'luvia';
  const [ranking, setRanking] = useState<Record<string, RankedPlayer>>({});
  const [serverStartTime, setServerStartTime] = useState<number | null>(null);
  const [uptime, setUptime] = useState<string>('0s');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onlinePlayersCount, setOnlinePlayersCount] = useState<number>(0);

  // Global state handled by Vercel Serverless Backend

  // Fetch data periodically
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/sync');
        if (!res.ok) throw new Error("Błąd backendu");
        const data = await res.json();
        
        if (mounted && data) {
            setRanking(data.ranking || {});
            setServerStartTime(data.serverStartTime);
            setOnlinePlayersCount(data.onlinePlayersCount || 0);
        }
      } catch (e) {
        if (mounted) setError("Błąd podczas pobierania.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000); // 30 seconds

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [world, serverStartTime]);

  // Uptime ticker
  useEffect(() => {
    if (!serverStartTime) return;
    
    const tick = () => {
        const distance = formatDistanceToNowStrict(serverStartTime, { locale: pl, addSuffix: false });
        setUptime(distance);
    };
    
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [serverStartTime]);



  const getProfColor = (prof: string) => {
      const colors: Record<string, string> = {
          'w': 'text-red-400 bg-red-400/10 border-red-400/20',
          'm': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
          'h': 'text-green-400 bg-green-400/10 border-green-400/20',
          't': 'text-teal-400 bg-teal-400/10 border-teal-400/20',
          'p': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
          'b': 'text-purple-400 bg-purple-400/10 border-purple-400/20'
      };
      return colors[prof] || 'text-gray-400 bg-gray-400/10 border-gray-400/20';
  };
  
  const getProfName = (prof: string) => {
      const names: Record<string, string> = {
          'w': 'Wojownik', 'm': 'Mag', 'h': 'Łowca', 't': 'Tropiciel', 'p': 'Paladyn', 'b': 'Tancerz Ostrzy'
      };
      return names[prof] || 'Nieznana';
  }

  const sortedRanking = Object.values(ranking).sort((a, b) => b.maxLevel - a.maxLevel);

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-purple-500/30">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-5xl">
        
        {/* Header */}
        <header className="mb-12 text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-2xl mb-4 border border-white/10 shadow-xl shadow-purple-500/10">
              <Trophy className="w-10 h-10 text-purple-400" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
            Margonem <span className="gradient-text">Exp Race</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Śledź wyścig o najwyższy poziom na nowym świecie. Ranking aktualizuje się na żywo na podstawie aktywności graczy.
          </p>
        </header>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="glass-panel p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <Clock className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Czas od startu</p>
                        <p className="text-xl font-bold text-white leading-tight">
                            {serverStartTime ? uptime : 'Oczekiwanie...'}
                        </p>
                        {serverStartTime && (
                            <p className="text-[10px] text-gray-400 mt-0.5">
                                {new Date(serverStartTime).toLocaleString('pl-PL')}
                            </p>
                        )}
                    </div>
                </div>
                {serverStartTime && (
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </div>
                )}
            </div>

            <div className="glass-panel p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                        <Users className="w-5 h-5 text-pink-400" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Gracze online</p>
                        <p className="text-xl font-bold text-white">{onlinePlayersCount}</p>
                    </div>
                </div>
                {loading && <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />}
            </div>
        </div>

        {/* Ranking Table */}
        <div className="glass-panel overflow-hidden border-t-4 border-t-purple-500">
            {error && (
                <div className="bg-red-500/10 text-red-400 p-4 text-center border-b border-red-500/20 text-sm font-medium">
                    {error}
                </div>
            )}
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-black/40 text-gray-400 text-xs uppercase tracking-wider border-b border-white/5">
                            <th className="px-6 py-4 font-medium text-center w-16">#</th>
                            <th className="px-6 py-4 font-medium">Gracz</th>
                            <th className="px-6 py-4 font-medium text-center">Profesja</th>
                            <th className="px-6 py-4 font-medium text-center">Max Poziom</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {sortedRanking.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                    Brak graczy do wyświetlenia. Ranking rozpocznie się, gdy ktoś pojawi się na serwerze.
                                </td>
                            </tr>
                        ) : (
                            sortedRanking.map((player, index) => (
                                <tr key={player.c} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                            index === 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]' :
                                            index === 1 ? 'bg-gray-300/20 text-gray-300 border border-gray-300/30' :
                                            index === 2 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30' :
                                            'text-gray-500'
                                        }`}>
                                            {index + 1}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <a 
                                            href={`https://www.margonem.pl/profile/view,${player.a}#char_${player.c},luvia`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-medium text-white text-lg hover:text-purple-400 transition-colors cursor-pointer inline-block"
                                        >
                                            {player.n}
                                        </a>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getProfColor(player.p)}`}>
                                            {getProfName(player.p)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 font-mono text-lg font-bold text-white shadow-inner">
                                            {player.maxLevel}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </div>
  );
}

export default App;
