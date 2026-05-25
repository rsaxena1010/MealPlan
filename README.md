# Indian Meal Planner

A web app that suggests protein-rich Indian meals for lunch and dinner, powered by Claude AI.

## Features

- **My Ingredients mode** — enter what you have in your fridge and get tailored lunch + dinner suggestions
- **Pantry Essentials mode** — discover which Indian ingredients to keep stocked, plus sample meals
- **Nutrition targets** — set daily calorie/protein/carbs/fat goals and see progress bars per meal and for the day
- **Per-meal breakdown** — calories, protein, carbs, fat per serving
- **Meal cards** — expandable with ingredients list and step-by-step instructions

## Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express (proxies Claude API calls, keeps API key server-side)
- **AI**: Claude API (`claude-sonnet-4-6`) for dynamic meal suggestions

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Set your API key
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# 3. Start the app (runs Express on :3001 and Vite on :5173 concurrently)
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev servers (frontend + backend) |
| `npm run build` | Production build |
| `npm run server` | Start backend only |
