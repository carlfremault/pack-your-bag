import fs from "fs/promises";
import path from "path";
import { glob } from "glob";

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function collectCoverageFiles() {
  try {
    // Folders to scan
    const patterns = ["../../apps/*", "../../packages/*"];
    const destinationDir = path.join(process.cwd(), "coverage/raw");
    await fs.mkdir(destinationDir, { recursive: true });

    const coverageFiles = [
      "coverage.json",
      "coverage-node.json",
      "coverage-browser.json",
    ];
    const collected: string[] = [];

    for (const pattern of patterns) {
      const matches = await glob(pattern);

      for (const match of matches) {
        const stats = await fs.stat(match);
        if (!stats.isDirectory()) continue;

        for (const coverageFile of coverageFiles) {
          // Check root
          let coverageFilePath = path.join(match, coverageFile);

          // Check inside "coverage/" folder
          if (!(await fileExists(coverageFilePath))) {
            coverageFilePath = path.join(match, "coverage", coverageFile);
            if (!(await fileExists(coverageFilePath))) continue;
          }

          // Copy to raw/ with unique name
          const fileName = `${path.basename(match)}-${coverageFile.replace(".json", "")}.json`;
          const destFile = path.join(destinationDir, fileName);
          await fs.copyFile(coverageFilePath, destFile);

          collected.push(`${match}/${coverageFile}`);
        }
      }
    }

    if (collected.length > 0) {
      console.log("Found coverage files:", collected.join(", "));
    } else {
      console.log("No coverage files found.");
    }

    console.log("Coverage collected into:", destinationDir);
  } catch (error) {
    console.error("Error collecting coverage files:", error);
  }
}

// Run the function
collectCoverageFiles();
