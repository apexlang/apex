test:
  deno fmt --check src/ test/
  deno test --unstable -A test/*.test.ts

install:
  deno install -f -A --unstable ./apex.ts

