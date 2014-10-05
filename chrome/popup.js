/** @jsx React.DOM */

(function () {



	// TaskList component
	var TasksList = React.createClass({displayName: 'TasksList',
		render: function () {
			var tasksNodes = this.props.tasks.map(function (task) {
				return (
					Task({task: task, key: task._id})
				);
			});
			var taskFormOrLoginButton = this.props.user ? TaskForm({user: this.props.user}) : LoginButton(null);
			return (
				React.DOM.div({className: "col-xs-12 col-sm-6 col-sm-offset-3"}, 
					React.DOM.h3(null, "asteroid todo"), 
					React.DOM.br(null), 
					React.DOM.ul({className: "list-group"}, 
						tasksNodes
					), 
					taskFormOrLoginButton
				)
			);
		}
	});

	// Task component
	var Task = React.createClass({displayName: 'Task',
		markAsDone: function () {
			Ceres.call("markAsDone", this.props.task._id);
		},
		deleteTask: function () {
			Tasks.remove(this.props.task._id);
		},
		render: function () {
			var done;
			if (this.props.task.status === "done") {
				done = React.DOM.i({className: "fa fa-check pull-right"});
			} else if (this.props.task.userId) {
				done = React.DOM.button({type: "button", className: "btn btn-xs btn-default pull-right", onClick: this.markAsDone}, "Done");
			}
			return (
				React.DOM.li({className: "list-group-item"}, 
					React.DOM.div({className: "row"}, 
						React.DOM.div({className: "col-xs-4"}, 
							this.props.task.name
						), 
						React.DOM.div({className: "col-xs-4"}, 
							this.props.task.description
						), 
						React.DOM.div({className: "col-xs-2"}, 
							done
						), 
						React.DOM.div({className: "col-xs-2"}, 
							React.DOM.button({type: "button", className: "btn btn-xs btn-default pull-right", onClick: this.deleteTask}, "Delete")
						)
					)
				)
			);
		}
	});

	// TaskForm component
	var TaskForm = React.createClass({displayName: 'TaskForm',
		getInitialState: function () {
			return {
				inputValue: ""
			};
		},
		userTypes: function (event) {
			this.setState({
				inputValue: event.target.value
			});	
		},
		addOnEnter: function (event) {
			if (event.keyCode === 13) {
				this.addTask();
			}
		},
		addTask: function () {
			if (this.state.inputValue === "") {
				return;
			}
			var task = {
				name: this.props.user.profile.name,
				userId: this.props.user._id,
				description: this.state.inputValue,
				status: "todo"
			};
			Tasks.insert(task);
			this.setState({
				inputValue: ""
			});
		},
		render: function () {
			return (
				React.DOM.div({className: "input-group"}, 
					React.DOM.input({type: "text", className: "form-control", value: this.state.inputValue, onChange: this.userTypes, onKeyDown: this.addOnEnter}), 
					React.DOM.span({className: "input-group-btn"}, 
						React.DOM.button({className: "btn btn-default", type: "button", onClick: this.addTask}, "Add")
					)
				)
			);
		}
	});

	// LoginButton component
	var LoginButton = React.createClass({displayName: 'LoginButton',
		login: function () {
			chrome.runtime.sendMessage("login");
		},
		render: function () {
			return (
				React.DOM.a({className: "btn btn-block btn-social btn-github", onClick: this.login}, 
					React.DOM.i({className: "fa fa-github"}), " Sign in with Github to add a task"
				)
			);
		}
	});



	Ceres = new Asteroid("localhost:3000");

	Ceres.subscribe("tasks");
	Tasks = Ceres.getCollection("tasks");
	Users = Ceres.getCollection("users");



	var tasksRQ = Tasks.reactiveQuery({});
	tasksRQ.on("change", render);
	Ceres.on("login", render);
	Ceres.on("logout", render);

	function render () {
		var user = Users.reactiveQuery({
			_id: Ceres.userId
		}).result[0];
		var tasks = tasksRQ.result;
		React.renderComponent(
			TasksList({user: user, tasks: tasks}),
			document.getElementById("tasks-box")
		);
	}

	render();



})();
