import React from 'react';
import { Users } from 'lucide-react';

interface UserPresenceProps {
  onlineCount: number;
}

export const UserPresence: React.FC<UserPresenceProps> = ({ onlineCount }) => {
  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-1 text-sm text-gray-600">
        <Users size={16} />
        <span className="font-medium">{onlineCount} online</span>
      </div>
    </div>
  );
};