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
    </div>
  );
};