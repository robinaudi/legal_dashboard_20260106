import React from 'react';

interface PermissionGuardProps {
  hasPermission: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode; // 當沒有權限時顯示的內容 (預設為不顯示)
}

/**
 * 權限守門員
 * 如果 hasPermission 為 true，顯示 children
 * 否則顯示 fallback (預設為 null)
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({ hasPermission, children, fallback = null }) => {
  if (hasPermission) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
};

export default PermissionGuard;
