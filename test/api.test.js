/**
 * Automated Verification Test Suite for Task Management REST API
 */

const dotenv = require('dotenv');
dotenv.config();

const BASE_URL = `http://localhost:${process.env.PORT || 5000}/api`;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ${colors.green}✔ PASS:${colors.reset} ${testName}`);
    passed++;
  } else {
    console.error(`  ${colors.red}✖ FAIL:${colors.reset} ${testName} ${details ? `(${details})` : ''}`);
    failed++;
  }
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, config);
  let data;
  try {
    data = await res.json();
  } catch (err) {
    data = null;
  }

  return { status: res.status, data };
}

async function runTests() {
  console.log(`\n${colors.bold}${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan} Starting API Verification Test Suite ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan} Target: ${BASE_URL}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}========================================\n${colors.reset}`);

  const testEmail1 = `alice_${Date.now()}@example.com`;
  const testEmail2 = `bob_${Date.now()}@example.com`;
  const password = 'Password123!';

  let user1Token = '';
  let user2Token = '';
  let createdTaskId = '';

  // 1. Health Check
  console.log(`${colors.yellow}1. Testing Health Endpoint...${colors.reset}`);
  const healthRes = await request('/health');
  assert(healthRes.status === 200, 'GET /api/health returns 200 OK');
  assert(healthRes.data?.data?.status === 'UP', 'Health check status is UP');

  // 2. Auth: Register
  console.log(`\n${colors.yellow}2. Testing User Registration...${colors.reset}`);
  const reg1 = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Alice Developer', email: testEmail1, password },
  });
  assert(reg1.status === 201, 'POST /api/auth/register returns 201 Created');
  assert(Boolean(reg1.data?.data?.token), 'Register returns JWT token');
  assert(!reg1.data?.data?.user?.password, 'Register does NOT expose password');
  user1Token = reg1.data?.data?.token;

  // 2b. Register with weak password
  const weakPassRes = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Weak User', email: `weak_${Date.now()}@test.com`, password: 'short' },
  });
  assert(weakPassRes.status === 400, 'Register with weak password fails with 400');

  // 2c. Register duplicate email
  const dupRes = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Alice Duplicate', email: testEmail1, password },
  });
  assert(dupRes.status === 409, 'Register duplicate email fails with 409 Conflict');

  // 3. Auth: Login
  console.log(`\n${colors.yellow}3. Testing User Login...${colors.reset}`);
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: { email: testEmail1, password },
  });
  assert(loginRes.status === 200, 'POST /api/auth/login returns 200 OK');
  assert(Boolean(loginRes.data?.data?.token), 'Login returns JWT token');
  assert(!loginRes.data?.data?.user?.password, 'Login does NOT expose password');

  // 3b. Login with wrong password
  const wrongLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: testEmail1, password: 'WrongPassword999' },
  });
  assert(wrongLogin.status === 401, 'Login with invalid password fails with 401 Unauthorized');
  assert(wrongLogin.data?.message === 'Invalid email or password', 'Generic error message for bad credentials');

  // 4. Auth: Profile
  console.log(`\n${colors.yellow}4. Testing User Profile...${colors.reset}`);
  const profRes = await request('/auth/profile', {
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  assert(profRes.status === 200, 'GET /api/auth/profile returns 200 OK');
  assert(profRes.data?.data?.user?.email === testEmail1.toLowerCase(), 'Profile matches authenticated user');

  // 4b. Profile without token
  const noTokenRes = await request('/auth/profile');
  assert(noTokenRes.status === 401, 'Protected route without token returns 401');

  // 4c. Profile with invalid token
  const badTokenRes = await request('/auth/profile', {
    headers: { Authorization: 'Bearer invalid.token.value' },
  });
  assert(badTokenRes.status === 401, 'Protected route with invalid token returns 401');

  // Register User 2 for isolation tests
  const reg2 = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Bob Tester', email: testEmail2, password },
  });
  user2Token = reg2.data?.data?.token;

  // 5. Tasks: Create Task
  console.log(`\n${colors.yellow}5. Testing Task Creation...${colors.reset}`);
  const task1 = await request('/tasks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user1Token}` },
    body: {
      title: 'Setup Production Server',
      description: 'Configure reverse proxy and TLS certificates',
      priority: 'High',
      status: 'In Progress',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    },
  });
  assert(task1.status === 201, 'POST /api/tasks returns 201 Created');
  assert(task1.data?.data?.task?.title === 'Setup Production Server', 'Task title matches');
  createdTaskId = task1.data?.data?.task?._id;

  // 5b. Create task with invalid payload (empty title)
  const invalidTaskRes = await request('/tasks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user1Token}` },
    body: { title: '', priority: 'InvalidPriority' },
  });
  assert(invalidTaskRes.status === 400, 'Create task with invalid payload returns 400');

  // Add more tasks for search/filter/pagination
  await request('/tasks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user1Token}` },
    body: { title: 'Write API Documentation', description: 'Complete OpenAPI / Postman spec', priority: 'Medium', status: 'Pending' },
  });
  await request('/tasks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user1Token}` },
    body: { title: 'Implement Rate Limiting', description: 'Prevent brute force attacks', priority: 'High', status: 'Completed' },
  });
  await request('/tasks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user1Token}` },
    body: { title: 'Design Database Schemas', description: 'Add indexes for MongoDB', priority: 'Low', status: 'Completed' },
  });

  // 6. Tasks: User Isolation & Cross-User Security
  console.log(`\n${colors.yellow}6. Testing User Task Isolation (Security)...${colors.reset}`);
  // User 2 trying to GET User 1's task
  const crossGet = await request(`/tasks/${createdTaskId}`, {
    headers: { Authorization: `Bearer ${user2Token}` },
  });
  assert(crossGet.status === 404, 'Cross-user GET task returns 404 (not 403)');

  // User 2 trying to UPDATE User 1's task
  const crossPut = await request(`/tasks/${createdTaskId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${user2Token}` },
    body: { title: 'Hacked Title' },
  });
  assert(crossPut.status === 404, 'Cross-user PUT task returns 404');

  // User 2 trying to DELETE User 1's task
  const crossDel = await request(`/tasks/${createdTaskId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${user2Token}` },
  });
  assert(crossDel.status === 404, 'Cross-user DELETE task returns 404');

  // 7. Tasks: Get Task By ID & Invalid Params
  console.log(`\n${colors.yellow}7. Testing Task Retrieval & ID Validation...${colors.reset}`);
  const getOne = await request(`/tasks/${createdTaskId}`, {
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  assert(getOne.status === 200, 'GET /api/tasks/:id returns 200 for owner');

  const invalidIdRes = await request('/tasks/123-not-valid-hex', {
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  assert(invalidIdRes.status === 400, 'Invalid ObjectId returns 400 Bad Request');

  const nonExistentIdRes = await request('/tasks/650000000000000000000000', {
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  assert(nonExistentIdRes.status === 404, 'Non-existent valid ObjectId returns 404 Not Found');

  // 8. Tasks: Update & Delete
  console.log(`\n${colors.yellow}8. Testing Task Update & Delete...${colors.reset}`);
  const updateRes = await request(`/tasks/${createdTaskId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${user1Token}` },
    body: { status: 'Completed', priority: 'Medium' },
  });
  assert(updateRes.status === 200, 'PUT /api/tasks/:id returns 200 OK');
  assert(updateRes.data?.data?.task?.status === 'Completed', 'Task status updated to Completed');

  // 9. Search, Filtering, and Pagination
  console.log(`\n${colors.yellow}9. Testing Search, Filtering & Pagination...${colors.reset}`);
  
  // 9a. List all tasks for User 1
  const listAll = await request('/tasks', {
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  assert(listAll.status === 200, 'GET /api/tasks returns 200');
  assert(listAll.data?.data?.tasks?.length >= 4, 'User 1 sees all 4 created tasks');
  assert(listAll.data?.data?.pagination?.total >= 4, 'Pagination total reflects task count');

  // 9b. Filter by status=Completed
  const statusFilter = await request('/tasks?status=Completed', {
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  const allCompleted = statusFilter.data?.data?.tasks?.every((t) => t.status === 'Completed');
  assert(statusFilter.status === 200 && allCompleted, 'Filter by status=Completed returns only Completed tasks');

  // 9c. Filter by priority=High
  const priorityFilter = await request('/tasks?priority=High', {
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  const allHigh = priorityFilter.data?.data?.tasks?.every((t) => t.priority === 'High');
  assert(priorityFilter.status === 200 && allHigh, 'Filter by priority=High returns only High priority tasks');

  // 9d. Search by title/description keyword
  const searchRes = await request('/tasks?search=Documentation', {
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  assert(
    searchRes.status === 200 &&
      searchRes.data?.data?.tasks?.some((t) => t.title.includes('Documentation')),
    'Search by keyword "Documentation" returns matching task'
  );

  // 9e. Search with regex special characters (escape test)
  const regexSearch = await request('/tasks?search=API.*[Spec]', {
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  assert(regexSearch.status === 200, 'Search with regex special characters does not crash or throw ReDoS');

  // 9f. Pagination limit and page
  const pageLimit = await request('/tasks?page=1&limit=2', {
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  assert(pageLimit.data?.data?.tasks?.length === 2, 'Limit=2 returns exactly 2 tasks');
  assert(pageLimit.data?.data?.pagination?.limit === 2, 'Pagination metadata limit is 2');
  assert(pageLimit.data?.data?.pagination?.hasNextPage === true, 'hasNextPage is true when more pages exist');

  // 10. Delete Task
  console.log(`\n${colors.yellow}10. Testing Task Deletion...${colors.reset}`);
  const delRes = await request(`/tasks/${createdTaskId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  assert(delRes.status === 200, 'DELETE /api/tasks/:id returns 200 OK');

  const verifyDel = await request(`/tasks/${createdTaskId}`, {
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  assert(verifyDel.status === 404, 'Deleted task returns 404 on subsequent get');

  // Summary
  console.log(`\n${colors.bold}${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.bold}Test Results Summary:${colors.reset}`);
  console.log(`  ${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`  ${failed > 0 ? colors.red : colors.green}Failed: ${failed}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}========================================\n${colors.reset}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
