document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const prioritySelect = document.getElementById('priority');
    const dueDateInput = document.getElementById('due-date');
    const categorySelect = document.getElementById('category');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const sortSelect = document.getElementById('sort-by');
    const currentDateDisplay = document.getElementById('current-date');
    const currentTimeDisplay = document.getElementById('current-time');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const currentMonthYear = document.getElementById('current-month-year');
    const calendarGrid = document.getElementById('calendar-grid');
    const upcomingEvents = document.getElementById('upcoming-events');
    const completedCount = document.getElementById('completed-count');
    const pendingCount = document.getElementById('pending-count');
    const urgentCount = document.getElementById('urgent-count');
    
    // State
    let tasks = [];
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let currentFilter = 'all';
    let currentSort = 'added';
    
    // Initialize
    loadTasks();
    updateDateTime();
    setInterval(updateDateTime, 60000);
    renderTaskList();
    renderCalendar();
    updateStats();
    
    // Event Listeners
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTask();
    });
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderTaskList();
        });
    });
    
    sortSelect.addEventListener('change', function() {
        currentSort = this.value;
        renderTaskList();
    });
    
    prevMonthBtn.addEventListener('click', goToPreviousMonth);
    nextMonthBtn.addEventListener('click', goToNextMonth);
    
    // Functions
    function loadTasks() {
        try {
            const storedTasks = localStorage.getItem('tasks');
            tasks = storedTasks ? JSON.parse(storedTasks) : [];
        } catch (error) {
            console.error('Error loading tasks from localStorage:', error);
            tasks = [];
        }
    }
    
    function saveTasks() {
        try {
            localStorage.setItem('tasks', JSON.stringify(tasks));
        } catch (error) {
            console.error('Error saving tasks to localStorage:', error);
        }
    }
    
    function updateDateTime() {
        try {
            const now = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            currentDateDisplay.textContent = now.toLocaleDateString(undefined, options);
            currentTimeDisplay.textContent = now.toLocaleTimeString();
        } catch (error) {
            console.error('Error updating date/time:', error);
        }
    }
    
    function addTask() {
        try {
            const taskText = taskInput.value.trim();
            if (!taskText) {
                alert('Please enter a task description');
                return;
            }
            
            const task = {
                id: Date.now(),
                text: taskText,
                priority: prioritySelect.value,
                category: categorySelect.value,
                dueDate: dueDateInput.value || null,
                completed: false,
                createdAt: new Date().toISOString(),
                completedAt: null
            };
            
            tasks.unshift(task);
            saveTasks();
            taskInput.value = '';
            dueDateInput.value = '';
            renderTaskList();
            renderCalendar();
            updateStats();
        } catch (error) {
            console.error('Error adding task:', error);
            alert('Failed to add task. Please try again.');
        }
    }
    
    function renderTaskList() {
        try {
            taskList.innerHTML = '';
            
            let filteredTasks = filterTasks();
            sortTasks(filteredTasks);
            
            if (filteredTasks.length === 0) {
                showEmptyMessage();
                return;
            }
            
            filteredTasks.forEach(task => createTaskElement(task));
        } catch (error) {
            console.error('Error rendering task list:', error);
            taskList.innerHTML = '<li class="error-message">Error loading tasks. Please refresh the page.</li>';
        }
    }
    
    function filterTasks() {
        const todayStr = new Date().toISOString().split('T')[0];
        
        switch (currentFilter) {
            case 'today':
                return tasks.filter(task => 
                    task.dueDate === todayStr || (!task.dueDate && currentFilter !== 'completed')
                );
            case 'week':
                const today = new Date();
                const nextWeek = new Date(today);
                nextWeek.setDate(today.getDate() + 7);
                
                return tasks.filter(task => {
                    if (!task.dueDate) return false;
                    const taskDate = new Date(task.dueDate);
                    return taskDate >= today && taskDate <= nextWeek;
                });
            case 'completed':
                return tasks.filter(task => task.completed);
            default:
                return [...tasks];
        }
    }
    
    function sortTasks(tasksArray) {
        tasksArray.sort((a, b) => {
            switch (currentSort) {
                case 'added':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'due':
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                case 'priority':
                    const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                case 'category':
                    return a.category.localeCompare(b.category);
                default:
                    return 0;
            }
        });
    }
    
    function showEmptyMessage() {
        const emptyMessage = document.createElement('li');
        emptyMessage.textContent = currentFilter === 'completed' 
            ? 'No completed tasks yet!' 
            : 'No tasks found. Add a new task!';
        emptyMessage.classList.add('empty-message');
        taskList.appendChild(emptyMessage);
    }
    
    function createTaskElement(task) {
        const taskItem = document.createElement('li');
        taskItem.className = 'task-item';
        taskItem.dataset.id = task.id;
        
        const todayStr = new Date().toISOString().split('T')[0];
        const isOverdue = task.dueDate && task.dueDate < todayStr && !task.completed;
        
        taskItem.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-text ${task.completed ? 'completed' : ''}">${escapeHtml(task.text)}</span>
            <span class="task-priority priority-${task.priority}">${task.priority}</span>
            <span class="task-category">${task.category}</span>
            ${task.dueDate ? `
                <span class="task-due-date ${isOverdue ? 'overdue' : ''}">
                    <i class="far fa-calendar"></i> ${formatDate(task.dueDate)}
                </span>
            ` : ''}
            <div class="task-actions">
                <button class="edit-btn" title="Edit"><i class="far fa-edit"></i></button>
                <button class="delete-btn" title="Delete"><i class="far fa-trash-alt"></i></button>
            </div>
        `;
        
        const checkbox = taskItem.querySelector('.task-checkbox');
        const editBtn = taskItem.querySelector('.edit-btn');
        const deleteBtn = taskItem.querySelector('.delete-btn');
        
        checkbox.addEventListener('change', () => toggleTaskCompletion(task));
        editBtn.addEventListener('click', () => editTask(task));
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        
        taskList.appendChild(taskItem);
    }
    
    function toggleTaskCompletion(task) {
        try {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            saveTasks();
            renderTaskList();
            renderCalendar();
            updateStats();
        } catch (error) {
            console.error('Error toggling task completion:', error);
        }
    }
    
    function editTask(task) {
        try {
            taskInput.value = task.text;
            prioritySelect.value = task.priority;
            categorySelect.value = task.category;
            dueDateInput.value = task.dueDate || '';
            
            // Remove the task from the list
            tasks = tasks.filter(t => t.id !== task.id);
            saveTasks();
            renderTaskList();
            updateStats();
        } catch (error) {
            console.error('Error editing task:', error);
        }
    }
    
    function deleteTask(taskId) {
        try {
            if (confirm('Are you sure you want to delete this task?')) {
                tasks = tasks.filter(task => task.id !== taskId);
                saveTasks();
                renderTaskList();
                renderCalendar();
                updateStats();
            }
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    }
    
    function formatDate(dateString) {
        try {
            if (!dateString) return '';
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        } catch (error) {
            console.error('Error formatting date:', error);
            return dateString;
        }
    }
    
    function goToPreviousMonth() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    }
    
    function goToNextMonth() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    }
    
    function renderCalendar() {
        try {
            calendarGrid.innerHTML = '';
            
            // Set month and year display
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                              'July', 'August', 'September', 'October', 'November', 'December'];
            currentMonthYear.textContent = `${monthNames[currentMonth]} ${currentYear}`;
            
            // Add day headers
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            dayNames.forEach(day => {
                const dayHeader = document.createElement('div');
                dayHeader.className = 'calendar-day-header';
                dayHeader.textContent = day;
                calendarGrid.appendChild(dayHeader);
            });
            
            // Get first day of month and total days in month
            const firstDay = new Date(currentYear, currentMonth, 1).getDay();
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            
            // Add empty cells for days before the first day of the month
            for (let i = 0; i < firstDay; i++) {
                const emptyDay = document.createElement('div');
                emptyDay.className = 'calendar-day empty';
                calendarGrid.appendChild(emptyDay);
            }
            
            // Add days of the month
            const today = new Date();
            const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;
            
            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = formatDateString(currentYear, currentMonth, day);
                const calendarDay = createCalendarDay(day, dateStr, isCurrentMonth && day === today.getDate());
                calendarGrid.appendChild(calendarDay);
            }
            
            renderUpcomingEvents();
        } catch (error) {
            console.error('Error rendering calendar:', error);
            calendarGrid.innerHTML = '<div class="error-message">Error loading calendar</div>';
        }
    }
    
    function formatDateString(year, month, day) {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    
    function createCalendarDay(day, dateStr, isToday) {
        const calendarDay = document.createElement('div');
        calendarDay.className = 'calendar-day';
        
        if (isToday) {
            calendarDay.classList.add('today');
        }
        
        const dayNumber = document.createElement('span');
        dayNumber.className = 'calendar-day-number';
        dayNumber.textContent = day;
        calendarDay.appendChild(dayNumber);
        
        const hasTasks = tasks.some(task => task.dueDate === dateStr);
        
        if (hasTasks) {
            calendarDay.classList.add('has-tasks');
            calendarDay.addEventListener('click', () => showTasksForDate(dateStr));
        }
        
        return calendarDay;
    }
    
    function showTasksForDate(dateStr) {
        try {
            const dateTasks = tasks.filter(task => task.dueDate === dateStr);
            const formattedDate = formatDate(dateStr);
            
            if (dateTasks.length > 0) {
                const taskList = dateTasks.map(task => 
                    `• ${task.text} (${task.priority})${task.completed ? ' - COMPLETED' : ''}`
                ).join('\n');
                
                alert(`Tasks for ${formattedDate}:\n\n${taskList}`);
            } else {
                alert(`No tasks scheduled for ${formattedDate}`);
            }
        } catch (error) {
            console.error('Error showing tasks for date:', error);
        }
    }
    
    function renderUpcomingEvents() {
        try {
            upcomingEvents.innerHTML = '';
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const nextMonth = new Date(currentYear, currentMonth + 1, 1);
            
            const upcomingTasks = tasks
                .filter(task => {
                    if (!task.dueDate || task.completed) return false;
                    const taskDate = new Date(task.dueDate);
                    return taskDate >= today && taskDate < nextMonth;
                })
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
            
            if (upcomingTasks.length === 0) {
                const emptyMsg = document.createElement('p');
                emptyMsg.textContent = 'No upcoming events this month.';
                upcomingEvents.appendChild(emptyMsg);
                return;
            }
            
            const eventsHeader = document.createElement('h3');
            eventsHeader.textContent = 'Upcoming Events';
            upcomingEvents.appendChild(eventsHeader);
            
            upcomingTasks.forEach(task => {
                const eventItem = document.createElement('div');
                eventItem.className = 'event-item';
                
               eventItem.innerHTML = `
    <span class="priority-dot" style="background-color: ${getPriorityColor(task.priority)}"></span>
    <span class="event-date">${formatDate(task.dueDate)}</span>
    <span class="event-text">${escapeHtml(task.text)}</span>
`;
                
                upcomingEvents.appendChild(eventItem);
            });
        } catch (error) {
            console.error('Error rendering upcoming events:', error);
        }
    }
    
    function getPriorityColor(priority) {
        const colors = {
            'urgent': '#ff5252',
            'high': '#ff9800',
            'medium': '#4caf50',
            'low': '#9e9e9e'
        };
        return colors[priority] || '#4a6fa5';
    }
    
    function updateStats() {
        try {
            const completedTasks = tasks.filter(task => task.completed).length;
            const pendingTasks = tasks.filter(task => !task.completed).length;
            const urgentTasks = tasks.filter(task => 
                task.priority === 'urgent' && !task.completed
            ).length;
            
            completedCount.textContent = completedTasks;
            pendingCount.textContent = pendingTasks;
            urgentCount.textContent = urgentTasks;
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }
    
    function escapeHtml(unsafe) 
    {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/</g, "&quot;")
            .replace(/>/g, "&#039;");
    }
});