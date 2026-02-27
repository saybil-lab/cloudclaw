FROM ubuntu:24.04

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard

RUN . /root/.profile && \
    openclaw config set gateway.mode local && \
    openclaw plugins enable telegram

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
