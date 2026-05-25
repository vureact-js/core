import type {
  Agent,
  ConversationDetail,
  ConversationQueue,
  ConversationStatus,
} from '../data/mock-api';

type ValueRef<T> = {
  value: T;
};

export type BatchActionContext = {
  selectedIds: ValueRef<string[]>;
  queue: ValueRef<'all' | ConversationQueue>;
  status: ValueRef<'all' | ConversationStatus>;
  agents: ValueRef<Agent[]>;
  setSelectedIds: (ids: string[]) => void;
};

export type ActiveConversationContext = {
  activeId: ValueRef<string>;
  activeDetail: ValueRef<ConversationDetail | null>;
  refresh: () => Promise<void>;
};

export type TicketCollabContext = {
  ticketId: ValueRef<string>;
  agents: ValueRef<string[]>;
  onSubmitted: () => Promise<void>;
};

export const batchActionContextKey = Symbol('batchActionContext') as any;
export const activeConversationContextKey = Symbol('activeConversationContext') as any;
export const ticketCollabContextKey = Symbol('ticketCollabContext') as any;
