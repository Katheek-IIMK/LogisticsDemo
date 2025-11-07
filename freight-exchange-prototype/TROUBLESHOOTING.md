# Troubleshooting Guide

## Turbopack Errors

If you encounter Turbopack internal errors like:
```
TurbopackInternalError: inner_of_uppers_lost_follower is not able to remove follower...
```

### Solution 1: Use Webpack Instead (Recommended - Already Configured)

The default `npm run dev` command now uses `TURBOPACK=0` environment variable to disable Turbopack and use the stable Webpack bundler instead.

If you want to use Turbopack (optional), use:
```bash
npm run dev:turbo
```

### Solution 2: Downgrade to Next.js 15 (If Solution 1 Doesn't Work)

If the environment variable doesn't work, downgrade to Next.js 15 which doesn't have Turbopack enabled by default:

```bash
npm install next@15 react@18 react-dom@18 @types/react@18 @types/react-dom@18
```

Then update your `package.json` scripts back to:
```json
"dev": "next dev",
```

### Solution 3: Clear Build Cache

1. Delete the `.next` folder:
```bash
# Windows PowerShell
Remove-Item -Recurse -Force .next

# Windows CMD
rmdir /s /q .next

# Mac/Linux
rm -rf .next
```

2. Clear npm cache:
```bash
npm cache clean --force
```

3. Delete `node_modules` and reinstall:
```bash
Remove-Item -Recurse -Force node_modules
npm install
```

### Solution 3: Downgrade Next.js (If Issues Persist)

If the error continues, you can temporarily use Next.js 15:
```bash
npm install next@15 react@18 react-dom@18
```

Then update your `package.json` scripts to not use Turbopack by default.

## Other Common Issues

### Port Already in Use

If port 3000 is already in use:
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use a different port
npm run dev -- -p 3001
```

### TypeScript Errors

If you see TypeScript errors:
1. Restart your IDE/editor
2. Run `npm run build` to check for actual errors
3. Delete `.next` folder and try again

### Module Not Found Errors

If you see "Module not found" errors:
1. Make sure all dependencies are installed: `npm install`
2. Check that file paths use `@/` alias correctly
3. Verify `tsconfig.json` has correct path mappings

### Build Errors

If build fails:
1. Check for TypeScript errors: `npx tsc --noEmit`
2. Check for linting errors: `npm run lint`
3. Clear `.next` folder and rebuild: `rm -rf .next && npm run build`

## Performance Tips

- **First Build**: Can take 30-60 seconds, this is normal
- **Hot Reload**: Changes should reflect within 1-2 seconds
- **Large Files**: If loading is slow, check browser console for errors

## Getting Help

If issues persist:
1. Check Next.js documentation: https://nextjs.org/docs
2. Check Next.js GitHub issues: https://github.com/vercel/next.js/issues
3. Ensure Node.js version is 18+ (check with `node --version`)

