import { convaiRequest } from "../utils/api.js";

export const characterToolDefinitions = [
  {
    name: "create_character",
    description:
      "Create a new Convai AI character with a name, backstory, voice type, and language.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Character name (required)" },
        backstory: {
          type: "string",
          description: "Character backstory / personality description (required)",
        },
        voice_type: {
          type: "string",
          enum: ["MALE", "FEMALE"],
          description: "Voice type — MALE or FEMALE (default: FEMALE)",
        },
        language: {
          type: "string",
          description: 'Language code (default: "en-US")',
        },
      },
      required: ["name", "backstory"],
    },
  },
  {
    name: "get_character",
    description: "Retrieve full details of a Convai character by ID.",
    inputSchema: {
      type: "object",
      properties: {
        character_id: { type: "string", description: "The character ID" },
      },
      required: ["character_id"],
    },
  },
  {
    name: "update_character",
    description:
      "Update an existing Convai character's name, backstory, or voice type.",
    inputSchema: {
      type: "object",
      properties: {
        character_id: {
          type: "string",
          description: "The character ID (required)",
        },
        name: { type: "string", description: "New character name (optional)" },
        backstory: {
          type: "string",
          description: "New backstory (optional)",
        },
        voice_type: {
          type: "string",
          enum: ["MALE", "FEMALE"],
          description: "New voice type (optional)",
        },
      },
      required: ["character_id"],
    },
  },
  {
    name: "list_characters",
    description: "List all Convai characters in your account.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "delete_character",
    description: "Delete a Convai character by ID.",
    inputSchema: {
      type: "object",
      properties: {
        character_id: {
          type: "string",
          description: "The character ID to delete",
        },
      },
      required: ["character_id"],
    },
  },
];

export async function handleCharacterTool(name, args) {
  switch (name) {
    case "create_character":
      return await createCharacter(args);
    case "get_character":
      return await getCharacter(args);
    case "update_character":
      return await updateCharacter(args);
    case "list_characters":
      return await listCharacters();
    case "delete_character":
      return await deleteCharacter(args);
    default:
      throw new Error(`Unknown character tool: ${name}`);
  }
}

async function createCharacter({ name, backstory, voice_type = "FEMALE", language = "en-US" }) {
  // Convai returns: { charID, status } — exact shape may vary
  const data = await convaiRequest("POST", "/v1/character/create", {
    charName: name,
    backstory,
    voiceType: voice_type,
    languageCode: language,
  });

  const charId = data?.charID ?? data?.character_id ?? data?.id ?? "unknown";
  const status = data?.status ?? "created";

  return {
    content: [
      {
        type: "text",
        text: `✅ Character created successfully!\n\n**Name:** ${name}\n**ID:** ${charId}\n**Voice:** ${voice_type}\n**Language:** ${language}\n**Status:** ${status}\n\n**Next steps:**\n- Use \`add_knowledge\` to give ${name} specialized knowledge\n- Use \`set_narrative_design\` to define their role and speaking style\n- Use \`get_character\` to review the full character profile`,
      },
    ],
  };
}

async function getCharacter({ character_id }) {
  // Convai returns: full character object — exact shape may vary
  const data = await convaiRequest("GET", `/v1/character/get?charID=${character_id}`);

  return {
    content: [
      {
        type: "text",
        text: `**Character Details (ID: ${character_id})**\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``,
      },
    ],
  };
}

async function updateCharacter({ character_id, name, backstory, voice_type }) {
  const updates = { charID: character_id };
  const updated = [];

  if (name !== undefined) {
    updates.charName = name;
    updated.push(`name → "${name}"`);
  }
  if (backstory !== undefined) {
    updates.backstory = backstory;
    updated.push("backstory");
  }
  if (voice_type !== undefined) {
    updates.voiceType = voice_type;
    updated.push(`voice_type → ${voice_type}`);
  }

  if (updated.length === 0) {
    return {
      content: [{ type: "text", text: "⚠️ No fields provided to update." }],
    };
  }

  // Convai returns: { status } or similar — exact shape may vary
  const data = await convaiRequest("POST", "/v1/character/update", updates);

  const status = data?.status ?? "updated";

  return {
    content: [
      {
        type: "text",
        text: `✅ Character updated (ID: ${character_id})\n\n**Updated:** ${updated.join(", ")}\n**Status:** ${status}`,
      },
    ],
  };
}

async function listCharacters() {
  // Convai returns: array or object containing characters — exact shape may vary
  const data = await convaiRequest("GET", "/v1/characters");

  const characters = Array.isArray(data)
    ? data
    : data?.characters ?? data?.data ?? [];

  if (characters.length === 0) {
    return {
      content: [{ type: "text", text: "No characters found in your account." }],
    };
  }

  const list = characters
    .map((c, i) => {
      const id = c?.charID ?? c?.character_id ?? c?.id ?? "unknown";
      const name = c?.charName ?? c?.name ?? "Unnamed";
      const voice = c?.voiceType ?? c?.voice_type ?? "—";
      return `${i + 1}. **${name}** — ID: \`${id}\` | Voice: ${voice}`;
    })
    .join("\n");

  return {
    content: [
      {
        type: "text",
        text: `**Your Convai Characters (${characters.length} total)**\n\n${list}`,
      },
    ],
  };
}

async function deleteCharacter({ character_id }) {
  // Convai returns: empty or { status } — exact shape may vary
  await convaiRequest("DELETE", `/v1/character/${character_id}`);

  return {
    content: [
      {
        type: "text",
        text: `✅ Character \`${character_id}\` has been deleted.`,
      },
    ],
  };
}
