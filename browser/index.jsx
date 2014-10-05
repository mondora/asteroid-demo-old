/** @jsx React.DOM */

(function () {



	// TaskList component
	var TasksList = React.createClass({
		render: function () {
			var tasksNodes = this.props.tasks.map(function (task) {
				return (
					<Task task={task} key={task._id} />
				);
			});
			var taskFormOrLoginButton = this.props.user ? <TaskForm user={this.props.user} /> : <LoginButton />;
			return (
				<div className="col-xs-12 col-sm-6 col-sm-offset-3">
					<h3>asteroid todo</h3>
					<br />
					<ul className="list-group">
						{tasksNodes}
					</ul>
					{taskFormOrLoginButton}
				</div>
			);
		}
	});

	// Task component
	var Task = React.createClass({
		markAsDone: function () {
			Ceres.call("markAsDone", this.props.task._id);
		},
		deleteTask: function () {
			Tasks.remove(this.props.task._id);
		},
		render: function () {
			var done;
			if (this.props.task.status === "done") {
				done = <i className="fa fa-check pull-right"></i>;
			} else if (this.props.task.userId) {
				done = <button type="button" className="btn btn-xs btn-default pull-right" onClick={this.markAsDone}>Done</button>;
			}
			return (
				<li className="list-group-item">
					<div className="row">
						<div className="col-xs-4">
							{this.props.task.name}
						</div>
						<div className="col-xs-4">
							{this.props.task.description}
						</div>
						<div className="col-xs-2">
							{done}
						</div>
						<div className="col-xs-2">
							<button type="button" className="btn btn-xs btn-default pull-right" onClick={this.deleteTask}>Delete</button>
						</div>
					</div>
				</li>
			);
		}
	});

	// TaskForm component
	var TaskForm = React.createClass({
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
				<div className="input-group">
					<input type="text" className="form-control" value={this.state.inputValue} onChange={this.userTypes} onKeyDown={this.addOnEnter} />
					<span className="input-group-btn">
						<button className="btn btn-default" type="button" onClick={this.addTask}>Add</button>
					</span>
				</div>
			);
		}
	});

	// LoginButton component
	var LoginButton = React.createClass({
		login: function () {
			Ceres.loginWithGithub();
		},
		render: function () {
			return (
				<a className="btn btn-block btn-social btn-github" onClick={this.login}>
					<i className="fa fa-github"></i> Sign in with Github to add a task
				</a>
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
			<TasksList user={user} tasks={tasks} />,
			document.getElementById("tasks-box")
		);
	}

	render();



})();
