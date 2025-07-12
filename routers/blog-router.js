const router = require("express").Router();
const { validator } = require("../validations/validator");
const { asyncHandler } = require("../utils/async-handler");
const { restrictTo, protect } = require("../controllers/auth-controller");

const {
  getAllBlogs,
  getBlogById,
  addBlog,
  editBlogById,
  removeBlogById,
  uploadBlogImages,
} = require("../controllers/blog-controller");
const {
  addBlogValidationSchema,
  editBlogValidationSchema,
} = require("../validations/blog-validation");

router.get("/", asyncHandler(getAllBlogs));

router.post(
  "/",
  protect,
  restrictTo("ADMIN"),
  uploadBlogImages,
  validator(addBlogValidationSchema),
  asyncHandler(addBlog)
);

router.get("/:id", asyncHandler(getBlogById));

router.patch(
  "/:id",
  uploadBlogImages,
  validator(editBlogValidationSchema),
  asyncHandler(editBlogById)
);

router.delete("/:id", asyncHandler(removeBlogById));

module.exports = router;
