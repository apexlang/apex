const readme = "README.md";

console.log(`Updating ${readme} examples`);
const orig = Deno.readTextFileSync(readme);

// deno-lint-ignore no-control-regex
const colorCodes = /\x1b\[\d+;*m/g;
const upgradeNotification = /\(New version.*$/m;

const command = new Deno.Command("./apex", {
  stdout: "piped",
  args: ["help"],
});
const outout = await command.output();
const apexOutput = outout.stdout;

const helpText = new TextDecoder()
  .decode(apexOutput)
  .replace(colorCodes, "")
  .replace(upgradeNotification, "")
  .trim();

const updated = orig.replace(
  /```(console{title="apex help"}).*?```/s,
  `\`\`\`\$1
${helpText}
\`\`\``,
);

Deno.writeFileSync(readme, new TextEncoder().encode(updated));
