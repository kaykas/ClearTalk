# Quick Start Guide - ClearTalk Professional Portal

Get the attorney portal running in 5 minutes.

## Step 1: Install Dependencies

```bash
cd /Users/jkw/Documents/Work/Projects/ClearTalk/apps/portal
npm install
```

## Step 2: Configure Environment

```bash
# Copy the example environment file
cp .env.local.example .env.local

# Edit with your Supabase credentials
nano .env.local
```

Add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## Step 3: Set Up Database

### Create Test Attorney Account

Run in Supabase SQL editor:

```sql
-- Create attorney user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'attorney@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now()
) RETURNING id;

-- Add attorney profile
INSERT INTO public.users (
  id,
  email,
  full_name,
  role
) VALUES (
  '<attorney_user_id_from_above>',
  'attorney@example.com',
  'Jane Attorney',
  'attorney'
);
```

### Grant Access to Conversation

```sql
-- Grant attorney access to a conversation
INSERT INTO professional_access (
  conversation_id,
  professional_id,
  granted_by,
  access_level
) VALUES (
  '<conversation_id>',
  '<attorney_user_id>',
  '<parent_user_id>',
  'export'
);
```

## Step 4: Start Development Server

```bash
npm run dev
```

Portal runs on: http://localhost:3001

## Step 5: Test Login

1. Go to http://localhost:3001
2. Login with:
   - Email: `attorney@example.com`
   - Password: `password123`
3. You should see the clients dashboard

## Troubleshooting

### Can't login
- Check attorney user exists in `auth.users`
- Check profile exists in `public.users` with `role = 'attorney'`
- Verify email/password are correct

### No clients showing
- Check `professional_access` table has rows for the attorney
- Verify `conversation_id` exists in `conversations` table
- Check RLS policies are enabled

### Build errors
- Run `npm install` again
- Delete `node_modules` and `.next` folders, reinstall
- Check Node.js version is 18+

## Next Steps

- Add more test conversations
- Test PDF export functionality
- Test hash chain verification
- Deploy to Vercel

## Production Deployment

```bash
# Build for production
npm run build

# Test production build locally
npm start

# Deploy to Vercel
vercel deploy --prod
```

Don't forget to:
- Set environment variables in Vercel dashboard
- Update `NEXT_PUBLIC_APP_URL` to production URL
- Enable HTTPS (required for Web Crypto API)

## Need Help?

See full README.md for detailed documentation.
