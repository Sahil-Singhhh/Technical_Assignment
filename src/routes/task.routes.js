const express = require('express');
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} = require('../controllers/task.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  taskIdParamSchema,
  createTaskSchema,
  updateTaskSchema,
  queryTaskSchema,
} = require('../validators/task.validator');

const router = express.Router();

// All task routes require JWT authentication
router.use(protect);

router
  .route('/')
  .post(validate(createTaskSchema, 'body'), createTask)
  .get(validate(queryTaskSchema, 'query'), getTasks);

router
  .route('/:id')
  .get(validate(taskIdParamSchema, 'params'), getTaskById)
  .put(
    validate(taskIdParamSchema, 'params'),
    validate(updateTaskSchema, 'body'),
    updateTask
  )
  .delete(validate(taskIdParamSchema, 'params'), deleteTask);

module.exports = router;
