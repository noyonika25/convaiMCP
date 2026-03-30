import { convaiRequest } from "../utils/api.js";

export const narrativeToolDefinitions = [
  {
    name: "set_narrative_design",
    description:
      "Set the narrative design of a Convai character — their role classification, emotional range, speaking style, and key topics of expertise. This appends a structured addendum to the character's backstory.",
    inputSchema: {
      type: "object",
      properties: {
        character_id: {
          type: "string",
          description: "The character ID (required)",
        },
        classification: {
          type: "string",
          description: 'Character role, e.g. "NPC", "Guide", "Antagonist"',
        },
        emotional_range: {
          type: "string",
          description: 'Emotional range, e.g. "calm to aggressive"',
        },
        speaking_style: {
          type: "string",
          description: 'Speaking style, e.g. "formal", "casual", "archaic"',
        },
        key_topics: {
          type: "array",
          items: { type: "string" },
          description: "Topics this character is an expert in",
        },
      },
      required: ["character_id"],
    },
  },
  {
    name: "clone_character",
    description:
      "Clone an existing Convai character into a new character with the same voice settings, optionally overriding the backstory.",
    inputSchema: {
      type: "object",
      properties: {
        source_character_id: {
          type: "string",
          description: "ID of the character to clone (required)",
        },
        new_name: {
          type: "string",
          description: "Name for the new character (required)",
        },
        backstory_override: {
          type: "string",
          description:
            "If provided, use this backstory instead of the source character's (optional)",
        },
      },
      required: ["source_character_id", "new_name"],
    },
  },
];

export async function handleNarrativeTool(name, args) {
  switch (name) {
    case "set_narrative_design":
      return await setNarrativeDesign(args);
    case "clone_character":
      return await cloneCharacter(args);
    default:
      throw new Error(`Unknown narrative tool: ${name}`);
  }
}

async function setNarrativeDesign({
  character_id,
  classification,
  emotional_range,
  speaking_style,
  key_topics,
}) {
  // Fetch existing character to preserve current backstory
  // Convai returns: full character object — exact shape may vary
  const existing = await convaiRequest(
    "GET",
    `/v1/character/get?charID=${character_id}`
  );

  const currentBackstory =
    existing?.backstory ?? existing?.charBackstory ?? existing?.description ?? "";

  // Build the narrative addendum
  const addendumLines = ["--- Narrative Design ---"];
  if (classification) addendumLines.push(`Role: ${classification}`);
  if (emotional_range) addendumLines.push(`Emotional range: ${emotional_range}`);
  if (speaking_style) addendumLines.push(`Speaking style: ${speaking_style}`);
  if (key_topics && key_topics.length > 0) {
    addendumLines.push(`Key expertise: ${key_topics.join(", ")}`);
  }
  addendumLines.push("--- End Narrative Design ---");

  const addendum = addendumLines.join("\n");

  // Remove any previous narrative addendum before appending new one
  const backstoryWithoutOldAddendum = currentBackstory
    .replace(/\n?--- Narrative Design ---[\s\S]*?--- End Narrative Design ---/g, "")
    .trim();

  const newBackstory = backstoryWithoutOldAddendum
    ? `${backstoryWithoutOldAddendum}\n\n${addendum}`
    : addendum;

  // Convai returns: { status } or similar — exact shape may vary
  const data = await convaiRequest("POST", "/v1/character/update", {
    charID: character_id,
    backstory: newBackstory,
  });

  const status = data?.status ?? "updated";

  return {
    content: [
      {
        type: "text",
        text: `✅ Narrative design applied to character \`${character_id}\`\n**Status:** ${status}\n\n**Addendum added to backstory:**\n\`\`\`\n${addendum}\n\`\`\``,
      },
    ],
  };
}

async function cloneCharacter({ source_character_id, new_name, backstory_override }) {
  // Fetch source character
  // Convai returns: full character object — exact shape may vary
  const source = await convaiRequest(
    "GET",
    `/v1/character/get?charID=${source_character_id}`
  );

  const voiceType =
    source?.voiceType ?? source?.voice_type ?? "FEMALE";
  const languageCode =
    source?.languageCode ?? source?.language_code ?? source?.language ?? "en-US";
  const backstory =
    backstory_override ??
    source?.backstory ??
    source?.charBackstory ??
    source?.description ??
    "";

  // Create the new character
  // Convai returns: { charID, status } — exact shape may vary
  const newChar = await convaiRequest("POST", "/v1/character/create", {
    charName: new_name,
    backstory,
    voiceType,
    languageCode,
  });

  const newCharId = newChar?.charID ?? newChar?.character_id ?? newChar?.id ?? "unknown";
  const status = newChar?.status ?? "created";

  return {
    content: [
      {
        type: "text",
        text: [
          `✅ Character cloned successfully!`,
          `**Source:** \`${source_character_id}\``,
          `**New character:** ${new_name} (ID: \`${newCharId}\`)`,
          `**Voice:** ${voiceType} | **Language:** ${languageCode}`,
          `**Backstory:** ${backstory_override ? "custom override applied" : "copied from source"}`,
          `**Status:** ${status}`,
        ].join("\n"),
      },
    ],
  };
}
