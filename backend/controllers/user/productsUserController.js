const sequelize = require("../../config/sequelize");
const initModels = require("../../models/init-models");
const models = initModels(sequelize);
const { Food, Category, Size, Topping } = models;
const { Op, fn, col, literal } = require("sequelize");

// ================== HÀM HỖ TRỢ ==================
const mapCategoryToLike = (cat) => {
  switch ((cat || "").toLowerCase()) {
    case "coffee":
      return "Cà phê%";
    case "milktea":
      return "Trà sữa%";
    case "frappe":
      return "Thức uống đá xay%";
    case "snack":
      return "Bánh & Snack%";
    case "fruittea":
      return "Trà trái cây%";
    default:
      return "";
  }
};

const sortToOrderBy = (sort) => {
  switch ((sort || "").toLowerCase()) {
    case "name_asc":
      return [["FoodName", "ASC"]];
    case "name_desc":
      return [["FoodName", "DESC"]];
    case "price_asc":
      return [
        [
          literal(
            "ISNULL([Food].[DiscountPrice], [Food].[Price] * (1 - ISNULL([Food].[Discount], 0) / 100.0))"
          ),
          "ASC",
        ],
        ["Price", "ASC"],
      ];
    case "price_desc":
      return [
        [
          literal(
            "ISNULL([Food].[DiscountPrice], [Food].[Price] * (1 - ISNULL([Food].[Discount], 0) / 100.0))"
          ),
          "DESC",
        ],
        ["Price", "DESC"],
      ];
    case "id_asc":
      return [["FoodId", "ASC"]];
    default:
      return [["FoodId", "ASC"]];
  }
};

// =========================
// 📌 LẤY DANH SÁCH SẢN PHẨM
// =========================
exports.getProducts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "10", 10), 1);
    const offset = (page - 1) * limit;
    const keyword = (req.query.keyword || "").trim();
    const category = (req.query.category || "").trim(); // 'all', 'coffee', etc.
    const sort = (req.query.sort || "").trim();
    const minPrice = parseFloat(req.query.minPrice) || null;
    const maxPrice = parseFloat(req.query.maxPrice) || null;

    const where = {};
    const categoryWhere = {};

    // 🔹 Filter keyword
    if (keyword) {
      where[Op.or] = [
        { FoodName: { [Op.like]: `%${keyword}%` } },
        { Description: { [Op.like]: `%${keyword}%` } },
      ];
    }

    // 🔹 Filter category
    const catLike = mapCategoryToLike(category); // giữ nguyên map từ frontend
    if (catLike) {
      categoryWhere.CategoryName = { [Op.like]: catLike };
    }

    // 🔹 Filter min/max price
    if (minPrice !== null && !isNaN(minPrice)) {
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push(
        literal(
          `ISNULL([Food].[DiscountPrice], [Food].[Price] * (1 - ISNULL([Food].[Discount], 0)/100.0)) >= ${minPrice}`
        )
      );
    }
    if (maxPrice !== null && !isNaN(maxPrice)) {
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push(
        literal(
          `ISNULL([Food].[DiscountPrice], [Food].[Price] * (1 - ISNULL([Food].[Discount], 0)/100.0)) <= ${maxPrice}`
        )
      );
    }

    // 🔹 Query products
    const products = await Food.findAll({
      where,
      offset,
      limit,
      order: sortToOrderBy(sort),
      attributes: [
        "FoodId",
        "FoodName",
        "Description",
        "Price",
        "Discount",
        [
          literal(
            "ISNULL([Food].[DiscountPrice], [Food].[Price] * (1 - ISNULL([Food].[Discount], 0)/100.0))"
          ),
          "DiscountPrice",
        ],
        "Stock",
        "CreatedDate",
        "UpdatedDate",
        "Status",
        "ImageURL",
      ],
      include: [
        {
          model: Category,
          as: "Category",
          attributes: ["CategoryId", "CategoryName"],
          where: category !== "all" ? categoryWhere : undefined,
          required: category !== "all", // chỉ INNER JOIN nếu chọn category
        },
      ],
    });

    // 🔹 Count tổng
    const total = await Food.count({
      where,
      include: [
        {
          model: Category,
          as: "Category",
          where: category !== "all" ? categoryWhere : undefined,
          required: category !== "all",
        },
      ],
    });

    // 🔹 Format data trả về
    const formattedProducts = products.map((p) => ({
      FoodId: p.FoodId,
      FoodName: p.FoodName,
      Description: p.Description,
      Price: parseFloat(p.Price),
      Discount: p.Discount ? parseFloat(p.Discount) : null,
      DiscountPrice: parseFloat(p.dataValues.DiscountPrice),
      Stock: p.Stock,
      CreatedDate: p.CreatedDate,
      UpdatedDate: p.UpdatedDate,
      Status: p.Status,
      ImageURL: p.ImageURL || "/images/no-image.png",
      CategoryId: p.Category?.CategoryId,
      CategoryName: p.Category?.CategoryName,
    }));

    res.json({
      success: true,
      data: {
        products: formattedProducts,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("LIST PRODUCTS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách món ăn",
      detail: err.message,
    });
  }
};

// =========================
// 📌 LẤY CHI TIẾT SẢN PHẨM
// =========================
exports.getProductDetail = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "ID sản phẩm không hợp lệ." });
    }

    const product = await Food.findByPk(id, {
      attributes: [
        "FoodId",
        "FoodName",
        "Description",
        "Price",
        "Discount",
        [
          literal(
            "ISNULL([Food].[DiscountPrice], [Food].[Price] * (1 - ISNULL([Food].[Discount], 0) / 100.0))"
          ),
          "DiscountPrice",
        ],
        "Stock",
        "ImageURL",
        "Status",
      ],
      include: [
        {
          model: Category,
          as: "Category",
          attributes: ["CategoryId", "CategoryName"],
        },
      ],
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy món ăn." });
    }

    const sizes = await Size.findAll({
      attributes: ["SizeID", "SizeName", "ExtraPrice"],
      order: [["ExtraPrice", "ASC"]],
    });

    const toppings = await Topping.findAll({
      attributes: ["ToppingID", "ToppingName", "ToppingPrice"],
      order: [["ToppingName", "ASC"]],
    });

    let related = [];
    if (product.CategoryId) {
      related = await Food.findAll({
        where: {
          CategoryId: product.CategoryId,
          FoodId: { [Op.ne]: id },
        },
        limit: 4,
        order: [[literal("NEWID()"), ""]], // Random trong SQL Server
        attributes: [
          "FoodId",
          "FoodName",
          "Price",
          [
            literal(
              "ISNULL([Food].[DiscountPrice], [Food].[Price] * (1 - ISNULL([Food].[Discount], 0) / 100.0))"
            ),
            "DiscountPrice",
          ],
          "ImageURL",
        ],
        include: [
          {
            model: Category,
            as: "Category",
            attributes: ["CategoryName"],
          },
        ],
      });
    }

    const formattedProduct = {
      FoodId: product.FoodId,
      FoodName: product.FoodName,
      Description: product.Description,
      Price: parseFloat(product.Price),
      Discount: product.Discount ? parseFloat(product.Discount) : null,
      DiscountPrice: parseFloat(product.dataValues.DiscountPrice),
      Stock: product.Stock,
      ImageURL: product.ImageURL || "/images/no-image.png",
      Status: product.Status,
      CategoryId: product.Category?.CategoryId,
      CategoryName: product.Category?.CategoryName,
    };

    const formattedRelated = related.map((r) => ({
      FoodId: r.FoodId,
      FoodName: r.FoodName,
      Price: parseFloat(r.Price),
      DiscountPrice: parseFloat(r.dataValues.DiscountPrice),
      ImageURL: r.ImageURL || "/images/no-image.png",
      CategoryName: r.Category?.CategoryName,
    }));

    res.json({
      success: true,
      data: {
        product: formattedProduct,
        sizes,
        toppings,
        related: formattedRelated,
      },
    });
  } catch (err) {
    console.error("PRODUCT DETAIL ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy chi tiết món ăn",
      detail: err.message,
    });
  }
};
