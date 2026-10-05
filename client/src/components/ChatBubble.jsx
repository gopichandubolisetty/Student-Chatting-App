import { formatDistanceToNow } from '../utils/dateUtils';

const ChatBubble = ({ message, isOwn, onDelete, isAdmin }) => {
  if (message.isDeleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
        <div className="max-w-xs lg:max-w-md">
          {!isOwn && (
            <p className="text-xs text-gray-500 mb-1 ml-1">{message.senderName}</p>
          )}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl px-4 py-2">
            <p className="text-gray-500 text-sm italic">🚫 Message deleted by admin</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 group`}>
      <div className="max-w-xs lg:max-w-md xl:max-w-lg">
        {!isOwn && (
          <p className="text-xs font-medium text-indigo-400 mb-1 ml-1">{message.senderName}</p>
        )}
        <div
          className={`relative rounded-2xl px-4 py-2.5 ${
            isOwn
              ? 'bg-indigo-600 text-white rounded-tr-sm'
              : 'bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700'
          }`}
        >
          {/* Image */}
          {message.imageUrl && (
            <a href={message.imageUrl} target="_blank" rel="noopener noreferrer">
              <img
                src={message.imageUrl}
                alt="Shared image"
                className="rounded-xl max-w-full mb-1 cursor-pointer hover:opacity-90 transition-opacity"
                style={{ maxHeight: '300px', objectFit: 'cover' }}
              />
            </a>
          )}
          {/* Text */}
          {message.text && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
          )}
          {/* Timestamp */}
          <p
            className={`text-xs mt-1 ${
              isOwn ? 'text-indigo-200' : 'text-gray-500'
            }`}
          >
            {formatDistanceToNow(new Date(message.createdAt))}
          </p>

          {/* Admin delete button */}
          {isAdmin && onDelete && (
            <button
              onClick={() => onDelete(message._id)}
              className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-500 text-white text-xs rounded-full w-5 h-5 items-center justify-center hidden group-hover:flex transition-all"
              title="Delete message"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
