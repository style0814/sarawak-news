# User Profile

## Overview

The user profile page allows authenticated users to view and manage their account information, change their password, and see their activity statistics.

## Access

- **URL:** `/profile`
- **Requires:** User authentication (NextAuth session)
- **Redirects:** To `/auth/login` if not authenticated

## Features

- **View Profile** - Display name, email, username, join date
- **Edit Profile** - Update display name and email
- **Change Password** - Secure password update
- **Activity Stats** - Comment count, bookmark count
- **Comment History Link** - View all user's comments

## Page Structure

```
app/profile/page.tsx
│
├── Profile Card
│   ├── Avatar/Icon
│   ├── Display Name
│   ├── Username
│   ├── Email
│   └── Member Since
│
├── Stats Cards
│   ├── Total Comments
│   └── Total Bookmarks
│
├── Edit Profile Form
│   ├── Display Name input
│   ├── Email input
│   └── Save button
│
└── Change Password Form
    ├── Current Password
    ├── New Password
    ├── Confirm Password
    └── Change button
```

## API Endpoints

### GET /api/user/profile

Get current user's profile and stats.

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "display_name": "John Doe",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "stats": {
    "commentCount": 15,
    "bookmarkCount": 8,
    "joinDate": "2024-01-01"
  }
}
```

### PUT /api/user/profile

Update user profile or password.

**Update Profile:**
```json
{
  "display_name": "New Display Name",
  "email": "newemail@example.com"
}
```

**Change Password:**
```json
{
  "action": "changePassword",
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Response (success):**
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

**Response (error):**
```json
{
  "error": "Current password is incorrect"
}
```

## Database Functions

### getUserStats()

```typescript
export function getUserStats(userId: number): {
  commentCount: number;
  bookmarkCount: number;
  joinDate: string;
}
```

Counts user's comments and bookmarks, returns join date.

### updateUserProfile()

```typescript
export function updateUserProfile(
  userId: number,
  updates: {
    display_name?: string;
    email?: string;
  }
): boolean
```

Updates user's display name and/or email.

### updateUserPassword()

```typescript
export async function updateUserPassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<boolean>
```

Verifies current password and updates to new password (bcrypt hashed).

## Component Code

```tsx
// app/profile/page.tsx
'use client';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    if (session) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    const response = await fetch('/api/user/profile');
    const data = await response.json();
    setProfile(data.user);
    setStats(data.stats);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: displayName,
        email: email
      })
    });
    // Handle response...
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'changePassword',
        currentPassword,
        newPassword
      })
    });
    // Handle response...
  };

  // Render...
}
```

## Security

### Password Requirements

- Current password verification required
- New password must be different from current
- Password hashed with bcrypt (cost factor 10)

### Session Validation

```typescript
// API route checks session
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Email Validation

- Valid email format required
- Unique email constraint in database

## Translations

```typescript
// lib/i18n.ts
{
  profile: 'Profile',
  editProfile: 'Edit Profile',
  memberSince: 'Member Since',
  changePassword: 'Change Password',
  currentPassword: 'Current Password',
  newPassword: 'New Password',
  confirmPassword: 'Confirm Password',
  passwordMismatch: 'Passwords do not match',
  passwordChanged: 'Password changed successfully',
  profileUpdated: 'Profile updated successfully',
  incorrectPassword: 'Current password is incorrect'
}
```

## User Comment History

### GET /api/user/comments

Get all comments made by the current user.

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page

**Response:**
```json
{
  "comments": [
    {
      "id": 1,
      "content": "Great article!",
      "news_id": 123,
      "news_title": "Article Title",
      "likes": 5,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 15,
  "totalPages": 2
}
```

### Comments Page

Located at `app/comments/page.tsx`

Displays paginated list of user's comments with:
- Comment content
- Link to original article
- Like count
- Timestamp
- Delete option

## UI Flow

```
1. User navigates to /profile
   │
2. Check authentication
   │  ├── Not logged in → Redirect to /auth/login
   │  └── Logged in → Continue
   │
3. Fetch profile data
   │  └── GET /api/user/profile
   │
4. Display profile card + stats
   │
5. User clicks "Edit Profile"
   │  └── Show edit form
   │
6. User submits changes
   │  └── PUT /api/user/profile
   │
7. Show success/error message
```

## Related Pages

- `/auth/login` - User login
- `/auth/register` - User registration
- `/bookmarks` - User's saved articles
- `/comments` - User's comment history
