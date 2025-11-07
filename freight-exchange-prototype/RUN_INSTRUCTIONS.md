# How to Run the Application

## Prerequisites

- **Node.js 18+** installed on your system
- **npm** (comes with Node.js)

## Quick Start

### 1. Install Dependencies

First, make sure all dependencies are installed:

```bash
cd freight-exchange-prototype
npm install
```

### 2. Start the Development Server

Run the development server:

```bash
npm run dev
```

The application will start on **http://localhost:3000**

### 3. Open in Browser

Open your browser and navigate to:
```
http://localhost:3000
```

## Available Scripts

### Development
```bash
npm run dev
```
- Starts Next.js development server
- Uses Webpack (Turbopack disabled for stability)
- Hot reload enabled
- Runs on port 3000

### Build for Production
```bash
npm run build
```
- Creates optimized production build
- Generates static files in `.next` folder

### Start Production Server
```bash
npm run start
```
- Starts production server
- Requires `npm run build` first

### Linting
```bash
npm run lint
```
- Runs ESLint to check code quality

## First Run Checklist

1. ✅ Install dependencies: `npm install`
2. ✅ Start dev server: `npm run dev`
3. ✅ Open browser: http://localhost:3000
4. ✅ Select a role (Load Owner, Fleet Manager, or Driver)
5. ✅ Test the workflow

## Testing the Backend/Frontend Separation

### Verify Backend is Working

1. **Check API Routes**: Visit http://localhost:3000/api/loads
   - Should return `[]` (empty array) initially
   - This confirms the API is running

2. **Check Data Storage**: 
   - After creating a load, check `data/store.json`
   - File should be created automatically
   - Contains all persisted data

### Test the Flow

1. **As Load Owner**:
   - Create a shipment (e.g., Hyderabad → Guntur)
   - Data is saved to backend
   - Check `data/store.json` to see the load

2. **As Fleet Manager**:
   - Switch to Fleet Manager role
   - Go to "Load Matching" step
   - You should see the load created by Load Owner
   - Select it and proceed through workflow

3. **As Driver**:
   - After Fleet Manager dispatches
   - Switch to Driver role
   - You should see the trip with actual data

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
# Kill the process using port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use a different port
PORT=3001 npm run dev
```

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Data Not Persisting

1. Check that `data/` directory exists
2. Verify file permissions (should be writable)
3. Check browser console for errors
4. Verify API routes are accessible

### Backend API Not Responding

1. Check server logs in terminal
2. Verify API routes exist in `app/api/`
3. Test API directly: `curl http://localhost:3000/api/loads`
4. Check for TypeScript errors: `npm run lint`

## Development Tips

### View Backend Data

The backend stores data in `data/store.json`. You can:
- View it directly in a text editor
- Monitor changes as you use the app
- Manually edit for testing (be careful!)

### API Testing

Use these endpoints to test:

```bash
# Get all loads
curl http://localhost:3000/api/loads

# Get all trips
curl http://localhost:3000/api/trips

# Get KPIs
curl http://localhost:3000/api/kpis
```

### Hot Reload

- Changes to frontend components reload automatically
- Changes to API routes require server restart
- Changes to backend services require server restart

## Production Deployment

### Build for Production

```bash
npm run build
npm run start
```

### Environment Variables

Create `.env.local` for production:

```env
NEXT_PUBLIC_API_URL=/api
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

## File Structure

```
freight-exchange-prototype/
├── app/
│   ├── api/          # Backend API (runs on server)
│   └── [pages]/      # Frontend pages (runs in browser)
├── lib/
│   ├── backend/      # Backend logic
│   └── api-client.ts # Frontend API client
├── data/             # Backend data storage (created automatically)
│   └── store.json
└── package.json
```

## Next Steps After Running

1. **Test Load Owner Flow**:
   - Create a shipment
   - Verify it appears in backend data

2. **Test Fleet Manager Flow**:
   - View loads from Load Owner
   - Create recommendation
   - Dispatch trip

3. **Test Driver Flow**:
   - View dispatched trip
   - Update trip status
   - Mark checkpoints

4. **Verify Data Persistence**:
   - Refresh page
   - Data should persist
   - Check `data/store.json`

## Support

If you encounter issues:
1. Check the terminal for error messages
2. Check browser console (F12)
3. Verify all dependencies are installed
4. Ensure Node.js version is 18+

