# Lovely Notes

## Deploy the API on Render

Create a Blueprint from this repository and use the included `render.yaml`.
Set `mongourl` to your MongoDB connection string and `FRONTEND_URL` to your
Netlify site origin (for example, `https://your-site.netlify.app`, without a
trailing slash). Render generates `JWT_SECRET` for the service.

After deployment, the API health endpoint is `/home`.

## Deploy the frontend on Netlify

The included `netlify.toml` sets the frontend directory, build command, output
directory, and client-side route fallback. Set the Netlify environment variable
`VITE_API_URL` to the Render API origin (for example,
`https://your-api.onrender.com`, without a trailing slash), then redeploy.
