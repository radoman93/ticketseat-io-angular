/*
 * Public API Surface of ticketseat-io-angular
 */

// Main component export
export * from './app/components/event-editor/event-editor.component';

// Export the design data interface for proper typing
export { LayoutExportData } from './app/services/layout-export-import.service';

// Export MobX stores for advanced usage
export { layoutStore } from './app/stores/layout.store';
export { viewerStore } from './app/stores/viewer.store';
export { selectionStore } from './app/stores/selection.store';
export { gridStore } from './app/stores/grid.store';
export { toolStore } from './app/stores/tool.store';
export { chairStore } from './app/stores/chair.store';

// Export the layout metrics store for accessing layout statistics
export { layoutMetricsStore } from './app/stores/derived/layout-metrics.store';

// Export the root store for comprehensive access
export { rootStore } from './app/stores/root.store';

// Export persistence manager for save/load operations
export { persistenceManager } from './app/stores/persistence.manager';

// Export the transaction manager for bulk operations
export { transactionManager } from './app/stores/transaction.manager';

// Component exports
export * from './app/components/grid/grid.component';
export * from './app/components/toolbars/main-toolbar/main-toolbar.component';
export * from './app/components/toolbars/top-toolbar/top-toolbar.component';
export * from './app/components/properties-panel/properties-panel.component';
export * from './app/components/chair-properties-panel/chair-properties-panel.component';
export * from './app/components/reservation-panel/reservation-panel.component';
export * from './app/components/notifications/notifications.component';

// Store exports
export * from './app/stores/drag.store';
export * from './app/stores/rotation.store';
export * from './app/stores/history.store';

// Store index for convenience
export * from './app/stores/index';

// Models exports (if any)
export * from './app/models';

// Services exports
export * from './app/services';

// Commands exports
export * from './app/commands'; 