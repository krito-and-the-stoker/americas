# Americas Project

This project uses Docker to simplify the setup of a local development environment. Follow the instructions below to install and run the development server, as well as to update NPM dependencies. These steps work for **Windows**, **macOS**, and **Linux**.

## 1. Install the Development Server

To set up the development environment, follow these steps:

### Step 1: Create the `.env.backend` File

Before building the container, create a `.env.backend` file in the root of the project with the following content:

```env
MONGO_INITDB_ROOT_USERNAME=root
MONGO_INITDB_ROOT_PASSWORD=example
GEOLOCATION_API_KEY=kritohastherealkey
OMIT_INITIAL_BACKUP=True
```

This file will set up the necessary environment variables for the backend.

### Step 2: Build the Development Container

Open a terminal (e.g., Command Prompt, PowerShell, or your preferred terminal on macOS/Linux like bash, zsh, etc.) and navigate to the project directory. Then, run the following command to build the Docker container:

```bash
docker compose -f docker-compose.develop.yml build
```

### Step 3: Install Node Modules

Once the container is built, install the required NPM dependencies by running this command:

```bash
docker compose -f docker-compose.install-dev.yml up
```

This will install all necessary node modules for local development.

### Step 4: Start the Development Server

After the dependencies are installed, start the development server by running:

```bash
docker compose -f docker-compose.develop.yml up
```

The development server will be running, and you can access it in your web browser at: http://localhost:3000

## 2. Update NPM Dependencies

If you need to update or reinstall NPM dependencies, follow these steps:

```bash
docker compose -f docker-compose.install-dev.yml up
```

This will ensure that all NPM dependencies are up-to-date and correctly installed inside the Docker container.

## Additional Notes

Ensure that you have Docker and Docker Compose installed on your machine:

- Windows: https://docs.docker.com/desktop/install/windows-install/
- MacOS: https://docs.docker.com/desktop/install/mac-install/
- Linux: https://docs.docker.com/engine/install/ubuntu/

If you use Windows or MacOS, you can use the Docker Desktop App to start and stop containers and observe their logs.

