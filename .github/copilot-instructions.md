# Smart Laundry POS - GitHub Copilot Instructions

Always follow these instructions first and fallback to additional search and context gathering only if the information in these instructions is incomplete or found to be in error.

## Working Effectively

### Bootstrap, Build, and Test Repository
Always run these commands in sequence for fresh repository setup:

```bash
# Step 1: Install dependencies (takes ~20 seconds)
npm install

# Step 2: Build for production (takes ~9 seconds) - NEVER CANCEL
npm run build
```

**CRITICAL TIMEOUT WARNINGS:**
- Set timeouts to at least 60 seconds for `npm install` 
- Set timeouts to at least 30 seconds for `npm run build`
- NEVER CANCEL builds or installations - wait for completion

### Development Workflow
```bash
# Start development server (ready in ~270ms)
npm run dev
# Application available at: http://localhost:8080/

# Preview built version
npm run preview
# Preview available at: http://localhost:4173/

# Lint code (takes ~3 seconds, may show errors - this is normal)
npm run lint
```

### Validation Requirements
**ALWAYS perform these validation steps after making changes:**

1. **Build Validation**: Run `npm run build` and ensure it completes successfully
2. **Lint Check**: Run `npm run lint` (ignore existing TypeScript `@typescript-eslint/no-explicit-any` errors)
3. **Development Test**: Start `npm run dev` and verify application loads
4. **Functional Test**: Navigate to landing page, test login page access, verify PWA features

**Manual Validation Scenarios:**
- Test the landing page loads at `http://localhost:8080/`
- Verify login page is accessible via "Masuk" button
- Confirm PWA install prompts appear on mobile/compatible browsers
- Test navigation between public routes (/, /login, /install)

## Build System Details

### Technology Stack
- **Build Tool**: Vite 5.4+ with React SWC plugin
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components  
- **Backend**: Supabase (PostgreSQL database)
- **State Management**: React Query + Context API
- **PWA**: Service Worker + Web App Manifest

### Build Configuration
- **Output Directory**: `dist/`
- **Build Command**: `npm run build`
- **Development Mode**: `npm run build:dev`
- **Preview Command**: `npm run preview`

### Critical Files and Locations
- **Main Entry**: `src/main.tsx` (includes PWA service worker registration)
- **App Router**: `src/App.tsx` (React Router with protected routes)
- **PWA Manifest**: `public/manifest.json`
- **Service Worker**: `public/sw.js`
- **Build Config**: `vite.config.ts`
- **Database Config**: `src/integrations/supabase/client.ts`

## Database and Supabase

### Database Setup
The application uses Supabase with pre-configured connection. Database migrations are located in:
```
supabase/migrations/
```

**Important**: Supabase configuration is already set up in `src/integrations/supabase/client.ts`. Do not modify these settings unless explicitly required.

### Key Database Tables
- `customers` - Customer information and contact details
- `orders` - Main order records with dual status tracking
- `order_items` - Individual service items within orders
- `services` - Service definitions and pricing
- `stores` - Multi-tenant store management

## Application Structure

### Route Structure
- `/` - Landing page (public)
- `/login` - Authentication (public) 
- `/install` - PWA installation guide (public)
- `/home` - Main POS interface (protected)
- `/pos` - Legacy POS interface (protected)
- `/order-history` - Order management (protected)
- `/services` - Service management (owner only)
- `/stores` - Store management (owner only)
- `/receipt/:orderId` - Public receipt view

### Key Components
- **POS System**: `src/components/pos/` - Main point of sale interface
- **Order Management**: `src/pages/OrderHistoryOptimized.tsx`
- **Authentication**: `src/contexts/AuthContext.tsx`
- **Store Management**: `src/contexts/StoreContext.tsx`

## Deployment

### Production Deployment
```bash
# Deploy to Vercel (recommended)
npm run build
vercel --prod

# Alternative: Use provided script
./script/deploy-prod.sh
```

### Environment Variables
For WhatsApp integration, set these in production:
```env
VITE_WHATSAPP_ENABLED=true
VITE_WHATSAPP_API_URL=your_api_url
VITE_WHATSAPP_NOTIFY_ORDER_CREATED=true
VITE_WHATSAPP_NOTIFY_ORDER_COMPLETED=true
```

## Progressive Web App (PWA)

### PWA Features Implemented
- ✅ Service worker for offline functionality
- ✅ Web app manifest with proper icons
- ✅ Install prompts for mobile devices
- ✅ Offline fallback page
- ✅ Background sync capabilities

### PWA Testing
```bash
# Build and test PWA features
npm run build
npm run preview

# Open http://localhost:4173/ in Chrome
# Check DevTools → Application → Service Workers
# Verify DevTools → Application → Manifest
# Test install prompts on mobile devices
```

## Common Issues and Solutions

### Linting Errors
The codebase currently has TypeScript linting errors (mainly `@typescript-eslint/no-explicit-any`). These are non-blocking:
- Run `npm run lint` to see current issues
- Focus on fixing new errors you introduce
- Do not modify existing error-prone files unless necessary

### Build Warnings
Expect these normal warnings during build:
- "browsers data (caniuse-lite) is 10 months old" - non-critical
- Chunk size warnings - optimized with manual chunking

### Service Worker Issues
If PWA features aren't working:
1. Check browser console for service worker registration
2. Verify `public/sw.js` exists and is valid
3. Clear browser cache and reload
4. Ensure HTTPS in production (required for PWA)

## Development Best Practices

### Code Changes
- Always test changes with `npm run dev` first
- Run `npm run build` before committing
- Verify PWA functionality if modifying public assets
- Test responsive design on mobile devices

### File Modifications
**Frequently Modified Areas:**
- `src/components/pos/` - POS interface components
- `src/pages/` - Route components
- `src/hooks/` - Custom React hooks
- `src/integrations/whatsapp/` - WhatsApp integration

**Rarely Modified (Be Careful):**
- `src/integrations/supabase/client.ts` - Database configuration
- `public/manifest.json` - PWA configuration
- `vite.config.ts` - Build configuration

### Testing Approach
1. **Unit Level**: Test individual component changes
2. **Integration Level**: Verify data flow between components
3. **User Flow Level**: Test complete workflows (create order, process payment)
4. **PWA Level**: Verify offline functionality and install process

## Performance Considerations

### Build Performance
- Build time: ~9 seconds (normal)
- Bundle size: Optimized with manual code splitting
- Asset optimization: Terser minification enabled

### Runtime Performance
- Service worker caching for fast loading
- React Query for efficient data fetching
- Lazy loading for route components
- Optimized bundle chunks for faster initial load

## Known Working Commands Reference

```bash
# Guaranteed working commands (validated):
npm install                    # 20 seconds
npm run build                  # 9 seconds  
npm run dev                    # Ready in 270ms
npm run preview               # Instant start
npm run lint                  # 3 seconds (shows existing errors)

# Directory navigation:
cd /path/to/smart-laundry-pos  # Always use absolute paths

# Quick health check:
ls package.json && npm run build && echo "✅ Build successful"
```

## Emergency Procedures

### If Build Fails
1. Check Node.js version (should work with Node 16+)
2. Clear node_modules: `rm -rf node_modules package-lock.json`
3. Reinstall: `npm install`
4. Retry build: `npm run build`

### If Application Won't Start
1. Verify dependencies: `npm install`
2. Check for TypeScript errors: `npm run lint`
3. Try clean build: `npm run build`
4. Start development server: `npm run dev`

### If PWA Features Break
1. Check `public/sw.js` exists and is valid JavaScript
2. Verify `public/manifest.json` is valid JSON
3. Clear browser application storage
4. Re-register service worker

---

**Remember**: Always validate every command before documenting it. If unsure about a command, test it first in the development environment.