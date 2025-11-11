# Smart Laundry POS System

A modern, comprehensive Point of Sale (POS) system designed specifically for laundry businesses. Built with React, TypeScript, and Supabase for a seamless user experience.

## 🌟 New Features

### 📱 Progressive Web App (PWA)
- **Installable**: Can be installed on Android devices like a native app
- **Offline Support**: Works offline with cached content and service worker
- **App-like Experience**: Runs in standalone mode without browser UI
- **Fast Loading**: Intelligent caching for instant startup

### 🏠 Landing Page
- **Professional Presentation**: Beautiful landing page showcasing POS features
- **Direct Access**: Easy navigation to login and app access
- **Mobile Optimized**: Responsive design for all devices
- **PWA Install**: Built-in install prompts for mobile users

## 📱 Installation Options

### For End Users
1. **Visit Landing Page**: Navigate to your deployed URL
2. **Install on Android**: 
   - Automatic "Add to Home Screen" banner in Chrome
   - Manual: Chrome menu → "Install app"
   - Custom button: Click "Install App" in header
3. **Login**: Click "Login" from landing page to access POS

### Route Structure
- `/` - Landing page (public)
- `/login` - Login page (public)
- `/pos` - Main POS interface (protected)
- `/order-history` - Order history (protected)
- `/services` - Service management (owner only)
- `/stores` - Store management (owner only)

## 🚀 Features

### Core POS Functionality
- **Customer Management**: Search, add, and manage customer information with phone-based lookup
- **Service Management**: Multiple laundry services with different pricing and completion times
- **Product/Goods Support**: Sell retail products (detergent, perfume, softener) alongside services
- **Order Processing**: Create orders with real-time completion estimates
- **Payment Processing**: Support for Cash, QRIS, and Transfer payments
- **Dual Status Tracking**: Separate tracking for execution status (in_queue, in_progress, completed, cancelled) and payment status (pending, completed, down_payment, refunded)

### Order Management
- **Order History**: Comprehensive view of all orders with advanced filtering and search
- **Status Updates**: Easy-to-use action buttons for updating order and payment status
- **Overdue Tracking**: Automatic identification and highlighting of overdue orders
- **Real-time Estimates**: Dynamic completion time calculations based on service duration

### Advanced Features
- **Smart Search**: Search orders by customer name, phone number, or order details
- **Advanced Filtering**: Filter by execution status, payment status, payment method, date range, and overdue status
- **Flexible Sorting**: Sort orders by date, customer, amount, status, or completion time
- **Draft Orders**: Save orders for later completion
- **Revenue Tracking**: Real-time revenue calculations and statistics

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL database + Real-time subscriptions)
- **Authentication**: Supabase Auth (ready for implementation)
- **State Management**: React Hooks + Custom hooks
- **Date/Time**: Native JavaScript Date with custom utilities

## 📦 Installation & Setup

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd smart-laundry-pos

# Step 3: Install dependencies
npm install

# Step 4: Set up Supabase
# Create a new Supabase project and update the configuration in src/integrations/supabase/client.ts

# Step 5: Run database migrations
# Execute the SQL files in supabase/migrations/ in your Supabase project

# Step 6: Start the development server
npm run dev
```

## 🗄️ Database Schema

The system uses a comprehensive database schema with the following key tables:

- **customers**: Customer information and contact details
- **orders**: Main order records with status tracking
- **order_items**: Individual service items within orders

### Key Features of the Schema:
- Dual status system (execution_status + payment_status)
- Flexible payment tracking (method, amount, notes)
- Automatic timestamp management
- Comprehensive order item tracking with individual completion estimates

## 💻 Development

**Local Development**

1. Clone the repository and follow the installation steps above
2. Make your changes in your preferred IDE
3. Test locally with `npm run dev`
4. Commit and push your changes

**Using GitHub Codespaces**

- Navigate to the main page of your repository
- Click on the "Code" button (green button) near the top right
- Select the "Codespaces" tab
- Click on "New codespace" to launch a new Codespace environment
- Edit files directly within the Codespace and commit your changes

## 🔧 Technologies Used

This project is built with:

- **Vite** - Fast build tool and development server
- **TypeScript** - Type-safe JavaScript
- **React 18** - Modern React with hooks
- **shadcn/ui** - Beautiful and accessible UI components
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **Lucide React** - Beautiful icon library
- **React Router** - Client-side routing

## 🚀 Deployment

This project can be deployed to any static hosting service that supports React applications:

- **Vercel**: Connect your GitHub repository for automatic deployments
- **Netlify**: Drag and drop your build folder or connect via Git
- **GitHub Pages**: Use GitHub Actions for automated deployment
- **Firebase Hosting**: Deploy with Firebase CLI
- **AWS S3 + CloudFront**: For scalable static hosting

Build the project for production:
```sh
npm run build
```

## 🌐 Custom Domain

Most hosting providers support custom domain configuration. Check your provider's documentation for specific instructions.

## 📋 Recent Updates

### Version 2.0 - Advanced Order Management System
- ✅ Refactored order system with dual status tracking (execution + payment)
- ✅ Added comprehensive payment management (QRIS, Cash, Transfer)
- ✅ Implemented advanced search and filtering in order history
- ✅ Added overdue order tracking and alerts
- ✅ Enhanced UI with modern status badges and action buttons
- ✅ Database schema improvements with proper migrations
- ✅ Improved error handling and user feedback

## 🎯 Future Enhancements

- [ ] User authentication and role-based access
- [ ] Inventory management for detergents and supplies
- [ ] Customer loyalty program and rewards
- [ ] SMS/Email notifications for order status updates
- [ ] Reporting and analytics dashboard
- [ ] Multi-location support
- [ ] Mobile app version
- [ ] Receipt printing integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
