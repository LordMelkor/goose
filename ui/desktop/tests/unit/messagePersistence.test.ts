import { describe, it, expect } from 'vitest';
import {
  serializeMessage,
  deserializeMessage,
  serializeMessages,
  deserializeMessages,
  hasVersionData,
  migrateLegacyMessage,
} from '../../src/utils/messagePersistence';
import { Message, MessageVersion } from '../../src/types/message';

// Mock message data for testing
const createMockMessage = (id: string, content: string): Message => ({
  id,
  role: 'user',
  created: Math.floor(Date.now() / 1000),
  content: [{ type: 'text', text: content }],
});

const createMessageWithVersions = (id: string, content: string): Message => {
  const message = createMockMessage(id, content);
  const version: MessageVersion = {
    versionNumber: 1,
    content: message.content,
    timestamp: Date.now(),
    childMessageIds: [],
  };
  
  return {
    ...message,
    versions: [version],
    currentVersionIndex: 0,
  };
};

describe('messagePersistence', () => {
  describe('serializeMessage', () => {
    it('should serialize a simple message to JSON', () => {
      const message = createMockMessage('msg1', 'Test content');
      
      const result = serializeMessage(message);
      const parsed = JSON.parse(result);
      
      expect(parsed.id).toBe('msg1');
      expect(parsed.content[0].text).toBe('Test content');
      expect(parsed.role).toBe('user');
    });

    it('should serialize a message with versions', () => {
      const message = createMessageWithVersions('msg1', 'Test content');
      
      const result = serializeMessage(message);
      const parsed = JSON.parse(result);
      
      expect(parsed.versions).toHaveLength(1);
      expect(parsed.currentVersionIndex).toBe(0);
      expect(parsed.versions[0].versionNumber).toBe(1);
    });

    it('should throw error for invalid message', () => {
      const circularMessage = createMockMessage('msg1', 'Test');
      // Create circular reference
      (circularMessage as any).circular = circularMessage;
      
      expect(() => serializeMessage(circularMessage)).toThrow();
    });
  });

  describe('deserializeMessage', () => {
    it('should deserialize a simple message from JSON', () => {
      const originalMessage = createMockMessage('msg1', 'Test content');
      const serialized = serializeMessage(originalMessage);
      
      const result = deserializeMessage(serialized);
      
      expect(result.id).toBe('msg1');
      expect(result.content[0].text).toBe('Test content');
      expect(result.role).toBe('user');
    });

    it('should deserialize a message with versions', () => {
      const originalMessage = createMessageWithVersions('msg1', 'Test content');
      const serialized = serializeMessage(originalMessage);
      
      const result = deserializeMessage(serialized);
      
      expect(result.versions).toHaveLength(1);
      expect(result.currentVersionIndex).toBe(0);
      expect(result.versions![0].versionNumber).toBe(1);
    });

    it('should handle legacy messages without versions', () => {
      const legacyMessage = createMockMessage('msg1', 'Legacy content');
      const serialized = JSON.stringify(legacyMessage);
      
      const result = deserializeMessage(serialized);
      
      expect(result.id).toBe('msg1');
      expect(result.versions).toBeUndefined();
      expect(result.currentVersionIndex).toBeUndefined();
    });

    it('should validate and normalize version structure', () => {
      const messageWithInvalidVersion = {
        id: 'msg1',
        role: 'user',
        created: Math.floor(Date.now() / 1000),
        content: [{ type: 'text', text: 'Test' }],
        versions: [
          {
            // Missing required fields
            content: [{ type: 'text', text: 'Version content' }],
          }
        ],
        currentVersionIndex: 0,
      };
      const serialized = JSON.stringify(messageWithInvalidVersion);
      
      const result = deserializeMessage(serialized);
      
      expect(result.versions![0].versionNumber).toBe(1);
      expect(result.versions![0].timestamp).toBeDefined();
      expect(result.versions![0].childMessageIds).toEqual([]);
    });

    it('should throw error for invalid JSON', () => {
      expect(() => deserializeMessage('invalid json')).toThrow();
    });
  });

  describe('serializeMessages', () => {
    it('should serialize an array of messages', () => {
      const messages = [
        createMockMessage('msg1', 'Content 1'),
        createMockMessage('msg2', 'Content 2'),
      ];
      
      const result = serializeMessages(messages);
      const parsed = JSON.parse(result);
      
      expect(parsed).toHaveLength(2);
      expect(parsed[0].id).toBe('msg1');
      expect(parsed[1].id).toBe('msg2');
    });

    it('should handle empty array', () => {
      const result = serializeMessages([]);
      const parsed = JSON.parse(result);
      
      expect(parsed).toEqual([]);
    });
  });

  describe('deserializeMessages', () => {
    it('should deserialize an array of messages', () => {
      const originalMessages = [
        createMockMessage('msg1', 'Content 1'),
        createMessageWithVersions('msg2', 'Content 2'),
      ];
      const serialized = serializeMessages(originalMessages);
      
      const result = deserializeMessages(serialized);
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('msg1');
      expect(result[1].id).toBe('msg2');
      expect(result[1].versions).toHaveLength(1);
    });

    it('should handle empty array', () => {
      const result = deserializeMessages('[]');
      
      expect(result).toEqual([]);
    });

    it('should validate all messages in array', () => {
      const messagesWithInvalidVersions = [
        {
          id: 'msg1',
          role: 'user',
          created: Math.floor(Date.now() / 1000),
          content: [{ type: 'text', text: 'Test' }],
          versions: [{ content: [{ type: 'text', text: 'Version' }] }],
        }
      ];
      const serialized = JSON.stringify(messagesWithInvalidVersions);
      
      const result = deserializeMessages(serialized);
      
      expect(result[0].versions![0].versionNumber).toBe(1);
      expect(result[0].versions![0].timestamp).toBeDefined();
    });
  });

  describe('hasVersionData', () => {
    it('should return true for message with versions array', () => {
      const message = createMessageWithVersions('msg1', 'Test');
      
      expect(hasVersionData(message)).toBe(true);
    });

    it('should return true for message with currentVersionIndex', () => {
      const message = createMockMessage('msg1', 'Test');
      message.currentVersionIndex = 0;
      
      expect(hasVersionData(message)).toBe(true);
    });

    it('should return true for message with parentMessageId', () => {
      const message = createMockMessage('msg1', 'Test');
      message.parentMessageId = 'parent1';
      
      expect(hasVersionData(message)).toBe(true);
    });

    it('should return false for legacy message', () => {
      const message = createMockMessage('msg1', 'Test');
      
      expect(hasVersionData(message)).toBe(false);
    });

    it('should return false for message with currentVersionIndex = undefined explicitly', () => {
      const message = createMockMessage('msg1', 'Test');
      message.currentVersionIndex = undefined;
      
      expect(hasVersionData(message)).toBe(false);
    });
  });

  describe('migrateLegacyMessage', () => {
    it('should migrate a legacy message to support versions', () => {
      const legacyMessage = createMockMessage('msg1', 'Legacy content');
      
      const result = migrateLegacyMessage(legacyMessage);
      
      expect(result.versions).toHaveLength(1);
      expect(result.currentVersionIndex).toBe(0);
      expect(result.versions![0].versionNumber).toBe(1);
      expect(result.versions![0].content).toEqual(legacyMessage.content);
      expect(result.versions![0].timestamp).toBe(legacyMessage.created);
    });

    it('should return unchanged message if it already has version data', () => {
      const messageWithVersions = createMessageWithVersions('msg1', 'Test');
      
      const result = migrateLegacyMessage(messageWithVersions);
      
      expect(result).toEqual(messageWithVersions);
    });

    it('should preserve all original message properties', () => {
      const legacyMessage = createMockMessage('msg1', 'Legacy content');
      legacyMessage.display = false;
      legacyMessage.sendToLLM = true;
      
      const result = migrateLegacyMessage(legacyMessage);
      
      expect(result.id).toBe(legacyMessage.id);
      expect(result.role).toBe(legacyMessage.role);
      expect(result.created).toBe(legacyMessage.created);
      expect(result.display).toBe(legacyMessage.display);
      expect(result.sendToLLM).toBe(legacyMessage.sendToLLM);
      expect(result.content).toEqual(legacyMessage.content);
    });
  });
});
