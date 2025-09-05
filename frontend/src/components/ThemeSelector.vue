<template>
  <div class="theme-selector">
    <button @click="toggleSelector" class="theme-toggle-btn">
      <span class="theme-icon">🎨</span>
      主题
    </button>
    
    <div v-if="showSelector" class="theme-dropdown">
      <h4>选择主题</h4>
      <div class="theme-options">
        <div 
          v-for="theme in availableThemes" 
          :key="theme.key"
          @click="selectTheme(theme.key)"
          :class="['theme-option', { active: currentTheme === theme.key }]"
        >
          <div class="theme-preview" :style="getThemePreviewStyle(theme.key)"></div>
          <span class="theme-name">{{ theme.name }}</span>
          <span v-if="currentTheme === theme.key" class="check-icon">✓</span>
        </div>
      </div>
    </div>
    
    <!-- 点击外部关闭 -->
    <div v-if="showSelector" @click="closeSelector" class="theme-overlay"></div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { useTheme } from '../composables/useTheme';

export default {
  name: 'ThemeSelector',
  setup() {
    const { currentTheme, setTheme, getAvailableThemes, themes } = useTheme();
    const showSelector = ref(false);
    const availableThemes = ref([]);
    
    const toggleSelector = () => {
      showSelector.value = !showSelector.value;
    };
    
    const closeSelector = () => {
      showSelector.value = false;
    };
    
    const selectTheme = (themeKey) => {
      setTheme(themeKey);
      closeSelector();
    };
    
    const getThemePreviewStyle = (themeKey) => {
      const theme = themes[themeKey];
      return {
        background: `linear-gradient(45deg, ${theme.primary} 50%, ${theme.secondary} 50%)`
      };
    };
    
    // 按ESC键关闭
    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        closeSelector();
      }
    };
    
    onMounted(() => {
      availableThemes.value = getAvailableThemes();
      document.addEventListener('keydown', handleKeydown);
    });
    
    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeydown);
    });
    
    return {
      currentTheme,
      showSelector,
      availableThemes,
      toggleSelector,
      closeSelector,
      selectTheme,
      getThemePreviewStyle
    };
  }
};
</script>

<style scoped>
.theme-selector {
  position: relative;
  display: inline-block;
}

.theme-toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: var(--theme-cardBackground, #ffffff);
  border: 1px solid var(--theme-border, #e9ecef);
  border-radius: 6px;
  color: var(--theme-textPrimary, #333);
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.theme-toggle-btn:hover {
  background-color: var(--theme-background, #f0f2f5);
  border-color: var(--theme-primary, #2196F3);
}

.theme-icon {
  font-size: 1.1rem;
}

.theme-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background-color: var(--theme-cardBackground, #ffffff);
  border: 1px solid var(--theme-border, #e9ecef);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 200px;
  padding: 1rem;
}

.theme-dropdown h4 {
  margin: 0 0 0.75rem 0;
  color: var(--theme-textPrimary, #333);
  font-size: 1rem;
  font-weight: 600;
}

.theme-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border: 1px solid transparent;
}

.theme-option:hover {
  background-color: var(--theme-background, #f0f2f5);
}

.theme-option.active {
  background-color: var(--theme-primary, #2196F3);
  color: white;
  border-color: var(--theme-primary, #2196F3);
}

.theme-preview {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--theme-border, #e9ecef);
}

.theme-option.active .theme-preview {
  border-color: white;
}

.theme-name {
  flex: 1;
  font-size: 0.9rem;
}

.check-icon {
  font-size: 1rem;
  font-weight: bold;
}

.theme-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

@media (max-width: 768px) {
  .theme-dropdown {
    right: auto;
    left: 0;
    min-width: 180px;
  }
}
</style>