# remnawave-mcp

MCP server for the [Remnawave](https://remnawave.com) panel API.

Built without TypeScript SDK for remnawave.

## Requirements

- Node.js ≥ 18
- A running Remnawave panel
- An API token (create one in the panel under **API Tokens**)

## Setup

```bash
npm install
npm run build
```

## Configuration (Claude Desktop)

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "remnawave": {
      "command": "node",
      "args": ["/absolute/path/to/remnawave-mcp2/dist/server.js"],
      "env": {
        "REMNAWAVE_BASE_URL": "https://your-panel.example.com",
        "REMNAWAVE_API_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

## Available Tools (Not full list)

### Auth
| Tool | Description |
|------|-------------|
| `remnawave_auth_status` | Get auth status and panel info |

### System
| Tool | Description |
|------|-------------|
| `remnawave_system_stats` | Overall stats (users, traffic, nodes) |
| `remnawave_system_health` | Panel health check |
| `remnawave_system_metadata` | Version and build info |
| `remnawave_system_recap` | Key metrics summary |
| `remnawave_system_bandwidth_stats` | Bandwidth statistics |
| `remnawave_system_nodes_statistics` | Per-node statistics |
| `remnawave_system_nodes_metrics` | Realtime node metrics |
| `remnawave_system_generate_x25519_keypair` | Generate X25519 key pair |

### Users
| Tool | Description |
|------|-------------|
| `remnawave_users_list` | Paginated user list |
| `remnawave_users_get_by_uuid` | Get user by UUID |
| `remnawave_users_get_by_username` | Get user by username |
| `remnawave_users_get_by_email` | Get user by email |
| `remnawave_users_get_by_telegram_id` | Get user by Telegram ID |
| `remnawave_users_get_by_short_uuid` | Get user by short UUID |
| `remnawave_users_get_by_tag` | Get users by tag |
| `remnawave_users_get_tags` | List all user tags |
| `remnawave_users_get_accessible_nodes` | Nodes accessible to a user |
| `remnawave_users_resolve` | Resolve user by any identifier |
| `remnawave_users_create` | Create a new user |
| `remnawave_users_update` | Update user settings |
| `remnawave_users_delete` | Delete a user |
| `remnawave_users_enable` | Enable a user |
| `remnawave_users_disable` | Disable a user |
| `remnawave_users_reset_traffic` | Reset user traffic |
| `remnawave_users_revoke_subscription` | Regenerate subscription link |

### Users — Bulk Actions
| Tool | Description |
|------|-------------|
| `remnawave_users_bulk_delete` | Delete multiple users |
| `remnawave_users_bulk_delete_by_status` | Delete all users by status |
| `remnawave_users_bulk_reset_traffic` | Reset traffic for multiple users |
| `remnawave_users_bulk_reset_all_traffic` | Reset traffic for ALL users |
| `remnawave_users_bulk_revoke_subscription` | Revoke subscriptions for multiple users |
| `remnawave_users_bulk_update` | Update fields for multiple users |
| `remnawave_users_bulk_extend_all_expiration` | Extend expiration for ALL users |

### Nodes
| Tool | Description |
|------|-------------|
| `remnawave_nodes_list` | List all nodes |
| `remnawave_nodes_get` | Get a single node |
| `remnawave_nodes_get_realtime_usage` | Realtime node usage |
| `remnawave_nodes_create` | Create a node |
| `remnawave_nodes_update` | Update a node |
| `remnawave_nodes_delete` | Delete a node |
| `remnawave_nodes_enable` | Enable a node |
| `remnawave_nodes_disable` | Disable a node |
| `remnawave_nodes_restart` | Restart a node |
| `remnawave_nodes_restart_all` | Restart all nodes |
| `remnawave_nodes_reset_traffic` | Reset node traffic |
| `remnawave_nodes_bulk_action` | Bulk ENABLE/DISABLE/RESTART/RESET_TRAFFIC |

### Hosts
| Tool | Description |
|------|-------------|
| `remnawave_hosts_list` | List all hosts |
| `remnawave_hosts_get` | Get a single host |
| `remnawave_hosts_get_tags` | List all host tags |
| `remnawave_hosts_create` | Create a host |
| `remnawave_hosts_update` | Update a host |
| `remnawave_hosts_delete` | Delete a host |
| `remnawave_hosts_bulk_delete` | Delete multiple hosts |
| `remnawave_hosts_bulk_enable` | Enable multiple hosts |
| `remnawave_hosts_bulk_disable` | Disable multiple hosts |
