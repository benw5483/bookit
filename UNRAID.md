# Deploying Bookit to Unraid

This guide provides step-by-step instructions for deploying Bookit on your Unraid server.

## Prerequisites

- Unraid 6.9 or later
- Docker enabled in Unraid
- Basic familiarity with the Unraid Docker interface

## Installation Methods

### Method 1: Manual Docker Template (Recommended)

1. **Open the Unraid Web UI** and navigate to the **Docker** tab.

2. **Click "Add Container"** at the bottom of the page.

3. **Configure the template** with the following settings:

#### Basic Settings

| Field        | Value                            |
| ------------ | -------------------------------- |
| Name         | `bookit`                         |
| Repository   | `ghcr.io/benw5483/bookit:latest` |
| Network Type | `bridge`                         |

#### Port Mappings

| Container Port | Host Port               | Description   |
| -------------- | ----------------------- | ------------- |
| `3000`         | `3000` (or your choice) | Web interface |

#### Volume Mappings

| Container Path        | Host Path                          | Description                |
| --------------------- | ---------------------------------- | -------------------------- |
| `/app/data`           | `/mnt/user/appdata/bookit/data`    | SQLite database            |
| `/app/public/uploads` | `/mnt/user/appdata/bookit/uploads` | Uploaded images & favicons |

#### Environment Variables

| Variable           | Value                      | Description                |
| ------------------ | -------------------------- | -------------------------- |
| `AUTH_SECRET`      | (generate a random string) | Session encryption key     |
| `INITIAL_USERNAME` | `admin`                    | Your login username        |
| `INITIAL_PASSWORD` | (your secure password)     | Your login password        |
| `AUTH_TRUST_HOST`  | `true`                     | Required for reverse proxy |
| `TZ`               | `America/New_York`         | Your timezone              |

4. **Click "Apply"** to create and start the container.

### Method 2: Docker Compose via Compose Manager Plugin

If you have the **Compose Manager** plugin installed:

1. Create a new stack or add to an existing one.

2. Use this compose configuration:

```yaml
version: "3.8"

services:
  bookit:
    image: ghcr.io/benw5483/bookit:latest
    container_name: bookit
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - /mnt/user/appdata/bookit/data:/app/data
      - /mnt/user/appdata/bookit/uploads:/app/public/uploads
    environment:
      - AUTH_SECRET=your-secret-key-here
      - INITIAL_USERNAME=admin
      - INITIAL_PASSWORD=your-secure-password
      - AUTH_TRUST_HOST=true
      - TZ=America/New_York
```

3. Deploy the stack.

### Method 3: Build Locally on Unraid

If you prefer to build the image yourself:

1. **SSH into your Unraid server** or use the terminal in the web UI.

2. **Clone the repository**:

   ```bash
   cd /mnt/user/appdata
   git clone https://github.com/benw5483/bookit.git
   cd bookit
   ```

3. **Build the Docker image**:

   ```bash
   docker build -t bookit:latest .
   ```

4. **Follow Method 1** above, using `bookit:latest` as the repository.

## Generating AUTH_SECRET

The `AUTH_SECRET` should be a random string at least 32 characters long. Generate one using:

```bash
openssl rand -base64 32
```

Or use an online generator for a random string.

## Reverse Proxy Setup

### Using Nginx Proxy Manager (Recommended)

1. Add a new Proxy Host in Nginx Proxy Manager.

2. Configure the following:
   - **Domain**: `bookit.yourdomain.com`
   - **Scheme**: `http`
   - **Forward Hostname/IP**: `bookit` (container name) or Unraid IP
   - **Forward Port**: `3000`
   - **Websockets Support**: Enable

3. Set up SSL using Let's Encrypt in the SSL tab.

### Using Unraid's Built-in Reverse Proxy (SWAG)

Add to your SWAG proxy configuration:

```nginx
server {
    listen 443 ssl;
    server_name bookit.yourdomain.com;

    include /config/nginx/ssl.conf;

    location / {
        proxy_pass http://bookit:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Post-Installation

1. **Access Bookit** at `http://YOUR_UNRAID_IP:3000`

2. **Log in** with the username and password you configured.

3. **Start adding bookmarks!**

## Updating Bookit

### If using a remote image:

```bash
docker pull ghcr.io/benw5483/bookit:latest
```

Then restart the container from the Unraid Docker tab.

### If built locally:

```bash
cd /mnt/user/appdata/bookit
git pull
docker build -t bookit:latest .
```

Then restart the container.

## Backup

Your data is stored in two locations:

- **Database**: `/mnt/user/appdata/bookit/data/bookit.db`
- **Uploads**: `/mnt/user/appdata/bookit/uploads/`

Include these paths in your Unraid backup solution (e.g., Appdata Backup plugin).

## Troubleshooting

### Container won't start

Check the container logs:

```bash
docker logs bookit
```

Common issues:

- **Permission denied**: Ensure the appdata directories exist and have correct permissions
- **Port already in use**: Change the host port mapping

### Can't log in

- Verify `INITIAL_USERNAME` and `INITIAL_PASSWORD` are set correctly
- The initial user is only created on first run. To reset:
  1. Stop the container
  2. Delete `/mnt/user/appdata/bookit/data/bookit.db`
  3. Start the container again

### Favicons not loading

- Ensure the uploads volume is mapped correctly
- Check that the container can reach external URLs (network connectivity)

### Database locked errors

- Ensure only one instance of Bookit is running
- Check available disk space on your array

## Unraid-Specific Tips

- **Use the Cache Drive**: For better performance, consider setting the appdata share to use cache (prefer or only).

- **Docker Network**: If using a reverse proxy container, ensure both containers are on the same Docker network for hostname resolution.

- **Scheduled Backups**: Use the **CA Appdata Backup** plugin to automatically backup your Bookit data.

## Support

For issues and feature requests, visit: https://github.com/benw5483/bookit/issues
