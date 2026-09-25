# us.

A small private site for two: a password gate, a countdown to the next time
you see each other, a shared calendar, and a movie list — all synced live
between your devices via Firebase.

## Setup, in order

### 1. Change the password

Open `js/auth.js` and edit:

```js
const PASSWORD = "changeme";
const HINTS = [ ... ];
```

### 2. Create a free Firebase project (this is what makes it sync)

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
   and sign in with a Google account, then **Add project**. Name it
   anything (e.g. "us"). You can skip Google Analytics.
2. Once created, click the **</>** (web) icon to register a web app. Give
   it any nickname. You don't need Firebase Hosting.
3. Firebase shows you a `firebaseConfig` object — copy it.
4. Open `js/firebase-config.js` in this project and paste your values in.
5. In the same file, change `SPACE_ID` to a long random string (mash your
   keyboard, 20+ characters). This is the address of your shared data —
   keep it random so a stranger can't guess it.
6. In the Firebase console, go to **Build → Firestore Database → Create
   database**. Choose any region close to you, and start in
   **production mode**.
7. Go to the **Rules** tab and replace the contents with what's in
   `firestore.rules` in this project (also shown below), then **Publish**:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /spaces/{spaceId} {
         allow read, write: if true;
       }
     }
   }
   ```

That's it — both devices, once pointed at the same Firebase project and
the same `SPACE_ID`, will see the same countdown date, calendar events, and
movie list, updating live without a page refresh.

## Running it locally in VS Code

Because the pages now load Firebase as ES modules, you can't just double
click the HTML files — browsers block module imports over `file://`. You
need a local web server:

1. Open the `us` folder in VS Code.
2. Install the **Live Server** extension (Ritwick Dey) if you don't have it.
3. Right-click `index.html` → **Open with Live Server**.
4. It opens at something like `http://127.0.0.1:5500`.

## An important note on privacy

Two separate layers here, worth understanding:

- **The password screen** is client-side only — good for keeping casual
  visitors out, not real security. Anyone in dev tools can read it.
- **The Firebase data** is protected only by your `SPACE_ID` being hard to
  guess (see the rules above) — not by login or password. Anyone who had
  both your Firebase config *and* your exact `SPACE_ID` could read or
  write your data. Neither of those is discoverable without your source
  code or GitHub repo, so for a personal project between two people this
  is a reasonable trade-off, not bank-grade security.
- Firebase's free "Spark" plan comfortably covers two people using this
  site — you won't hit any billing.

## Publishing it with GitHub Pages

1. Go to [github.com](https://github.com) and create a **new repository**
   (e.g. `us`).
2. In VS Code, open the `us` folder in the terminal and run:

   ```bash
   git init
   git add .
   git commit -m "first version of our site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```

3. On GitHub, go to your repo → **Settings** → **Pages**.
4. Under "Build and deployment", set **Source** to `Deploy from a branch`,
   branch `main`, folder `/ (root)`. Save.
5. After a minute or two, GitHub gives you a URL like
   `https://<your-username>.github.io/<repo-name>/`. That's your site —
   open it on both your phones/laptops.

### About "private"

GitHub Pages sites are **public URLs** — anyone with the link can open
them, regardless of whether the repository itself is public or private:

- On the **free** GitHub plan, Pages only works from a **public**
  repository. The site is visible to anyone with the link (it won't show
  up in search engines, since `noindex` meta tags are already included).
- A **private** repository with Pages enabled requires a paid plan
  (GitHub Pro or above) — and even then the published *site* is still a
  public URL, not access-controlled at the GitHub level.

So the realistic setup for a project like this is: **public repo,
unguessable URL, plus the password screen** — which is exactly what you
have.

## File structure

```
us/
├── index.html            password gate
├── home.html              countdown + navigation
├── calendar.html           monthly calendar with events
├── movies.html              movie list
├── firestore.rules          paste into Firebase console → Firestore → Rules
├── css/
│   └── style.css           shared styles
├── js/
│   ├── auth.js              password + hints (EDIT THIS)
│   ├── guard.js              redirects unauthenticated visitors
│   ├── firebase-config.js    your Firebase project keys (EDIT THIS)
│   ├── db.js                 Firestore read/write helpers
│   ├── home.js                countdown logic
│   ├── calendar.js            calendar logic
│   └── movies.js               movie list logic
└── README.md
```
