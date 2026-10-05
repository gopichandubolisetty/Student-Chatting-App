import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { connectSocket, disconnectSocket } from '../services/socket';
import api from '../services/api';
import Navbar from '../components/Navbar';
import ChatBubble from '../components/ChatBubble';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';

const ChatRoom = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [connected, setConnected] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load room details + message history
  useEffect(() => {
    const loadRoom = async () => {
      try {
        const [roomRes, msgRes] = await Promise.all([
          api.get(`/rooms/${roomId}`),
          api.get(`/rooms/${roomId}/messages`),
        ]);
        setRoom(roomRes.data.data);
        setMessages(msgRes.data.data);
      } catch (err) {
        if (err.response?.status === 404) {
          toast.error('Room not found.');
          navigate('/dashboard');
        } else {
          toast.error('Failed to load room.');
        }
      } finally {
        setLoadingRoom(false);
      }
    };
    loadRoom();
  }, [roomId, navigate]);

  // Connect socket & join room
  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    const onConnect = () => {
      setConnected(true);
      socket.emit('joinRoom', { roomId });
    };

    const onDisconnect = () => {
      setConnected(false);
    };

    const onReceiveMessage = (message) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.find((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    };

    const onMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, isDeleted: true } : m))
      );
    };

    const onParticipantCount = (count) => {
      setParticipantCount(count);
    };

    const onError = (err) => {
      toast.error(err.message || 'Socket error');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('receiveMessage', onReceiveMessage);
    socket.on('messageDeleted', onMessageDeleted);
    socket.on('participantCount', onParticipantCount);
    socket.on('error', onError);

    if (socket.connected) onConnect();

    return () => {
      socket.emit('leaveRoom', { roomId });
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('receiveMessage', onReceiveMessage);
      socket.off('messageDeleted', onMessageDeleted);
      socket.off('participantCount', onParticipantCount);
      socket.off('error', onError);
    };
  }, [roomId]);

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB.');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Send message
  const handleSend = async () => {
    if (!text.trim() && !imageFile) return;
    if (!connected) {
      toast.error('Not connected. Please wait...');
      return;
    }

    setSendingMessage(true);

    try {
      let imageUrl = null;

      // Upload image first if present
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadRes = await api.post('/rooms/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrl = uploadRes.data.imageUrl;
      }

      // Emit via socket
      socketRef.current.emit('sendMessage', {
        roomId,
        text: text.trim(),
        imageUrl,
      });

      setText('');
      clearImage();
      textareaRef.current?.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loadingRoom) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Navbar />

      {/* Room header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                ← Dashboard
              </button>
              <span className="text-gray-700">/</span>
            </div>
            <h2 className="text-white font-semibold text-lg mt-0.5">
              {room?.subject?.name} — {room?.slot?.label}
            </h2>
            <p className="text-gray-400 text-sm">
              Faculty: {room?.faculty?.name} · Code: {room?.subject?.code}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-gray-400 text-sm">
              {participantCount} online
            </span>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center text-gray-600 py-16">
              <p className="text-4xl mb-3">💬</p>
              <p className="text-lg font-medium text-gray-500">No messages yet</p>
              <p className="text-sm">Be the first to say something!</p>
            </div>
          )}
          {messages.map((message) => (
            <ChatBubble
              key={message._id}
              message={message}
              isOwn={message.sender?._id === user?.id || message.sender === user?.id}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message input */}
      <div className="bg-gray-900 border-t border-gray-800 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Image preview */}
          {imagePreview && (
            <div className="mb-3 relative inline-block">
              <img
                src={imagePreview}
                alt="Upload preview"
                className="h-24 rounded-lg object-cover border border-gray-700"
              />
              <button
                onClick={clearImage}
                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-500"
              >
                ×
              </button>
            </div>
          )}

          <div className="flex items-end gap-3">
            {/* Image upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 w-10 h-10 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-white rounded-xl flex items-center justify-center transition-colors"
              title="Attach image"
            >
              📎
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Text input */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
              rows={1}
              className="flex-1 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none min-h-[42px] max-h-40"
              style={{ height: 'auto' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
              }}
            />

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={(!text.trim() && !imageFile) || sendingMessage}
              className="flex-shrink-0 w-10 h-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sendingMessage ? <Spinner size="sm" /> : '➤'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
