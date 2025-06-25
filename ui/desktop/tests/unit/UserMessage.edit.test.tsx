import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserMessage from '../../src/components/UserMessage';
import { Message, MessageContent } from '../../src/types/message';

// Mock the icons
vi.mock('../../src/components/icons/Edit', () => ({
  default: ({ className }: { className?: string }) => (
    <div data-testid="edit-icon" className={className}>Edit</div>
  ),
}));

vi.mock('../../src/components/VersionNavigator', () => ({
  default: ({ currentVersion, totalVersions, onVersionChange }: any) => (
    <div data-testid="version-navigator">
      <button onClick={() => onVersionChange(0)}>Previous</button>
      <span>{currentVersion} / {totalVersions}</span>
      <button onClick={() => onVersionChange(1)}>Next</button>
    </div>
  ),
}));

vi.mock('../../src/components/MessageCopyLink', () => ({
  default: () => <div data-testid="copy-link">Copy</div>,
}));

vi.mock('../../src/components/MarkdownContent', () => ({
  default: ({ content }: { content: string }) => <div data-testid="markdown-content">{content}</div>,
}));

// Mock utility functions
vi.mock('../../src/utils/urlUtils', () => ({
  extractUrls: () => [],
}));

vi.mock('../../src/utils/imageUtils', () => ({
  extractImagePaths: () => [],
  removeImagePathsFromText: (text: string) => text,
}));

vi.mock('../../src/utils/timeUtils', () => ({
  formatMessageTimestamp: () => '12:34 PM',
}));

vi.mock('../../src/utils/messageVersionUtils', () => ({
  hasMultipleVersions: (message: Message) => !!(message.versions && message.versions.length > 1),
}));

// Mock message data
const createMockMessage = (id: string, content: string, hasVersions = false): Message => {
  const message: Message = {
    id,
    role: 'user',
    created: Math.floor(Date.now() / 1000),
    content: [{ type: 'text', text: content }],
  };

  if (hasVersions) {
    message.versions = [
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
    ];
    message.currentVersionIndex = 1;
  }

  return message;
};

describe('UserMessage Edit Functionality', () => {
  const mockOnEditMessage = vi.fn();
  const mockOnSwitchVersion = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Edit Icon Display', () => {
    it('should show edit icon on hover when onEditMessage is provided', async () => {
      const message = createMockMessage('msg1', 'Test message');
      
      render(
        <UserMessage 
          message={message} 
          onEditMessage={mockOnEditMessage}
          onSwitchVersion={mockOnSwitchVersion}
        />
      );

      const messageContainer = screen.getByText('Test message').closest('.group');
      expect(messageContainer).toBeInTheDocument();
      
      // Edit icon should be present but initially hidden
      const editIcon = screen.getByTestId('edit-icon');
      expect(editIcon).toBeInTheDocument();
    });

    it('should not show edit icon when onEditMessage is not provided', () => {
      const message = createMockMessage('msg1', 'Test message');
      
      render(
        <UserMessage 
          message={message} 
          onSwitchVersion={mockOnSwitchVersion}
        />
      );

      expect(screen.queryByTestId('edit-icon')).not.toBeInTheDocument();
    });
  });

  describe('Edit Mode Activation', () => {
    it('should enter edit mode when edit icon is clicked', async () => {
      const user = userEvent.setup();
      const message = createMockMessage('msg1', 'Test message');
      
      render(
        <UserMessage 
          message={message} 
          onEditMessage={mockOnEditMessage}
          onSwitchVersion={mockOnSwitchVersion}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit message/i });
      await user.click(editButton);

      // Should show textarea in edit mode
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test message')).toBeInTheDocument();
      
      // Should show save and cancel buttons
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should populate textarea with current message content', async () => {
      const user = userEvent.setup();
      const message = createMockMessage('msg1', 'Original content');
      
      render(
        <UserMessage 
          message={message} 
          onEditMessage={mockOnEditMessage}
          onSwitchVersion={mockOnSwitchVersion}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit message/i });
      await user.click(editButton);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('Original content');
    });
  });

  describe('Edit Mode Interaction', () => {
    it('should update textarea content when typing', async () => {
      const user = userEvent.setup();
      const message = createMockMessage('msg1', 'Test message');
      
      render(
        <UserMessage 
          message={message} 
          onEditMessage={mockOnEditMessage}
          onSwitchVersion={mockOnSwitchVersion}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit message/i });
      await user.click(editButton);

      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'Updated message');

      expect(textarea).toHaveValue('Updated message');
    });

    it('should save changes when save button is clicked', async () => {
      const user = userEvent.setup();
      const message = createMockMessage('msg1', 'Test message');
      
      render(
        <UserMessage 
          message={message} 
          onEditMessage={mockOnEditMessage}
          onSwitchVersion={mockOnSwitchVersion}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit message/i });
      await user.click(editButton);

      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'Updated message');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(mockOnEditMessage).toHaveBeenCalledWith('msg1', [
        { type: 'text', text: 'Updated message' }
      ]);
    });

    it('should not save if content is unchanged', async () => {
      const user = userEvent.setup();
      const message = createMockMessage('msg1', 'Test message');
      
      render(
        <UserMessage 
          message={message} 
          onEditMessage={mockOnEditMessage}
          onSwitchVersion={mockOnSwitchVersion}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit message/i });
      await user.click(editButton);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(mockOnEditMessage).not.toHaveBeenCalled();
    });

    it('should cancel edit mode when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const message = createMockMessage('msg1', 'Test message');
      
      render(
        <UserMessage 
          message={message} 
          onEditMessage={mockOnEditMessage}
          onSwitchVersion={mockOnSwitchVersion}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit message/i });
      await user.click(editButton);

      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'Updated message');

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Should exit edit mode and not save changes
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByTestId('markdown-content')).toHaveTextContent('Test message');
      expect(mockOnEditMessage).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should save when Enter is pressed (without Shift)', async () => {
      const user = userEvent.setup();
      const message = createMockMessage('msg1', 'Test message');
      
      render(
        <UserMessage 
          message={message} 
          onEditMessage={mockOnEditMessage}
          onSwitchVersion={mockOnSwitchVersion}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit message/i });
      await user.click(editButton);

      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'Updated message');
      
      await user.keyboard('{Enter}');

      expect(mockOnEditMessage).toHaveBeenCalledWith('msg1', [
        { type: 'text', text: 'Updated message' }
      ]);
    });

    it('should add newline when Shift+Enter is pressed', async () => {
      const user = userEvent.setup();
      const message = createMockMessage('msg1', 'Test message');
      
      render(
        <UserMessage 
          message={message} 
          onEditMessage={mockOnEditMessage}
          onSwitchVersion={mockOnSwitchVersion}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit message/i });
      await user.click(editButton);

      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'Line 1');
      
      await user.keyboard('{Shift>}{Enter}{/Shift}');
      await user.type(textarea, 'Line 2');

      expect(textarea).toHaveValue('Line 1\nLine 2');
      expect(mockOnEditMessage).not.toHaveBeenCalled();
    });

    it('should cancel when Escape is pressed', async () => {
      const user = userEvent.setup();
      const message = createMockMessage('msg1', 'Test message');
      
      render(
        <UserMessage 
          message={message} 
          onEditMessage={mockOnEditMessage}
          onSwitchVersion={mockOnSwitchVersion}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit message/i });
      await user.click(editButton);

      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'Updated message');
      
      await user.keyboard('{Escape}');

      // Should exit edit mode without saving
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(mockOnEditMessage).not.toHaveBeenCalled();
    });

    it('should activate edit mode when Enter or Space is pressed on edit button', async () => {
      const user = userEvent.setup();
      const message = createMockMessage('msg1', 'Test message');
      
      render(
        <UserMessage 
          message={message} 
          onEditMessage={mockOnEditMessage}
          onSwitchVersion={mockOnSwitchVersion}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit message/i });
      
      // Test Enter key
      editButton.focus();
      await user.keyboard('{Enter}');
      
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      
      // Cancel and test Space key
      await user.keyboard('{Escape}');
      
      editButton.focus();
      await user.keyboard(' ');
      
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Version Navigator', () => {
    it('should show version navigator when message has multiple versions', () => {
      const message = createMockMessage('msg1', 'Test message', true);
      
      render(
        <UserMessage 
          message={message} 
          onEditMessage={mockOnEditMessage}
          onSwitchVersion={mockOnSwitchVersion}
        />
      );

      expect(screen.getByTestId('version-navigator')).toBeInTheDocument();
      expect(screen.getByText('2 / 2')).toBeInTheDocument();
    });

    it('should not show version navigator when message has single version', () => {
      const message = createMockMessage('msg1', 'Test message', false);
      
      render(
        <UserMessage 
          message={message} 
          onEditMessage={mockOnEditMessage}
          onSwitchVersion={mockOnSwitchVersion}
        />
      );

      expect(screen.queryByTestId('version-navigator')).not.toBeInTheDocument();
    });

    it('should call onSwitchVersion when version navigator is used', async () => {
      const user = userEvent.setup();
      const message = createMockMessage('msg1', 'Test message', true);
      
      render(
        <UserMessage 
          message={message} 
          onEditMessage={mockOnEditMessage}
          onSwitchVersion={mockOnSwitchVersion}
        />
      );

      const previousButton = screen.getByRole('button', { name: /previous/i });
      await user.click(previousButton);

      expect(mockOnSwitchVersion).toHaveBeenCalledWith('msg1', 0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for edit functionality', () => {
      const message = createMockMessage('msg1', 'Test message');
      
      render(
        <UserMessage 
          message={message} 
          onEditMessage={mockOnEditMessage}
          onSwitchVersion={mockOnSwitchVersion}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit message/i });
      expect(editButton).toHaveAttribute('aria-label', 'Edit message');
      expect(editButton).toHaveAttribute('title', expect.stringContaining('Edit message'));
    });

    it('should have proper ARIA labels in edit mode', async () => {
      const user = userEvent.setup();
      const message = createMockMessage('msg1', 'Test message');
      
      render(
        <UserMessage 
          message={message} 
          onEditMessage={mockOnEditMessage}
          onSwitchVersion={mockOnSwitchVersion}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit message/i });
      await user.click(editButton);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-label', 'Edit message content');

      const saveButton = screen.getByRole('button', { name: /save edited message/i });
      expect(saveButton).toHaveAttribute('aria-label', 'Save edited message');

      const cancelButton = screen.getByRole('button', { name: /cancel editing/i });
      expect(cancelButton).toHaveAttribute('aria-label', 'Cancel editing');
    });

    it('should have proper focus management', async () => {
      const user = userEvent.setup();
      const message = createMockMessage('msg1', 'Test message');
      
      render(
        <UserMessage 
          message={message} 
          onEditMessage={mockOnEditMessage}
          onSwitchVersion={mockOnSwitchVersion}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit message/i });
      await user.click(editButton);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing message ID gracefully', async () => {
      const user = userEvent.setup();
      const message = createMockMessage('msg1', 'Test message');
      message.id = undefined;
      
      render(
        <UserMessage 
          message={message} 
          onEditMessage={mockOnEditMessage}
          onSwitchVersion={mockOnSwitchVersion}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit message/i });
      await user.click(editButton);

      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'Updated message');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should not call onEditMessage if message ID is missing
      expect(mockOnEditMessage).not.toHaveBeenCalled();
    });

    it('should handle empty/whitespace-only content', async () => {
      const user = userEvent.setup();
      const message = createMockMessage('msg1', 'Test message');
      
      render(
        <UserMessage 
          message={message} 
          onEditMessage={mockOnEditMessage}
          onSwitchVersion={mockOnSwitchVersion}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit message/i });
      await user.click(editButton);

      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, '   ');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should not call onEditMessage for whitespace-only content
      expect(mockOnEditMessage).not.toHaveBeenCalled();
    });
  });
});
