function createElement(tag, attributes, children, events) {
    const element = document.createElement(tag);

    if (attributes) {
        Object.keys(attributes).forEach((key) => {
            const value = attributes[key];
            if (value === null || value === undefined) return;
            if (key in element) {
                element[key] = value;
            } else {
                element.setAttribute(key, value);
            }
        });
    }

    if (events) {
        Object.keys(events).forEach((eventName) => {
            element.addEventListener(eventName, events[eventName]);
        });
    }

    if (Array.isArray(children)) {
        children.forEach((child) => {
            if (typeof child === "string") {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof HTMLElement) {
                element.appendChild(child);
            }
        });
    } else if (typeof children === "string") {
        element.appendChild(document.createTextNode(children));
    } else if (children instanceof HTMLElement) {
        element.appendChild(children);
    }

    return element;
}


class Component {
    getDomNode() {
        if (!this._domNode) {
            this._domNode = this.render();
        }
        return this._domNode;
    }

    update() {
        const newNode = this.render();

        if (this._domNode && this._domNode.parentNode) {
            this._domNode.parentNode.replaceChild(newNode, this._domNode);
        }

        this._domNode = newNode;
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.update();
    }

    setProps(newProps) {
        Object.assign(this, newProps);
        this.update();
    }
}

class AddTask extends Component {
    constructor(onAddTask) {
        super();

        this.onAddTask = onAddTask;
        this.state = {
            inputValue: "",
        };

        this.onAddInputChange = this.onAddInputChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    onAddInputChange(e) {
        this.state.inputValue = e.target.value;
    }

    onSubmit() {
        if (!this.state.inputValue.trim()) return;

        this.onAddTask(this.state.inputValue);
        this.setState({
            inputValue: "",
        });
    }

    render() {
        return createElement("div", { class: "add-todo" }, [
            createElement(
                "input",
                {
                    id: "new-todo",
                    type: "text",
                    placeholder: "Задание",
                    value: this.state.inputValue,
                },
                null,
                {
                    input: this.onAddInputChange,
                }
            ),

            createElement(
                "button",
                { id: "add-btn" },
                "+",
                { click: this.onSubmit }
            ),
        ]);
    }
}

class Task extends Component {
    constructor(todo, onDeleteTask, onToggleTask) {
        super();

        this.todo = todo;
        this.onDeleteTask = onDeleteTask;
        this.onToggleTask = onToggleTask;
        this.state = {
            isDeleteConfirming: false,
        };

        this.onDeleteClick = this.onDeleteClick.bind(this);
        this.onDoneChange = this.onDoneChange.bind(this);
    }

    onDeleteClick() {
        if (this.state.isDeleteConfirming) {
            this.onDeleteTask(this.todo.id);
            return;
        }

        this.setState({
            isDeleteConfirming: true,
        });
    }

    onDoneChange() {
        this.onToggleTask(this.todo.id);
    }

    render() {
        return createElement("li", { "data-id": this.todo.id }, [
            createElement(
                "input",
                {
                    type: "checkbox",
                    checked: this.todo.done,
                },
                null,
                {
                    change: this.onDoneChange,
                }
            ),
            createElement(
                "label",
                {
                    class: this.todo.done ? "done" : "",
                },
                this.todo.text
            ),
            createElement(
                "button",
                {
                    class: this.state.isDeleteConfirming
                        ? "delete-confirming"
                        : "",
                },
                "🗑️",
                { click: this.onDeleteClick }
            ),
        ]);
    }
}

class TodoList extends Component {
    constructor() {
        super();

        const saved = localStorage.getItem("todoState");
        if (saved) {
            this.state = JSON.parse(saved);
        } else {
            this.state = {
                todos: [
                    { id: 1, text: "Сделать домашку", done: false },
                    { id: 2, text: "Сделать практику", done: false },
                ],
            };
        }

        this.onAddTask = this.onAddTask.bind(this);
        this.onDeleteTask = this.onDeleteTask.bind(this);
        this.onToggleTask = this.onToggleTask.bind(this);

        this._addTask = new AddTask(this.onAddTask);
        this._taskComponents = new Map();
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        localStorage.setItem("todoState", JSON.stringify(this.state));
        this.update();
    }

    onAddTask(text) {
        const newTodo = {
            id: Date.now(),
            text,
            done: false,
        };

        this.setState({
            todos: [...this.state.todos, newTodo],
        });
    }

    onDeleteTask(id) {
        this._taskComponents.delete(id);

        const updatedTodos = this.state.todos.filter(
            (todo) => todo.id !== id
        );

        this.setState({ todos: updatedTodos });
    }

    onToggleTask(id) {
        const updatedTodos = this.state.todos.map((todo) => {
            if (todo.id !== id) return todo;

            return {
                ...todo,
                done: !todo.done,
            };
        });

        this.setState({ todos: updatedTodos });
    }

    _getTaskComponent(todo) {
        if (this._taskComponents.has(todo.id)) {
            const existing = this._taskComponents.get(todo.id);
            existing.todo = todo;
            existing.update();
            return existing;
        }

        const task = new Task(todo, this.onDeleteTask, this.onToggleTask);
        this._taskComponents.set(todo.id, task);
        return task;
    }

    render() {
        this._addTask.update();

        return createElement("div", { class: "todo-list" }, [
            createElement("h1", {}, "TODO List"),
            this._addTask.getDomNode(),

            createElement(
                "ul",
                { id: "todos" },
                this.state.todos.map((todo) =>
                    this._getTaskComponent(todo).getDomNode()
                )
            ),
        ]);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.body.appendChild(new TodoList().getDomNode());
});