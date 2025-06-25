import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ChatView from '../../src/components/ChatView';
import { Message } from '../../src/types/message';

// Mock all the complex dependencies
vi.mock('../../src/hooks/useMessageStream', () => ({
  useMessageStream: () => ({
    messages: [],
    append: vi.fn(),
    stop: vi.fn(),
    isLoading: false,
    error: undefined,
    setMessages: vi.fn(),
    input: '',
    setInput: vi.fn(),
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    updateMessageStreamBody: vi.fn(),
    notifications: [],
    currentModelInfo: null,
    editMessage: vi.fn(),
    switchMessageVersion: vi.fn(),
    activeVersionPath: [],
  }),
}));

vi.mock('../../src/components/context_management/ChatContextManager', () => ({
  ChatContextManagerProvider: ({ children }: { children: React.ReactNode }) => children,
  useChatContextManager: () => ({
    summaryContent: '',
    summarizedThread: [],
    isSummaryModalOpen: false,
    resetMessagesWithSummary: vi.fn(),
    closeSummaryModal: vi.fn(),
    updateSummary: vi.fn(),
    hasContextHandlerContent: () => false,
    getContextHandlerType: () => null,
  }),
}));

vi.mock('../../src/components/more_menu/MoreMenuLayout', () => ({
  default: () => <div data-testid="more-menu">More Menu</div>,
}));

vi.mock('../../src/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={className} {...props} data-testid="chat-card">
      {children}
    </div>
  ),
}));

vi.mock('../../src/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scroll-area">{children}</div>
  ),
}));

vi.mock('../../src/components/conversation/SearchView', () => ({
  SearchView: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="search-view">{children}</div>
  ),
}));

vi.mock('../../src/components/UserMessage', () => ({
  default: ({ message }: { message: Message }) => (
    <div data-testid={`user-message-${message.id}`}>
      User: {message.content[0]?.type === 'text' ? message.content[0].text : 'No text'}
    </div>
  ),
}));

vi.mock('../../src/components/GooseMessage', () => ({
  default: ({ message }: { message: Message }) => (
    <div data-testid={`goose-message-${message.id}`}>
      Goose: {message.content[0]?.type === 'text' ? message.content[0].text : 'No text'}
    </div>
  ),
}));

vi.mock('../../src/components/ChatInput', () => ({
  default: () => <div data-testid="chat-input">Chat Input</div>,
}));

vi.mock('../../src/components/Splash', () => ({
  default: () => <div data-testid="splash">Splash</div>,
}));

vi.mock('../../src/components/context_management/SessionSummaryModal', () => ({
  SessionSummaryModal: () => <div data-testid="session-summary-modal">Session Summary Modal</div>,
}));

// Mock other utilities
vi.mock('../../src/config', () => ({
  getApiUrl: (path: string) => `http://localhost:3000${path}`,
}));

vi.mock('../../src/sessions', () => ({
  fetchSessionDetails: vi.fn(),
  generateSessionId: vi.fn(() => '20240101_120000'),
}));

vi.mock('../../src/utils/localMessageStorage', () => ({
  LocalMessageStorage: {
    addMessage: vi.fn(),
  },
}));

// Mock window.appConfig
Object.defineProperty(window, 'appConfig', {
  value: {
    get: vi.fn((key: string) => {
      if (key === 'GOOSE_WORKING_DIR') return '/test/working/dir';
      if (key === 'recipeConfig') return null;
      return undefined;
    }),
  },
  writable: true,
});

// Mock window.electron
Object.defineProperty(window, 'electron', {
  value: {
    logInfo: vi.fn(),
    stopPowerSaveBlocker: vi.fn(),
    startPowerSaveBlocker: vi.fn(),
    showNotification: vi.fn(),
    createChatWindow: vi.fn(),
    getPathForFile: vi.fn(),
  },
  writable: true,
});

// Mock window.addEventListener
Object.defineProperty(window, 'addEventListener', {
  value: vi.fn(),
  writable: true,
});

Object.defineProperty(window, 'removeEventListener', {
  value: vi.fn(),
  writable: true,
});

// Create mock messages for testing
const createMockMessage = (id: string, content: string, role: 'user' | 'assistant' = 'user'): Message => ({
  id,
  role,
  created: Math.floor(Date.now() / 1000),
  content: [{ type: 'text', text: content }],
});

const createMessageWithVersions = (id: string, content: string): Message => {
  const message = createMockMessage(id, content);
  return {
    ...message,
    versions: [
      {
        versionNumber: 1,
        content: [{ type: 'text', text: 'Original content' }],
        timestamp: Date.now(),
        childMessageIds: [],
      },
      {
        versionNumber: 2,
        content: [{ type: 'text', text: content }],
        timestamp: Date.now(),
        childMessageIds: [],
      },
    ],
    currentVersionIndex: 1,
  };
};

describe('ChatView Message Filtering', () => {
  const mockSetChat = vi.fn();
  const mockSetView = vi.fn();
  const mockSetIsGoosehintsModalOpen = vi.fn();

  const defaultChat = {
    id: 'test-chat',
    title: 'Test Chat',
    messageHistoryIndex: 0,
    messages: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Message Display', () => {
    it('should render messages without filtering when no activeVersionPath', async () => {
      const messages = [
        createMockMessage('msg1', 'First message'),
        createMockMessage('msg2', 'Second message', 'assistant'),
        createMockMessage('msg3', 'Third message'),
      ];

      const mockUseMessageStream = vi.mocked(
        await import('../../src/hooks/useMessageStream')
      ).useMessageStream;

      mockUseMessageStream.mockReturnValue({
        messages,
        append: vi.fn(),
        stop: vi.fn(),
        isLoading: false,
        error: undefined,
        setMessages: vi.fn(),
        input: '',
        setInput: vi.fn(),
        handleInputChange: vi.fn(),
        handleSubmit: vi.fn(),
        updateMessageStreamBody: vi.fn(),
        notifications: [],
        currentModelInfo: null,
        editMessage: vi.fn(),
        switchMessageVersion: vi.fn(),
        activeVersionPath: [], // No active version path
      });

      render(
        <ChatView
          chat={{ ...defaultChat, messages }}
          setChat={mockSetChat}
          setView={mockSetView}
          setIsGoosehintsModalOpen={mockSetIsGoosehintsModalOpen}
        />
      );

      // All messages should be displayed
      expect(screen.getByTestId('user-message-msg1')).toBeInTheDocument();
      expect(screen.getByTestId('goose-message-msg2')).toBeInTheDocument();
      expect(screen.getByTestId('user-message-msg3')).toBeInTheDocument();
    });

    it('should filter messages based on activeVersionPath', async () => {
      const messages = [
        createMockMessage('msg1', 'First message'),
        createMockMessage('msg2', 'Second message', 'assistant'),
        createMockMessage('msg3', 'Third message'),
        createMockMessage('msg4', 'Fourth message', 'assistant'),
      ];

      const mockUseMessageStream = vi.mocked(
        await import('../../src/hooks/useMessageStream')
      ).useMessageStream;

      mockUseMessageStream.mockReturnValue({
        messages,
        append: vi.fn(),
        stop: vi.fn(),
        isLoading: false,
        error: undefined,
        setMessages: vi.fn(),
        input: '',
        setInput: vi.fn(),
        handleInputChange: vi.fn(),
        handleSubmit: vi.fn(),
        updateMessageStreamBody: vi.fn(),
        notifications: [],
        currentModelInfo: null,
        editMessage: vi.fn(),
        switchMessageVersion: vi.fn(),
        activeVersionPath: ['msg1', 'msg2'], // Only show first two messages
      });

      render(
        <ChatView
          chat={{ ...defaultChat, messages }}
          setChat={mockSetChat}
          setView={mockSetView}
          setIsGoosehintsModalOpen={mockSetIsGoosehintsModalOpen}
        />
      );

      // Only messages in activeVersionPath should be displayed
      expect(screen.getByTestId('user-message-msg1')).toBeInTheDocument();
      expect(screen.getByTestId('goose-message-msg2')).toBeInTheDocument();
      expect(screen.queryByTestId('user-message-msg3')).not.toBeInTheDocument();
      expect(screen.queryByTestId('goose-message-msg4')).not.toBeInTheDocument();
    });

    it('should filter out messages with display=false', async () => {
      const messages = [
        createMockMessage('msg1', 'First message'),
        { ...createMockMessage('msg2', 'Second message', 'assistant'), display: false },
        createMockMessage('msg3', 'Third message'),
      ];

      const mockUseMessageStream = vi.mocked(
        await import('../../src/hooks/useMessageStream')
      ).useMessageStream;

      mockUseMessageStream.mockReturnValue({
        messages,
        append: vi.fn(),
        stop: vi.fn(),
        isLoading: false,
        error: undefined,
        setMessages: vi.fn(),
        input: '',
        setInput: vi.fn(),
        handleInputChange: vi.fn(),
        handleSubmit: vi.fn(),
        updateMessageStreamBody: vi.fn(),
        notifications: [],
        currentModelInfo: null,
        editMessage: vi.fn(),
        switchMessageVersion: vi.fn(),
        activeVersionPath: [],
      });

      render(
        <ChatView
          chat={{ ...defaultChat, messages }}
          setChat={mockSetChat}
          setView={mockSetView}
          setIsGoosehintsModalOpen={mockSetIsGoosehintsModalOpen}
        />
      );

      // Message with display=false should not be shown
      expect(screen.getByTestId('user-message-msg1')).toBeInTheDocument();
      expect(screen.queryByTestId('goose-message-msg2')).not.toBeInTheDocument();
      expect(screen.getByTestId('user-message-msg3')).toBeInTheDocument();
    });

    it('should apply both activeVersionPath and display filtering', async () => {
      const messages = [
        createMockMessage('msg1', 'First message'),
        { ...createMockMessage('msg2', 'Second message', 'assistant'), display: false },
        createMockMessage('msg3', 'Third message'),
        createMockMessage('msg4', 'Fourth message', 'assistant'),
      ];

      const mockUseMessageStream = vi.mocked(
        await import('../../src/hooks/useMessageStream')
      ).useMessageStream;

      mockUseMessageStream.mockReturnValue({
        messages,
        append: vi.fn(),
        stop: vi.fn(),
        isLoading: false,
        error: undefined,
        setMessages: vi.fn(),
        input: '',
        setInput: vi.fn(),
        handleInputChange: vi.fn(),
        handleSubmit: vi.fn(),
        updateMessageStreamBody: vi.fn(),
        notifications: [],
        currentModelInfo: null,
        editMessage: vi.fn(),
        switchMessageVersion: vi.fn(),
        activeVersionPath: ['msg1', 'msg2', 'msg3'], // Include msg2 in path but it has display=false
      });

      render(
        <ChatView
          chat={{ ...defaultChat, messages }}
          setChat={mockSetChat}
          setView={mockSetView}
          setIsGoosehintsModalOpen={mockSetIsGoosehintsModalOpen}
        />
      );

      // Should show msg1 and msg3 (msg2 filtered by display=false, msg4 filtered by activeVersionPath)
      expect(screen.getByTestId('user-message-msg1')).toBeInTheDocument();
      expect(screen.queryByTestId('goose-message-msg2')).not.toBeInTheDocument();
      expect(screen.getByTestId('user-message-msg3')).toBeInTheDocument();
      expect(screen.queryByTestId('goose-message-msg4')).not.toBeInTheDocument();
    });
  });

  describe('Tool Response Filtering', () => {
    it('should filter out standalone tool response messages', async () => {
      const messages = [
        createMockMessage('msg1', 'User message'),
        {
          id: 'msg2',
          role: 'user' as const,
          created: Math.floor(Date.now() / 1000),
          content: [
            {
              type: 'toolResponse' as const,
              id: 'tool1',
              toolResult: {
                status: 'success' as const,
                value: [{ type: 'text' as const, text: 'Tool result' }],
              },
            },
          ],
        },
        createMockMessage('msg3', 'Another user message'),
      ];

      const mockUseMessageStream = vi.mocked(
        await import('../../src/hooks/useMessageStream')
      ).useMessageStream;

      mockUseMessageStream.mockReturnValue({
        messages,
        append: vi.fn(),
        stop: vi.fn(),
        isLoading: false,
        error: undefined,
        setMessages: vi.fn(),
        input: '',
        setInput: vi.fn(),
        handleInputChange: vi.fn(),
        handleSubmit: vi.fn(),
        updateMessageStreamBody: vi.fn(),
        notifications: [],
        currentModelInfo: null,
        editMessage: vi.fn(),
        switchMessageVersion: vi.fn(),
        activeVersionPath: [],
      });

      render(
        <ChatView
          chat={{ ...defaultChat, messages }}
          setChat={mockSetChat}
          setView={mockSetView}
          setIsGoosehintsModalOpen={mockSetIsGoosehintsModalOpen}
        />
      );

      // Tool response message should be filtered out
      expect(screen.getByTestId('user-message-msg1')).toBeInTheDocument();
      expect(screen.queryByTestId('user-message-msg2')).not.toBeInTheDocument();
      expect(screen.getByTestId('user-message-msg3')).toBeInTheDocument();
    });

    it('should show user messages with both text and tool responses', async () => {
      const messages = [
        {
          id: 'msg1',
          role: 'user' as const,
          created: Math.floor(Date.now() / 1000),
          content: [
            { type: 'text' as const, text: 'User message with tool response' },
            {
              type: 'toolResponse' as const,
              id: 'tool1',
              toolResult: {
                status: 'success' as const,
                value: [{ type: 'text' as const, text: 'Tool result' }],
              },
            },
          ],
        },
      ];

      const mockUseMessageStream = vi.mocked(
        await import('../../src/hooks/useMessageStream')
      ).useMessageStream;

      mockUseMessageStream.mockReturnValue({
        messages,
        append: vi.fn(),
        stop: vi.fn(),
        isLoading: false,
        error: undefined,
        setMessages: vi.fn(),
        input: '',
        setInput: vi.fn(),
        handleInputChange: vi.fn(),
        handleSubmit: vi.fn(),
        updateMessageStreamBody: vi.fn(),
        notifications: [],
        currentModelInfo: null,
        editMessage: vi.fn(),
        switchMessageVersion: vi.fn(),
        activeVersionPath: [],
      });

      render(
        <ChatView
          chat={{ ...defaultChat, messages }}
          setChat={mockSetChat}
          setView={mockSetView}
          setIsGoosehintsModalOpen={mockSetIsGoosehintsModalOpen}
        />
      );

      // Message with both text and tool response should be shown
      expect(screen.getByTestId('user-message-msg1')).toBeInTheDocument();
    });
  });

  describe('Version-aware Message Filtering', () => {
    it('should handle messages with versions in filtering', async () => {
      const messages = [
        createMessageWithVersions('msg1', 'Edited message'),
        createMockMessage('msg2', 'Regular message', 'assistant'),
      ];

      const mockUseMessageStream = vi.mocked(
        await import('../../src/hooks/useMessageStream')
      ).useMessageStream;

      mockUseMessageStream.mockReturnValue({
        messages,
        append: vi.fn(),
        stop: vi.fn(),
        isLoading: false,
        error: undefined,
        setMessages: vi.fn(),
        input: '',
        setInput: vi.fn(),
        handleInputChange: vi.fn(),
        handleSubmit: vi.fn(),
        updateMessageStreamBody: vi.fn(),
        notifications: [],
        currentModelInfo: null,
        editMessage: vi.fn(),
        switchMessageVersion: vi.fn(),
        activeVersionPath: ['msg1'], // Only show the edited message
      });

      render(
        <ChatView
          chat={{ ...defaultChat, messages }}
          setChat={mockSetChat}
          setView={mockSetView}
          setIsGoosehintsModalOpen={mockSetIsGoosehintsModalOpen}
        />
      );

      // Only the message in activeVersionPath should be shown
      expect(screen.getByTestId('user-message-msg1')).toBeInTheDocument();
      expect(screen.queryByTestId('goose-message-msg2')).not.toBeInTheDocument();
    });

    it('should handle messages without IDs in activeVersionPath filtering', async () => {
      const messages = [
        createMockMessage('msg1', 'First message'),
        { ...createMockMessage('', 'Message without ID'), id: undefined },
        createMockMessage('msg3', 'Third message'),
      ];

      const mockUseMessageStream = vi.mocked(
        await import('../../src/hooks/useMessageStream')
      ).useMessageStream;

      mockUseMessageStream.mockReturnValue({
        messages,
        append: vi.fn(),
        stop: vi.fn(),
        isLoading: false,
        error: undefined,
        setMessages: vi.fn(),
        input: '',
        setInput: vi.fn(),
        handleInputChange: vi.fn(),
        handleSubmit: vi.fn(),
        updateMessageStreamBody: vi.fn(),
        notifications: [],
        currentModelInfo: null,
        editMessage: vi.fn(),
        switchMessageVersion: vi.fn(),
        activeVersionPath: ['msg1', 'msg3'], // Exclude message without ID
      });

      render(
        <ChatView
          chat={{ ...defaultChat, messages }}
          setChat={mockSetChat}
          setView={mockSetView}
          setIsGoosehintsModalOpen={mockSetIsGoosehintsModalOpen}
        />
      );

      // Messages with IDs in activeVersionPath should be shown
      expect(screen.getByTestId('user-message-msg1')).toBeInTheDocument();
      expect(screen.getByTestId('user-message-msg3')).toBeInTheDocument();
      // Message without ID should not be shown (filtered by activeVersionPath)
      expect(screen.queryByTestId('user-message-')).not.toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show splash when no messages', async () => {
      const mockUseMessageStream = vi.mocked(
        await import('../../src/hooks/useMessageStream')
      ).useMessageStream;

      mockUseMessageStream.mockReturnValue({
        messages: [],
        append: vi.fn(),
        stop: vi.fn(),
        isLoading: false,
        error: undefined,
        setMessages: vi.fn(),
        input: '',
        setInput: vi.fn(),
        handleInputChange: vi.fn(),
        handleSubmit: vi.fn(),
        updateMessageStreamBody: vi.fn(),
        notifications: [],
        currentModelInfo: null,
        editMessage: vi.fn(),
        switchMessageVersion: vi.fn(),
        activeVersionPath: [],
      });

      render(
        <ChatView
          chat={defaultChat}
          setChat={mockSetChat}
          setView={mockSetView}
          setIsGoosehintsModalOpen={mockSetIsGoosehintsModalOpen}
        />
      );

      expect(screen.getByTestId('splash')).toBeInTheDocument();
      expect(screen.queryByTestId('scroll-area')).not.toBeInTheDocument();
    });

    it('should show scroll area when messages exist', async () => {
      const messages = [createMockMessage('msg1', 'Test message')];

      const mockUseMessageStream = vi.mocked(
        await import('../../src/hooks/useMessageStream')
      ).useMessageStream;

      mockUseMessageStream.mockReturnValue({
        messages,
        append: vi.fn(),
        stop: vi.fn(),
        isLoading: false,
        error: undefined,
        setMessages: vi.fn(),
        input: '',
        setInput: vi.fn(),
        handleInputChange: vi.fn(),
        handleSubmit: vi.fn(),
        updateMessageStreamBody: vi.fn(),
        notifications: [],
        currentModelInfo: null,
        editMessage: vi.fn(),
        switchMessageVersion: vi.fn(),
        activeVersionPath: [],
      });

      render(
        <ChatView
          chat={{ ...defaultChat, messages }}
          setChat={mockSetChat}
          setView={mockSetView}
          setIsGoosehintsModalOpen={mockSetIsGoosehintsModalOpen}
        />
      );

      expect(screen.queryByTestId('splash')).not.toBeInTheDocument();
      expect(screen.getByTestId('scroll-area')).toBeInTheDocument();
    });
  });
});
