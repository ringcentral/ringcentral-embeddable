import type { ComponentType, ReactNode } from 'react';

import type {
  TeamMessagingChatItem,
  TeamMessagingMember,
  TeamMessagingNote,
  TeamMessagingPostItem,
  TeamMessagingReadStatusFilter,
  TeamMessagingResult,
  TeamMessagingTask,
  TeamMessagingTaskFilter,
} from '../../services/TeamMessaging';
import type { ChatTabId } from './chatTabs';

/** What posts need to show and act on tasks. */
export interface TaskActions {
  /** The latest known copy of a task. */
  getTask: (taskId: string) => TeamMessagingTask | undefined;
  /** Members for person ids, such as a task's assignees. */
  getMembers: (ids: string[]) => TeamMessagingMember[];
  toggleTask: (taskId: string, completed: boolean) => void;
  /** Show a task's details in the tasks drawer. */
  openTask: (taskId: string) => void;
}

/** An item of a header's "More" menu. */
export interface HeaderMenuAction {
  key: string;
  symbol: ComponentType;
  label: string;
  onClick: () => void;
}

/**
 * The chat header while a drawer covers the chat: the drawer's title, the
 * chat's name under it, a back button for the drawer, and the drawer's
 * actions, such as editing the task that shows.
 */
export interface DrawerHeader {
  title: string;
  onBack: () => void;
  dataSign: string;
  actions?: HeaderMenuAction[];
}

/** What posts need to show notes. */
export interface NoteActions {
  /** The latest known copy of a note. */
  getNote: (noteId: string) => TeamMessagingNote | undefined;
  /** Show a note in the notes drawer. */
  openNote: (noteId: string) => void;
}

/** The note form's values: a note's body is typed as plain text. */
export interface NoteFormValues {
  title: string;
  text: string;
}

export interface CreateNoteContentProps {
  /** A note being edited; the form is empty for a new note. */
  initialValues?: NoteFormValues;
  /** The confirm button's label, "Create" by default. */
  submitLabel?: string;
  onSubmit: (values: NoteFormValues) => Promise<TeamMessagingResult>;
  onCancel: () => void;
}

/** What the chat lends its notes drawer. */
export interface NotesViewProps {
  chatId: string;
  open: boolean;
  /** The note that shows; the list shows when not set. */
  noteId: string | null;
  container: () => HTMLElement | null;
  formatTime: (utcTimestamp: number) => string;
  getMemberName: (member?: TeamMessagingMember) => string;
  onOpenNote: (noteId: string | null) => void;
  onClose: () => void;
}

export interface NotesDrawerProps
  extends Omit<NotesViewProps, 'chatId' | 'noteId'> {
  notes: TeamMessagingNote[];
  isLoading: boolean;
  /** The note that shows, if any. */
  note?: TeamMessagingNote;
  /** A note was asked for but is not known. */
  isNoteMissing: boolean;
  /** Members for person ids, such as a note's author. */
  getMembers: (ids: string[]) => TeamMessagingMember[];
}

/** The new task form's values. */
export interface CreateTaskValues {
  subject: string;
  assigneeIds: string[];
  dueDate?: Date;
  description: string;
}

/** A task being edited, as its form shows it. */
export interface TaskFormInitialValues {
  subject: string;
  assignees: CreateTeamContact[];
  dueDate?: Date;
  description: string;
}

export interface CreateTaskContentProps {
  /** Chat members that can be assigned, matching the search text. */
  searchMembers: (searchText: string) => CreateTeamContact[];
  /** A task being edited; the form is empty for a new task. */
  initialValues?: TaskFormInitialValues;
  /** The confirm button's label, "Create" by default. */
  submitLabel?: string;
  onSubmit: (values: CreateTaskValues) => Promise<TeamMessagingResult>;
  onCancel: () => void;
}

/** What the chat lends its tasks drawer. */
export interface TasksViewProps {
  chatId: string;
  /** The drawer is open, on the list or on a task's details. */
  open: boolean;
  /** The task whose details show; the list shows when not set. */
  taskId: string | null;
  container: () => HTMLElement | null;
  taskActions: TaskActions;
  formatTime: (utcTimestamp: number) => string;
  getMemberName: (member?: TeamMessagingMember) => string;
  onOpenTask: (taskId: string | null) => void;
  onClose: () => void;
}

export interface TasksDrawerProps
  extends Omit<TasksViewProps, 'chatId' | 'taskId'> {
  filter: TeamMessagingTaskFilter;
  onFilterChange: (filter: TeamMessagingTaskFilter) => void;
  /** The listed tasks of the filter. */
  tasks: TeamMessagingTask[];
  isLoading: boolean;
  /** The task whose details show, if any. */
  task?: TeamMessagingTask;
  /** A task was asked for but is not known. */
  isTaskMissing: boolean;
}

/** A thread parent's replies, shown under it in the chat. */
export interface ThreadInfo {
  replyCount: number;
  lastReplyTime: number;
  /** The latest replies, oldest first, shown in full under the parent. */
  recentReplies: TeamMessagingPostItem[];
}

/** Mention types rendered in posts. `All` is "@Team". */
export type MentionType = 'Person' | 'Team' | 'All';

export interface ChatTab {
  id: ChatTabId;
  /** The tab's chats, filtered by the search text and read status. */
  chats: TeamMessagingChatItem[];
  /** The tab has chats, so an empty list means nothing matched the filters. */
  hasChats: boolean;
  /** Unread posts of all the tab's chats, shown in the tab label. */
  unreadCount: number;
}

/** A sub tab as the sync tab view renders it. */
export interface ChatSyncTab {
  id: ChatTabId;
  /** The tab's name with its unread count. */
  label: string;
  component: ReactNode;
}

export interface ChatListPanelProps {
  tabs: ChatTab[];
  searchFilter: string;
  readStatusFilter: TeamMessagingReadStatusFilter;
  isLoading: boolean;
  currentChatId: string | null;
  onSearchChange: (searchFilter: string) => void;
  onReadStatusFilterChange: (
    readStatusFilter: TeamMessagingReadStatusFilter,
  ) => void;
  onSelectChat: (chatId: string) => void;
  onToggleFavorite: (chatId: string) => void;
  onCreateConversation: () => void;
  onCreateTeam: () => void;
  formatTime: (utcTimestamp: number) => string;
  /** Renders the sub tabs, kept in step across windows. */
  renderTabs: (tabs: ChatSyncTab[]) => ReactNode;
}

export interface CreateTeamContact {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface CreateTeamContentProps {
  searchContacts: (searchText: string) => CreateTeamContact[];
  onCreate: (params: {
    name: string;
    emails: string[];
  }) => Promise<TeamMessagingResult>;
  onCancel: () => void;
}

export interface CreateConversationContentProps {
  searchContacts: (searchText: string) => CreateTeamContact[];
  /** Resolves `ok: false` when the conversation could not be opened. */
  onStart: (personIds: string[]) => Promise<TeamMessagingResult>;
  onCancel: () => void;
}

export interface ChatPanelProps {
  chat?: TeamMessagingChatItem;
  /** Posts, oldest first. */
  posts: TeamMessagingPostItem[];
  isLoading: boolean;
  hasOlderPosts: boolean;
  /** The text typed but not sent yet. */
  draft: string;
  goBack: () => void;
  loadOlderPosts: () => Promise<boolean>;
  /** Resolves `false` when the post was not sent. */
  /** Sends text and files as one post; resolves `false` when it failed. */
  sendMessage: (text: string, files: File[]) => Promise<boolean>;
  /** Whether a file can be attached, such as not being too large. */
  canAttach: (file: File) => boolean;
  saveDraft: (text: string) => void;
  openPerson: (personId: string) => void;
  openChat: (chatId: string) => void;
  formatTime: (utcTimestamp: number) => string;
  getMentionName: (type: MentionType, id: string) => string;
  getMemberName: (member?: TeamMessagingMember) => string;
  toggleFavorite: () => void;
  /** A thread parent's reply count, for the line under it. */
  getThreadInfo?: (post: TeamMessagingPostItem) => ThreadInfo | undefined;
  /** Set while a drawer covers the chat; the header then serves it. */
  drawerHeader?: DrawerHeader;
  /** Renders the thread drawer over the chat panel, its container. */
  renderThread?: (container: () => HTMLElement | null) => ReactNode;
  /** Renders the tasks drawer over the chat panel, its container. */
  renderTasks?: (container: () => HTMLElement | null) => ReactNode;
  taskActions?: TaskActions;
  noteActions?: NoteActions;
  /** Renders the notes drawer over the chat panel, its container. */
  renderNotes?: (container: () => HTMLElement | null) => ReactNode;
  /** Open the new note dialog. */
  createNote?: () => void;
  /** Open the notes drawer on the chat's notes. */
  openNotes?: () => void;
  /** Open the new task dialog. */
  createTask?: () => void;
  /** Open the tasks drawer on the chat's tasks. */
  openTasks?: () => void;
  /** Open a post's thread, starting one when it has none. */
  openThread?: (post: TeamMessagingPostItem) => void;
}

/** Where a message goes: the chat, a thread, or a post's new thread. */
export interface MessageTarget {
  threadId?: string;
  parentPostId?: string;
}

/** What the chat lends its thread drawer. */
export type ThreadActions = Pick<
  ChatPanelProps,
  | 'taskActions'
  | 'noteActions'
  | 'canAttach'
  | 'openPerson'
  | 'openChat'
  | 'formatTime'
  | 'getMentionName'
  | 'getMemberName'
> & {
  sendMessage: (
    text: string,
    files: File[],
    target: MessageTarget,
  ) => Promise<boolean>;
};

export interface ThreadViewProps {
  chatId: string;
  /** The open thread's parent post, or `null` when the drawer is closed. */
  postId: string | null;
  actions: ThreadActions;
  /** The chat panel the drawer covers. */
  container: () => HTMLElement | null;
  onClose: () => void;
}

export type ThreadDrawerProps = Pick<
  ChatPanelProps,
  | 'taskActions'
  | 'noteActions'
  | 'posts'
  | 'isLoading'
  | 'hasOlderPosts'
  | 'draft'
  | 'loadOlderPosts'
  | 'sendMessage'
  | 'canAttach'
  | 'saveDraft'
  | 'openPerson'
  | 'openChat'
  | 'formatTime'
  | 'getMentionName'
  | 'getMemberName'
> & {
  open: boolean;
  /** Remounts the composer per thread, so each thread keeps its own draft. */
  threadKey: string;
  container: () => HTMLElement | null;
  onClose: () => void;
  /** Chat members, for mentions. */
  members: TeamMessagingMember[];
  /** The thread's parent post was found, or is still loading. */
  isAvailable: boolean;
};
