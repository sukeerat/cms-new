import React from 'react';
import { Button, Tooltip, Layout, Divider } from 'antd';
import {
  MenuOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SunOutlined,
  MoonOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { NotificationDropdown } from '../../features/common/notifications';

const { Header } = Layout;

const LayoutHeader = ({
  collapsed,
  onToggleCollapse,
  onMobileOpen,
  isDesktop,
  darkMode,
  toggleTheme,
  themeRef,
  onProfileClick,
  onLogoutClick,
}) => {
  return (
    <Header
      className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 md:px-6 bg-surface border-b border-border shadow-sm transition-all duration-300"
      style={{
        lineHeight: 'normal',
        paddingInline: '24px',
      }}
    >
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <Tooltip title={isDesktop ? (collapsed ? "Expand sidebar" : "Collapse sidebar") : "Open menu"}>
          <Button
            type="text"
            icon={
              isDesktop ? (
                collapsed ? <MenuUnfoldOutlined className="text-lg" /> : <MenuFoldOutlined className="text-lg" />
              ) : (
                <MenuOutlined className="text-lg" />
              )
            }
            onClick={() => (isDesktop ? onToggleCollapse() : onMobileOpen())}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          />
        </Tooltip>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Theme Toggle */}
        <Tooltip title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
          <Button
            type="text"
            ref={themeRef}
            icon={
              darkMode ? (
                <SunOutlined className="text-lg text-amber-400" />
              ) : (
                <MoonOutlined className="text-lg text-indigo-500" />
              )
            }
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-100 dark:hover:border-slate-600 transition-all duration-200"
          />
        </Tooltip>

        {/* Notifications */}
        <div className="relative">
          <NotificationDropdown />
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 mx-2" />

        {/* User Profile Button */}
        <Tooltip title="View profile">
          <Button
            type="text"
            icon={<UserOutlined className="text-lg" />}
            onClick={onProfileClick}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-100 dark:hover:border-slate-600 transition-all duration-200"
          />
        </Tooltip>

        {/* Logout Button */}
        <Button
          type="primary"
          danger
          onClick={onLogoutClick}
          icon={<LogoutOutlined />}
          className="h-10 px-4 rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95 bg-red-500 hover:bg-red-600 border-red-500 hover:border-red-600"
        >
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </Header>
  );
};

export default LayoutHeader;