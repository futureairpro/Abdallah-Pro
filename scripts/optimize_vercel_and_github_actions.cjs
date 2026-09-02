const fs = require('fs');

// 1. UPDATE VERCEL.JSON
const cleanVercelJson = {
  "functions": {
    "api/*.js": {
      "maxDuration": 60
    }
  },
  "rewrites": [
    {
      "source": "/dashboard",
      "destination": "/index.html"
    }
  ]
};

fs.writeFileSync('./vercel.json', JSON.stringify(cleanVercelJson, null, 2), 'utf8');
console.log('✅ Cleaned vercel.json');

// 2. OPTIMIZE GITHUB ACTIONS WORKFLOW
const cleanWorkflowYaml = `name: 24/7 Automated Life Scheduler & Reminders Dispatcher

on:
  schedule:
    - cron: '*/10 * * * *'
  workflow_dispatch:

jobs:
  dispatch_cron:
    runs-on: ubuntu-latest
    timeout-minutes: 2
    steps:
      - name: Trigger Scheduler API
        run: |
          echo "Triggering lightweight scheduler cycle on Vercel..."
          curl -s -X GET "https://abdallah-pro.vercel.app/api/cron" || true
          echo "Dispatcher cycle completed."
`;

fs.writeFileSync('./.github/workflows/scheduler.yml', cleanWorkflowYaml, 'utf8');
console.log('✅ Optimized .github/workflows/scheduler.yml to lightweight single-call dispatch');
