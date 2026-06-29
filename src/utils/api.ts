import type { OnlineListResponse } from '../types';

export const fetchOnlinePlayers = async (world: string): Promise<OnlineListResponse | null> => {
    try {
        const url = `https://staticinfo.margonem.pl/online/${world}.json`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch online list");
        return await response.json();
    } catch (e) {
        console.error("Fetch online error", e);
        return null;
    }
}
