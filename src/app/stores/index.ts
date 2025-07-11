/**
 * MobX Store System Exports
 * 
 * This file exports all stores and managers from the MobX system
 * to make them easily importable by the rest of the application.
 */

// MobX Store exports
export { gridStore } from './grid.store';
export { toolStore } from './tool.store';
export { selectionStore } from './selection.store';
export { layoutStore } from './layout.store';
// export { dragStore } from './drag.store';
export { default as viewerStore } from './viewer.store';
export { chairStore } from './chair.store';
export { HistoryStore } from './history.store';

// Root store
export { rootStore } from './root.store';

// Persistence and Transaction managers
export { persistenceManager } from './persistence.manager';
export { transactionManager } from './transaction.manager';

// Derived stores
export { layoutMetricsStore } from './derived/layout-metrics.store';

// Types and interfaces
export type { LayoutMetrics } from './derived/layout-metrics.store';
// Temporarily commented out due to Angular Material dependency issues
// export type { GridDialogData } from '../modules/layout-manager/dialogs/create-grid-dialog.component'; 