# Real login + push notifications — setup

Two features, one shared requirement. **You** do the account steps (only you can);
**I** write all the code. Where it says **→ send me**, paste that value back to me.

> **Both features need a real dev build — they do NOT run in Expo Go.**
> We'll make an EAS **development build** (Step A). That's also needed for publishing.

---

## Step A — EAS dev build (needed for both) — together
1. `npm install -g eas-cli`
2. `eas login` (create a free Expo account if you don't have one)
3. `eas build:configure` — this creates an **EAS project id** (I'll read it automatically).
4. `eas build --profile development --platform android` → install the `.apk` on your phone.
   (iOS dev build needs your Apple account — see Step 5.)

Once you're on a dev build, real login and push work on the device.

---

# PART 1 — Real login (Firebase Auth)

Firebase handles Google, Phone OTP, Facebook, and Apple.

## 1. Create the Firebase project (you, ~3 min)
- https://console.firebase.google.com → **Add project** → name "Mini Shorts".

## 2. Add a Web app + get config (you)
- Project → **Web icon `</>`** → register → copy the `firebaseConfig { apiKey, authDomain, projectId, appId, … }`.
- **→ send me the whole `firebaseConfig` object** (public client keys — safe to share).

## 3. Enable the sign-in methods (you)
Firebase → **Build → Authentication → Sign-in method**, enable:
- **Google** — one click. Then copy the **Web client ID** it shows. **→ send me it.**
- **Phone** — toggle on (real SMS OTP).
- **Facebook** — needs Part 1.4 first.
- **Apple** — needs Part 1.5 first.

## 4. Facebook login (you, ~5 min)
- https://developers.facebook.com → **Create App** → "Consumer" → add **Facebook Login**.
- Settings → Basic: copy the **App ID**. **→ send me the App ID.**
- Copy the **App Secret** into Firebase's Facebook provider box (do NOT send me the secret).
- Put Firebase's **OAuth redirect URI** into the Facebook app's "Valid OAuth Redirect URIs".

## 5. Apple login (you)
- Needs an **Apple Developer account ($99/yr)** → https://developer.apple.com.
- Enable **Sign in with Apple** for your App ID, create the Services ID + key, and paste those into Firebase's Apple provider. (I'll give you the exact fields once you're at this step.)
- Note: Apple **requires** "Sign in with Apple" on iOS if you offer Google/Facebook login.

## 6. I wire the code
Once I have the **firebaseConfig**, the **Google Web client ID**, and the **Facebook App ID**, I install the auth packages, add the config plugin, and replace the demo sign-in with real Google, Facebook, Apple, and phone-OTP. Everything else (profile, logout) stays the same.

### The 3 things to send me to start login
1. `firebaseConfig { … }`  2. Google **Web client ID**  3. Facebook **App ID**

---

# PART 2 — Push notification on new blog

Already built: the app registers each device, and a small server watches your blog.

## Files I built
- **`/push-server`** — a Node service that checks `blogs.getpanda.money` every 5 min and, when a new post appears, sends "New on Mini Shorts: …" to all devices.
- **`src/utils/push.ts`** — the app registers this device's push token on startup.

## What you do
1. **Deploy the push-server** (free) — see `push-server/README.md`:
   - Render: New → **Web Service** → connect this repo → root dir `push-server`, build `npm install`, start `npm start`.
2. Copy the deployed service's **public URL**.
3. Put it in **`src/utils/push.ts`** → `PUSH_SERVER = 'https://your-service.onrender.com'`.
4. Rebuild the dev build (Step A) and install. Devices now register automatically.
5. Publish a test blog on ZoltMoney → within ~5 min every device gets the alert.

That's it — no ongoing work; new blogs notify users automatically.

---

## Order I recommend
1. **Step A** (dev build) — unblocks everything.
2. **Part 2** (push) — mostly done; just deploy + paste the URL.
3. **Part 1** (login) — create Firebase + Facebook (+ Apple), send me the 3 values, I wire it.

Start with **Step A**, then send me the Firebase config whenever it's ready.
