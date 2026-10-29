import {
  DateTimeFormat,
  Toast,
} from '@ringcentral-integration/micro-core/src/app/services';
import {
  action,
  injectable,
  RcViewModule,
  RouterPlugin,
  state,
  useConnector,
} from '@ringcentral-integration/next-core';
import { fileToBase64 } from '@ringcentral-integration/utils';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getPersonName,
  TeamMessagingChats,
  type TeamMessagingMember,
  TeamMessagingPersons,
  type TeamMessagingPost,
  TeamMessagingPosts,
  type TeamMessagingPostItem,
  toPostItem,
} from '../../services/TeamMessaging';
import {
  getPostTime,
  isThreadReply,
} from '../../services/TeamMessaging/TeamMessaging.helper';
import { ChatPanel } from './components/ChatPanel';
import { CHATS_PATH, getChatPath } from './getChatPath';
import { t } from './i18n';
import type {
  ChatPanelProps,
  MentionType,
  DrawerHeader,
  HeaderMenuAction,
  MessageTarget,
  NoteActions,
  TaskActions,
  ThreadActions,
  ThreadInfo,
} from './TeamMessaging.view.interface';
import { TeamMessagingNotesView } from './TeamMessagingNotes.view';
import { TeamMessagingTasksView } from './TeamMessagingTasks.view';
import { TeamMessagingThreadView } from './TeamMessagingThread.view';

/** The tasks drawer: closed, on the chat's tasks, or on one task. */
/**
 * The tasks drawer: closed, on the chat's tasks, or on one task. A task opened
 * from the list goes back to it; one opened from the chat goes back to the
 * chat.
 */
type TasksDrawerState = {
  open: boolean;
  taskId: string | null;
  fromList: boolean;
};

const TASKS_DRAWER_CLOSED: TasksDrawerState = {
  open: false,
  taskId: null,
  fromList: false,
};

/** The notes drawer: closed, on the chat's notes, or on one note. */
/** The notes drawer, like the tasks drawer. */
type NotesDrawerState = {
  open: boolean;
  noteId: string | null;
  fromList: boolean;
};

const NOTES_DRAWER_CLOSED: NotesDrawerState = {
  open: false,
  noteId: null,
  fromList: false,
};

/**
 * The header of the drawer on top, if any. Tasks and notes can open over a
 * thread, so they come first. Back leaves a task or note for its list, and
 * a list or thread for the chat; a deleted task or note leaves the same way.
 */
function getDrawerHeader({
  tasksDrawer,
  notesDrawer,
  threadPostId,
  setTasksDrawer,
  setNotesDrawer,
  closeThread,
  getTaskMenuActions,
  getNoteMenuActions,
}: {
  tasksDrawer: TasksDrawerState;
  notesDrawer: NotesDrawerState;
  threadPostId: string | null;
  setTasksDrawer: (state: TasksDrawerState) => void;
  setNotesDrawer: (state: NotesDrawerState) => void;
  closeThread: () => void;
  getTaskMenuActions: (taskId: string, onDeleted: () => void) => HeaderMenuAction[];
  getNoteMenuActions: (noteId: string, onDeleted: () => void) => HeaderMenuAction[];
}): DrawerHeader | undefined {
  if (tasksDrawer.open) {
    if (!tasksDrawer.taskId) {
      return {
        title: t('tasks'),
        dataSign: 'tasksHeader',
        onBack: () => setTasksDrawer(TASKS_DRAWER_CLOSED),
      };
    }
    const leaveTask = (): void =>
      setTasksDrawer(
        tasksDrawer.fromList
          ? { open: true, taskId: null, fromList: false }
          : TASKS_DRAWER_CLOSED,
      );
    return {
      title: t('task'),
      dataSign: 'taskHeader',
      onBack: leaveTask,
      actions: getTaskMenuActions(tasksDrawer.taskId, leaveTask),
    };
  }
  if (notesDrawer.open) {
    if (!notesDrawer.noteId) {
      return {
        title: t('notes'),
        dataSign: 'notesHeader',
        onBack: () => setNotesDrawer(NOTES_DRAWER_CLOSED),
      };
    }
    const leaveNote = (): void =>
      setNotesDrawer(
        notesDrawer.fromList
          ? { open: true, noteId: null, fromList: false }
          : NOTES_DRAWER_CLOSED,
      );
    return {
      title: t('note'),
      dataSign: 'noteHeader',
      onBack: leaveNote,
      actions: getNoteMenuActions(notesDrawer.noteId, leaveNote),
    };
  }
  return threadPostId
    ? { title: t('thread'), dataSign: 'threadHeader', onBack: closeThread }
    : undefined;
}

/** The Team Messaging API accepts files up to 30 MB. */
const MAX_FILE_SIZE = 30 * 1024 * 1024;

/** Replies shown in full under their parent; the rest are in the drawer. */
const MAX_INLINE_REPLIES = 5;

type ChatRouteProps = {
  match?: { params?: { groupId?: string } };
};

/**
 * The replies of each thread among the loaded posts, newest first. Replies
 * are newer than their parent, so a loaded parent has all of its replies
 * loaded too.
 */
function getRepliesByThread(
  posts: readonly TeamMessagingPost[],
): Record<string, TeamMessagingPost[]> {
  return posts.reduce<Record<string, TeamMessagingPost[]>>((map, post) => {
    if (post.threadId && isThreadReply(post)) {
      (map[post.threadId] ??= []).push(post);
    }
    return map;
  }, {});
}

/**
 * A chat page (`/glip/groups/:groupId`), opened as a routed side widget.
 */
@injectable({
  name: 'TeamMessagingChatView',
})
export class TeamMessagingChatView extends RcViewModule {
  constructor(
    private _teamMessagingChats: TeamMessagingChats,
    private _teamMessagingPosts: TeamMessagingPosts,
    private _teamMessagingPersons: TeamMessagingPersons,
    private _dateTimeFormat: DateTimeFormat,
    private _router: RouterPlugin,
    private _toast: Toast,
    private _teamMessagingThreadView: TeamMessagingThreadView,
    private _teamMessagingTasksView: TeamMessagingTasksView,
    private _teamMessagingNotesView: TeamMessagingNotesView,
  ) {
    super();
    // The chat list is fetched on demand; a failed fetch must not keep this
    // view, and the app view that renders it, from initializing.
    const readiness = this as unknown as {
      _ignoreModuleReadiness(dep: object): void;
    };
    readiness._ignoreModuleReadiness(_teamMessagingChats);
  }

  /** Text typed in each chat and not sent yet. */
  @state
  drafts: Record<string, string> = {};

  @action
  saveDraft(chatId: string, text: string): void {
    if (text) {
      this.drafts[chatId] = text;
    } else {
      delete this.drafts[chatId];
    }
  }

  goBack(): void {
    void this._router.push(CHATS_PATH);
  }

  openChat(chatId: string): void {
    void this._router.push(getChatPath(chatId));
  }

  /** Open the 1:1 chat with a person, as clicking a name did in legacy. */
  async openPerson(personId: string): Promise<void> {
    const result = await this._teamMessagingChats.openConversation([
      personId,
    ]);
    if (!result?.ok || !result.id) {
      this._toast.danger({ message: t('openChatFailed') });
      return;
    }
    this.openChat(result.id);
  }

  async toggleFavorite(chatId: string): Promise<void> {
    const result = await this._teamMessagingChats.toggleFavorite(chatId);
    if (!result?.ok) {
      this._toast.danger({ message: t('favoriteFailed') });
    }
  }

  /** Whether a file can be attached; a file over 30 MB is refused. */
  canAttach(file: File): boolean {
    if (file.size > MAX_FILE_SIZE) {
      this._toast.danger({
        message: t('fileTooLarge', { name: file.name }),
      });
      return false;
    }
    return true;
  }

  /**
   * Send text and files as one post, to the chat or to a thread. Resolves
   * `false` when it failed.
   */
  async sendMessage(
    chatId: string,
    text: string,
    files: File[],
    target: MessageTarget = {},
  ): Promise<boolean> {
    const uploads = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        base64Url: (await fileToBase64(file)) as string,
      })),
    );
    const result = await this._teamMessagingPosts.sendPost({
      chatId,
      text,
      files: uploads,
      ...target,
    });
    return !!result?.ok;
  }

  formatTime(utcTimestamp: number): string {
    return (
      this._dateTimeFormat.formatDateTime({ utcTimestamp }) ?? ''
    ).toString();
  }

  getMemberName(member?: TeamMessagingMember): string {
    return getPersonName(member) || member?.id || '';
  }

  getMentionName(type: MentionType, id: string): string {
    if (type === 'Team') {
      return this._teamMessagingChats.getChatItem(id)?.name || id;
    }
    return (
      getPersonName(this._teamMessagingPersons.personsMap[id]) || id
    );
  }

  /**
   * The chat's posts, oldest first, without thread replies, which show as a
   * count under their parent instead.
   */
  private _usePosts(chatId: string): {
    posts: TeamMessagingPostItem[];
    getThreadInfo: (post: TeamMessagingPostItem) => ThreadInfo | undefined;
  } {
    const { posts, personsMap, myId } = useConnector(() => ({
      posts: this._teamMessagingPosts.postsMap[chatId],
      personsMap: this._teamMessagingPersons.personsMap,
      myId: this._teamMessagingChats.myId,
    }));
    return useMemo(() => {
      const allPosts = posts ?? [];
      const repliesByThread = getRepliesByThread(allPosts);
      return {
        posts: allPosts
          .filter((post) => !isThreadReply(post))
          .reverse()
          .map((post) => toPostItem({ post, personsMap, myId })),
        getThreadInfo: (post: TeamMessagingPostItem) => {
          const replies =
            post.isParent && post.threadId
              ? repliesByThread[post.threadId]
              : undefined;
          if (!replies?.length) {
            return undefined;
          }
          // The posts are newest first.
          return {
            replyCount: replies.length,
            lastReplyTime: getPostTime(replies[0]),
            recentReplies: replies
              .slice(0, MAX_INLINE_REPLIES)
              .reverse()
              .map((reply) => toPostItem({ post: reply, personsMap, myId })),
          };
        },
      };
    }, [posts, personsMap, myId]);
  }

  private _useFunctions(
    chatId: string,
    setThreadPostId: (postId: string | null) => void,
  ): Omit<
    ChatPanelProps,
    | 'chat'
    | 'posts'
    | 'isLoading'
    | 'hasOlderPosts'
    | 'draft'
    | 'getThreadInfo'
    | 'renderThread'
  > {
    return useMemo(
      () => ({
        goBack: () => this.goBack(),
        loadOlderPosts: () => this._teamMessagingPosts.loadOlderPosts(chatId),
        sendMessage: (text: string, files: File[]) =>
          this.sendMessage(chatId, text, files),
        canAttach: (file: File) => this.canAttach(file),
        saveDraft: (text: string) => this.saveDraft(chatId, text),
        openPerson: (personId: string) => void this.openPerson(personId),
        openChat: (id: string) => this.openChat(id),
        formatTime: (utcTimestamp: number) => this.formatTime(utcTimestamp),
        getMentionName: (type: MentionType, id: string) =>
          this.getMentionName(type, id),
        getMemberName: (member?: TeamMessagingMember) =>
          this.getMemberName(member),
        toggleFavorite: () => void this.toggleFavorite(chatId),
        openThread: (post: TeamMessagingPostItem) => {
          if (post.id && !post.sendStatus) {
            setThreadPostId(post.id);
          }
        },
      }),
      [chatId, setThreadPostId],
    );
  }

  /** What the thread drawer borrows from the chat. */
  private _useThreadActions(
    chatId: string,
    functions: ReturnType<TeamMessagingChatView['_useFunctions']>,
    taskActions: TaskActions,
    noteActions: NoteActions,
  ): ThreadActions {
    return useMemo(
      () => ({
        taskActions,
        noteActions,
        sendMessage: (text: string, files: File[], target: MessageTarget) =>
          this.sendMessage(chatId, text, files, target),
        canAttach: functions.canAttach,
        openPerson: functions.openPerson,
        openChat: functions.openChat,
        formatTime: functions.formatTime,
        getMentionName: functions.getMentionName,
        getMemberName: functions.getMemberName,
      }),
      [chatId, functions, taskActions, noteActions],
    );
  }

  /** The notes drawer's state; it closes when another chat opens. */
  private _useNotesDrawer(
    chatId: string,
  ): [NotesDrawerState, (state: NotesDrawerState) => void] {
    const [notesDrawer, setNotesDrawer] =
      useState<NotesDrawerState>(NOTES_DRAWER_CLOSED);
    useEffect(() => setNotesDrawer(NOTES_DRAWER_CLOSED), [chatId]);
    return [notesDrawer, setNotesDrawer];
  }

  /** The tasks drawer's state; it closes when another chat opens. */
  private _useTasksDrawer(
    chatId: string,
  ): [TasksDrawerState, (state: TasksDrawerState) => void] {
    const [tasksDrawer, setTasksDrawer] =
      useState<TasksDrawerState>(TASKS_DRAWER_CLOSED);
    useEffect(() => setTasksDrawer(TASKS_DRAWER_CLOSED), [chatId]);
    return [tasksDrawer, setTasksDrawer];
  }

  /** The thread open in the drawer, by parent post; none in a new chat. */
  private _useThreadPostId(
    chatId: string,
  ): [string | null, (postId: string | null) => void] {
    const [threadPostId, setThreadPostId] = useState<string | null>(null);
    useEffect(() => setThreadPostId(null), [chatId]);
    return [threadPostId, setThreadPostId];
  }

  /** Keeps the server's current chat in step with the open page. */
  useCurrentChat(chatId: string): void {
    useEffect(() => {
      void this._teamMessagingChats.setCurrentChat(chatId);
      return () => {
        void this._teamMessagingChats.setCurrentChat(null);
      };
    }, [chatId]);
  }

  component({ match }: ChatRouteProps): React.ReactElement {
    const chatId = decodeURIComponent(match?.params?.groupId ?? '');
    this.useCurrentChat(chatId);
    const { posts, getThreadInfo } = this._usePosts(chatId);
    const [threadPostId, setThreadPostId] = this._useThreadPostId(chatId);
    const functions = this._useFunctions(chatId, setThreadPostId);
    const [tasksDrawer, setTasksDrawer] = this._useTasksDrawer(chatId);
    // From the chat: a card, an activity line or the menu's "Tasks".
    const openTask = useCallback(
      (taskId: string | null) =>
        setTasksDrawer({ open: true, taskId, fromList: false }),
      [setTasksDrawer],
    );
    const openTaskFromList = useCallback(
      (taskId: string | null) =>
        setTasksDrawer({ open: true, taskId, fromList: !!taskId }),
      [setTasksDrawer],
    );
    const tasksView = this._teamMessagingTasksView;
    const taskActions = tasksView.useTaskActions(openTask);
    const [notesDrawer, setNotesDrawer] = this._useNotesDrawer(chatId);
    // From the chat: a card or the menu's "Notes".
    const openNote = useCallback(
      (noteId: string | null) =>
        setNotesDrawer({ open: true, noteId, fromList: false }),
      [setNotesDrawer],
    );
    const openNoteFromList = useCallback(
      (noteId: string | null) =>
        setNotesDrawer({ open: true, noteId, fromList: !!noteId }),
      [setNotesDrawer],
    );
    const notesView = this._teamMessagingNotesView;
    const noteActions = notesView.useNoteActions(openNote);
    const threadActions = this._useThreadActions(
      chatId,
      functions,
      taskActions,
      noteActions,
    );
    const uiProps = useConnector(() => ({
      chat: this._teamMessagingChats.getChatItem(chatId),
      isLoading: !!this._teamMessagingPosts.loadingChatIds[chatId],
      hasOlderPosts: !!this._teamMessagingPosts.olderPageTokens[chatId],
    }));
    // The draft only seeds the composer when it mounts, keyed by chat.
    return (
      <ChatPanel
        key={chatId}
        {...uiProps}
        {...functions}
        posts={posts}
        getThreadInfo={getThreadInfo}
        draft={this.drafts[chatId] ?? ''}
        drawerHeader={getDrawerHeader({
          tasksDrawer,
          notesDrawer,
          threadPostId,
          setTasksDrawer,
          setNotesDrawer,
          closeThread: () => setThreadPostId(null),
          getTaskMenuActions: (taskId, onDeleted) =>
            tasksView.getTaskMenuActions(taskId, onDeleted),
          getNoteMenuActions: (noteId, onDeleted) =>
            notesView.getNoteMenuActions(noteId, onDeleted),
        })}
        taskActions={taskActions}
        createTask={() => tasksView.openCreateTask(chatId)}
        openTasks={() => openTask(null)}
        noteActions={noteActions}
        createNote={() => notesView.openCreateNote(chatId)}
        openNotes={() => openNote(null)}
        renderNotes={(container) => (
          <notesView.component
            chatId={chatId}
            open={notesDrawer.open}
            noteId={notesDrawer.noteId}
            container={container}
            formatTime={functions.formatTime}
            getMemberName={functions.getMemberName}
            onOpenNote={openNoteFromList}
            onClose={() => setNotesDrawer(NOTES_DRAWER_CLOSED)}
          />
        )}
        renderTasks={(container) => (
          <tasksView.component
            chatId={chatId}
            open={tasksDrawer.open}
            taskId={tasksDrawer.taskId}
            container={container}
            taskActions={taskActions}
            formatTime={functions.formatTime}
            getMemberName={functions.getMemberName}
            onOpenTask={openTaskFromList}
            onClose={() => setTasksDrawer(TASKS_DRAWER_CLOSED)}
          />
        )}
        renderThread={(container) => (
          <this._teamMessagingThreadView.component
            chatId={chatId}
            postId={threadPostId}
            actions={threadActions}
            container={container}
            onClose={() => setThreadPostId(null)}
          />
        )}
      />
    );
  }
}
