const express = require("express");
const { poolPromise } = require("../../db");
const sql = require("mssql");

const router = express.Router();

// Lấy danh sách account
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const rs = await pool
      .request()
      .query("SELECT * FROM Account ORDER BY AccountId DESC");
    res.json({ success: true, data: rs.recordset });
  } catch (err) {
    console.error("❌ Lỗi lấy account:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Thêm account
router.post("/add", async (req, res) => {
  try {
    const { DisplayName, UserName, PassWord, RoleName } = req.body;
    const pool = await poolPromise;

    // Check username trùng
    const check = await pool
      .request()
      .input("UserName", sql.NVarChar, UserName.trim())
      .query(
        "SELECT COUNT(*) AS count FROM Account WHERE LOWER(UserName)=LOWER(@UserName)"
      );
    if (check.recordset[0].count > 0)
      return res.json({ success: false, message: "Username đã tồn tại" });

    await pool
      .request()
      .input("DisplayName", sql.NVarChar, DisplayName.trim())
      .input("UserName", sql.NVarChar, UserName.trim())
      .input("PassWord", sql.NVarChar, PassWord.trim())
      .input("RoleName", sql.NVarChar, RoleName.trim())
      .query(
        "INSERT INTO Account (DisplayName,UserName,PassWord,RoleName) VALUES (@DisplayName,@UserName,@PassWord,@RoleName)"
      );

    res.json({ success: true, message: "Thêm account thành công!" });
  } catch (err) {
    console.error("❌ Lỗi thêm account:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

module.exports = router;
