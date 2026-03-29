import { createStore } from 'zustand/vanilla';

type User = {
  id: string;
  name: string;
  role: string;
  email: string;
};

type TicketFilters = {
  keyword: string;
  status: 'all' | 'open' | 'processing' | 'resolved' | 'closed';
  priority: 'all' | 'high' | 'medium' | 'low';
  owner: string;
};

type SlaConfig = {
  firstResponseMinutes: number;
  resolveMinutes: number;
  warningThresholdPercent: number;
};

type UiPrefs = {
  density: 'default' | 'compact';
  theme: 'ocean' | 'graphite';
};

type Activity = {
  id: string;
  text: string;
  time: string;
};

type AppState = {
  session: {
    user: User | null;
  };
  ticketFilters: TicketFilters;
  slaConfig: SlaConfig;
  uiPrefs: UiPrefs;
  activities: Activity[];
  login: (user: User) => void;
  logout: () => void;
  setTicketFilters: (patch: Partial<TicketFilters>) => void;
  setSlaConfig: (patch: Partial<SlaConfig>) => void;
  setUiPrefs: (patch: Partial<UiPrefs>) => void;
  appendActivity: (text: string) => void;
};

const makeId = () => Math.random().toString(36).slice(2, 10);

export const appStore = createStore<AppState>((set, get) => ({
  session: {
    user: null,
  },
  ticketFilters: {
    keyword: '',
    status: 'all',
    priority: 'all',
    owner: 'all',
  },
  slaConfig: {
    firstResponseMinutes: 30,
    resolveMinutes: 240,
    warningThresholdPercent: 80,
  },
  uiPrefs: {
    density: 'default',
    theme: 'ocean',
  },
  activities: [],
  login: (user) =>
    set((state) => ({
      ...state,
      session: { user },
    })),
  logout: () =>
    set((state) => ({
      ...state,
      session: { user: null },
    })),
  setTicketFilters: (patch) =>
    set((state) => ({
      ...state,
      ticketFilters: { ...state.ticketFilters, ...patch },
    })),
  setSlaConfig: (patch) =>
    set((state) => ({
      ...state,
      slaConfig: { ...state.slaConfig, ...patch },
    })),
  setUiPrefs: (patch) =>
    set((state) => ({
      ...state,
      uiPrefs: { ...state.uiPrefs, ...patch },
    })),
  appendActivity: (text) =>
    set((state) => ({
      ...state,
      activities: [
        {
          id: makeId(),
          text,
          time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
        },
        ...state.activities,
      ].slice(0, 20),
    })),
}));

export type { AppState };
