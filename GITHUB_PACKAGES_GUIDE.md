# GitHub Packages Installation Guide

This guide explains how to install and use the TicketSeat.io Angular library from GitHub Packages.

## What is GitHub Packages?

GitHub Packages is GitHub's package registry that allows developers to publish and share packages directly within their GitHub repositories. This ensures the package is always in sync with the source code.

## Prerequisites

You need to authenticate with GitHub Packages to install scoped packages. You'll need:

1. A GitHub account
2. A GitHub Personal Access Token (PAT) with `read:packages` permission

## Setup GitHub Packages Authentication

### Option 1: Project-level .npmrc (Recommended)

Create a `.npmrc` file in your project root:

```
@radoman93:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

Replace `YOUR_GITHUB_TOKEN` with your GitHub Personal Access Token.

### Option 2: Global .npmrc

Create or edit `~/.npmrc` (global npm config):

```
@radoman93:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

### Option 3: Environment Variable

Set the environment variable:

```bash
export NPM_TOKEN=YOUR_GITHUB_TOKEN
```

Then use this .npmrc:

```
@radoman93:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```

## Creating a GitHub Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "NPM Package Access")
4. Select the `read:packages` scope
5. Click "Generate token"
6. Copy the token and store it securely

## Installation

Once authentication is set up, install the library:

```bash
npm install @radoman93/ticketseat-io-angular
```

Or specify the registry explicitly:

```bash
npm install @radoman93/ticketseat-io-angular --registry=https://npm.pkg.github.com
```

## Install Peer Dependencies

```bash
npm install @angular/animations @angular/common @angular/core @angular/forms @angular/platform-browser @angular/platform-browser-dynamic @angular/router mobx mobx-angular
```

## Include Styling

Add to your `src/styles.css`:

```css
@import '@radoman93/ticketseat-io-angular/styles.css';
```

## Usage Example

```typescript
import { Component } from '@angular/core';
import { EventEditorComponent } from '@radoman93/ticketseat-io-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [EventEditorComponent],
  template: '<app-event-editor></app-event-editor>'
})
export class AppComponent {
}
```

## Automatic Updates

The library is automatically published to GitHub Packages on every commit to the main branch with semantic versioning:

- **Patch**: `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:` commits
- **Minor**: `feat:` commits  
- **Major**: `feat!:` or commits with `BREAKING CHANGE` in the body

## Version History

You can see all available versions at:
https://github.com/radoman93/ticketseat-io-angular/packages

## Troubleshooting

### 401 Unauthorized Error

This usually means authentication is not properly configured. Check:

1. Your GitHub token has `read:packages` permission
2. The token is correctly set in `.npmrc`
3. The registry URL is correct

### 404 Not Found Error

This can happen if:

1. The package name is incorrect (make sure to include the `@radoman93/` scope)
2. You don't have access to the repository
3. The package hasn't been published yet

### Authentication in CI/CD

For GitHub Actions, use the built-in `GITHUB_TOKEN`:

```yaml
- name: Install dependencies
  run: npm install
  env:
    NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

For other CI systems, add your GitHub token as a secret environment variable.

## Benefits of GitHub Packages

1. **Always in sync**: Package versions match git tags
2. **Secure**: Uses GitHub's authentication and access controls
3. **Free**: No additional cost for public repositories
4. **Integrated**: Shows package info directly in the repository
5. **Automatic**: Updates published automatically on code changes 