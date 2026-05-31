const fs = require("fs");
const path = require("path");

const contracts = [
  { name: "PolicyManager", file: "PolicyManager.sol/PolicyManager.json", output: "PolicyManager.ts" },
  { name: "InsurancePool", file: "InsurancePool.sol/InsurancePool.json", output: "InsurancePool.ts" },
  { name: "ClaimsProcessor", file: "ClaimsProcessor.sol/ClaimsProcessor.json", output: "ClaimsProcessor.ts" },
  { name: "ChainShieldToken", file: "ChainShieldToken.sol/ChainShieldToken.json", output: "ChainShieldToken.ts" },
  { name: "LPToken", file: "LPToken.sol/LPToken.json", output: "LPToken.ts" },
  { name: "ChainShieldGovernor", file: "ChainShieldGovernor.sol/ChainShieldGovernor.json", output: "ChainShieldGovernor.ts" },
];

const artifactsDir = path.join(__dirname, "../artifacts");
const outputDir = path.join(__dirname, "../src/lib/contracts/abis");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

contracts.forEach((c) => {
  const jsonPath = path.join(artifactsDir, c.file);
  if (!fs.existsSync(jsonPath)) {
    console.warn(`[ABI Extractor] Warning: Artifact for ${c.name} not found at ${jsonPath}`);
    return;
  }
  
  const artifactJson = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const abi = artifactJson.abi;
  
  // Format naming (e.g. PolicyManager -> POLICY_MANAGER_ABI)
  const formattedName = c.name
    .replace(/([A-Z])/g, "_$1")
    .replace(/^_/, "")
    .toUpperCase() + "_ABI";

  const content = `// Generated automatically from Solidity build artifacts. Do not edit manually.
export const ${formattedName} = ${JSON.stringify(abi, null, 2)} as const;
`;
  
  const outputPath = path.join(outputDir, c.output);
  fs.writeFileSync(outputPath, content, "utf8");
  console.log(`[ABI Extractor] Extracted ${c.name} ABI -> ${c.output}`);
});
