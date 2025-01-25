<template>
  <div class="shortcuts-config">
    <div 
      v-for="(actions, category) in actionsByCategory"
      :key="category"
      class="shortcut-category"
    >
      <h3>{{ category }}</h3>
      <div 
        v-for="action in actions"
        :key="action.id"
        class="shortcut-item"
      >
        <div class="action-info">
          <span class="icon">{{ action.icon }}</span>
          <span class="label">{{ action.label }}</span>
        </div>
        <ShortcutInput
          :value="shortcuts[action.id]"
          @update="updateShortcut(action.id, $event)"
        />
      </div>
    </div>
  </div>
</template> 