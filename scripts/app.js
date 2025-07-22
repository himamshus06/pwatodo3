document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const groupsList = document.getElementById('groups-list');
    const todosList = document.getElementById('todos-list');
    const addGroupBtn = document.getElementById('add-group-btn');
    const addTodoBtn = document.getElementById('add-todo-btn');
    const editGroupBtn = document.getElementById('edit-group-btn');
    const deleteGroupBtn = document.getElementById('delete-group-btn');
    const currentGroupName = document.getElementById('current-group-name');
    const groupContent = document.getElementById('group-content');
    const noGroupSelected = document.getElementById('no-group-selected');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const darkModeStyle = document.getElementById('dark-mode-style');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const sortBySelect = document.getElementById('sort-by');
    const filterPrioritySelect = document.getElementById('filter-priority');
    const filterStatusSelect = document.getElementById('filter-status');
    
    // Modal elements
    const groupModal = document.getElementById('group-modal');
    const todoModal = document.getElementById('todo-modal');
    const groupNameInput = document.getElementById('group-name-input');
    const todoTitleInput = document.getElementById('todo-title-input');
    const todoDescInput = document.getElementById('todo-desc-input');
    const todoDueDateInput = document.getElementById('todo-due-date');
    const todoPrioritySelect = document.getElementById('todo-priority');
    const saveGroupBtn = document.getElementById('save-group-btn');
    const saveTodoBtn = document.getElementById('save-todo-btn');
    const modalGroupTitle = document.getElementById('modal-group-title');
    const modalTodoTitle = document.getElementById('modal-todo-title');
    const closeButtons = document.querySelectorAll('.close');
    
    // State
    let currentGroupId = null;
    let isEditingGroup = false;
    let isEditingTodo = false;
    let editingTodoId = null;
    let currentSort = 'created';
    let currentPriorityFilter = 'all';
    let currentStatusFilter = 'all';
    let currentSearchQuery = '';
    
    // Initialize app
    initApp();
    
    // Event Listeners
    addGroupBtn.addEventListener('click', () => openGroupModal());
    addTodoBtn.addEventListener('click', () => openTodoModal());
    editGroupBtn.addEventListener('click', () => editCurrentGroup());
    deleteGroupBtn.addEventListener('click', () => deleteCurrentGroup());
    saveGroupBtn.addEventListener('click', () => saveGroup());
    saveTodoBtn.addEventListener('click', () => saveTodo());
    darkModeToggle.addEventListener('click', toggleDarkMode);
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    sortBySelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        if (currentGroupId) loadTodos(currentGroupId);
    });
    filterPrioritySelect.addEventListener('change', (e) => {
        currentPriorityFilter = e.target.value;
        if (currentGroupId) loadTodos(currentGroupId);
    });
    filterStatusSelect.addEventListener('change', (e) => {
        currentStatusFilter = e.target.value;
        if (currentGroupId) loadTodos(currentGroupId);
    });
    
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            groupModal.style.display = 'none';
            todoModal.style.display = 'none';
            resetModalInputs();
        });
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === groupModal) {
            groupModal.style.display = 'none';
            resetModalInputs();
        }
        if (e.target === todoModal) {
            todoModal.style.display = 'none';
            resetModalInputs();
        }
    });
    
    // Functions
    function initApp() {
        loadGroups();
        loadDarkModePreference();
    }
    
    function loadGroups() {
        const groups = Storage.getGroups();
        groupsList.innerHTML = '';
        
        if (groups.length === 0) {
            noGroupSelected.style.display = 'block';
            groupContent.style.display = 'none';
            editGroupBtn.disabled = true;
            deleteGroupBtn.disabled = true;
            return;
        }
        
        groups.forEach(group => {
            const li = document.createElement('li');
            li.textContent = group.name;
            li.dataset.id = group.id;
            li.addEventListener('click', () => loadGroup(group.id));
            groupsList.appendChild(li);
        });
    }
    
    function loadGroup(groupId) {
        currentGroupId = groupId;
        currentSearchQuery = '';
        searchInput.value = '';
        const group = Storage.getGroup(groupId);
        
        if (!group) return;
        
        // Update UI
        currentGroupName.textContent = group.name;
        
        // Highlight selected group in sidebar
        document.querySelectorAll('#groups-list li').forEach(li => {
            li.classList.toggle('active', li.dataset.id === groupId);
        });
        
        // Enable group actions
        editGroupBtn.disabled = false;
        deleteGroupBtn.disabled = false;
        
        // Show todos
        noGroupSelected.style.display = 'none';
        groupContent.style.display = 'block';
        
        // Load todos
        loadTodos(groupId);
    }
    
    function loadTodos(groupId) {
        const group = Storage.getGroup(groupId);
        if (!group) return;
        
        todosList.innerHTML = '';
        
        let todos = [...group.todos];
        
        // Apply filters
        if (currentPriorityFilter !== 'all') {
            todos = todos.filter(todo => todo.priority === currentPriorityFilter);
        }
        
        if (currentStatusFilter !== 'all') {
            todos = todos.filter(todo => 
                currentStatusFilter === 'completed' ? todo.completed : !todo.completed
            );
        }
        
        // Apply sorting
        todos.sort((a, b) => {
            if (currentSort === 'due') {
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            } else if (currentSort === 'priority') {
                const priorityOrder = { high: 1, medium: 2, low: 3 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        if (todos.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No todos match your criteria.';
            todosList.appendChild(li);
            return;
        }

        todos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueDate = todo.dueDate ? new Date(todo.dueDate) : null;
            const isOverdue = dueDate && dueDate < today && !todo.completed;
            
            li.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <input type="checkbox" class="complete-checkbox" 
                        ${todo.completed ? 'checked' : ''} data-id="${todo.id}">
                    <h3>${todo.title}</h3>
                </div>
                ${todo.description ? `<p>${todo.description}</p>` : ''}
                ${dueDate ? `
                    <div class="due-date ${isOverdue ? 'overdue' : ''}">
                        Due: ${dueDate.toLocaleDateString()} ${isOverdue ? ' (Overdue)' : ''}
                    </div>
                ` : ''}
                <div class="priority priority-${todo.priority}">
                    ${todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
                </div>
                <div class="todo-actions">
                    <button class="edit-todo" data-id="${todo.id}">Edit</button>
                    <button class="delete-todo" data-id="${todo.id}">Delete</button>
                </div>
            `;
            todosList.appendChild(li);
            
            // Add event listener for checkbox
            li.querySelector('.complete-checkbox').addEventListener('change', (e) => {
                Storage.toggleTodoComplete(groupId, e.target.dataset.id);
                loadTodos(groupId);
            });
            
            // Add event listeners for edit and delete
            li.querySelector('.edit-todo').addEventListener('click', (e) => {
                editTodo(e.target.dataset.id);
            });
            
            li.querySelector('.delete-todo').addEventListener('click', (e) => {
                deleteTodo(e.target.dataset.id);
            });
        });
    }
    
    function handleSearch() {
        currentSearchQuery = searchInput.value.trim().toLowerCase();
        if (currentSearchQuery) {
            searchTodos(currentSearchQuery);
        } else {
            loadGroups();
            if (currentGroupId) {
                loadTodos(currentGroupId);
            }
        }
    }
    
    function searchTodos(query) {
        const groups = Storage.getGroups();
        todosList.innerHTML = '';
        currentGroupId = null;
        
        // Reset group selection
        document.querySelectorAll('#groups-list li').forEach(li => {
            li.classList.remove('active');
        });
        
        // Disable group actions
        editGroupBtn.disabled = true;
        deleteGroupBtn.disabled = true;
        
        // Show search header
        noGroupSelected.style.display = 'none';
        groupContent.style.display = 'block';
        currentGroupName.textContent = `Search Results for "${query}"`;
        
        let hasResults = false;
        
        groups.forEach(group => {
            group.todos.forEach(todo => {
                if (todo.title.toLowerCase().includes(query) || 
                    (todo.description && todo.description.toLowerCase().includes(query))) {
                    
                    hasResults = true;
                    const li = document.createElement('li');
                    li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
                    
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const dueDate = todo.dueDate ? new Date(todo.dueDate) : null;
                    const isOverdue = dueDate && dueDate < today && !todo.completed;
                    
                    li.innerHTML = `
                        <div>
                            <small><strong>${group.name}</strong></small>
                            <div style="display: flex; align-items: center;">
                                <input type="checkbox" class="complete-checkbox" 
                                    ${todo.completed ? 'checked' : ''} 
                                    data-group="${group.id}" data-id="${todo.id}">
                                <h3>${todo.title}</h3>
                            </div>
                        </div>
                        ${todo.description ? `<p>${todo.description}</p>` : ''}
                        ${dueDate ? `
                            <div class="due-date ${isOverdue ? 'overdue' : ''}">
                                Due: ${dueDate.toLocaleDateString()} ${isOverdue ? ' (Overdue)' : ''}
                            </div>
                        ` : ''}
                        <div class="priority priority-${todo.priority}">
                            ${todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
                        </div>
                        <div class="todo-actions">
                            <button class="edit-todo" data-group="${group.id}" data-id="${todo.id}">Edit</button>
                            <button class="delete-todo" data-group="${group.id}" data-id="${todo.id}">Delete</button>
                        </div>
                    `;
                    todosList.appendChild(li);
                    
                    // Add event listeners for search result items
                    li.querySelector('.complete-checkbox').addEventListener('change', (e) => {
                        Storage.toggleTodoComplete(
                            e.target.dataset.group, 
                            e.target.dataset.id
                        );
                        searchTodos(query);
                    });
                    
                    li.querySelector('.edit-todo').addEventListener('click', (e) => {
                        currentGroupId = e.target.dataset.group;
                        editTodo(e.target.dataset.id);
                    });
                    
                    li.querySelector('.delete-todo').addEventListener('click', (e) => {
                        if (confirm('Are you sure you want to delete this todo?')) {
                            Storage.deleteTodo(
                                e.target.dataset.group, 
                                e.target.dataset.id
                            );
                            searchTodos(query);
                        }
                    });
                }
            });
        });
        
        if (!hasResults) {
            const li = document.createElement('li');
            li.textContent = 'No todos found matching your search.';
            todosList.appendChild(li);
        }
    }
    
    function openGroupModal(editing = false, groupId = null) {
        isEditingGroup = editing;
        
        if (editing) {
            modalGroupTitle.textContent = 'Edit Group';
            const group = Storage.getGroup(groupId);
            if (group) {
                groupNameInput.value = group.name;
            }
        } else {
            modalGroupTitle.textContent = 'Add New Group';
        }
        
        groupModal.style.display = 'block';
    }
    
    function openTodoModal(editing = false, todoId = null) {
        if (!currentGroupId) return;
        
        isEditingTodo = editing;
        editingTodoId = todoId;
        
        if (editing) {
            modalTodoTitle.textContent = 'Edit Todo';
            const todo = Storage.getTodo(currentGroupId, todoId);
            if (todo) {
                todoTitleInput.value = todo.title;
                todoDescInput.value = todo.description || '';
                todoDueDateInput.value = todo.dueDate || '';
                todoPrioritySelect.value = todo.priority || 'medium';
            }
        } else {
            modalTodoTitle.textContent = 'Add New Todo';
        }
        
        todoModal.style.display = 'block';
    }
    
    function saveGroup() {
        const name = groupNameInput.value.trim();
        
        if (!name) {
            alert('Group name cannot be empty');
            return;
        }
        
        if (isEditingGroup && currentGroupId) {
            Storage.updateGroup(currentGroupId, name);
        } else {
            Storage.addGroup(name);
        }
        
        groupModal.style.display = 'none';
        resetModalInputs();
        loadGroups();
    }
    
    function saveTodo() {
        if (!currentGroupId) return;
        
        const title = todoTitleInput.value.trim();
        const description = todoDescInput.value.trim();
        const dueDate = todoDueDateInput.value;
        const priority = todoPrioritySelect.value;
        
        if (!title) {
            alert('Todo title cannot be empty');
            return;
        }
        
        if (isEditingTodo && editingTodoId) {
            Storage.updateTodo(
                currentGroupId, 
                editingTodoId, 
                title, 
                description,
                dueDate,
                priority
            );
        } else {
            Storage.addTodo(
                currentGroupId, 
                title, 
                description,
                dueDate,
                priority
            );
        }
        
        todoModal.style.display = 'none';
        resetModalInputs();
        loadTodos(currentGroupId);
    }
    
    function editCurrentGroup() {
        if (!currentGroupId) return;
        openGroupModal(true, currentGroupId);
    }
    
    function editTodo(todoId) {
        if (!currentGroupId || !todoId) return;
        openTodoModal(true, todoId);
    }
    
    function deleteCurrentGroup() {
        if (!currentGroupId || !confirm('Are you sure you want to delete this group and all its todos?')) {
            return;
        }
        
        Storage.deleteGroup(currentGroupId);
        currentGroupId = null;
        loadGroups();
        
        // Reset UI
        currentGroupName.textContent = 'Select a Group';
        noGroupSelected.style.display = 'block';
        groupContent.style.display = 'none';
        editGroupBtn.disabled = true;
        deleteGroupBtn.disabled = true;
    }
    
    function deleteTodo(todoId) {
        if (!currentGroupId || !todoId || !confirm('Are you sure you want to delete this todo?')) {
            return;
        }
        
        Storage.deleteTodo(currentGroupId, todoId);
        if (currentSearchQuery) {
            searchTodos(currentSearchQuery);
        } else {
            loadTodos(currentGroupId);
        }
    }
    
    function resetModalInputs() {
        groupNameInput.value = '';
        todoTitleInput.value = '';
        todoDescInput.value = '';
        todoDueDateInput.value = '';
        todoPrioritySelect.value = 'medium';
        isEditingGroup = false;
        isEditingTodo = false;
        editingTodoId = null;
    }
    
    function toggleDarkMode() {
        const isDark = darkModeStyle.disabled;
        darkModeStyle.disabled = !isDark;
        Storage.setDarkModePreference(!isDark);
    }
    
    function loadDarkModePreference() {
        const darkModeEnabled = Storage.getDarkModePreference();
        darkModeStyle.disabled = !darkModeEnabled;
    }
});