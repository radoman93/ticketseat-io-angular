# TicketSeat.io Angular Library - Styling Guide

This guide explains how to properly include styling when using the TicketSeat.io Angular library in your project.

## Problem

When you install the library using `npm install @radoman93/ticketseat-io-angular`, you might notice that the components appear unstyled. This is because Angular libraries don't automatically include their CSS files in consuming applications.

## Solution

The library now includes a compiled CSS file (`styles.css`) that contains all necessary Tailwind CSS classes and custom component styles. You need to explicitly include this CSS file in your project.

## Setup Options

### Option 1: Import in Global Styles (Recommended)

Add this line to your main `src/styles.css` or `src/styles.scss` file:

```css
@import '@radoman93/ticketseat-io-angular/styles.css';
```

### Option 2: Include in angular.json

Modify your `angular.json` file to include the CSS in the build:

```json
{
  "projects": {
    "your-app": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "src/styles.css",
              "node_modules/@radoman93/ticketseat-io-angular/styles.css"
            ]
          }
        }
      }
    }
  }
}
```

### Option 3: Use with Existing Tailwind Setup

If your project already uses Tailwind CSS, you can configure it to scan the library files:

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
    "./node_modules/@radoman93/ticketseat-io-angular/**/*.{html,ts,js,mjs}"
  ],
  theme: {
    extend: {},
  },
  plugins: [
    // Add DaisyUI if you want full compatibility
    require('daisyui'),
  ],
}
```

Then install the required dependencies:

```bash
npm install tailwindcss daisyui
```

## Verification

After setting up the styling, you should see:

- Grid lines and borders
- Properly colored seat states (green for available, red for occupied, blue for selected, yellow for reserved)
- Hover effects and transitions
- Proper toolbar and panel styling
- Responsive layout

## Included Styles

The library's CSS includes:

1. **Full Tailwind CSS** - All utility classes used by the components
2. **Custom seat styling** - `.seat`, `.seat.available`, `.seat.occupied`, etc.
3. **Component-specific classes** - `.ticketseat-container`, `.seat-grid`, etc.
4. **DaisyUI components** - For enhanced UI elements

## Custom Styling

If you want to customize the appearance, you can override the CSS classes:

```css
/* After importing the library styles */
@import '@radoman93/ticketseat-io-angular/styles.css';

/* Your custom overrides */
.seat.available {
  background-color: #your-color;
  border-color: #your-border-color;
}

.seat.selected {
  background-color: #your-selected-color;
}
```

## Troubleshooting

**Problem**: Components are still unstyled
- **Solution**: Make sure the CSS import is correctly placed and the build includes the styles

**Problem**: Some styles are missing
- **Solution**: Verify that your bundler is processing the CSS file correctly

**Problem**: Styles conflict with existing styles
- **Solution**: Use more specific CSS selectors or CSS modules to isolate the library styles

## File Size

The compiled CSS file is approximately 29KB minified, which includes:
- Tailwind CSS utilities
- Custom component styles
- Responsive design rules
- Transition and animation definitions 