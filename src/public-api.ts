/*
 * Public API Surface of ticketseat-io-angular
 */

// Main component exports
export * from './app/components/event-editor/event-editor.component';
export * from './app/components/event-viewer/event-viewer.component';

// Export the design data interface for proper typing
export type { LayoutExportData } from './app/services/layout-export-import.service';

// Export MobX stores for advanced usage
export { layoutStore } from './app/stores/layout.store';
export { default as viewerStore } from './app/stores/viewer.store';
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
// export * from './app/stores/drag.store';
export * from './app/stores/history.store';

// Store index for convenience
export * from './app/stores/index';

// Models exports (if any)
export * from './app/models';

// Specific service exports (avoiding problematic index imports)
export * from './app/services/layout-export-import.service';
export * from './app/services/layout-validator.service';
export * from './app/services/asset.service';

// Specific command exports (avoiding problematic index imports)
export * from './app/commands/add-object.command';
export * from './app/commands/delete-object.command';
export * from './app/commands/move-object.command';
export * from './app/commands/rotate-object.command'; 