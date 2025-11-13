require("dotenv").config();
const { VNPay, ProductCode, VnpLocale, dateFormat } = require("vnpay");

console.log("\nÌ¥ç === KI·ªÇM TRA C·∫§U H√åNH HI·ªÜN T·∫†I ===");
console.log("Ì≥ã .env variables:");
console.log("  VNP_TMN_CODE:", process.env.VNP_TMN_CODE);
console.log("  VNP_SECURE_SECRET:", process.env.VNP_SECURE_SECRET?.substring(0,10) + "...");
console.log("  VNPAY_SECURE_SECRET:", process.env.VNPAY_SECURE_SECRET?.substring(0,10) + "...");
console.log("  VNP_RETURN_URL:", process.env.VNP_RETURN_URL);

// T·∫°o vnpay GI·ªêNG H·ªÜT placeOrder.js
const vnpay = new VNPay({
  tmnCode: process.env.VNP_TMN_CODE || process.env.VNPAY_TMN_CODE || "4Z1QBO45",
  secureSecret:
    process.env.VNP_SECURE_SECRET ||
    process.env.VNPAY_SECURE_SECRET ||
    "XQBSS9ZDQJCIKDZZ108ABV5RP6B32FOH",
  vnpayHost: "https://sandbox.vnpayment.vn",
  testMode: true,
  hashAlgorithm: "SHA512",
});

console.log("\n‚úÖ VNPay object created");
console.log("  Config used:");
console.log("    tmnCode:", process.env.VNP_TMN_CODE || process.env.VNPAY_TMN_CODE || "4Z1QBO45");

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

const params = {
  vnp_Amount: 100000,
  vnp_IpAddr: "127.0.0.1",
  vnp_TxnRef: "TEST" + Date.now(),
  vnp_OrderInfo: "Test order",
  vnp_OrderType: ProductCode.Other,
  vnp_ReturnUrl: process.env.VNP_RETURN_URL || "http://localhost:3000/vnpay-return",
  vnp_Locale: VnpLocale.VN,
  vnp_CreateDate: dateFormat(new Date()),
  vnp_ExpireDate: dateFormat(tomorrow),
};

console.log("\nÌ≥ù Params:", JSON.stringify(params, null, 2));

(async () => {
  try {
    const url = await vnpay.buildPaymentUrl(params);
    console.log("\nÌ¥ó Generated URL:", url);
    
    const urlObj = new URL(url);
    console.log("\nÌ≥ä Key params:");
    console.log("  vnp_TmnCode:", urlObj.searchParams.get("vnp_TmnCode"));
    console.log("  vnp_Amount:", urlObj.searchParams.get("vnp_Amount"));
    console.log("  vnp_ReturnUrl:", urlObj.searchParams.get("vnp_ReturnUrl"));
    console.log("  vnp_SecureHash:", urlObj.searchParams.get("vnp_SecureHash")?.substring(0, 20) + "...");
    
    console.log("\n‚úÖ TEST XONG!");
  } catch (err) {
    console.error("\n‚ùå L·ªñI:", err);
  }
})();
