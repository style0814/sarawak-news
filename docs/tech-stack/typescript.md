# TypeScript

## What is TypeScript?

TypeScript is **JavaScript with types**. It catches errors before you run the code.

## JavaScript vs TypeScript

### JavaScript (No Types)
```javascript
function add(a, b) {
  return a + b;
}

add(5, "hello")  // Returns "5hello" - probably not what you wanted!
```

### TypeScript (With Types)
```typescript
function add(a: number, b: number): number {
  return a + b;
}

add(5, "hello")  // ERROR! TypeScript stops you before running
//     ^^^^^^^ Argument of type 'string' is not assignable to parameter of type 'number'
```

## Why We Use It

### 1. Catch Errors Early
TypeScript shows errors in your editor while you type, not when users find bugs.

### 2. Better Autocomplete
```typescript
interface NewsItem {
  id: number;
  title: string;
  clicks: number;
}

const news: NewsItem = { ... }
news.  // Editor shows: id, title, clicks
```

### 3. Self-Documenting Code
Types explain what data looks like:
```typescript
// Without types: What does this function return??
function getNews() { ... }

// With types: Clear! Returns array of NewsItem
function getNews(): NewsItem[] { ... }
```

## Basic Types

```typescript
// Primitives
let name: string = "John";
let age: number = 25;
let isActive: boolean = true;

// Arrays
let numbers: number[] = [1, 2, 3];
let names: string[] = ["a", "b"];

// Objects with interface
interface User {
  id: number;
  name: string;
  email?: string;  // ? means optional
}

let user: User = {
  id: 1,
  name: "John"
  // email is optional, so we can skip it
};
```

## Types in Our Project

### NewsItem Interface (lib/db.ts)
```typescript
export interface NewsItem {
  id: number;
  title: string;
  source_url: string;
  source_name: string;
  published_at: string | null;  // string OR null
  clicks: number;
  created_at: string;
  score?: number;  // optional
}
```

### Component Props
```typescript
interface NewsItemProps {
  id: number;
  rank: number;
  title: string;
  sourceUrl: string;
  sourceName: string;
  clicks: number;
  createdAt: string;
  lang: Language;
  onItemClick: (id: number) => void;  // function type
}

export default function NewsItem({
  id,
  rank,
  title,
  // ... destructure props
}: NewsItemProps) {
  // Component code
}
```

### Language Type (lib/i18n.ts)
```typescript
// Union type - can only be one of these values
export type Language = 'en' | 'zh' | 'ms';

let lang: Language = 'en';    // OK
let lang: Language = 'fr';    // ERROR! 'fr' not in union
```

## Common Patterns

### Function Types
```typescript
// Function that takes number, returns nothing
const handleClick: (id: number) => void = (id) => {
  console.log(id);
};

// Function that returns a Promise
async function fetchNews(): Promise<NewsItem[]> {
  const response = await fetch('/api/news');
  return response.json();
}
```

### Generics
```typescript
// T is a placeholder for any type
function firstItem<T>(arr: T[]): T {
  return arr[0];
}

firstItem<number>([1, 2, 3]);     // Returns number
firstItem<string>(['a', 'b']);    // Returns string
```

### Type Assertions
```typescript
// Tell TypeScript "trust me, I know the type"
const data = response.json() as NewsItem[];
```

## File Extensions

| Extension | Meaning |
|-----------|---------|
| `.ts` | TypeScript file |
| `.tsx` | TypeScript + JSX (React components) |
| `.js` | JavaScript file |
| `.jsx` | JavaScript + JSX |

## tsconfig.json

Configuration file that controls TypeScript behavior:
```json
{
  "compilerOptions": {
    "strict": true,        // Enable strict checking
    "target": "ES2017",    // Output JS version
    "jsx": "preserve"      // Handle JSX
  }
}
```

## Learn More

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [TypeScript Playground](https://www.typescriptlang.org/play) (try online)
