# GauRakshak - Real-time Cow Monitoring Dashboard

A modern, responsive dashboard for monitoring cow health in real-time using React, Vite, Tailwind CSS, and Firebase Realtime Database.

![GauRakshak Dashboard](https://lovable.dev/opengraph-image-p98pqg.png)

## Features

- **Real-time Monitoring**: Live updates for temperature, activity, and heart rate
- **Interactive Charts**: Beautiful visualizations using Recharts
- **Alert System**: Instant notifications for abnormal parameters
- **Cow Management**: Track individual cow health status
- **Reports**: Generate and export health reports with date filtering
- **Customizable Settings**: Configure alert thresholds and preferences
- **Dark Theme**: Modern, professional dark interface
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Backend**: Firebase Realtime Database
- **UI Components**: shadcn/ui
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account (for database integration)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Gau-Rakshak
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Realtime Database
   - Copy your Firebase configuration
   - Update `src/lib/firebase.ts` with your credentials:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser to `http://localhost:8080`

### Build for Production

```bash
npm run build
```

The optimized files will be in the `dist` folder.

## Project Structure

```
Gau-Rakshak/
├── src/
│   ├── components/
│   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   ├── Topbar.tsx            # Top navigation bar
│   │   ├── AlertToast.tsx        # Alert notification system
│   │   ├── charts/
│   │   │   ├── TempChart.tsx     # Temperature line chart
│   │   │   ├── ActivityChart.tsx # Activity bar chart
│   │   │   └── HeartRateChart.tsx # Heart rate line chart
│   │   └── ui/                   # shadcn UI components
│   ├── pages/
│   │   ├── DashboardPage.tsx     # Main dashboard with charts
│   │   ├── CowsPage.tsx          # Cow inventory management
│   │   ├── ReportsPage.tsx       # Reports and analytics
│   │   └── SettingsPage.tsx      # Settings and configuration
│   ├── lib/
│   │   ├── firebase.ts           # Firebase configuration
│   │   └── utils.ts              # Utility functions
│   ├── App.tsx                   # Main app component
│   ├── index.css                 # Global styles & design system
│   └── main.tsx                  # App entry point
├── index.html
├── package.json
├── tailwind.config.ts            # Tailwind configuration
├── vite.config.ts                # Vite configuration
└── README.md
```

## Firebase Database Structure

Recommended database structure for cow monitoring data:

```json
{
  "cows": {
    "C001": {
      "id": "C001",
      "age": 3,
      "health": "healthy",
      "temperature": 37.5,
      "heartRate": 65,
      "activity": 1500,
      "lastCheck": "2024-01-15T10:30:00Z"
    }
  },
  "monitoring": {
    "temperature": {
      "2024-01-15": {
        "00:00": 37.5,
        "04:00": 37.8
      }
    },
    "activity": {
      "2024-01-15": {
        "00:00": 1200,
        "04:00": 1800
      }
    },
    "heartRate": {
      "2024-01-15": {
        "00:00": 65,
        "04:00": 68
      }
    }
  },
  "alerts": {
    "alert_001": {
      "type": "temperature",
      "cowId": "C001",
      "value": 39.2,
      "severity": "critical",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  }
}
```

## Customization

### Alert Thresholds

Configure alert thresholds in the Settings page:
- Temperature threshold (default: 38.5°C)
- Heart rate threshold (default: 80 BPM)
- Activity threshold (default: 500 steps)

### Color Scheme

The design system is defined in `src/index.css`. Key colors:
- Primary (Green): Agriculture/health theme
- Accent (Amber): Warnings
- Destructive (Red): Critical alerts
- Chart colors: Defined in CSS variables

## Real-time Updates

The dashboard uses Firebase Realtime Database to sync data across all connected clients. When sensor data is updated in the database, all dashboards will automatically refresh with the new values.

Example of listening to real-time updates:

```typescript
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';

const cowsRef = ref(database, 'cows');
onValue(cowsRef, (snapshot) => {
  const data = snapshot.val();
  // Update your state with the new data
});
```

## License

MIT License - feel free to use this project for your cattle monitoring needs!

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ for modern cattle farming

