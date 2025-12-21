import { theme } from 'antd';

const { defaultAlgorithm, darkAlgorithm } = theme;

// Primary blue from Tailwind (blue-500 for light, blue-400 for dark)
const PRIMARY_LIGHT = '#3b82f6';
const PRIMARY_DARK = '#60a5fa';

export const lightTheme = {
  token: {
    colorPrimary: PRIMARY_LIGHT,
    colorInfo: PRIMARY_LIGHT,
    colorSuccess: '#22c55e', // green-500
    colorWarning: '#f59e0b', // amber-500
    colorError: '#ef4444',   // red-500
    colorBgLayout: '#f1f5f9', // slate-100 (matches Layout.jsx)
    colorBgContainer: '#ffffff',
    colorTextBase: '#0f172a', // slate-900
    colorTextSecondary: '#334155', // slate-700
    colorBorder: '#e2e8f0', // slate-200
    fontFamily: "'Inter', system-ui, sans-serif",
    borderRadius: 10,
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
  },
  algorithm: defaultAlgorithm,
  components: {
    Card: {
      colorBorderSecondary: '#f1f5f9',
    },
    Table: {
      headerBg: '#f8fafc',
      headerColor: '#475569',
    },
    Button: {
      fontWeight: 500,
      controlHeight: 38,
    },
    Input: {
      controlHeight: 38,
    },
    Select: {
      controlHeight: 38,
    },
  },
};

export const darkTheme = {
  token: {
    colorPrimary: PRIMARY_DARK,
    colorInfo: PRIMARY_DARK,
    colorSuccess: '#4ade80', // green-400
    colorWarning: '#fbbf24', // amber-400
    colorError: '#f87171',   // red-400
    colorBgLayout: '#020617', // slate-950
    colorBgContainer: '#0f172a', // slate-900
    colorBgElevated: '#1e293b', // slate-800
    colorBorder: '#1e293b', // slate-800
    colorBorderSecondary: '#334155', // slate-700
    colorTextBase: '#f8fafc', // slate-50
    colorTextSecondary: '#94a3b8', // slate-400
    fontFamily: "'Inter', system-ui, sans-serif",
    borderRadius: 10,
  },
  algorithm: darkAlgorithm,
  components: {
    Card: {
      colorBgContainer: '#0f172a',
    },
    Table: {
      colorBgContainer: '#0f172a',
      headerBg: '#1e293b',
    },
    Modal: {
      contentBg: '#0f172a',
      headerBg: '#0f172a',
    },
    Drawer: {
      colorBgElevated: '#0f172a',
    },
    Menu: {
      itemBg: 'transparent',
    },
  },
};
