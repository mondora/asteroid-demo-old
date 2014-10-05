Meteor.subscribe("tasks");

Template.login.helpers({
	githubConfigured: function () {
		return !!ServiceConfiguration.configurations.findOne({service: "github"});
	}
});

Template.login.events({
	"click a": function () {
		Meteor.loginWithGithub();
	}
});

Template.taskList.helpers({
	tasks: function () {
		return Tasks.find();
	}
});

Template.task.events({
	"click #done": function () {
		Meteor.call("markAsDone", this._id);
	},
	"click #delete": function () {
		Tasks.remove(this._id);
	}
});

Template.task.helpers({
	done: function () {
		return this.status === "done";
	},
	ownsTask: function () {
		return this.userId === Meteor.userId();
	}
});

Template.addTask.events({
	"keyup input": function (event) {
		if (event.keyCode !== 13) {
			return;
		}
		var task = {};
		task.userId = Meteor.userId();
		task.name = Meteor.user().profile.name;
		task.description = $("input").val();
		task.status = "todo";
		Tasks.insert(task);
		$("input").val("");
	},
	"click button": function () {
		var task = {};
		task.userId = Meteor.userId();
		task.name = Meteor.user().profile.name;
		task.description = $("input").val();
		task.status = "todo";
		Tasks.insert(task);
		$("input").val("");
	}
});
