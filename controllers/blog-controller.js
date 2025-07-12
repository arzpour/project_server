const { join } = require("node:path");
const { unlink, access, constants } = require("node:fs/promises");
const sharp = require("sharp");
const { AppError } = require("../utils/app-error");
const { ApiFeatures } = require("../utils/api-features");
const { multerUpload } = require("../utils/multer-config");

const Blog = require("../models/blog-model");

const blogsThumbnailsDefault = "blogs-thumbnails-default.jpeg";

const uploadBlogImages = multerUpload.fields([
  { name: "thumbnail", maxCount: 1 },
]);

const resizeBlogThumbnail = async (blogId, files) => {
  const { thumbnail = [] } = files;

  if (!thumbnail.length) return null;

  const thumbnailFilename = `blogs-${blogId}-${Date.now()}.jpeg`;

  await sharp(thumbnail[0].buffer)
    .resize(1500, 800)
    .toFormat("jpeg")
    .jpeg({ quality: 95 })
    .toFile(
      join(__dirname, `../public/images/blogs/thumbnails/${thumbnailFilename}`)
    );

  return thumbnailFilename;
};

const getAllBlogs = async (req, res) => {
  const blogsModel = new ApiFeatures(Blog.find({}), req.query)
    .limitFields()
    .paginate()
    .filter()
    .sort();

  const blogs = await blogsModel.model;

  const { page = 1, limit = 10 } = req.query;
  const totalModels = new ApiFeatures(Blog.find(), req.query).filter();
  const total = await totalModels.model;

  const totalPages = Math.ceil(total.length / Number(limit));

  res.status(200).json({
    status: "success",
    page: Number(page),
    per_page: Number(limit),
    total: total.length,
    total_pages: totalPages,
    data: { blogs },
  });
};

const addBlog = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    const isBlogExists = await Blog.exists({ title });
    if (isBlogExists) {
      return next(new AppError(409, "Blog title already exists"));
    }

    const blog = await Blog.create({ title, description });

    const thumbnail = await resizeBlogThumbnail(blog._id, req.files);
    blog.thumbnail = thumbnail ?? blogsThumbnailsDefault;

    await blog.save({ validateModifiedOnly: true });

    res.status(201).json({
      status: "success",
      data: { blog },
    });
  } catch (err) {
    next(err);
  }
};

const getBlogById = async (req, res, next) => {
  const { id: blogId } = req.params;

  const blog = await Blog.findById(blogId);

  if (!blog) {
    return next(new AppError(404, `blog: ${blogId} not found`));
  }

  res.status(200).json({
    status: "success",
    data: { blog },
  });
};

const editBlogById = async (req, res, next) => {
  const { id: blogId } = req.params;

  const { title = null, description = null } = req.body;

  const blog = await Blog.findById(blogId);

  if (!blog) {
    return next(new AppError(404, `blog: ${blogId} not found`));
  }

  const duplicateBlog = await Blog.findOne({ title });

  if (!!duplicateBlog && duplicateBlog.title !== blog.title) {
    return next(
      new AppError(
        409,
        "blog name is already exists. choose a different blog name"
      )
    );
  }

  const thumbnail = await resizeBlogThumbnail(blogId, req.files ?? {});

  if (!!thumbnail && blog.thumbnail !== blogsThumbnailsDefault) {
    await access(
      join(__dirname, "../public/images/blogs/thumbnails", blog.thumbnail),
      constants.F_OK
    );
    await unlink(
      join(__dirname, "../public/images/blogs/thumbnails", blog.thumbnail)
    );
  }

  blog.title = title ?? blog.title;
  blog.description = description ?? blog.description;
  blog.thumbnail = thumbnail ?? blog.thumbnail;

  await blog.save({ validateModifiedOnly: true });

  res.status(200).json({
    status: "success",
    data: { blog },
  });
};

const removeBlogById = async (req, res, next) => {
  const { id: blogId } = req.params;

  const blog = await Blog.findByIdAndDelete(blogId);

  if (!blog) {
    return next(new AppError(404, `blog: ${blogId} not found`));
  }

  if (blog.thumbnail !== blogsThumbnailsDefault) {
    await access(
      join(__dirname, "../public/images/blogs/thumbnails", blog.thumbnail),
      constants.F_OK
    );
    await unlink(
      join(__dirname, "../public/images/blogs/thumbnails", blog.thumbnail)
    );
  }

  res.status(200).json({
    status: "success",
    data: { blog },
  });
};

module.exports = {
  getAllBlogs,
  getBlogById,
  addBlog,
  editBlogById,
  removeBlogById,
  uploadBlogImages,
};
