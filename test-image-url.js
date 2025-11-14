// Test URL image handling
const {
  getImageUrl,
  getDefaultImage,
  getAvatarUrl,
} = require("../frontend/src/utils/imageUtils.js");

// Test cases
const testCases = [
  // Supabase URLs (should return as-is)
  "https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/Cafe/traxanhespresso.png",
  "https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/Avatar/a.png",

  // Relative paths (should add localhost)
  "/images/Cafe/bacxiulacmuoi.png",
  "/images/Avatar/default.png",

  // No leading slash (should add localhost)
  "images/banh/banhgau.png",

  // Empty/null cases
  null,
  "",
  undefined,
];

console.log("🧪 Testing Image URL Helper Functions\n");

testCases.forEach((input, index) => {
  console.log(`Test ${index + 1}: Input = "${input}"`);
  console.log(`   getImageUrl() = "${getImageUrl(input)}"`);
  console.log(`   getAvatarUrl() = "${getAvatarUrl(input)}"`);
  console.log("");
});

console.log("✅ Default Image:", getDefaultImage());
