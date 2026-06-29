import { useState, useEffect } from 'react';
import type { RankedPlayer } from './types';
import { Trophy, Clock, Users, RefreshCw, Target, Award, Activity } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { pl } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function App() {
  const world = 'luvia';
  const [ranking, setRanking] = useState<Record<string, RankedPlayer>>({});
  const [milestones, setMilestones] = useState<Record<string, any>>({});
  const [serverStartTime, setServerStartTime] = useState<number | null>(null);
  const [uptime, setUptime] = useState<string>('0s');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onlinePlayersCount, setOnlinePlayersCount] = useState<number>(0);
  const [profStats, setProfStats] = useState<Record<string, number>>({});
  const [activity, setActivity] = useState<Array<{time: number, count: number}>>([]);
  
  type TimeRange = 1 | 3 | 7 | 30 | 'all';
  const [timeRange, setTimeRange] = useState<TimeRange>(1);

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
            setMilestones(data.milestones || {});
            setServerStartTime(data.serverStartTime);
            setOnlinePlayersCount(data.onlinePlayersCount || 0);
            setProfStats(data.onlineProfStats || {});
            setActivity(data.activity || []);
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

  const formatDuration = (ms: number) => {
      if (!ms || ms < 0) return '0s';
      const seconds = Math.floor((ms / 1000) % 60);
      const minutes = Math.floor((ms / (1000 * 60)) % 60);
      const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
      const days = Math.floor(ms / (1000 * 60 * 60 * 24));
      
      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);
      return parts.join(' ');
  };

  const getPlayerTimeOnline = (player: RankedPlayer) => {
      let time = player.totalTimeOnline || 0;
      const isOnline = Date.now() - (player.lastSeen || 0) < 120000;
      if (isOnline) {
          time += (Date.now() - (player.lastSeen || Date.now()));
      }
      return time;
  };

  const sortedRanking = Object.values(ranking).sort((a, b) => b.maxLevel - a.maxLevel);
  const milestoneLevels = [50, 67, 100, 150, 200, 250, 300];

  const filteredActivity = activity.filter(a => {
      if (timeRange === 'all') return true;
      const daysInMs = timeRange * 24 * 60 * 60 * 1000;
      return Date.now() - a.time <= daysInMs;
  });

  const chartData = filteredActivity.map(a => ({
      ...a,
      timeFormatted: new Date(a.time).toLocaleString('pl-PL', { 
          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
      })
  }));

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
            Margonem <span className="gradient-text">Luvia</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Śledź wyścig o najwyższy poziom na nowym świecie. Ranking aktualizuje się na żywo na podstawie aktywności graczy.
          </p>
        </header>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
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

            <div className="glass-panel p-4 flex flex-col justify-center">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">Zalogowane profesje</p>
                <div className="flex flex-wrap gap-2">
                    {['w', 'm', 'h', 't', 'p', 'b'].map(prof => (
                        <div key={prof} className={`px-2 py-1 rounded text-xs font-medium border flex items-center gap-1.5 ${getProfColor(prof)}`} title={getProfName(prof)}>
                            <span>{getProfName(prof).substring(0, 3)}.</span>
                            <span className="font-bold bg-black/20 px-1.5 py-0.5 rounded-sm">{profStats[prof] || 0}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Activity Chart */}
        <div className="glass-panel p-4 md:p-6 mb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
                    <Activity className="w-6 h-6 text-pink-400" />
                    Aktywność na serwerze
                </h2>
                <div className="flex gap-2 bg-black/40 p-1.5 rounded-lg border border-white/5 overflow-x-auto w-full md:w-auto">
                    {[
                        { label: '1d', value: 1 },
                        { label: '3d', value: 3 },
                        { label: '7d', value: 7 },
                        { label: '30d', value: 30 },
                        { label: 'Max', value: 'all' }
                    ].map(range => (
                        <button
                            key={range.value}
                            onClick={() => setTimeRange(range.value as TimeRange)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex-1 md:flex-none ${
                                timeRange === range.value 
                                    ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' 
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="h-[300px] w-full">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis 
                                dataKey="timeFormatted" 
                                stroke="#ffffff50" 
                                fontSize={10} 
                                tickLine={false}
                                axisLine={false}
                                minTickGap={30}
                            />
                            <YAxis 
                                stroke="#ffffff50" 
                                fontSize={10} 
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#000000dd', border: '1px solid #ffffff20', borderRadius: '8px' }}
                                itemStyle={{ color: '#ec4899', fontWeight: 'bold' }}
                                labelStyle={{ color: '#ffffff80', marginBottom: '4px' }}
                                formatter={(value: number) => [value, 'Graczy Online']}
                                labelFormatter={(label) => `Godzina: ${label}`}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="count" 
                                stroke="#ec4899" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorCount)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 italic text-sm">
                        Zbyt mało danych do narysowania wykresu. Trwa zbieranie danych...
                    </div>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            
            {/* Ranking Table (Left Side, 2/3 width) */}
            <div className="lg:col-span-2">
                <div className="glass-panel overflow-hidden border-t-4 border-t-purple-500 h-full">
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
                                    <th className="px-6 py-4 font-medium text-center">Czas w grze</th>
                                    <th className="px-6 py-4 font-medium text-center">Aktualny Poziom</th>
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
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full shrink-0 ${Date.now() - (player.lastSeen || 0) < 120000 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-600'}`} title={Date.now() - (player.lastSeen || 0) < 120000 ? 'Online' : 'Offline'}></div>
                                                    <a 
                                                        href={`https://www.margonem.pl/profile/view,${player.a}#char_${player.c},luvia`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-medium text-white text-lg hover:text-purple-400 transition-colors cursor-pointer inline-block"
                                                    >
                                                        {player.n}
                                                    </a>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getProfColor(player.p)}`}>
                                                    {getProfName(player.p)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="text-sm font-mono text-purple-300/80">
                                                    {formatDuration(getPlayerTimeOnline(player))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 font-mono text-lg font-bold text-white shadow-inner">
                                                    {player.l}
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

            {/* Milestones (Right Side, 1/3 width) */}
            <div className="lg:col-span-1">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <Target className="w-6 h-6 text-yellow-400" />
                    Kamienie Milowe
                </h2>
                <div className="flex flex-col gap-4">
                    {milestoneLevels.map(lvl => {
                        const achieved = milestones[lvl];
                        return (
                            <div key={lvl} className={`glass-panel p-4 border-l-4 ${achieved ? 'border-l-yellow-400' : 'border-l-gray-700 opacity-60'} relative overflow-hidden group`}>
                                {achieved && (
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-400/5 rounded-bl-full z-0 transition-transform group-hover:scale-110"></div>
                                )}
                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <span className="text-2xl font-black text-white/90">{lvl} <span className="text-xs font-medium text-gray-500">lvl</span></span>
                                    <Award className={`w-6 h-6 ${achieved ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'text-gray-600'}`} />
                                </div>
                                
                                <div className="relative z-10">
                                    {achieved ? (
                                        <div>
                                            <a 
                                                href={`https://www.margonem.pl/profile/view,${achieved.a}#char_${achieved.c},luvia`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`font-bold text-lg hover:underline ${getProfColor(achieved.p).split(' ')[0]}`}
                                            >
                                                {achieved.n}
                                            </a>
                                            <div className="mt-2 space-y-1">
                                                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(achieved.date).toLocaleString('pl-PL')}
                                                </p>
                                                <p className="text-[11px] font-mono text-purple-300">
                                                    (+{formatDuration(achieved.timeSinceStart)})
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-500 italic mt-2">
                                            Jeszcze nie zdobyty...
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>

      </div>
    </div>
  );
}

export default App;
