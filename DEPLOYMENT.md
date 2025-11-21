# HueShift Deployment Guide

## Deploy to Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications and is the recommended platform for HueShift.

### Method 1: Deploy via Vercel CLI

1. Install Vercel CLI (if not already installed):
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

Follow the prompts to configure your project. Vercel will automatically detect Next.js and configure the build settings.

4. For production deployment:
```bash
vercel --prod
```

### Method 2: Deploy via Vercel Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Go to [vercel.com](https://vercel.com) and sign in

3. Click "Add New Project"

4. Import your Git repository

5. Vercel will automatically detect Next.js and configure:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

6. Click "Deploy"

7. Your app will be live at `your-project-name.vercel.app`

### Environment Variables

Currently, HueShift doesn't require any environment variables. All processing is done client-side.

If you add backend features in the future, you can configure environment variables in:
- Vercel Dashboard → Your Project → Settings → Environment Variables

### Custom Domain

To add a custom domain:

1. Go to your project in Vercel Dashboard
2. Navigate to Settings → Domains
3. Add your domain
4. Follow the DNS configuration instructions

### Automatic Deployments

Once connected to Git:
- Every push to the `main` branch triggers a production deployment
- Pull requests get preview deployments automatically
- You can configure different branches for staging/production

## Deploy to Other Platforms

### Netlify

1. Push code to Git repository
2. Connect repository to Netlify
3. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Functions directory**: (leave empty for Next.js)

4. Install Next.js plugin for Netlify:
   - Add to `netlify.toml`:
   ```toml
   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```

### Self-Hosted (Node.js Server)

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm run start
```

The app will run on `http://localhost:3000`

3. For production, use a process manager like PM2:
```bash
npm install -g pm2
pm2 start npm --name "hueshift" -- start
pm2 save
pm2 startup
```

### Docker Deployment

1. Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

2. Build and run:
```bash
docker build -t hueshift .
docker run -p 3000:3000 hueshift
```

## Build Verification

Before deploying, verify the build locally:

```bash
npm run build
npm run start
```

Visit `http://localhost:3000` to test the production build.

## Performance Optimization

The production build is already optimized with:
- ✅ Static page generation
- ✅ Automatic code splitting
- ✅ Image optimization (if using Next.js Image)
- ✅ Minified JavaScript and CSS
- ✅ Tree shaking

Current bundle size: ~115 kB First Load JS

## Monitoring

After deployment, you can monitor your app in Vercel:
- Analytics (page views, unique visitors)
- Real User Monitoring
- Build logs
- Runtime logs

## Troubleshooting

### Build Fails

1. Check build logs for specific errors
2. Verify all dependencies are in `package.json`
3. Ensure Node.js version compatibility (18+)
4. Run `npm run build` locally to reproduce

### Runtime Errors

1. Check browser console for client-side errors
2. Verify all imports are correct
3. Check for missing environment variables

### Performance Issues

1. Use Vercel Analytics to identify slow pages
2. Check bundle size: `npm run build`
3. Consider code splitting for large components

## Post-Deployment Checklist

- [ ] Test all features in production
- [ ] Verify color parsing works with various formats
- [ ] Test copy/download functionality
- [ ] Check responsive design on mobile
- [ ] Verify WCAG contrast checker accuracy
- [ ] Test before/after comparison
- [ ] Confirm metadata and SEO tags
- [ ] Set up custom domain (optional)
- [ ] Configure analytics (optional)

## Support

For deployment issues:
- Vercel: https://vercel.com/docs
- Next.js: https://nextjs.org/docs/deployment
- Project Issues: https://github.com/yourusername/hueshift/issues
