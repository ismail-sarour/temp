import fs from "fs";

const file = process.argv[2];
if (!file) {
  console.error("usage: node fix-motion-tags.js <file>");
  process.exit(1);
}
let s = fs.readFileSync(file, "utf8");
s = s.replace(/<\/motion>/g, "</div>");
s = s.replace(/<motion(\s)/g, "<div$1");
s = s.replace(/<(\/?)motion>/g, "<$1div>");
fs.writeFileSync(file, s);
console.log("fixed", file);
