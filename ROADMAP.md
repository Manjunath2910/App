# Market News — Build → Publish Roadmap

A step-by-step plan to make the app match Inshorts and ship it to the Google Play
Store and Apple App Store. "You" = actions only you can do (accounts, payments,
final submit). "Me" = I build/prepare it.

---

## PHASE 0 — What's already done ✅
- Expo + React Native app (iOS + Android, one codebase)
- Swipeable 60-word card feed, tap to read the full story in-app
- Categories, live search, bookmarks (saved offline), share
- Light/dark mode, pull-to-refresh + refresh button
- Polls, Discover screen (trending, topics, poll)
- Live news backend (real marketing articles from RSS, marketing-only filter)
- Add-your-own-articles file (myArticles.ts)

---

## PHASE 1 — Match the Inshorts UI, screen by screen 🎯
We make each screen look exactly like Inshorts using the proven method we used for
your website: **you send me a screenshot of the Inshorts screen → I replicate it
line-by-line → you check → I refine.** Order:

1. **Main feed card** — image, headline, 60-word text, author/time, bottom bar
2. **Top bar + menu** — logo, hamburger/menu, search, notifications
3. **Discover / Search screen** — quick tiles, Trending, Topics, Poll, Insights
4. **Category menu** — the full categories list
5. **Full-story reader** — layout, typography
6. **Profile screen** — saved, settings, read-offline
7. **Colors + fonts** — Inshorts red accent, exact type sizes

➡️ **To start: send a screenshot of the Inshorts main feed card.**

---

## PHASE 2 — Feature parity with Inshorts ⚙️
Built with sample UI now, real data when the backend/services are connected:
1. Insights (explainer cards)  2. Notifications  3. Daily Ritual (today's picks)
4. Timelines  5. Video Shorts  6. Profile tab
Needs external services + API keys (you provide):
7. Finance feed + live stock prices (stock API)
8. "Ask Anything" AI (OpenAI/Anthropic key)

---

## PHASE 3 — Real content 📰
- Live marketing news backend is built (RSS). Optionally add an OpenAI key for
  clean 60-word AI summaries.
- Deploy the backend to a free host (Render/Railway) so the published app has data.

---

## PHASE 4 — Test 🧪
- Test on a real iPhone and Android phone via **Expo Go** (scan QR from `npx expo start`).
- Fix anything that looks off (send screenshots).

---

## PHASE 5 — App assets 🎨 (Me)
- App icon (1024×1024) in your brand colors
- Splash screen
- Adaptive Android icon
- 5–8 store screenshots per platform (I'll tell you exactly what to capture)

---

## PHASE 6 — Accounts & legal 📝 (You)
1. **Apple Developer Program** — $99/year → developer.apple.com
2. **Google Play Console** — $25 one-time → play.google.com/console
3. **Privacy policy URL** (both stores require it) — I write it, you host it
4. Free **Expo (EAS)** account → expo.dev

---

## PHASE 7 — Configure & build 🔧
1. I add bundle IDs (`ios.bundleIdentifier`, `android.package`), version, permissions
2. Install EAS:  `npm install -g eas-cli`
3. `eas login`
4. `eas build:configure`
5. Build in the cloud (no Mac needed):
   - `eas build --platform android`  → produces an `.aab`
   - `eas build --platform ios`      → produces an `.ipa`

---

## PHASE 8 — Publish to Google Play (You + Me) 🤖
1. In Play Console: **Create app** → name "Market News", category **News & Magazines**
2. Fill **Store listing**: short + full description (I write), screenshots, icon, feature graphic
3. Complete **Content rating**, **Data safety**, **Target audience**, **Privacy policy URL**
4. Create a **service account key** for EAS submit (I guide you), then:
   `eas submit --platform android`
5. Roll out to **Internal testing** → then **Production** → **Send for review**
   (review: usually hours to ~2 days)

---

## PHASE 9 — Publish to Apple App Store (You + Me) 🍎
1. In App Store Connect: **New app** → name "Market News", category **News**
2. Fill listing: subtitle, description (I write), keywords, screenshots, privacy details
3. Age rating, privacy questionnaire, App Privacy "nutrition label"
4. Submit the build:  `eas submit --platform ios`  (signs in with your Apple ID)
5. Attach build → **Submit for review** (review: usually 1–3 days)

---

## What I need from you to keep moving
- **Now:** a screenshot of the Inshorts main feed card (to start Phase 1)
- **Later:** the two developer accounts (Phase 6) and an OpenAI key if you want AI summaries

We'll go one step at a time. Reply with the Inshorts screenshot and I'll match it exactly.
