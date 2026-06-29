export interface OnlinePlayer {
  a: string; // account id
  c: string; // char id
  n: string; // nick
  p: string; // profession (b, w, p, h, t, m)
  l: string; // level
  r: string; // rank/reputation?
}

export interface OnlineListResponse {
    [key: string]: OnlinePlayer;
}

export interface RankedPlayer extends OnlinePlayer {
  maxLevel: number;
  lastSeen: number; // timestamp
  sessionStart?: number;
  totalTimeOnline?: number;
}
