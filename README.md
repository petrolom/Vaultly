# Vaultly
A password manager using SHA-256 encryption and a backend to save the hashes and send 2FA emails.

## Link
Demo: https://vaultly.linuskjk.hackclub.app/

## Photo
<img width="600" alt="grafik" src="https://github.com/user-attachments/assets/7a264fd4-17de-4d35-8b02-41f43e6179a6" />

## What this is
Vaultly is a simple password manager made for storing website logins, usernames, and passwords in one place.

The idea is that you create an account, log in, and then save entries like "Instagram", "Google", or "GitHub" with a username and password. The app hides the password by default and lets you reveal it when needed.

It also has a reset password flow and a username lookup flow using a master key, plus 2FA login for security.

## How it works
This project is a mix of frontend and backend files.

- The HTML/CSS/JS frontend is what the user interacts with.
- The PHP files in the php folder handle login, account creation, password reset, entry saving, and loading.
- User accounts are stored in the accounts folder, and vault entries are stored in the entries folder.
- The app uses hashed passwords and encrypted saved entry values so the actual password text is not just sitting there in plain text.
- 2FA codes are generated and checked on the backend, and for normal users they are sent by email using PHPMailer.

So basically: the browser sends requests to the backend, the backend checks the user info and saves things in files, and the frontend just shows the vault.

## How to use it
1. Go to the site.
2. Create an account.
3. Save your master key somewhere safe. This is important because it can be used to recover the account.
4. Log in with your username and password.
5. Request the 2FA code and enter it.
6. Add entries to your vault.
7. Reveal or hide passwords when needed.
8. You can also delete entries or reset your password using your master key.

## Local run
Just download the repo and run php on your desired port to get the backend working.
Then open the public url of the server running the backend and forward it to the port you picked.

Example:

```bash
cd Vaultly
php -S 0.0.0.0:8000
```

Then open the site on the public URL that points to port 8000.
