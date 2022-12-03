const textEncoder = typeof TextEncoder === "function" && new TextEncoder();
const textDecoder = typeof TextDecoder === "function" && new TextDecoder();

export function encode(input: string): Uint8Array {
  if (textEncoder) return textEncoder.encode(input);

  const s = encodeURIComponent(input);
  const result = [];
  for (let i = 0; i < s.length; i++) {
    const code = s.charAt(i);
    if (code === "%") {
      result.push(parseInt(s.charAt(i + 1) + s.charAt(i + 2), 16));
      i += 2;
    } else result.push(code.charCodeAt(0));
  }

  return new Uint8Array(result);
}

export function decode(input: Uint8Array): string {
  if (textDecoder) return textDecoder.decode(input);
  return decodeURIComponent(
    Array.from(input)
      .map((code) => `%${code.toString(16).padStart(2, "0")}`)
      .join("")
  );
}
