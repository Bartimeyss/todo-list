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
                inputValue: "",
            };
        }

        this.onAddTask = this.onAddTask.bind(this);
        this.onAddInputChange = this.onAddInputChange.bind(this);
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        localStorage.setItem("todoState", JSON.stringify(this.state));
        this.update();
    }

    onAddInputChange(e) {
        this.setState({
            inputValue: e.target.value,
        });
    }

    onAddTask() {
        if (!this.state.inputValue.trim()) return;
        const newTodo = {
            id: Date.now(),
            text: this.state.inputValue,
            done: false,
        };

        this.setState({
            todos: [...this.state.todos, newTodo],
            inputValue: "",
        });
    }
    onDeleteTask(id) {
        const updatedTodos = this.state.todos.filter(
            (todo) => todo.id !== id
        );

        this.setState({ todos: updatedTodos });
    }

    render() {
        return createElement("div", { class: "todo-list" }, [
            createElement("h1", {}, "TODO List"),
            createElement("div", { class: "add-todo" }, [
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
                    "button", { id: "add-btn" },
                    "+", { click: this.onAddTask, }
                ),
            ]),

            createElement(
                "ul",
                { id: "todos" },
                this.state.todos.map((todo) =>
                    createElement("li", { "data-id": todo.id }, [
                        createElement("input", {
                            type: "checkbox",
                            checked: todo.done,
                        }),
                        createElement("label", {}, todo.text),
                        createElement("button", {}, 
                            "🗑️", { click: () => this.onDeleteTask(todo.id),}),
                    ])
                )
            ),
        ]);
    }
}
document.addEventListener("DOMContentLoaded", () => {
    document.body.appendChild(new TodoList().getDomNode());
});
