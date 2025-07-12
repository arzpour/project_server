const { model, Schema } = require("mongoose");
const slugify = require("slugify");

const BlogSchema = new Schema(
  {
    title: {
      type: String,
      unique: true,
      required: [true, "title is required"],
    },
    description: {
      type: String,
      required: [true, "description is required"],
    },
    thumbnail: {
      type: String,
      trim: true,
      default: "products-thumbnails-default.jpeg",
    },
  },
  {
    timestamps: true,
  }
);

BlogSchema.pre("save", function (next) {
  this.slugname = slugify(this.title, { lower: true });

  next();
});

module.exports = model("Blog", BlogSchema);
