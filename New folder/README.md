# MERN Portfolio Starter

A modern MERN portfolio project scaffolded for a software engineer.

## Structure

- `frontend/` - React app for the portfolio UI
- `backend/` - Express API with MongoDB support

## Quick start

### Backend

1. Navigate to `backend`
2. Install dependencies: `npm install`
3. Create `.env` using `.env.example`
4. Start dev server: `npm run dev`
5. Optionally test API routes with Postman or another API client

### Frontend

1. Navigate to `frontend`
2. Install dependencies: `npm install`
3. Start dev server: `npm start`

## Notes

- The frontend uses a polished one-page portfolio layout with modern 3D-inspired styling.
- Replace sample projects and personal details with your own content.
- The app supports a fallback project display when no backend API is configured.

## Deploying the frontend to Netlify

This project can be deployed as frontend-only to Netlify. You do not need to deploy the backend unless you want live project data.

1. In Netlify, create a new site from Git.
2. Select the repository and set the publish directory to `frontend`.
3. Set the build command to `npm run build`.
4. Set the publish directory to `build`.
5. If you want the app to fetch live project data from an API, add a `REACT_APP_API_URL` environment variable with a value like:
   - `https://your-backend-host.com/api/portfolio`
6. If you do not set `REACT_APP_API_URL`, the app will use its built-in fallback project data.

If you later deploy a backend separately, use that backend URL in Netlify environment variables so the React app can fetch live portfolio data.

## Resume

- Add your resume file as `frontend/public/resume.pdf`.
- The portfolio will use that file for the `Download Resume` buttons.
- If you want, I can also help you create a polished resume PDF with your details.
