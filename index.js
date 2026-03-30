#!/usr/bin/env node
import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import {
  characterToolDefinitions,
  handleCharacterTool,
} from "./tools/character.js";
import {
  knowledgeToolDefinitions,
  handleKnowledgeTool,
} from "./tools/knowledge.js";
import {
  narrativeToolDefinitions,
  handleNarrativeTool,
} from "./tools/narrative.js";

const allTools = [
  ...characterToolDefinitions,
  ...knowledgeToolDefinitions,
  ...narrativeToolDefinitions,
];

const server = new Server(
  { name: "convai-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: allTools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Route by tool name prefix / ownership
    if (name.startsWith("create_character") || name === "get_character" ||
        name === "update_character" || name === "list_characters" ||
        name === "delete_character") {
      return await handleCharacterTool(name, args ?? {});
    }

    if (name === "add_knowledge" || name === "list_knowledge") {
      return await handleKnowledgeTool(name, args ?? {});
    }

    if (name === "set_narrative_design" || name === "clone_character") {
      return await handleNarrativeTool(name, args ?? {});
    }

    return {
      content: [{ type: "text", text: `❌ Unknown tool: ${name}` }],
      isError: true,
    };
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Error in ${name}: ${err.message}`,
        },
      ],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("✅ Convai MCP server running");
