# Asset Path Configuration Fix

## Problem Identified
The original issue was that when the GitHub Action builds the package, the assets folder wasn't included. However, the deeper problem was that even when assets were included in the package, the hardcoded paths in the component templates like `'assets/icons/toolbar/active/round-table-tool.svg'` would always try to load from the consuming application's assets folder, not from the library's assets.

## Root Cause Analysis
1. **Build Issue**: `ng-packagr` doesn't copy static assets automatically
2. **Path Resolution Issue**: Hardcoded asset paths in templates resolve relative to the consuming app, not the library
3. **Lack of Configuration**: No way for users to configure asset paths for different deployment scenarios

## Comprehensive Solution Implemented

### 1. AssetService (New)
- **File**: `src/app/services/asset.service.ts`
- **Purpose**: Centralized asset path management with configurable base path
- **Features**:
  - Injectable service with configurable base path
  - Helper methods for toolbar icon paths
  - Support for custom asset paths via injection token

### 2. Configurable Injection Token
- **Token**: `TICKETSEAT_ASSET_BASE_PATH`
- **Default**: `'assets'`
- **Usage**: Allows users to customize the base path for assets

### 3. Updated Component Implementation
- **File**: `src/app/components/toolbars/main-toolbar/main-toolbar.component.ts`
- **Changes**: 
  - Injected AssetService
  - Added `getToolbarIcon()` method
  - Replaced hardcoded paths with service calls

### 4. Template Updates
- **File**: `src/app/components/toolbars/main-toolbar/main-toolbar.component.html`
- **Changes**: Replaced all hardcoded asset paths with service method calls
- **Before**: `'assets/icons/toolbar/active/round-table-tool.svg'`
- **After**: `getToolbarIcon('round-table-tool', isToolActive(ToolType.RoundTable))`

### 5. Public API Exports
- **File**: `src/public-api.ts`
- **Addition**: Exported `AssetService` and `TICKETSEAT_ASSET_BASE_PATH` for user configuration

### 6. Build Process (Maintained)
- **Files**: `package.json`, `add-css-export.js`, `verify-package.js`
- **Purpose**: Ensures assets are copied and package exports are configured

## User Configuration Options

### Option 1: Default Setup (Simple)
```bash
# Copy assets to standard location
cp -r node_modules/@radoman93/ticketseat-io-angular/assets ./src/assets/
```

### Option 2: Angular.json Configuration
```json
{
  "assets": [
    {
      "glob": "**/*",
      "input": "node_modules/@radoman93/ticketseat-io-angular/assets",
      "output": "assets"
    }
  ]
}
```

### Option 3: Custom Asset Path (Advanced)
```typescript
import { TICKETSEAT_ASSET_BASE_PATH } from '@radoman93/ticketseat-io-angular';

// In main.ts or app.config.ts
providers: [
  {
    provide: TICKETSEAT_ASSET_BASE_PATH,
    useValue: 'custom-path/to/assets'
  }
]
```

## Benefits of This Solution

1. **Flexible Deployment**: Works with any asset path configuration
2. **User Control**: Users can customize asset paths based on their needs
3. **Backward Compatible**: Default behavior works like before
4. **Centralized Management**: All asset paths managed in one service
5. **Type Safety**: Service provides typed methods for asset access
6. **Easy Maintenance**: Changes to asset structure only require service updates

## Implementation Details

### AssetService Methods
- `getToolbarIcon(iconName, state)`: Returns full path for a specific icon
- `getToolbarIconPaths(iconName)`: Returns both active/inactive paths
- `setBasePath(path)`: Programmatically change base path
- `getBasePath()`: Get current base path

### Icon Naming Convention
- Icons follow pattern: `{basePath}/icons/toolbar/{state}/{iconName}.svg`
- States: `active`, `inactive`
- Examples: `round-table-tool`, `rectangular-table-tool`, etc.

## Testing Verification
1. ✅ Build process includes assets
2. ✅ Package exports assets correctly
3. ✅ Service injection works properly
4. ✅ Default configuration works
5. ✅ Custom path configuration available
6. ✅ All icons render correctly in templates

## Migration Guide for Users

### For Existing Users (v1.1.3+)
No breaking changes - the library will work with the default setup as before.

### For Advanced Users
Can now configure custom asset paths:
```typescript
// main.ts
import { TICKETSEAT_ASSET_BASE_PATH } from '@radoman93/ticketseat-io-angular';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: TICKETSEAT_ASSET_BASE_PATH, useValue: 'my-assets' }
  ]
});
```

## Files Modified/Created
1. **Created**: `src/app/services/asset.service.ts`
2. **Modified**: `src/app/services/index.ts`
3. **Modified**: `src/app/components/toolbars/main-toolbar/main-toolbar.component.ts`
4. **Modified**: `src/app/components/toolbars/main-toolbar/main-toolbar.component.html`
5. **Modified**: `src/public-api.ts`
6. **Modified**: `README.md`
7. **Modified**: `USAGE_EXAMPLE.md`

This solution provides a robust, flexible asset management system that works across different deployment scenarios while maintaining backward compatibility.
