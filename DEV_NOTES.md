# Dump2Done Dev Notes

## Free Dev Ports

Windows:

```powershell
netstat -ano | findstr :3001
taskkill /PID <PID> /F
netstat -ano | findstr :3002
taskkill /PID <PID> /F
```

Or run:

```powershell
npm run ports:windows
```

Mac/Linux:

```bash
lsof -ti:3001 | xargs kill -9
lsof -ti:3002 | xargs kill -9
```

## Local AI

Dump2Done uses Ollama locally. Default model is `qwen3:4b`.

```powershell
ollama pull qwen3:4b
```

If Ollama or the model is unavailable, the app uses a local fallback planner so the MVP still works offline.
