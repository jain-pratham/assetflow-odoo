import { Request, Response } from 'express';
import Category from '../models/Category';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validator';
import { successResponse, errorResponse } from '../utils/apiResponse';

export class CategoryController {
  /**
   * Get all categories with pagination, search, and filtering
   */
  static getCategories = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const query: any = {};

      if (req.query.search) {
        query.$or = [
          { name: { $regex: req.query.search, $options: 'i' } },
          { code: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex: req.query.search, $options: 'i' } }
        ];
      }

      if (req.query.status) {
        query.status = req.query.status;
      }

      const total = await Category.countDocuments(query);
      const categories = await Category.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // For future Asset module integration, inject assetsCount = 0 for now
      const enrichedCategories = categories.map((cat: any) => ({
        ...cat,
        assetsCount: 0 // TODO: Future integration with Asset module
      }));

      return res.status(200).json(successResponse('Categories retrieved', enrichedCategories, {
        total,
        page,
        pages: Math.ceil(total / limit) || 1
      }));
    } catch (error) {
      console.error('Get categories error:', error);
      return res.status(500).json(errorResponse('Failed to fetch categories'));
    }
  };

  /**
   * Get a single category by ID
   */
  static getCategoryById = async (req: Request, res: Response) => {
    try {
      const category = await Category.findById(req.params.id).lean();
      
      if (!category) {
        return res.status(404).json(errorResponse('Category not found'));
      }

      const enrichedCategory = {
        ...category,
        assetsCount: 0 // TODO: Future integration with Asset module
      };

      return res.status(200).json(successResponse('Category retrieved', enrichedCategory));
    } catch (error) {
      console.error('Get category error:', error);
      return res.status(500).json(errorResponse('Failed to fetch category'));
    }
  };

  /**
   * Create a new category
   */
  static createCategory = async (req: Request, res: Response) => {
    try {
      const validatedData = createCategorySchema.parse(req.body);

      // Check for uniqueness
      const existingName = await Category.findOne({ name: { $regex: new RegExp(`^${validatedData.name}$`, 'i') } });
      if (existingName) {
        return res.status(409).json(errorResponse('Category name already exists'));
      }

      const existingCode = await Category.findOne({ code: validatedData.code });
      if (existingCode) {
        return res.status(409).json(errorResponse('Category code already exists'));
      }

      const category = await Category.create(validatedData as any);

      return res.status(201).json(successResponse('Category created successfully', category));
    } catch (error: any) {
      console.error('Create category error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json(errorResponse(error.errors[0].message));
      }
      return res.status(500).json(errorResponse('Failed to create category'));
    }
  };

  /**
   * Update a category
   */
  static updateCategory = async (req: Request, res: Response) => {
    try {
      const validatedData = updateCategorySchema.parse(req.body);

      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json(errorResponse('Category not found'));
      }

      // Check name uniqueness if changed
      if (validatedData.name && validatedData.name.toLowerCase() !== category.name.toLowerCase()) {
        const existingName = await Category.findOne({ 
          name: { $regex: new RegExp(`^${validatedData.name}$`, 'i') }, 
          _id: { $ne: category._id } 
        });
        if (existingName) {
          return res.status(409).json(errorResponse('Category name already exists'));
        }
      }

      // Check code uniqueness if changed
      if (validatedData.code && validatedData.code !== category.code) {
        const existingCode = await Category.findOne({ 
          code: validatedData.code, 
          _id: { $ne: category._id } 
        });
        if (existingCode) {
          return res.status(409).json(errorResponse('Category code already exists'));
        }
      }

      const updatedCategory = await Category.findByIdAndUpdate(
        req.params.id,
        { $set: validatedData },
        { new: true, runValidators: true }
      );

      return res.status(200).json(successResponse('Category updated successfully', updatedCategory));
    } catch (error: any) {
      console.error('Update category error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json(errorResponse(error.errors[0].message));
      }
      return res.status(500).json(errorResponse('Failed to update category'));
    }
  };

  /**
   * Toggle category status
   */
  static toggleCategoryStatus = async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      if (!['ACTIVE', 'INACTIVE'].includes(status)) {
        return res.status(400).json(errorResponse('Invalid status value'));
      }

      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json(errorResponse('Category not found'));
      }

      // TODO: Future integration -> do not allow deactivation if active assets exist using this category
      
      category.status = status;
      await category.save();

      return res.status(200).json(successResponse(`Category marked as ${status}`, category));
    } catch (error) {
      console.error('Toggle category status error:', error);
      return res.status(500).json(errorResponse('Failed to update status'));
    }
  };
}
