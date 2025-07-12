const Joi = require("joi");

const addBlogValidationSchema = Joi.object({
  title: Joi.string().required().trim(),
  description: Joi.string().required().trim(),
});

const editBlogValidationSchema = Joi.object({
  title: Joi.string().allow("").optional(),
  description: Joi.string().optional(),
});

module.exports = { addBlogValidationSchema, editBlogValidationSchema };
