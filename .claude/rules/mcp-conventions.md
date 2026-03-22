# MCP Server Conventions

## Tools
- Name in `snake_case`: `get_user`, `search_files`, `create_report`
- Concise but complete description — the LLM uses it to pick the right tool
- Include examples in the description when the input format isn't obvious
- Zod schema required for input parameters
- Return structured content (text or objects), not HTML
- Each tool does one thing

## Resources
- Descriptive URI: `docs://project/readme`, `db://users/{id}`
- Resource templates for dynamic patterns
- Content with the correct MIME type
- Pagination for large lists

## Error handling
- Return `isError: true` with a clear message when a tool fails
- Differentiate user errors (bad input) from system errors
- Never crash the server because a tool fails — catch and return the error
- Log context to stderr for debugging

## Transport
- stdio: default, simplest, one client per server
- SSE (Server-Sent Events): for multi-client HTTP servers
- Don't mix logs (stderr) with transport (stdout) in stdio mode

## Testing
- Unit tests for each tool individually
- Integration tests with a real MCP client
- Mock external dependencies (APIs, databases)
- Test error cases as much as success cases
- Validate that Zod schemas reject bad inputs

## Performance
- Timeout on long-running operations
- No shared state between tool calls unless necessary
- Streaming for large responses when supported
