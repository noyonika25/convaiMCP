# Convai MCP Server

Create and manage Convai AI characters directly from Claude — no dashboard needed.

---

## For New Users: Quick Setup Guide

### Step 1 — Get your Convai API key

1. Go to [convai.com](https://convai.com) and sign in (or create a free account)
2. Open your dashboard and find **API Keys** in the settings/profile menu
3. Copy your API key — you'll need it in Step 3

---

### Step 2 — Find your Claude Desktop config file

**On Mac:**

1. Open **Finder**
2. Press `Cmd + Shift + G`
3. Paste this path and press Enter:
   ```
   ~/Library/Application Support/Claude/
   ```
4. Open the file named `claude_desktop_config.json` in a text editor (TextEdit, VS Code, etc.)

> If the file doesn't exist yet, create it with `{}` as the content first.

---

### Step 3 — Add the Convai MCP config

Paste this into `claude_desktop_config.json`, replacing `your_api_key_here` with the key from Step 1:

```json
{
  "mcpServers": {
    "convai": {
      "command": "npx",
      "args": ["-y", "convai-mcp-server"],
      "env": {
        "CONVAI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

> If the file already has other `mcpServers` entries, add the `"convai": { ... }` block inside the existing `mcpServers` object — don't replace the whole file.

---

### Step 4 — Restart Claude Desktop

1. Fully **quit** Claude Desktop (right-click the dock icon → Quit, or use the menu bar → Quit)
2. Reopen Claude Desktop from your Applications folder or Dock
3. Open a new chat

---

### Step 5 — Test it!

In a new Claude chat, type:

```
List my Convai characters
```

Claude will call the Convai API and show your characters. If you don't have any yet, it will say so — that means it's working!

---

## Troubleshooting

**"I don't see any Convai tools"**
- Make sure you fully quit and reopened Claude Desktop (not just closed the window)
- Check that the JSON in your config file is valid — use [jsonlint.com](https://jsonlint.com) to verify
- Make sure your API key has no extra spaces

**"Error: CONVAI_API_KEY is not set"**
- Double-check that `"CONVAI_API_KEY"` is inside the `"env"` block in your config

**"API error 401 / Unauthorized"**
- Your API key may be incorrect or expired — regenerate it from the Convai dashboard

---

## All Available Tools

| Tool | What it does | Required inputs |
|------|-------------|-----------------|
| `create_character` | Create a new AI character | `name`, `backstory` |
| `get_character` | Get full details of a character | `character_id` |
| `update_character` | Update name, backstory, or voice | `character_id` |
| `list_characters` | List all your characters | _(none)_ |
| `delete_character` | Delete a character | `character_id` |
| `add_knowledge` | Add knowledge to a character | `character_id`, `knowledge_text` |
| `list_knowledge` | List a character's knowledge entries | `character_id` |
| `set_narrative_design` | Set role, emotional range, speaking style | `character_id` |
| `clone_character` | Clone a character with a new name/backstory | `source_character_id`, `new_name` |

---

## Example Prompts

Once connected, just describe what you want — Claude picks the right tool:

> "Create a wise elven librarian named Sylara with a female voice who speaks in archaic formal english"

> "Add knowledge about the Forbidden Archives to Sylara"

> "Give Sylara a narrative design as a Guide NPC with a calm to mysterious emotional range"

> "Clone Sylara into a new character called The Shadow Librarian with a darker, more paranoid personality"

> "List all my characters"

> "Delete the character with ID abc123"

---

## Prerequisites (for local/dev setup)

- Node.js 18+
- A Convai account and API key

```bash
git clone https://github.com/noyonika25/convaimcp
cd convaimcp
npm install
cp .env.example .env
# Edit .env and add your CONVAI_API_KEY
node index.js
```
