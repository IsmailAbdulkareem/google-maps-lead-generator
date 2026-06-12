Lead Generator SaaS - Authentication, Free Plan Limits & Billing Integration
Current Plans
Free Plan
5 searches per day
25 leads per day
CSV export only
Pro Plan ($20/month)
Higher search limits
Higher lead limits
Premium exports
Future premium features
Authentication Flow Changes
Current Problem

The website immediately redirects users to the Clerk login page when they visit.

Current Flow

Visitor → Homepage → Login Page

Desired Flow

Visitor → Homepage → Browse Features → Click "Search Maps" → Login Required

Homepage Requirements
Public Pages

These pages should NOT require authentication:

/
/pricing
/about
/contact
Navbar
Signed Out

Show:

Login button
Sign Up button

Example:

<SignedOut>
  <SignInButton />
  <SignUpButton />
</SignedOut>
Signed In

Show:

<SignedIn>
  <UserButton />
</SignedIn>
Search Maps Authentication

When a visitor clicks:

Search Maps

Check authentication.

If not logged in:

router.push("/sign-in");

If logged in:

Continue to search functionality.

Middleware Changes

Current middleware appears to protect the entire application.

Instead:

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/api/search(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};

Result:

✅ Homepage public

✅ Pricing public

✅ About public

✅ Dashboard protected

✅ Search API protected

Free Plan Limits
Rules

Free users can only use:

5 searches/day
25 leads/day

After reaching either limit:

Block additional usage.

Example:

if (userPlan === "free") {
  if (searchesUsed >= 5) {
    return {
      allowed: false,
      message:
        "You have reached your free plan limit. Upgrade to Pro to continue."
    };
  }

  if (leadsUsed >= 25) {
    return {
      allowed: false,
      message:
        "You have reached your lead limit. Upgrade to Pro to continue."
    };
  }
}
Upgrade Modal

When limits are reached:

Title:

Free Limit Reached

Description:

You have used all 5 searches and 25 leads available on the Free plan.
Upgrade to Pro for continued access.

Button:

Upgrade to Pro - $20/month
Pricing Page

Create:

/pricing

Show:

Free
5 searches/day
25 leads/day
CSV export

Button:

Current Plan
Pro
Higher limits
Premium exports
Priority support

Button:

Upgrade to Pro
Billing Integration
Existing Clerk Keys

Already configured:

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

Keep these.

Verify Clerk Billing

Confirm in Clerk Dashboard:

Billing → Products

You should see:

Free Plan
Pro Plan

If Billing is enabled, Clerk manages:

Checkout
Subscription
Customer portal
Plan metadata
Environment Variables

Check Clerk documentation for any additional billing-related environment variables required for your specific billing setup.

Current required variables:

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
Subscription Detection

Server should determine user plan:

const plan = user.publicMetadata?.subscription?.tier || "free";
Access Control

Example:

const isPro = plan === "pro";

Premium features:

if (!isPro) {
  return NextResponse.json({
    error: "Upgrade to Pro required",
  });
}
Usage Indicator

Show:

Free User:

Free Plan

5/5 searches
25/25 leads

Pro User:

Pro Plan

Unlimited Searches
Unlimited Leads
Expected User Journey

Homepage
↓
Browse Features
↓
Click Search Maps
↓
Login / Sign Up
↓
Use Free Plan
↓
Reach 5 Searches or 25 Leads
↓
Upgrade Prompt
↓
Clerk Checkout
↓
Pro Plan Activated
↓
Continue Using Tool