import { ref, watch } from 'vue';

// 预定义的主题色
const themes = {
  default: {
    name: '默认蓝色',
    primary: '#2196F3',
    primaryHover: '#0b7dda',
    secondary: '#4CAF50',
    secondaryHover: '#3e8e41',
    background: '#f0f2f5',
    cardBackground: '#ffffff',
    textPrimary: '#333333',
    textSecondary: '#666666',
    border: '#e9ecef'
  },
  green: {
    name: '清新绿色',
    primary: '#4CAF50',
    primaryHover: '#3e8e41',
    secondary: '#2196F3',
    secondaryHover: '#0b7dda',
    background: '#f1f8e9',
    cardBackground: '#ffffff',
    textPrimary: '#2e7d32',
    textSecondary: '#558b2f',
    border: '#c8e6c9'
  },
  purple: {
    name: '优雅紫色',
    primary: '#9c27b0',
    primaryHover: '#7b1fa2',
    secondary: '#673ab7',
    secondaryHover: '#512da8',
    background: '#f3e5f5',
    cardBackground: '#ffffff',
    textPrimary: '#4a148c',
    textSecondary: '#6a1b9a',
    border: '#e1bee7'
  },
  orange: {
    name: '活力橙色',
    primary: '#ff9800',
    primaryHover: '#f57c00',
    secondary: '#ff5722',
    secondaryHover: '#e64a19',
    background: '#fff3e0',
    cardBackground: '#ffffff',
    textPrimary: '#e65100',
    textSecondary: '#ff6f00',
    border: '#ffcc80'
  },
  dark: {
    name: '深色模式',
    primary: '#bb86fc',
    primaryHover: '#985eff',
    secondary: '#03dac6',
    secondaryHover: '#018786',
    background: '#121212',
    cardBackground: '#1e1e1e',
    textPrimary: '#ffffff',
    textSecondary: '#b3b3b3',
    border: '#333333'
  }
};

// 当前主题
const currentTheme = ref('default');

// 从localStorage加载主题
const loadTheme = () => {
  const savedTheme = localStorage.getItem('chatroom-theme');
  if (savedTheme && themes[savedTheme]) {
    currentTheme.value = savedTheme;
  }
};

// 保存主题到localStorage
const saveTheme = (themeName) => {
  localStorage.setItem('chatroom-theme', themeName);
};

// 应用CSS变量
const applyCSSVariables = (theme) => {
  const root = document.documentElement;
  Object.entries(theme).forEach(([key, value]) => {
    if (key !== 'name') {
      root.style.setProperty(`--theme-${key}`, value);
    }
  });
};

// 切换主题
const setTheme = (themeName) => {
  if (themes[themeName]) {
    currentTheme.value = themeName;
    applyCSSVariables(themes[themeName]);
    saveTheme(themeName);
  }
};

// 获取当前主题对象
const getCurrentTheme = () => {
  return themes[currentTheme.value];
};

// 获取所有可用主题
const getAvailableThemes = () => {
  return Object.entries(themes).map(([key, theme]) => ({
    key,
    name: theme.name
  }));
};

// 监听主题变化
watch(currentTheme, (newTheme) => {
  applyCSSVariables(themes[newTheme]);
}, { immediate: true });

// 初始化主题
loadTheme();

export function useTheme() {
  return {
    currentTheme,
    themes,
    setTheme,
    getCurrentTheme,
    getAvailableThemes,
    loadTheme
  };
}