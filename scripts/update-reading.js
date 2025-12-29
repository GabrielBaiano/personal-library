import fs from "fs";
import path from "path";

// caminhos dos READMEs
// The workflow will check out the profile repo to a sibling directory usually, 
// OR we can make this configurable. For now, sticking to the user's relative path structure 
// assuming strict folder layout, but guarding against errors.
const personalReadmePath = "./README.md"; 
const profileReadmePath = "../GabrielBaiano/README.md"; 

// lê README atual
if (!fs.existsSync(personalReadmePath)) {
    console.error(`File not found: ${personalReadmePath}`);
    process.exit(1);
}
const content = fs.readFileSync(personalReadmePath, "utf-8");

// Adapting Regex to match HTML headers as seen in the file:
// Starts with: <th colspan="3">Reading</th> (or similar context) or just getting the content between markers if already tagged?
// The user wants to EXTRACT content. The file now HAS markers.
// If markers exist, we should probably extract FROM markers, to be safer.
// However, the user's script logic was: extract from Regex, THEN put into markers.
// If I use markers to extract, it becomes circular if we are updating the same file.
// But we are updating the content *inside* markers.
// Actually, the goal is: "le os livros... atualiza o README". 
// If I edit the README manually to add a book, I write it inside the markers.
// Then the script reads it and syncs it to the OTHER repo.
// AND re-writes it to the SAME repo? The user said "atualiza o README do repositório personal-library".
// This might be to ensure formatting or just a side-effect.
// Let's use the markers to EXTRACT the content. It's much more robust than the previous Regex.

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
// We add length of markerStart to get purely the content
const booksBlock = content.substring(startIndex + markerStart.length, endIndex).trim();

console.log("Found books content length:", booksBlock.length);

// constrói bloco final
// The user wanted: "## 2. What i'm reading ?\n\nReading\n${booksBlock}"
// NOTE: usage of Markdown headers '##' here might clash if the target uses HTML.
// But for the GitHub Profile README, Markdown is standard.
// For the Personal Library README, we are RE-INSERTING it.
// If we re-insert "## 2...", we might duplicate the header if we are inserting INSIDE the section.
// The markers in personal-library are INSIDE the table.
// So we should ONLY inject the `booksBlock` (the <tr>s) back into personal-library (no change essentially).
// BUT for the PROFILE readme, we likely want the full section with headers.

// Let's explicitly define what goes into Profile README.
const profileSection = `## What I'm Reading\n\n<table>\n  <tr>\n    <th colspan="3">Reading</th>\n  </tr>\n<!-- READING_START -->\n${booksBlock}\n<!-- READING_END -->\n</table>\n`;

// função para atualizar um README entre tags
function updateReadme(targetPath, newContent) {
  if (!fs.existsSync(targetPath)) {
      console.warn(`Skipping ${targetPath}: File not found (Repository might not be checked out locally)`);
      return;
  }
  let readme = fs.readFileSync(targetPath, "utf-8");

  // For the profile readme, we might look for the same markers.
  // If the profile readme doesn't have markers yet, this will fail silently (or we should warn).
  // Assuming the user WILL put markers in their profile README as instructed.
  
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

// Update Local Library README 
// (Technically it's already updated since we extracted from it, 
// but this ensures formatting/trimming consistency).
// AND we are inserting just the ROWS, not the header, because the markers are inside the table.
updateReadme(personalReadmePath, booksBlock);

// Update Profile README
// Here we might want to insert purely the rows if the Profile README has the table structure setup.
// OR we insert the whole table if markers surroud the whole section.
// The user said: "Insere nesse bloco ... igualzinho".
// If the user puts markers inside a table in Profile README, we pass `booksBlock`.
// If the user puts markers globally, we pass `profileSection`.
// Standard practice: assume the user has the table scaffolding in Profile too, or just wants the content.
// Since the Personal Library layout is specific (HTML Table), copying just the `<tr>`s (`booksBlock`) 
// assumes the target also has a `<table>`.
// I will assume `booksBlock` (just the rows) is what we want to sync, 
// assuming the user sets up the table container in their profile.
updateReadme(profileReadmePath, booksBlock);
