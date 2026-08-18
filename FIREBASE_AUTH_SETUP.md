# Real login setup — Google · Facebook · Phone OTP (Firebase)

This turns the demo login into real sign-in. Firebase handles all three:
real Google, real Facebook, and real SMS OTP.

**Important:** real auth (phone OTP + Google/Facebook native) does **not** run in
Expo Go. We'll make a **dev build** with EAS (also needed for publishing). Nothing
here costs money on the free tier for normal testing.

You do the account steps (only you can). I do all the code. Where it says
**→ send me**, copy that value back to me and I'll wire it in.

---

## Step 1 — Create the Firebase project  (you, ~3 min)
1. Go to https://console.firebase.google.com → **Add project**.
2. Name it "Mini Shorts" → continue (you can skip Google Analytics).

## Step 2 — Get the config  (you)
1. In the project, click the **Web** icon `</>` to "Add app".
2. Nickname "Mini Shorts" → **Register app**.
3. It shows a `firebaseConfig = { apiKey: …, authDomain: …, projectId: …, appId: … }`.
4. **→ send me that whole `firebaseConfig` object.** (These are public client keys — safe to share.)

## Step 3 — Turn on the sign-in methods  (you)
In Firebase → **Build → Authentication → Get started → Sign-in method**, enable:
- **Phone** (real SMS OTP)
- **Google** (one click — it auto-creates the Google OAuth client)
- **Facebook** (needs Step 5 first)

## Step 4 — Google sign-in on Android  (you)
Google on Android needs your app's signing fingerprint:
1. I'll give you the exact command to print your **SHA-1** after the first dev build.
2. In Firebase → Project settings → your Android app → **Add fingerprint** → paste SHA-1.
3. Download the updated **google-services.json** → **→ send me** (or drop it in the project root).

## Step 5 — Facebook app  (you, ~5 min)
1. Go to https://developers.facebook.com → **My Apps → Create App** → "Consumer".
2. Add the **Facebook Login** product.
3. From **Settings → Basic**, copy the **App ID** and **App Name**.
4. **→ send me the Facebook App ID.** (Public — safe. Do NOT send the App Secret; that goes only into Firebase's Facebook config box.)
5. Paste the **App Secret** into Firebase's Facebook provider box (Step 3), and copy the **OAuth redirect URI** Firebase shows into the Facebook app's "Valid OAuth Redirect URIs".

## Step 6 — I wire the code
Once I have: the `firebaseConfig`, the **Google web client ID** (from Firebase's Google provider → Web SDK config), and the **Facebook App ID**, I will:
- Add the auth packages and the config plugin.
- Replace the demo sign-in with real Firebase phone OTP, Google, and Facebook.
- Keep everything else (profile, stats, interests) exactly as is.

## Step 7 — Dev build to test it  (together)
- `npm install -g eas-cli` → `eas login` → `eas build:configure`
- `eas build --profile development --platform android` → install the .apk on your phone.
- Now Google, Facebook, and real OTP work on the device.

---

### The 3 things to send me to start
1. The `firebaseConfig { … }` object (Step 2)
2. The **Google Web client ID** (Firebase → Authentication → Google → Web SDK configuration)
3. The **Facebook App ID** (Step 5)

Send those and I'll wire the real login. Start with **Step 1 + Step 2** — that alone unblocks Google and Phone.
