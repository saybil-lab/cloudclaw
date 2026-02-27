#!/bin/bash
set -e

. /root/.profile 2>/dev/null || true
. /root/.bashrc 2>/dev/null || true

# Configure Telegram from env
if [ -n "$TELEGRAM_TOKEN" ]; then
    openclaw config set channels.telegram.enabled true
    openclaw config set channels.telegram.botToken "$TELEGRAM_TOKEN"
    openclaw config set channels.telegram.allowFrom '["*"]'
    openclaw config set channels.telegram.dmPolicy '"open"'
    openclaw config set channels.telegram.groups '{"*":{"requireMention":true}}'
fi

# Configure LLM from env
if [ -n "$ANTHROPIC_API_KEY" ]; then
    openclaw config set env.ANTHROPIC_API_KEY "$ANTHROPIC_API_KEY"
    openclaw config set agents.defaults.model.primary "${LLM_MODEL:-anthropic/claude-opus-4-6}"
elif [ -n "$OPENAI_API_KEY" ]; then
    openclaw config set env.OPENAI_API_KEY "$OPENAI_API_KEY"
    openclaw config set agents.defaults.model.primary "${LLM_MODEL:-openai/gpt-4o}"
fi

# Start gateway directly (no systemd in Docker)
exec openclaw gateway
