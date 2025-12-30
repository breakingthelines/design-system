# @breakingthelines/design-system

The design system for Breaking The Lines — a unified component library powering BTL's frontend surfaces.

## Stack

| Layer | Tool |
|-------|------|
| Primitives | [Base UI](https://base-ui.com) |
| Components | [shadcn/ui](https://ui.shadcn.com) (Base UI variant) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Variants | [CVA](https://cva.style) |
| Icons | [Phosphor](https://phosphoricons.com) |
| Animations | [Framer Motion](https://www.framer.com/motion) |
| Component Dev | [Storybook 10](https://storybook.js.org) |
| Build | [bunchee](https://github.com/huozhi/bunchee) |
| Testing | [Vitest](https://vitest.dev) |
| Linting | [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) |
| Formatting | [Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) |

## Installation

```bash
bun add @breakingthelines/design-system
```

Ensure your `.npmrc` is configured for GitHub Packages:

```
@breakingthelines:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

## Usage

```tsx
import { Button } from '@breakingthelines/design-system';
import '@breakingthelines/design-system/styles.css';

function App() {
  return <Button variant="primary">Publish</Button>;
}
```

### Tailwind Configuration

Extend your Tailwind config to include the design system's content paths:

```typescript
// tailwind.config.ts
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@breakingthelines/design-system/dist/**/*.js',
  ],
};
```

## Development

### Prerequisites

- [Bun](https://bun.sh) v1.0+
- Node.js 20.16+ (for Storybook 10 ESM support)

### Getting Started

```bash
# Install dependencies
bun install

# Start Storybook
bun run storybook

# Run in dev mode
bun run dev
```

### Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Vite dev server |
| `bun run storybook` | Storybook at localhost:6006 |
| `bun run build` | Build library with bunchee |
| `bun run lint` | Lint with Oxlint |
| `bun run format` | Format with Oxfmt |
| `bun run format:check` | Check formatting |
| `bun run test` | Run Vitest |
| `bun run test:ui` | Vitest with UI |

## Project Structure

```
src/
├── components/
│   ├── ui/           # Base shadcn/Base UI components
│   └── patterns/     # BTL-specific composed patterns
├── tokens/           # Design tokens (colours, typography, spacing)
├── hooks/            # UI hooks (useMediaQuery, useTheme)
├── lib/              # Utilities (cn, formatters)
└── styles/           # Global styles, CSS variables
```

## Adding Components

### From shadcn

```bash
bunx shadcn@latest add button
```

Components are copied into `src/components/ui/` with full ownership.

### Icons

We use Phosphor icons. Import with weight variants:

```tsx
import { CaretDown, Check, X } from '@phosphor-icons/react';

// Default weight
<CaretDown size={16} />

// Specific weight
<CaretDown size={16} weight="bold" />

// Available weights: thin, light, regular, bold, fill, duotone
```

### Component Guidelines

1. **Use CVA for variants**
   ```tsx
   import { cva, type VariantProps } from 'class-variance-authority';

   const buttonVariants = cva(
     'inline-flex items-center justify-center rounded-sm',
     {
       variants: {
         variant: {
           primary: 'bg-red-300 text-white',
           secondary: 'bg-grey-100 text-white',
         },
         size: {
           sm: 'h-8 px-3 text-sm',
           md: 'h-10 px-4 text-base',
         },
       },
       defaultVariants: {
         variant: 'primary',
         size: 'md',
       },
     }
   );
   ```

2. **Use cn() for class merging**
   ```tsx
   import { cn } from '#lib/utils';

   function Button({ className, variant, size, ...props }) {
     return (
       <button
         className={cn(buttonVariants({ variant, size }), className)}
         {...props}
       />
     );
   }
   ```

3. **Write stories alongside components**
   ```
   src/components/ui/button/
   ├── button.tsx
   ├── button.stories.tsx
   └── index.ts
   ```

## Publishing

Builds are published to GitHub Packages via CI on version tags.

```bash
# Bump version
bun version patch  # or minor, major

# Push with tags
git push --follow-tags
```

## Contributing

1. Create a branch from `main`
2. Make changes with tests and stories
3. Run `bun run lint && bun run test`
4. Open a PR

## Licence

Private — Breaking The Lines © 2025
