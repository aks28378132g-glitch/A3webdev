const mongoose = require("mongoose");
const Product = require("./Product");

function asyncHandler(fn) {
  return (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
}

exports.createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    product
  });
});

exports.getProducts = asyncHandler(async (req, res) => {
  const {
    category,
    supplier,
    minPrice,
    maxPrice,
    sortBy = "createdAt",
    order = "desc"
  } = req.query;

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(req.query.limit, 10) || 10, 1),
    100
  );

  const filter = {};

  if (category) filter.category = category;
  if (supplier) filter.supplier = supplier;

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};

    if (minPrice !== undefined) {
      filter.price.$gte = Number(minPrice);
    }

    if (maxPrice !== undefined) {
      filter.price.$lte = Number(maxPrice);
    }

    if (
      Object.values(filter.price).some((value) => !Number.isFinite(value)) ||
      Object.values(filter.price).some((value) => value < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Price filters must be non-negative numbers"
      });
    }

    if (
      filter.price.$gte !== undefined &&
      filter.price.$lte !== undefined &&
      filter.price.$gte > filter.price.$lte
    ) {
      return res.status(400).json({
        success: false,
        message: "minPrice cannot exceed maxPrice"
      });
    }
  }

  const allowedSortFields = [
    "name", "price", "quantity", "createdAt"
  ];

  if (!allowedSortFields.includes(sortBy)) {
    return res.status(400).json({
      success: false,
      message: "Invalid sortBy field"
    });
  }

  if (!["asc", "desc"].includes(order)) {
    return res.status(400).json({
      success: false,
      message: "order must be asc or desc"
    });
  }

  const sort = { [sortBy]: order === "asc" ? 1 : -1 };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),

    Product.countDocuments(filter)
  ]);

  res.json({
    success: true,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    products
  });
});

exports.getProductById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid product ID"
    });
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found"
    });
  }

  res.json({ success: true, product });
});

exports.updateProduct = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid product ID"
    });
  }

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found"
    });
  }

  res.json({ success: true, product });
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid product ID"
    });
  }

  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found"
    });
  }

  res.json({
    success: true,
    message: "Product deleted successfully"
  });
});

exports.adjustStock = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid product ID"
    });
  }

  const { change } = req.body;

  if (!Number.isInteger(change) || change === 0) {
    return res.status(400).json({
      success: false,
      message: "change must be a non-zero integer"
    });
  }

  const filter = { _id: req.params.id };

  if (change < 0) {
    filter.quantity = { $gte: Math.abs(change) };
  }

  const product = await Product.findOneAndUpdate(
    filter,
    { $inc: { quantity: change } },
    { new: true }
  );

  if (!product) {
    const exists = await Product.exists({
      _id: req.params.id
    });

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return res.status(400).json({
      success: false,
      message: "Insufficient stock"
    });
  }

  res.json({
    success: true,
    message: "Stock updated successfully",
    product
  });
});

exports.getLowStock = asyncHandler(async (req, res) => {
  const lowStockItems = await Product.find({
    $expr: {
      $lte: ["$quantity", "$reorderLevel"]
    }
  });

  res.json({
    success: true,
    count: lowStockItems.length,
    lowStockItems
  });
});

exports.getCategorySummary = asyncHandler(async (req, res) => {
  const summary = await Product.aggregate([
    {
      $group: {
        _id: "$category",
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: "$quantity" },
        totalStockValue: {
          $sum: {
            $multiply: ["$price", "$quantity"]
          }
        },
        avgPrice: { $avg: "$price" }
      }
    },
    {
      $project: {
        _id: 0,
        category: "$_id",
        totalItems: 1,
        totalQuantity: 1,
        totalStockValue: 1,
        avgPrice: 1
      }
    },
    { $sort: { category: 1 } }
  ]);

  res.json({
    success: true,
    categories: summary.length,
    summary
  });
});