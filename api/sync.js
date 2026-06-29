import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = (supabaseUrl && supabaseKey) 
    ? createClient(supabaseUrl, supabaseKey) 
    : null;

export default async function handler(req, res) {
  if (!supabase) {
      return res.status(500).json({ error: "Brak konfiguracji Supabase w zmiennych środowiskowych." });
  }

  try {
    const world = 'luvia';
    // Pobranie globalnego stanu z tabeli "margonem_state"
    const { data: dbData, error: fetchError } = await supabase
        .from('margonem_state')
        .select('data')
        .eq('id', world)
        .maybeSingle();
        
    let state = null;
    
    if (fetchError) {
        console.error("Supabase fetch error:", fetchError);
        return res.status(500).json({ error: "Błąd odczytu z bazy danych." });
    }
    
    // Jeśli nie ma rekordu, tworzymy domyślny stan
    if (!dbData) {
        state = { ranking: {}, serverStartTime: null, lastUpdated: 0, onlinePlayersCount: 0 };
    } else {
        state = dbData.data;
    }

    // Aktualizacja stanu maksymalnie raz na 15 sekund
    if (Date.now() - state.lastUpdated > 15000) {
        const response = await fetch(`https://staticinfo.margonem.pl/online/${world}.json`);
        if (!response.ok) throw new Error("Failed to fetch from Margonem API");
        const margonemData = await response.json();
        const players = Object.values(margonemData);
        
        // Zabezpieczenie przed GMami: nowy gracz musi pojawić się z 1 poziomem.
        const validPlayers = players.filter(p => {
            const currentLevel = parseInt(p.l);
            const isKnown = !!state.ranking[p.c];
            if (!isKnown && currentLevel >= 2) {
                return false; // To GM, ignorujemy
            }
            return true;
        });
        
        state.onlinePlayersCount = validPlayers.length;
        
        const profStats = { w: 0, m: 0, h: 0, t: 0, p: 0, b: 0 };
        validPlayers.forEach(p => {
            if (profStats[p.p] !== undefined) profStats[p.p]++;
        });
        state.onlineProfStats = profStats;
        
        // Start serwera: pierwsza poprawna osoba (poziom 1)
        if (validPlayers.length > 0 && !state.serverStartTime) {
            state.serverStartTime = Date.now();
        }

        if (!state.milestones) state.milestones = {};
        const milestoneLevels = [50, 67, 100, 150, 200, 250, 300];

        const nextRanking = { ...state.ranking };
        const now = Date.now();
        const onlinePlayerIds = new Set(validPlayers.map(p => p.c));

        validPlayers.forEach(p => {
            const currentLevel = parseInt(p.l);
            if (!nextRanking[p.c]) {
                nextRanking[p.c] = { 
                    ...p, 
                    maxLevel: currentLevel, 
                    lastSeen: now,
                    totalTimeOnline: 0
                };
            } else {
                const rp = nextRanking[p.c];
                rp.l = p.l;
                rp.maxLevel = Math.max(rp.maxLevel || 0, currentLevel);
                rp.p = p.p;
                
                const elapsed = now - (rp.lastSeen || now);
                // Dopisuj czas tylko jeśli skrypt był uruchamiany regularnie (max 5 minut przerwy)
                if (elapsed > 0 && elapsed <= 300000) {
                    rp.totalTimeOnline = (rp.totalTimeOnline || 0) + elapsed;
                }
                
                rp.lastSeen = now;
            }
            
            // Sprawdzenie kamieni milowych
            const playerMaxLevel = nextRanking[p.c].maxLevel;
            milestoneLevels.forEach(lvl => {
                if (playerMaxLevel >= lvl && !state.milestones[lvl]) {
                    state.milestones[lvl] = {
                        a: p.a,
                        c: p.c,
                        n: p.n,
                        p: p.p,
                        date: now,
                        timeSinceStart: state.serverStartTime ? (now - state.serverStartTime) : 0
                    };
                }
            });
        });

        // Zapisywanie aktywności na wykres (1 punkt = najwyższa liczba graczy w danej godzinie)
        if (!state.activity) state.activity = [];
        const currentHour = new Date(now).setMinutes(0, 0, 0); // start of current hour
        
        if (state.activity.length === 0 || state.activity[state.activity.length - 1].time !== currentHour) {
            state.activity.push({
                time: currentHour,
                count: validPlayers.length
            });
            // Ogranicz do 30 dni (30 dni * 24 godziny = 720 punktów)
            if (state.activity.length > 720) {
                state.activity.shift();
            }
        } else {
            // Zaktualizuj peak dla obecnej godziny
            state.activity[state.activity.length - 1].count = Math.max(
                state.activity[state.activity.length - 1].count, 
                validPlayers.length
            );
        }
        
        state.ranking = nextRanking;
        state.lastUpdated = Date.now();
        
        // Zapis do bazy Supabase
        const { error: upsertError } = await supabase
            .from('margonem_state')
            .upsert({ id: world, data: state });
            
        if (upsertError) {
            console.error("Supabase upsert error:", upsertError);
        }
    }

    res.status(200).json(state);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
