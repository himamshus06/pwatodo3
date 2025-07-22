class Storage {
    static getGroups() {
        const groups = localStorage.getItem('todo-groups');
        return groups ? JSON.parse(groups) : [];
    }
    
    static saveGroups(groups) {
        localStorage.setItem('todo-groups', JSON.stringify(groups));
    }
    
    static addGroup(name) {
        const groups = this.getGroups();
        const newGroup = {
            id: Date.now().toString(),
            name,
            todos: []
        };
        groups.push(newGroup);
        this.saveGroups(groups);
        return newGroup;
    }
    
    static getGroup(groupId) {
        const groups = this.getGroups();
        return groups.find(group => group.id === groupId);
    }
    
    static updateGroup(groupId, newName) {
        const groups = this.getGroups();
        const groupIndex = groups.findIndex(group => group.id === groupId);
        
        if (groupIndex !== -1) {
            groups[groupIndex].name = newName;
            this.saveGroups(groups);
            return true;
        }
        
        return false;
    }
    
    static deleteGroup(groupId) {
        let groups = this.getGroups();
        groups = groups.filter(group => group.id !== groupId);
        this.saveGroups(groups);
    }
    
    static addTodo(groupId, title, description = '', dueDate = '', priority = 'medium') {
        const groups = this.getGroups();
        const groupIndex = groups.findIndex(group => group.id === groupId);
        
        if (groupIndex === -1) return null;
        
        const newTodo = {
            id: Date.now().toString(),
            title,
            description,
            dueDate,
            priority,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        groups[groupIndex].todos.push(newTodo);
        this.saveGroups(groups);
        return newTodo;
    }
    
    static getTodo(groupId, todoId) {
        const group = this.getGroup(groupId);
        if (!group) return null;
        
        return group.todos.find(todo => todo.id === todoId) || null;
    }
    
    static updateTodo(groupId, todoId, newTitle, newDescription, newDueDate, newPriority) {
        const groups = this.getGroups();
        const groupIndex = groups.findIndex(group => group.id === groupId);
        
        if (groupIndex === -1) return false;
        
        const todoIndex = groups[groupIndex].todos.findIndex(todo => todo.id === todoId);
        
        if (todoIndex === -1) return false;
        
        groups[groupIndex].todos[todoIndex] = {
            ...groups[groupIndex].todos[todoIndex],
            title: newTitle,
            description: newDescription,
            dueDate: newDueDate,
            priority: newPriority
        };
        
        this.saveGroups(groups);
        return true;
    }
    
    static deleteTodo(groupId, todoId) {
        const groups = this.getGroups();
        const groupIndex = groups.findIndex(group => group.id === groupId);
        
        if (groupIndex === -1) return false;
        
        groups[groupIndex].todos = groups[groupIndex].todos.filter(todo => todo.id !== todoId);
        this.saveGroups(groups);
        return true;
    }
    
    static toggleTodoComplete(groupId, todoId) {
        const groups = this.getGroups();
        const groupIndex = groups.findIndex(group => group.id === groupId);
        
        if (groupIndex === -1) return false;
        
        const todoIndex = groups[groupIndex].todos.findIndex(todo => todo.id === todoId);
        
        if (todoIndex === -1) return false;
        
        groups[groupIndex].todos[todoIndex].completed = 
            !groups[groupIndex].todos[todoIndex].completed;
        
        this.saveGroups(groups);
        return true;
    }
    
    static setDarkModePreference(enabled) {
        localStorage.setItem('dark-mode', enabled ? 'enabled' : 'disabled');
    }
    
    static getDarkModePreference() {
        return localStorage.getItem('dark-mode') === 'enabled';
    }
}