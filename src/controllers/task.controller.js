const Task = require('../models/Task');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Escapes regex special characters to prevent ReDoS / injection
 * @param {string} text
 * @returns {string}
 */
const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 * @access  Private
 */
const createTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, dueDate } = req.body;

  const task = await Task.create({
    title,
    description,
    status,
    priority,
    dueDate,
    user: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: {
      task,
    },
  });
});

/**
 * @desc    Get all tasks for the logged-in user with search, filter, and pagination
 * @route   GET /api/tasks
 * @access  Private
 */
const getTasks = asyncHandler(async (req, res) => {
  const {
    search,
    status,
    priority,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    order = 'desc',
  } = req.query;

  // Base filter scoped strictly to the authenticated user
  const filter = { user: req.user._id };

  // Filter by status if specified
  if (status) {
    filter.status = status;
  }

  // Filter by priority if specified
  if (priority) {
    filter.priority = priority;
  }

  // Search filter across title and description
  if (search && search.trim()) {
    const escapedSearch = escapeRegex(search.trim());
    const searchRegex = new RegExp(escapedSearch, 'i');
    filter.$or = [{ title: searchRegex }, { description: searchRegex }];
  }

  // Pagination calculations
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  // Sorting
  const sortDirection =
    order.toString().toLowerCase() === 'asc' || order === '1' ? 1 : -1;
  const sortOptions = { [sortBy]: sortDirection };

  // Execute count and query concurrently
  const [total, tasks] = await Promise.all([
    Task.countDocuments(filter),
    Task.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum),
  ]);

  const totalPages = Math.ceil(total / limitNum) || (total === 0 ? 0 : 1);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1 && totalPages > 0;

  res.status(200).json({
    success: true,
    message: 'Tasks retrieved successfully',
    data: {
      tasks,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    },
  });
});

/**
 * @desc    Get a single task by ID
 * @route   GET /api/tasks/:id
 * @access  Private
 */
const getTaskById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Scoped to current user - returns null (404) if belongs to another user
  const task = await Task.findOne({ _id: id, user: req.user._id });

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  res.status(200).json({
    success: true,
    message: 'Task retrieved successfully',
    data: {
      task,
    },
  });
});

/**
 * @desc    Update a task by ID
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const task = await Task.findOneAndUpdate(
    { _id: id, user: req.user._id },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  res.status(200).json({
    success: true,
    message: 'Task updated successfully',
    data: {
      task,
    },
  });
});

/**
 * @desc    Delete a task by ID
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = await Task.findOneAndDelete({ _id: id, user: req.user._id });

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  res.status(200).json({
    success: true,
    message: 'Task deleted successfully',
    data: null,
  });
});

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
