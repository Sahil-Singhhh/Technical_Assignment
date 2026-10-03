const Joi = require('joi');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const taskIdParamSchema = Joi.object({
  id: Joi.string().pattern(objectIdPattern).required().messages({
    'string.pattern.base': 'Invalid task ID format. Must be a valid 24-character hexadecimal ObjectId',
    'any.required': 'Task ID is required in URL parameters',
  }),
});

const createTaskSchema = Joi.object({
  title: Joi.string().trim().max(100).required().messages({
    'string.base': 'Title must be a string',
    'string.empty': 'Title cannot be empty',
    'string.max': 'Title cannot exceed 100 characters',
    'any.required': 'Title is required',
  }),
  description: Joi.string().trim().max(500).allow('').optional().messages({
    'string.base': 'Description must be a string',
    'string.max': 'Description cannot exceed 500 characters',
  }),
  status: Joi.string()
    .valid('Pending', 'In Progress', 'Completed')
    .optional()
    .messages({
      'any.only': 'Status must be one of: Pending, In Progress, Completed',
    }),
  priority: Joi.string()
    .valid('Low', 'Medium', 'High')
    .optional()
    .messages({
      'any.only': 'Priority must be one of: Low, Medium, High',
    }),
  dueDate: Joi.date().iso().allow(null).optional().messages({
    'date.base': 'Due date must be a valid date (ISO 8601 format)',
    'date.format': 'Due date must be in a valid ISO date format',
  }),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().trim().max(100).optional().messages({
    'string.base': 'Title must be a string',
    'string.empty': 'Title cannot be empty',
    'string.max': 'Title cannot exceed 100 characters',
  }),
  description: Joi.string().trim().max(500).allow('').optional().messages({
    'string.base': 'Description must be a string',
    'string.max': 'Description cannot exceed 500 characters',
  }),
  status: Joi.string()
    .valid('Pending', 'In Progress', 'Completed')
    .optional()
    .messages({
      'any.only': 'Status must be one of: Pending, In Progress, Completed',
    }),
  priority: Joi.string()
    .valid('Low', 'Medium', 'High')
    .optional()
    .messages({
      'any.only': 'Priority must be one of: Low, Medium, High',
    }),
  dueDate: Joi.date().iso().allow(null).optional().messages({
    'date.base': 'Due date must be a valid date (ISO 8601 format)',
    'date.format': 'Due date must be in a valid ISO date format',
  }),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

const queryTaskSchema = Joi.object({
  search: Joi.string().trim().max(100).allow('').optional(),
  status: Joi.string()
    .valid('Pending', 'In Progress', 'Completed')
    .optional()
    .messages({
      'any.only': 'Status must be one of: Pending, In Progress, Completed',
    }),
  priority: Joi.string()
    .valid('Low', 'Medium', 'High')
    .optional()
    .messages({
      'any.only': 'Priority must be one of: Low, Medium, High',
    }),
  page: Joi.number().integer().min(1).default(1).optional().messages({
    'number.base': 'Page must be an integer',
    'number.min': 'Page must be at least 1',
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).optional().messages({
    'number.base': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),
  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'title', 'dueDate', 'priority', 'status')
    .default('createdAt')
    .optional()
    .messages({
      'any.only':
        'sortBy must be one of: createdAt, updatedAt, title, dueDate, priority, status',
    }),
  order: Joi.string()
    .valid('asc', 'desc', 'ASC', 'DESC', '1', '-1')
    .default('desc')
    .optional()
    .messages({
      'any.only': 'order must be either asc or desc',
    }),
});

module.exports = {
  taskIdParamSchema,
  createTaskSchema,
  updateTaskSchema,
  queryTaskSchema,
};
