import { Message, MessageVersion, MessageContent } from '../types/message';

/**
 * Utility functions for message version serialization and deserialization
 * These ensure that message versions are properly handled when persisting to/from storage
 */

/**
 * Serializes a message with versions to JSON string
 * @param message - The message to serialize
 * @returns JSON string representation
 */
export function serializeMessage(message: Message): string {
  try {
    return JSON.stringify(message);
  } catch (error) {
    console.error('Error serializing message:', error);
    throw error;
  }
}

/**
 * Deserializes a message from JSON string, ensuring version compatibility
 * @param messageJson - JSON string representation of the message
 * @returns Parsed message object
 */
export function deserializeMessage(messageJson: string): Message {
  try {
    const message = JSON.parse(messageJson) as Message;
    
    // Ensure backward compatibility for messages without versions
    if (!message.versions && !message.currentVersionIndex && !message.parentMessageId) {
      // This is a legacy message without version support
      return message;
    }
    
    // Validate version structure if present
    if (message.versions) {
      message.versions = message.versions.map(validateMessageVersion);
    }
    
    return message;
  } catch (error) {
    console.error('Error deserializing message:', error);
    throw error;
  }
}

/**
 * Validates and normalizes a message version object
 * @param version - The version to validate
 * @returns Validated version object
 */
function validateMessageVersion(version: any): MessageVersion {
  return {
    versionNumber: version.versionNumber || 1,
    content: Array.isArray(version.content) ? version.content : [],
    timestamp: version.timestamp || Date.now(),
    childMessageIds: Array.isArray(version.childMessageIds) ? version.childMessageIds : [],
  };
}

/**
 * Serializes an array of messages
 * @param messages - Array of messages to serialize
 * @returns JSON string representation
 */
export function serializeMessages(messages: Message[]): string {
  try {
    return JSON.stringify(messages);
  } catch (error) {
    console.error('Error serializing messages:', error);
    throw error;
  }
}

/**
 * Deserializes an array of messages from JSON string
 * @param messagesJson - JSON string representation of the messages
 * @returns Array of parsed message objects
 */
export function deserializeMessages(messagesJson: string): Message[] {
  try {
    const messages = JSON.parse(messagesJson) as Message[];
    return messages.map(message => {
      // Ensure each message is properly validated
      if (message.versions) {
        message.versions = message.versions.map(validateMessageVersion);
      }
      return message;
    });
  } catch (error) {
    console.error('Error deserializing messages:', error);
    throw error;
  }
}

/**
 * Checks if a message has version data
 * @param message - The message to check
 * @returns True if the message has version information
 */
export function hasVersionData(message: Message): boolean {
  return !!(message.versions || message.currentVersionIndex !== undefined || message.parentMessageId);
}

/**
 * Migrates a legacy message to support versions
 * This creates the initial version from the current content
 * @param message - The legacy message to migrate
 * @returns Migrated message with version support
 */
export function migrateLegacyMessage(message: Message): Message {
  if (hasVersionData(message)) {
    return message; // Already has version data
  }
  
  // Create initial version from current content
  const initialVersion: MessageVersion = {
    versionNumber: 1,
    content: message.content,
    timestamp: message.created,
    childMessageIds: [],
  };
  
  return {
    ...message,
    versions: [initialVersion],
    currentVersionIndex: 0,
  };
}
