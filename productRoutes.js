const express = require("express");
const router = express.Router();

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  adjustStock,
  getLowStock,
  getCategorySummary
} = require("./productController");

router.get("/low-stock", getLowStock);
router.get("/summary", getCategorySummary);

router.route("/")
  .post(createProduct)
  .get(getProducts);

router.route("/:id/stock")
  .patch(adjustStock);

router.route("/:id")
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

module.exports = router;