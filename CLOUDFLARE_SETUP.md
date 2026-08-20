# Cloudflare & Vercel Deployment Setup for `shuvamsingh.com.np`

This guide explains how to connect your domain **`shuvamsingh.com.np`** to your **Vercel** deployment with **Cloudflare DNS & SSL**.

---

## 1. Domain Status & Nameservers
- **Domain:** `shuvamsingh.com.np`
- **Registry:** `register.com.np` (Status: Approved, waiting for active)
- **Primary Nameserver:** `sima.ns.cloudflare.com`
- **Secondary Nameserver:** `vick.ns.cloudflare.com`

---

## 2. Cloudflare DNS Configuration

Log in to your **Cloudflare Dashboard** (`dash.cloudflare.com`) → Select `shuvamsingh.com.np` → **DNS** → **Records** and add the following:

| Type | Name | Content (Value) | Proxy status | TTL | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CNAME** | `@` (or `shuvamsingh.com.np`) | `cname.vercel-dns.com` | **DNS only (Gray Cloud)** | Auto | Routes root domain to Vercel |
| **CNAME** | `www` | `cname.vercel-dns.com` | **DNS only (Gray Cloud)** | Auto | Routes www subdomain to Vercel |

*(Alternative if your DNS requires an A-record for `@`:)*
| Type | Name | Content (Value) | Proxy status |
| :--- | :--- | :--- | :--- |
| **A** | `@` | `76.76.21.21` | **DNS only (Gray Cloud)** |

> [!NOTE]
> Keep the Proxy status as **DNS only (Gray cloud)** during initial Vercel SSL verification so Vercel can issue the Let's Encrypt certificate automatically. Once verified, you can toggle it to **Proxied (Orange cloud)** if desired.

---

## 3. Cloudflare SSL/TLS Settings
In Cloudflare:
- Go to **SSL/TLS** → **Overview**
- Set encryption mode to **Full** (or **Full (strict)**) to ensure seamless HTTPS between Cloudflare and Vercel.

---

## 4. Deploying to Vercel

### Method A: Connect via GitHub (Automatic CI/CD)
1. Push this repository to your GitHub account: `https://github.com/samshuvam/portfolio` (or `shuvamsingh-website`).
2. Go to [Vercel Dashboard](https://vercel.com/samshuvams-projects).
3. Click **Add New** → **Project** → Select your GitHub repository.
4. Framework Preset: **Vite** (detected automatically).
5. Click **Deploy**.

### Method B: Deploy via Vercel CLI
Run in this directory:
```bash
npx vercel
```
Follow the prompts (log in via Edge browser, select project scope `samshuvam`).

---

## 5. Adding Custom Domain in Vercel
1. Once deployed, open your project in the [Vercel Dashboard](https://vercel.com/samshuvams-projects).
2. Go to **Settings** → **Domains**.
3. Enter `shuvamsingh.com.np` and `www.shuvamsingh.com.np`.
4. Vercel will verify the DNS records from Cloudflare. As soon as `register.com.np` finishes activating the `.np` domain, your portfolio will go live worldwide!

---

## 6. Local Development & Preview
To run the website locally:
```bash
npm run dev
```
To build for production:
```bash
npm run build
```
To preview the production build locally:
```bash
npm run preview
```
