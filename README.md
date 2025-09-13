# Media Planning Automation Tool

A Next.js web application that automates media planning workflows, reducing the time needed to create traffic sheets, taxonomies, and campaign structures from 4+ hours to 25 minutes.

## What You've Built So Far ✅

### Phase 1 MVP - COMPLETED
- ✅ **Basic Campaign Form**: Create campaigns with client info, dates, budgets
- ✅ **Modern Dashboard**: Clean, intuitive interface with campaign overview
- ✅ **Data Persistence**: All data saved to browser localStorage
- ✅ **Campaign Management**: View, edit, and delete campaigns
- ✅ **CSV Export**: Basic export functionality for campaign data
- ✅ **Responsive Design**: Works on desktop and mobile

### Current Features
1. **Dashboard**: Shows total campaigns, budgets, and active campaigns
2. **Campaign Creation**: Form with validation and auto-generated naming
3. **Campaign Detail View**: Full campaign overview with stats
4. **Export System**: CSV export with UTM parameters

## How to Use Your Tool

### Starting the Development Server
```bash
cd /Users/lucusdato/Documents/Dev/media-planning-tool
npm run dev
```
Then open http://localhost:3000 in your browser

### Creating Your First Campaign
1. Click "New Campaign" on the dashboard
2. Fill out campaign details (client, dates, budget)
3. Campaign name auto-generates based on client and date
4. Click "Create Campaign" to save

### Viewing Campaigns
- Dashboard shows all campaigns with status indicators
- Click on a campaign name to view details
- Use export button to download CSV with campaign data

## Next Steps to Complete Your Tool

### Still To Build:
- **Ad Set Creation**: Build multiple ad sets within each campaign
- **Creative Management**: Add creative assets with UTM parameter builder
- **Excel Import**: Import blocking charts from Excel
- **Enhanced Export**: Platform-specific exports (DV360, Facebook, Google Ads)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Dashboard
│   └── campaigns/
│       ├── new/page.tsx   # Create campaign
│       └── [id]/page.tsx  # View campaign
├── components/            # Reusable UI components
│   └── Campaign/
│       └── CampaignForm.tsx
├── hooks/                 # Custom React hooks
│   └── useCampaigns.ts
├── types/                 # TypeScript type definitions
│   └── index.ts
└── utils/                 # Utility functions
    ├── storage.ts         # localStorage management
    ├── taxonomy.ts        # Naming conventions
    └── exportHelpers.ts   # Export functionality
```

## Technologies Used

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **React Hook Form**: Form handling and validation
- **Lucide React**: Modern icon library
- **XLSX**: Excel file processing
- **UUID**: Unique identifier generation

## Data Storage

Currently uses browser localStorage - your data is saved locally on your computer. Each campaign includes:
- Campaign details (name, client, dates, budget)
- Ad sets (will be added next)
- Creative assets (will be added next)
- UTM parameters for tracking

## Browser Access

Open your tool at: **http://localhost:3000**

## Troubleshooting

### If the server isn't running:
```bash
cd /Users/lucusdato/Documents/Dev/media-planning-tool
npm run dev
```

### If you see errors:
```bash
npm install  # Reinstall dependencies
```

### To stop the server:
Press `Ctrl + C` in the terminal

## What's Next?

You've successfully built the foundation of your media planning tool! The next phase will add:
1. Ad set creation within campaigns
2. Creative asset management
3. UTM parameter builder
4. Excel import for blocking charts
5. Enhanced export options

Your tool is already functional and can save you significant time on campaign setup and basic export tasks!