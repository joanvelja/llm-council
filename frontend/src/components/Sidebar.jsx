import { useState } from 'react';
import './Sidebar.css';

export default function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(null);

  const handleDeleteClick = (e, convId) => {
    e.stopPropagation();
    setConfirmingDelete(convId);
  };

  const handleConfirmDelete = (e, convId) => {
    e.stopPropagation();
    onDeleteConversation(convId);
    setConfirmingDelete(null);
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setConfirmingDelete(null);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>LLM Council</h1>
        <button className="new-conversation-btn" onClick={onNewConversation}>
          + New Conversation
        </button>
      </div>

      <div className="conversation-list">
        {conversations.length === 0 ? (
          <div className="no-conversations">No conversations yet</div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className={`conversation-item ${conv.id === currentConversationId ? 'active' : ''
                } ${confirmingDelete === conv.id ? 'confirming' : ''}`}
              onClick={() => onSelectConversation(conv.id)}
            >
              <div className="conversation-content">
                <div className="conversation-title">
                  {conv.title || 'New Conversation'}
                </div>
                <div className="conversation-meta">
                  {conv.message_count} messages
                </div>
              </div>

              {confirmingDelete === conv.id ? (
                <div className="delete-confirm">
                  <span className="delete-confirm-text">Delete?</span>
                  <button
                    className="confirm-btn yes"
                    onClick={(e) => handleConfirmDelete(e, conv.id)}
                    title="Confirm delete"
                  >
                    ✓
                  </button>
                  <button
                    className="confirm-btn no"
                    onClick={handleCancelDelete}
                    title="Cancel"
                  >
                    ✗
                  </button>
                </div>
              ) : (
                <button
                  className="delete-btn"
                  onClick={(e) => handleDeleteClick(e, conv.id)}
                  title="Delete conversation"
                >
                  🗑
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
