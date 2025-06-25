# Message Edit Feature Documentation

## Overview

The Message Edit feature allows users to edit any previously sent message in a Goose Desktop chat session. When a message is edited, the conversation flow updates to show only the responses generated from the edited version, while maintaining a navigable history of all edits.

## Architecture

### Data Model

The feature extends the existing `Message` interface with version support:

```typescript
interface Message {
  // ... existing fields
  versions?: MessageVersion[];
  currentVersionIndex?: number;
  parentMessageId?: string;
}

interface MessageVersion {
  versionNumber: number;
  content: MessageContent[];
  timestamp: number;
  childMessageIds: string[];
}
```

### Key Components

1. **Message Version Utilities** (`utils/messageVersionUtils.ts`)
   - Core logic for creating, switching, and managing message versions
   - Functions for computing active version paths and hiding downstream messages

2. **Message Persistence** (`utils/messagePersistence.ts`)
   - Serialization/deserialization utilities for version data
   - Backward compatibility support for legacy messages

3. **UserMessage Component** (`components/UserMessage.tsx`)
   - Edit icon that appears on hover
   - In-place editing with textarea
   - Keyboard shortcuts (Enter to save, Escape to cancel)

4. **VersionNavigator Component** (`components/VersionNavigator.tsx`)
   - Navigation controls for switching between message versions
   - Displays current version (e.g., "< 2 / 3 >")

5. **useMessageStream Hook** (`hooks/useMessageStream.ts`)
   - Extended with `editMessage` and `switchMessageVersion` functions
   - Manages `activeVersionPath` state for filtering

6. **ChatView Component** (`components/ChatView.tsx`)
   - Message filtering based on version paths
   - Integration of edit functionality

## User Flow

1. **Edit Activation**
   - User hovers over their message → Edit icon appears
   - User clicks edit icon → Message becomes editable in-place
   - Textarea is pre-filled with current message content

2. **Editing**
   - User modifies message text
   - Save with Enter key (Shift+Enter for newlines)
   - Cancel with Escape key or Cancel button

3. **Version Creation**
   - Original message is preserved as version 1
   - Edited content becomes version 2
   - Downstream messages are hidden
   - AI generates new response based on edited message

4. **Version Navigation**
   - Version navigator appears: `< 2 / 2 >`
   - Users can click arrows to switch between versions
   - Conversation view updates to show selected version's branch

## Implementation Details

### Version Management

```typescript
// Creating a new version
const updatedMessage = createNewVersion(originalMessage, newContent);

// Switching versions
const switchedMessage = switchVersion(message, versionIndex);

// Computing active path
const activePath = computeActiveVersionPath(messages);
```

### Message Filtering

Messages are filtered in ChatView based on:
1. `display` property (false = hidden)
2. `activeVersionPath` (only show messages in current branch)
3. Tool response filtering (hide standalone tool responses)

### Keyboard Shortcuts

- **Enter**: Save edit (without Shift)
- **Shift+Enter**: New line in edit mode
- **Escape**: Cancel edit
- **Tab**: Navigate between edit controls
- **Enter/Space**: Activate edit button

### Accessibility Features

- ARIA labels for all interactive elements
- Proper focus management during edit mode
- Screen reader announcements for version changes
- Keyboard navigation support throughout
- High contrast focus indicators

## API Integration

The feature works seamlessly with the existing backend:
- Message versions are automatically serialized in requests
- No server-side changes required
- Backward compatibility maintained

## Testing

### Unit Tests
- Message version utilities (`messageVersionUtils.test.ts`)
- Message persistence (`messagePersistence.test.ts`)
- UserMessage edit functionality (`UserMessage.edit.test.tsx`)
- VersionNavigator component (`VersionNavigator.test.tsx`)
- ChatView filtering logic (`ChatView.filtering.test.tsx`)

### Test Coverage
- Version creation and switching
- Edit mode activation and interaction
- Keyboard shortcuts and accessibility
- Message filtering and display
- Error handling and edge cases

## Performance Considerations

- Version data is stored efficiently in memory
- Filtering is performed client-side with minimal overhead
- No impact on existing message rendering performance
- Lazy loading of version history when needed

## Browser Compatibility

- Works in all modern browsers supported by Electron
- No external dependencies required
- Uses standard web APIs for keyboard/mouse interaction

## Future Enhancements

Potential improvements identified but not implemented:
- Diff view between versions
- Bulk edit operations
- Full conversation tree visualization
- Collaborative editing features
- Version history export options

## Troubleshooting

### Common Issues

1. **Edit icon not appearing**
   - Ensure `onEditMessage` prop is passed to UserMessage
   - Check hover state CSS is working

2. **Version navigator not showing**
   - Verify message has multiple versions
   - Check `hasMultipleVersions` utility function

3. **Keyboard shortcuts not working**
   - Ensure textarea has focus
   - Check for event propagation issues

### Debug Information

Enable debug logging:
```typescript
// In messageVersionUtils.ts
console.log('Creating new version:', { messageId, newContent });
```

## Migration Guide

### From Legacy Messages

Existing messages without version data are automatically compatible:
- No migration required
- First edit creates version history
- Original content preserved as version 1

### Updating Components

To add edit functionality to custom message components:
```typescript
<UserMessage 
  message={message}
  onEditMessage={editMessage}
  onSwitchVersion={switchMessageVersion}
/>
```

## Security Considerations

- All user input is sanitized through existing message content validation
- No additional XSS vectors introduced
- Version data follows same security model as regular messages
- No sensitive data stored in version history
