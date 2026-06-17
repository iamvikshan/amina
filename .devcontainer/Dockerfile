ARG VARIANT="26.04"
FROM ubuntu:${VARIANT}

ARG USERNAME=root
ENV DEBIAN_FRONTEND=noninteractive

# Install system essentials and Bun
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl zsh git sudo unzip xz-utils jq python3 btop ripgrep tree \
    && curl -fsSL https://bun.sh/install | bash \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Symlink Bun
RUN if [ "${USERNAME}" != "root" ]; then \
    mv /root/.bun /home/${USERNAME}/.bun \
    && ln -s /home/${USERNAME}/.bun/bin/bun /usr/local/bin/bun \
    && ln -s /home/${USERNAME}/.bun/bin/bunx /usr/local/bin/bunx; \
    else \
    ln -s /root/.bun/bin/bun /usr/local/bin/bun \
    && ln -s /root/.bun/bin/bunx /usr/local/bin/bunx; \
    fi

# Configure ZSH and fetch remote setup script
RUN if [ "${USERNAME}" != "root" ]; then \
        usermod -s /bin/zsh "${USERNAME}"; \
        HOME_DIR="/home/${USERNAME}"; \
    else \
        HOME_DIR="/root"; \
    fi && \
    mkdir -p "${HOME_DIR}" && \
    git clone --depth=1 https://github.com/ohmyzsh/ohmyzsh.git "${HOME_DIR}/.oh-my-zsh" && \
    git clone --depth=1 https://github.com/zsh-users/zsh-autosuggestions "${HOME_DIR}/.oh-my-zsh/custom/plugins/zsh-autosuggestions" && \
    git clone --depth=1 https://github.com/zsh-users/zsh-syntax-highlighting "${HOME_DIR}/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting" && \
    curl -fsSL https://raw.githubusercontent.com/iamvikshan/.github/refs/heads/main/scripts/universal.zshrc -o "${HOME_DIR}/.zshrc" && \
    if [ "${USERNAME}" != "root" ]; then \
        chown -R "${USERNAME}:${USERNAME}" "${HOME_DIR}"; \
    fi

# Bake Coderabbit CLI into the image safely and globalize it
RUN curl -fsSL https://cli.coderabbit.ai/install.sh -o /tmp/install_coderabbit.sh \
    && bash /tmp/install_coderabbit.sh \
    && mv /root/.local/bin/coderabbit /usr/local/bin/coderabbit \
    && rm /tmp/install_coderabbit.sh

USER ${USERNAME}
CMD ["/bin/zsh"]