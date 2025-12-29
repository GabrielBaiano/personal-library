import fs from "fs";
import path from "path";

// Paths to README files
// This automation assumes the Profile repository is checked out in a sibling directory.
const personalReadmePath = "./README.md"; 
const profileReadmePath = "../GabrielBaiano/README.md"; 

// AUTOMATION PURPOSE:
// This script automates the synchronization of the 'Reading' section between the Personal Library
// and the GitHub Profile README. It extracts the book list from the library and injects it into the profile.
// This saves manual effort and prevents inconsistencies or human errors when updating reading status.

// Check if local file exists
if (!fs.existsSync(personalReadmePath)) {
    console.error(`File not found: ${personalReadmePath}`);
    process.exit(1);
}
const content = fs.readFileSync(personalReadmePath, "utf-8");

// Markers identifying the section to sync
const markerStart = "<!-- READING_START -->";
const markerEnd = "<!-- READING_END -->";

// Find content between markers
const startIndex = content.indexOf(markerStart);
const endIndex = content.indexOf(markerEnd);

if (startIndex === -1 || endIndex === -1) {
  console.error("Tags <!-- READING_START --> or <!-- READING_END --> not found in README.md");
  process.exit(1);
}

// Extract the content (the rows of books)
const booksBlock = content.substring(startIndex + markerStart.length, endIndex).trim();

console.log("Found books content length:", booksBlock.length);

// Function to update content between markers in a target file
function updateReadme(targetPath, newContent) {
  if (!fs.existsSync(targetPath)) {
      console.warn(`Skipping ${targetPath}: File not found (Repository might not be checked out locally)`);
      return;
  }
  let readme = fs.readFileSync(targetPath, "utf-8");
  
  if (!readme.includes(markerStart) || !readme.includes(markerEnd)) {
      console.warn(`Skipping update for ${targetPath}: Markers not found`);
      return;
  }

  const updated = readme.replace(
    /<!-- READING_START -->([\s\S]*?)<!-- READING_END -->/,
    `<!-- READING_START -->\n${newContent}\n<!-- READING_END -->`
  );

  if (readme !== updated) {
      fs.writeFileSync(targetPath, updated);
      console.log(`Updated: ${targetPath}`);
  } else {
      console.log(`No changes for: ${targetPath}`);
  }
}

// 1. Sync Local Library README (Ensures formatting consistency)
updateReadme(personalReadmePath, booksBlock);

// 2. Sync Profile README
// Convert horizontal cells (<td>...</td>...<td>...</td>) into vertical rows (<tr><td>...</td></tr>...)
let profileContent = booksBlock;
profileContent = profileContent.replace(/^\s*<tr>/, "").replace(/<\/tr>\s*$/, "");
profileContent = profileContent.replace(/<\/td>\s*<td/g, "</td></tr>\n<tr><td");
profileContent = profileContent.trim();

if (!profileContent.startsWith("<tr>")) {
    profileContent = "<tr>" + profileContent;
}
if (!profileContent.endsWith("</tr>")) {
    profileContent = profileContent + "</tr>";
}

updateReadme(profileReadmePath, profileContent);
