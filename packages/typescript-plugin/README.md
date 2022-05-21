# TypeScript Language Service Plugin for Estrela

It partially adds syntax for Estrela state properties. It's still a work in progress.

```tsx
function App() {
  let count = 0;

  // get the "State" reference of "count" by adding a "$" sign to the end of the name.
  count$.subscribe(console.log);

  setInterval(() => count++, 1000);

  return <div>Count is {count}</div>
}
```

## Contributing

Help is welcome.

Todo:
- Add intellisense for `State` props.
- Add `css` syntax to `styled` template string.
