const readme = "README.md";

console.log(`Updating ${readme} examples`);
const orig = Deno.readTextFileSync(readme);

const colorCodes = /\x1b\[\d+;*m/g;
const upgradeNotification = /\(New version.*$/m;

const apexOutput = await Deno.run({ stdout: "piped", cmd: ["./apex", "help"] })
  .output();

const helpText = new TextDecoder().decode(apexOutput)
  .replace(colorCodes, "")
  .replace(upgradeNotification, "");

const updated = orig.replace(
  /```(console{title="apex help"}).*?```/s,
  `\`\`\`$1${helpText}\`\`\``,
);

Deno.writeFileSync(`readme.new.md`, new TextEncoder().encode(updated));
