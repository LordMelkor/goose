import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNewVersion,
  switchVersion,
  computeActiveVersionPath,
  hideDownstreamMessages,
  getVersionNavigatorText,
  hasMultipleVersions,
  getChildMessageIds,
} from '../../src/utils/messageVersionUtils';
import { Message, MessageVersion, MessageContent } from '../../src/types/message';

// Mock message data for testing
const createMockMessage = (id: string, content: string, created: number = Date.now()): Message => ({
  id,
  role: 'user',
  created: Math.floor(created / 1000),
  content: [{ type: 'text', text: content }],
});

const createMockAssistantMessage = (id: string, content: string): Message => ({
  id,
  role: 'assistant',
  created: Math.floor(Date.now() / 1000),
  content: [{ type: 'text', text: content }],
});

describe('messageVersionUtils', () => {
  describe('createNewVersion', () => {
    it('should create a new version for a message without existing versions', () => {
      const originalMessage = createMockMessage('msg1', 'Original content');
      const newContent: MessageContent[] = [{ type: 'text', text: 'Edited content' }];

      const result = createNewVersion(originalMessage, newContent);

      expect(result.content).toEqual(newContent);
      expect(result.versions).toHaveLength(2);
      expect(result.versions![0].versionNumber).toBe(1);
      expect(result.versions![0].content).toEqual(originalMessage.content);
      expect(result.versions![1].versionNumber).toBe(2);
      expect(result.versions![1].content).toEqual(newContent);
      expect(result.currentVersionIndex).toBe(1);
    });

    it('should add a new version to a message with existing versions', () => {
      const originalMessage = createMockMessage('msg1', 'Original content');
      const firstEdit: MessageContent[] = [{ type: 'text', text: 'First edit' }];
      const messageWithVersion = createNewVersion(originalMessage, firstEdit);
      
      const secondEdit: MessageContent[] = [{ type: 'text', text: 'Second edit' }];
      const result = createNewVersion(messageWithVersion, secondEdit);

      expect(result.versions).toHaveLength(3);
      expect(result.versions![2].versionNumber).toBe(3);
      expect(result.versions![2].content).toEqual(secondEdit);
      expect(result.currentVersionIndex).toBe(2);
    });

    it('should preserve original message properties', () => {
      const originalMessage = createMockMessage('msg1', 'Original content');
      originalMessage.display = true;
      originalMessage.sendToLLM = false;
      
      const newContent: MessageContent[] = [{ type: 'text', text: 'Edited content' }];
      const result = createNewVersion(originalMessage, newContent);

      expect(result.id).toBe(originalMessage.id);
      expect(result.role).toBe(originalMessage.role);
      expect(result.created).toBe(originalMessage.created);
      expect(result.display).toBe(originalMessage.display);
      expect(result.sendToLLM).toBe(originalMessage.sendToLLM);
    });
  });

  describe('switchVersion', () => {
    it('should switch to a valid version index', () => {
      const originalMessage = createMockMessage('msg1', 'Original content');
      const editedContent: MessageContent[] = [{ type: 'text', text: 'Edited content' }];
      const messageWithVersions = createNewVersion(originalMessage, editedContent);

      const result = switchVersion(messageWithVersions, 0);

      expect(result.content).toEqual(messageWithVersions.versions![0].content);
      expect(result.currentVersionIndex).toBe(0);
    });

    it('should return unchanged message for invalid version index', () => {
      const originalMessage = createMockMessage('msg1', 'Original content');
      const editedContent: MessageContent[] = [{ type: 'text', text: 'Edited content' }];
      const messageWithVersions = createNewVersion(originalMessage, editedContent);

      const result = switchVersion(messageWithVersions, 5);

      expect(result).toEqual(messageWithVersions);
    });

    it('should return unchanged message for negative version index', () => {
      const originalMessage = createMockMessage('msg1', 'Original content');
      const editedContent: MessageContent[] = [{ type: 'text', text: 'Edited content' }];
      const messageWithVersions = createNewVersion(originalMessage, editedContent);

      const result = switchVersion(messageWithVersions, -1);

      expect(result).toEqual(messageWithVersions);
    });

    it('should return unchanged message without versions', () => {
      const originalMessage = createMockMessage('msg1', 'Original content');

      const result = switchVersion(originalMessage, 0);

      expect(result).toEqual(originalMessage);
    });
  });

  describe('computeActiveVersionPath', () => {
    it('should return all message IDs when no messages have display=false', () => {
      const messages = [
        createMockMessage('msg1', 'Content 1'),
        createMockMessage('msg2', 'Content 2'),
        createMockMessage('msg3', 'Content 3'),
      ];

      const result = computeActiveVersionPath(messages);

      expect(result).toEqual(['msg1', 'msg2', 'msg3']);
    });

    it('should exclude messages with display=false', () => {
      const messages = [
        createMockMessage('msg1', 'Content 1'),
        createMockMessage('msg2', 'Content 2'),
        createMockMessage('msg3', 'Content 3'),
      ];
      messages[1].display = false;

      const result = computeActiveVersionPath(messages);

      expect(result).toEqual(['msg1', 'msg3']);
    });

    it('should handle messages without IDs', () => {
      const messages = [
        createMockMessage('msg1', 'Content 1'),
        { ...createMockMessage('', 'Content 2'), id: undefined },
        createMockMessage('msg3', 'Content 3'),
      ];

      const result = computeActiveVersionPath(messages);

      expect(result).toEqual(['msg1', 'msg3']);
    });
  });

  describe('hideDownstreamMessages', () => {
    it('should hide messages after the edited message', () => {
      const messages = [
        createMockMessage('msg1', 'Content 1'),
        createMockMessage('msg2', 'Content 2'),
        createMockMessage('msg3', 'Content 3'),
        createMockMessage('msg4', 'Content 4'),
      ];

      const result = hideDownstreamMessages('msg2', messages);

      expect(result[0].display).toBeUndefined();
      expect(result[1].display).toBeUndefined();
      expect(result[2].display).toBe(false);
      expect(result[3].display).toBe(false);
    });

    it('should return unchanged messages if edited message not found', () => {
      const messages = [
        createMockMessage('msg1', 'Content 1'),
        createMockMessage('msg2', 'Content 2'),
      ];

      const result = hideDownstreamMessages('nonexistent', messages);

      expect(result).toEqual(messages);
    });

    it('should not hide messages if edited message is the last one', () => {
      const messages = [
        createMockMessage('msg1', 'Content 1'),
        createMockMessage('msg2', 'Content 2'),
      ];

      const result = hideDownstreamMessages('msg2', messages);

      expect(result[0].display).toBeUndefined();
      expect(result[1].display).toBeUndefined();
    });
  });

  describe('getVersionNavigatorText', () => {
    it('should format version text correctly', () => {
      expect(getVersionNavigatorText(1, 3)).toBe('< 1 / 3 >');
      expect(getVersionNavigatorText(2, 5)).toBe('< 2 / 5 >');
      expect(getVersionNavigatorText(10, 10)).toBe('< 10 / 10 >');
    });
  });

  describe('hasMultipleVersions', () => {
    it('should return true for messages with multiple versions', () => {
      const originalMessage = createMockMessage('msg1', 'Original content');
      const editedContent: MessageContent[] = [{ type: 'text', text: 'Edited content' }];
      const messageWithVersions = createNewVersion(originalMessage, editedContent);

      expect(hasMultipleVersions(messageWithVersions)).toBe(true);
    });

    it('should return false for messages without versions', () => {
      const message = createMockMessage('msg1', 'Content');

      expect(hasMultipleVersions(message)).toBe(false);
    });

    it('should return false for messages with only one version', () => {
      const message = createMockMessage('msg1', 'Content');
      message.versions = [{
        versionNumber: 1,
        content: message.content,
        timestamp: Date.now(),
        childMessageIds: [],
      }];

      expect(hasMultipleVersions(message)).toBe(false);
    });
  });

  describe('getChildMessageIds', () => {
    it('should return child message IDs for a parent message', () => {
      const messages = [
        createMockMessage('msg1', 'Parent'),
        createMockMessage('msg2', 'Child 1'),
        createMockMessage('msg3', 'Child 2'),
        createMockMessage('msg4', 'Other'),
      ];
      
      messages[1].parentMessageId = 'msg1';
      messages[2].parentMessageId = 'msg1';

      const result = getChildMessageIds('msg1', 0, messages);

      expect(result).toEqual(['msg2', 'msg3']);
    });

    it('should return empty array when no children exist', () => {
      const messages = [
        createMockMessage('msg1', 'Parent'),
        createMockMessage('msg2', 'Other'),
      ];

      const result = getChildMessageIds('msg1', 0, messages);

      expect(result).toEqual([]);
    });

    it('should handle messages without IDs', () => {
      const messages = [
        createMockMessage('msg1', 'Parent'),
        { ...createMockMessage('', 'Child'), id: undefined, parentMessageId: 'msg1' },
      ];

      const result = getChildMessageIds('msg1', 0, messages);

      expect(result).toEqual([]);
    });
  });
});
