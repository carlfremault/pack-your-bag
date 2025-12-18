FROM mcr.microsoft.com/devcontainers/typescript-node:22

ENV YARN_CACHE_FOLDER=/home/node/.cache/yarn

# This RUN command will:
# 1. Install Zsh, Turborepo, NestJS CLI and networking tools
# 2. Set Zsh as the default shell for the 'node' user
# 3. Enable Corepack for Yarn 4 management
# 4. Pre-create directories and set ownership to 'node' user
#    to prevent "Permission Denied" errors when mounting Named Volumes.
# 5. Clean up the APT cache
RUN apt-get update && apt-get install -y zsh iputils-ping netcat-openbsd && \
    npm install -g turbo @nestjs/cli && \
    chsh -s /usr/bin/zsh node && \
    corepack enable && corepack prepare yarn@4.11.0 --activate && \
    mkdir -p /home/node/.vscode-server/extensions \
             /home/node/.cache/yarn \
             /workspaces/pack-your-bag/node_modules && \
    chown -R node:node /home/node /workspaces/pack-your-bag && \
    apt-get clean && rm -rf /var/lib/apt/lists/*


WORKDIR /workspaces/pack-your-bag