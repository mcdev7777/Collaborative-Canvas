import React from 'react';
import { Users } from 'lucide-react';

interface User {
  id: string;
  name: string;
  color: string;
  isOnline: boolean;
}

interface UserPresenceProps {
  users: User[];
}

export const UserPresence: React.FC<UserPresenceProps> = ({ users }) => {
  const onlineUsers = users.filter(user => user.isOnline);

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-1 text-sm text-gray-600">
        <Users size={16} />
        <span className="font-medium">{onlineUsers.length} online</span>
      </div>
      <div className="flex -space-x-2">
        {onlineUsers.slice(0, 5).map((user, index) => (
          <div
            key={user.id}
            className="relative inline-flex items-center justify-center w-8 h-8 text-xs font-medium text-white rounded-full border-2 border-white shadow-sm hover:shadow-md transition-all duration-300 ease-in-out transform hover:scale-110 hover:z-10"
            style={{ 
              backgroundColor: user.color,
              zIndex: onlineUsers.length - index
            }}
            title={user.name}
          >
            {user.name.charAt(0).toUpperCase()}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-pulse"></div>
          </div>
        ))}
        {onlineUsers.length > 5 && (
          <div className="flex items-center justify-center w-8 h-8 text-xs font-medium text-gray-600 bg-gray-200 rounded-full border-2 border-white shadow-sm hover:shadow-md transition-all duration-300 ease-in-out transform hover:scale-110">
            +{onlineUsers.length - 5}
          </div>
        )}
      </div>
    </div>
  );
};