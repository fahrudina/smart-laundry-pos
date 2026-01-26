# Custom Database Authentication System

This project now includes a complete custom authentication system that stores user data directly in your database. Here's how it works:

## Features

- **Custom User Storage**: User data is stored in your own database table
- **Password Hashing**: Secure bcrypt password hashing
- **Login Page**: Secure login with email and password validation
- **Sign Up**: New user registration with full name, email, phone, and password
- **Protected Routes**: All application pages are protected and require authentication
- **Auto Redirect**: Unauthenticated users are automatically redirected to login
- **Session Persistence**: Users stay logged in across browser sessions (24 hours)
- **Logout**: Secure logout functionality from the user menu
- **Role-based Access**: Support for user roles (staff, admin, etc.)

## Database Schema

### Users Table
```sql
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'staff',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

### Database Functions
- `create_user()`: Safely creates users with hashed passwords
- `verify_user_credentials()`: Validates login credentials

## Usage

### First Time Setup

1. **Sign Up**: When you first visit the application, you'll be redirected to the login page
2. **Create Account**: Click on the "Sign Up" tab and fill in:
   - Full Name (required)
   - Email (required, unique)
   - Phone Number (required)
   - Password (minimum 6 characters)
   - Confirm Password
3. **Automatic Login**: After successful signup, you're automatically logged in
4. **Future Logins**: Use the "Sign In" tab with your email and password

### Navigation

- **Main POS**: Access the Point of Sale system from the home page (`/`)
- **Order History**: View order history from the navigation button or direct URL (`/order-history`)
- **User Profile**: See your name, email, and role in the header dropdown
- **Logout**: Click on your avatar in the top-right corner and select "Log out"

### Security Features

- All routes except `/login` are protected
- Passwords are hashed using bcrypt with salt rounds of 12
- Session tokens are generated and stored locally
- Sessions expire after 24 hours
- Return URLs are preserved (users are sent back to their intended page after login)
- Database-level Row Level Security (RLS) policies

## Development

### File Structure

```
src/
├── services/
│   └── authService.ts           # Custom authentication service
├── contexts/
│   └── AuthContext.tsx          # Authentication state management
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.tsx   # Route protection wrapper
│   └── layout/
│       ├── AppHeader.tsx        # Header with user menu
│       └── AppLayout.tsx        # Main layout wrapper
├── pages/
│   └── Login.tsx               # Login and signup page
└── App.tsx                     # Updated with auth provider
```

### Key Components

1. **AuthService**: Handles all authentication logic, session management
2. **AuthContext**: React context for authentication state
3. **ProtectedRoute**: Wraps routes that require authentication
4. **Login**: Combined login and signup page with comprehensive form validation
5. **AppHeader**: Navigation header with user menu and profile info
6. **AppLayout**: Layout wrapper for authenticated pages

### Authentication Flow

1. User visits any page
2. `ProtectedRoute` checks if user is authenticated via `authService`
3. If not authenticated → redirect to `/login`
4. If authenticated → show requested page
5. On login/signup success → redirect to originally requested page
6. Session persists in localStorage for 24 hours

## Database Management

### Creating Users Programmatically
```sql
SELECT create_user(
  'user@example.com',
  'password123',
  'John Doe',
  '+1234567890',
  'admin'
);
```

### Verifying Credentials
```sql
SELECT * FROM verify_user_credentials('user@example.com', 'password123');
```

### User Roles
- `staff`: Default role for regular users
- `admin`: Administrative privileges (can be extended)
- Custom roles can be added as needed

## Security Considerations

1. **Password Security**: Uses bcrypt with 12 salt rounds
2. **Database Security**: RLS policies protect user data
3. **Session Management**: Local storage with expiration
4. **Input Validation**: Comprehensive form validation on frontend
5. **SQL Injection Protection**: Uses parameterized queries via Supabase

## Troubleshooting

1. **Can't log in**: Check if user exists and is active in database
2. **Password errors**: Ensure password meets minimum requirements
3. **Session not persisting**: Check if localStorage is enabled
4. **Database errors**: Check Supabase logs and connection
5. **Migration issues**: Ensure `20250727160000_create_users_table.sql` was applied

## Migration

The authentication system was migrated from Supabase Auth to custom database authentication. The migration file `20250727160000_create_users_table.sql` creates all necessary tables and functions.
