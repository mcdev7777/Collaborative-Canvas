import React, { useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Message } from '../lib/Types';
import { formatTime } from '../lib/Utils';

interface ChatProps {
  messages: Message[];
  newMessage: string;
  setNewMessage: React.Dispatch<React.SetStateAction<string>>;
  socketRef: React.MutableRefObject<WebSocket | null>;
}

export const Chat: React.FC<ChatProps> = ({
  messages,
  newMessage,
  setNewMessage,
  socketRef,
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = () => {
    if (newMessage.trim() && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'chat', text: newMessage.trim() }));
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full w-full min-w-[300px] max-w-[400px] bg-[#1a1f2a] rounded-lg border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-[#101521]">
        <h3 className="text-white font-semibold text-lg">Team Chat</h3>
        <p className="text-sm text-gray-400">{messages.length} messages</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin min-h-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className="flex flex-col bg-white border border-black rounded-md p-2 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: message.userColor }}
              />
              <span className="text-sm font-medium text-gray-900">{message.username}</span>
              <span className="text-xs text-gray-500">{formatTime(new Date(message.timestamp))}</span>
            </div>
            <p className="text-sm text-gray-800 ml-5">{message.text}</p>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700 bg-[#101521]">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 transition"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
