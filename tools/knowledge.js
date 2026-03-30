import { convaiRequest } from "../utils/api.js";

export const knowledgeToolDefinitions = [
  {
    name: "add_knowledge",
    description:
      "Add a knowledge entry to a Convai character's knowledge bank.",
    inputSchema: {
      type: "object",
      properties: {
        character_id: {
          type: "string",
          description: "The character ID to add knowledge to (required)",
        },
        knowledge_text: {
          type: "string",
          description: "The knowledge content to add (required)",
        },
        knowledge_title: {
          type: "string",
          description: "A short title for this knowledge entry (optional)",
        },
      },
      required: ["character_id", "knowledge_text"],
    },
  },
  {
    name: "list_knowledge",
    description: "List all knowledge entries for a Convai character.",
    inputSchema: {
      type: "object",
      properties: {
        character_id: {
          type: "string",
          description: "The character ID to list knowledge for (required)",
        },
      },
      required: ["character_id"],
    },
  },
];

export async function handleKnowledgeTool(name, args) {
  switch (name) {
    case "add_knowledge":
      return await addKnowledge(args);
    case "list_knowledge":
      return await listKnowledge(args);
    default:
      throw new Error(`Unknown knowledge tool: ${name}`);
  }
}

async function addKnowledge({ character_id, knowledge_text, knowledge_title }) {
  const body = {
    charID: character_id,
    knowledge: knowledge_text,
  };
  if (knowledge_title !== undefined) {
    body.title = knowledge_title;
  }

  // Convai returns: { status, knowledgeID } or similar — exact shape may vary
  const data = await convaiRequest("POST", "/v1/knowledge/upload", body);

  const status = data?.status ?? "uploaded";
  const knowledgeId = data?.knowledgeID ?? data?.knowledge_id ?? data?.id;

  const preview =
    knowledge_text.length > 120
      ? knowledge_text.slice(0, 120) + "…"
      : knowledge_text;

  return {
    content: [
      {
        type: "text",
        text: [
          `✅ Knowledge added to character \`${character_id}\``,
          knowledge_title ? `**Title:** ${knowledge_title}` : null,
          knowledgeId ? `**Knowledge ID:** ${knowledgeId}` : null,
          `**Status:** ${status}`,
          `**Preview:** "${preview}"`,
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ],
  };
}

async function listKnowledge({ character_id }) {
  // Convai returns: array or object of knowledge entries — exact shape may vary
  const data = await convaiRequest(
    "GET",
    `/v1/knowledge/list?charID=${character_id}`
  );

  const entries = Array.isArray(data)
    ? data
    : data?.knowledge ?? data?.entries ?? data?.data ?? [];

  if (entries.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: `No knowledge entries found for character \`${character_id}\`.`,
        },
      ],
    };
  }

  const list = entries
    .map((e, i) => {
      const id = e?.knowledgeID ?? e?.knowledge_id ?? e?.id ?? "unknown";
      const title = e?.title ?? e?.name ?? "Untitled";
      const preview = (e?.knowledge ?? e?.text ?? e?.content ?? "")
        .slice(0, 80);
      return `${i + 1}. **${title}** (ID: \`${id}\`)\n   ${preview}${preview.length === 80 ? "…" : ""}`;
    })
    .join("\n\n");

  return {
    content: [
      {
        type: "text",
        text: `**Knowledge entries for character \`${character_id}\` (${entries.length} total)**\n\n${list}`,
      },
    ],
  };
}
