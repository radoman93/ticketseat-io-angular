/**
 * MobX Store System Exports
 * 
 * This file exports all stores and managers from the MobX system
 * to make them easily importable by the rest of the application.
 */

// Root store
export { rootStore } from './root.store';

// Core stores
export { layoutStore } from './layout.store';
export { selectionStore } from './selection.store';
export { toolStore } from './tool.store';
export { gridStore } from './grid.store';

// Derived stores
export { layoutMetricsStore } from './derived/layout-metrics.store';

// Managers
export { transactionManager } from './transaction.manager';
export { persistenceManager } from './persistence.manager';

// Types and interfaces
export type { LayoutMetrics } from './derived/layout-metrics.store';
export type { GridDialogData } from '../modules/layout-manager/dialogs/create-grid-dialog.component'; 