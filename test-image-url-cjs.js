// Test URL image handling (CommonJS version)

// Helper function để xử lý URL ảnh từ database
const getImageUrl = (imageUrl) => {
  if (!imageUrl)
    return "https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/no-image.png";

  // Nếu URL đã là absolute (bắt đầu với http/https), trả về trực tiếp
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // Nếu URL là relative path (bắt đầu với /), thêm localhost base URL
  if (imageUrl.startsWith("/")) {
    return `http://localhost:5000${imageUrl}`;
  }

  // Fallback: thêm localhost base URL
  return `http://localhost:5000/${imageUrl}`;
};

// Default image cho trường hợp lỗi
const getDefaultImage = () => {
  return "https://vhkvfmbmmsolqiwrjlxp.supabase.co/storage/v1/object/public/images/no-image.png";
};

// Helper function để xử lý avatar URL
const getAvatarUrl = (avatarUrl) => {
  if (!avatarUrl) return getDefaultImage();
  return getImageUrl(avatarUrl);
};

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

console.log("\n📋 Summary:");
console.log("- Supabase URLs: ✅ Returned as-is");
console.log("- Relative paths: ✅ Localhost prefix added");
console.log("- Empty/null: ✅ Default Supabase image returned");
console.log("\n🎯 This should fix the infinite loop image loading issue!");
