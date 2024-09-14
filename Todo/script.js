// DOM Elements
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const filterButtons = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('search-input');
const sortButton = document.getElementById('sort-priority');
const totalTasksSpan = document.getElementById('total-tasks');
const completedTasksSpan = document.getElementById('completed-tasks');
const categorySelect = document.getElementById('category-select');
const categoryFilterSelect = document.getElementById('category-filter');
const dueDateInput = document.getElementById('due-date');
const dueTimeInput = document.getElementById('due-time');

// Todo array to store tasks
let todos = JSON.parse(localStorage.getItem('todos')) || [];

// Categories
const categories = ['Work', 'Personal', 'Shopping', 'Health', 'Other'];

// Keywords for special effects
const keywords = {
  urgent: { priority: 5, color: '#ff4136', icon: '🚨' },
  important: { priority: 4, color: '#ff851b', icon: '❗' },
  relax: { priority: 1, color: '#0074d9', icon: '😌' },
  fun: { priority: 2, color: '#2ecc40', icon: '🎉' },
  learn: { priority: 3, color: '#b10dc9', icon: '📚' }
};

// Event Listeners
todoForm.addEventListener('submit', addTodo);
todoInput.addEventListener('input', handleInput);
todoList.addEventListener('click', handleTodoClick);
filterButtons.forEach(button => button.addEventListener('click', filterTodos));
searchInput.addEventListener('input', searchTodos);
sortButton.addEventListener('click', sortByPriority);
categoryFilterSelect.addEventListener('change', filterByCategory);

// Populate category select options
function populateCategorySelects() {
  const selects = [categorySelect, categoryFilterSelect];
  selects.forEach(select => {
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.toLowerCase();
      option.textContent = category;
      select.appendChild(option);
    });
  });
  // Add "All" option to filter select
  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'All Categories';
  categoryFilterSelect.insertBefore(allOption, categoryFilterSelect.firstChild);
  categoryFilterSelect.value = 'all';
}

// Functions
function addTodo(e) {
  e.preventDefault();
  const todoText = todoInput.value.trim();
  const category = categorySelect.value;
  const dueDate = dueDateInput.value;
  const dueTime = dueTimeInput.value;
  if (todoText && category) {
    const todo = createTodoObject(todoText, category, dueDate, dueTime);
    todos.push(todo);
    renderTodos();
    saveTodosToLocalStorage();
    todoInput.value = '';
    categorySelect.value = '';
    dueDateInput.value = '';
    dueTimeInput.value = '';
    updateBackgroundAnimation();
    setAlarm(todo);
  }
}

function createTodoObject(todoText, category, dueDate, dueTime) {
  const lowercaseText = todoText.toLowerCase();
  const matchedKeyword = Object.keys(keywords).find(keyword => lowercaseText.includes(keyword));
  const keyword = matchedKeyword ? keywords[matchedKeyword] : null;

  return {
    id: Date.now(),
    text: todoText,
    completed: false,
    createdAt: new Date(),
    priority: keyword ? keyword.priority : 0,
    color: keyword ? keyword.color : null,
    icon: keyword ? keyword.icon : null,
    lastUpdated: new Date(),
    category: category,
    dueDate: dueDate,
    dueTime: dueTime
  };
}

function handleInput(e) {
  const inputText = e.target.value.toLowerCase();
  const matchedKeyword = Object.keys(keywords).find(keyword => inputText.includes(keyword));

  if (matchedKeyword) {
    const keywordEffect = keywords[matchedKeyword];
    todoInput.style.backgroundColor = keywordEffect.color;
    todoInput.style.color = 'white';
    todoInput.style.transform = 'scale(1.05)';
  } else {
    todoInput.style.backgroundColor = '';
    todoInput.style.color = '';
    todoInput.style.transform = '';
  }
}

function renderTodos(filteredTodos = todos) {
  todoList.innerHTML = '';
  filteredTodos.forEach(todo => {
    const todoItem = document.createElement('li');
    todoItem.classList.add('todo-item');
    todoItem.dataset.id = todo.id;
    todoItem.innerHTML = `
      <input type="checkbox" ${todo.completed ? 'checked' : ''}>
      <span class="${todo.completed ? 'completed' : ''}">${todo.icon || ''} ${todo.text}</span>
      <span class="category-tag">${todo.category}</span>
      <span class="due-date">${formatDueDate(todo.dueDate, todo.dueTime)}</span>
      <div class="priority-controls">
        <button class="priority-btn" data-change="-1">-</button>
        <span class="priority-display">${todo.priority}</span>
        <button class="priority-btn" data-change="1">+</button>
      </div>
      <button class="delete-btn">Delete</button>
    `;
    if (todo.color) {
      todoItem.style.borderLeft = `5px solid ${todo.color}`;
    }
    updateHeatmap(todoItem, todo.priority);
    todoList.appendChild(todoItem);

    // Add animation class
    setTimeout(() => todoItem.classList.add('show'), 10);
  });
  updateTaskCounter();
}

function formatDueDate(dueDate, dueTime) {
  if (!dueDate) return '';
  const date = new Date(`${dueDate}T${dueTime || '00:00'}`);
  return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

function handleTodoClick(e) {
  const todoItem = e.target.closest('.todo-item');
  const id = parseInt(todoItem.dataset.id);

  if (e.target.type === 'checkbox') {
    toggleTodoComplete(id);
  } else if (e.target.classList.contains('delete-btn')) {
    deleteTodo(id);
  } else if (e.target.classList.contains('priority-btn')) {
    changePriority(id, parseInt(e.target.dataset.change));
  }
}

function toggleTodoComplete(id) {
  todos = todos.map(todo =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );
  renderTodos();
  saveTodosToLocalStorage();
  updateBackgroundAnimation();
}

function deleteTodo(id) {
  todos = todos.filter(todo => todo.id !== id);
  renderTodos();
  saveTodosToLocalStorage();
  updateBackgroundAnimation();
}

function changePriority(id, change) {
  todos = todos.map(todo => {
    if (todo.id === id) {
      const newPriority = Math.max(0, Math.min(5, todo.priority + change));
      return { ...todo, priority: newPriority, lastUpdated: new Date() };
    }
    return todo;
  });
  renderTodos();
  saveTodosToLocalStorage();
  updateBackgroundAnimation();
}

function updateHeatmap(todoItem, priority) {
  const hue = 200 - priority * 30; // Adjust hue based on priority (0-5)
  todoItem.style.setProperty('--heatmap-color', `hsl(${hue}, 70%, 60%)`);
}

function filterTodos(e) {
  const filter = e.target.dataset.filter;
  let filteredTodos;
  switch (filter) {
    case 'active':
      filteredTodos = todos.filter(todo => !todo.completed);
      break;
    case 'completed':
      filteredTodos = todos.filter(todo => todo.completed);
      break;
    default:
      filteredTodos = todos;
  }
  renderTodos(filteredTodos);
}

function searchTodos(e) {
  const searchTerm = e.target.value.toLowerCase();
  const filteredTodos = todos.filter(todo =>
    todo.text.toLowerCase().includes(searchTerm) ||
    todo.category.toLowerCase().includes(searchTerm)
  );
  renderTodos(filteredTodos);
}

function sortByPriority() {
  todos.sort((a, b) => b.priority - a.priority || b.lastUpdated - a.lastUpdated);
  renderTodos();
}

function filterByCategory() {
  const selectedCategory = categoryFilterSelect.value;
  let filteredTodos = todos;
  if (selectedCategory !== 'all') {
    filteredTodos = todos.filter(todo => todo.category.toLowerCase() === selectedCategory);
  }
  renderTodos(filteredTodos);
}

function saveTodosToLocalStorage() {
  localStorage.setItem('todos', JSON.stringify(todos));
}

function updateTaskCounter() {
  totalTasksSpan.textContent = todos.length;
  completedTasksSpan.textContent = todos.filter(todo => todo.completed).length;
}

function updateBackgroundAnimation() {
  const totalTasks = todos.length;
  const completedTasks = todos.filter(todo => todo.completed).length;
  const averagePriority = todos.reduce((sum, todo) => sum + todo.priority, 0) / totalTasks || 0;
  
  document.documentElement.style.setProperty('--total-tasks', totalTasks);
  document.documentElement.style.setProperty('--completed-tasks', completedTasks);
  document.documentElement.style.setProperty('--average-priority', averagePriority);
}

function setAlarm(todo) {
  if (todo.dueDate && todo.dueTime) {
    const dueDateTime = new Date(`${todo.dueDate}T${todo.dueTime}`);
    const now = new Date();
    const timeUntilDue = dueDateTime - now;

    if (timeUntilDue > 0) {
      setTimeout(() => {
        if (!todo.completed) {
          alert(`Task "${todo.text}" is due now!`);
        }
      }, timeUntilDue);
    }
  }
}

// Check for due tasks every minute
setInterval(() => {
  const now = new Date();
  todos.forEach(todo => {
    if (!todo.completed && todo.dueDate && todo.dueTime) {
      const dueDateTime = new Date(`${todo.dueDate}T${todo.dueTime}`);
      if (now >= dueDateTime) {
        alert(`Task "${todo.text}" is overdue!`);
      }
    }
  });
}, 60000);

// Initialize
populateCategorySelects();
renderTodos();
updateBackgroundAnimation();

// Initialize drag and drop
new Sortable(todoList, {
  animation: 150,
  onEnd: function() {
    const newOrder = Array.from(todoList.children).map(item => 
      parseInt(item.dataset.id)
    );
    todos = newOrder.map(id => todos.find(todo => todo.id === id));
    saveTodosToLocalStorage();
  }
});