Tasks = new Meteor.Collection("tasks");

Tasks.allow({
	insert: function (userId, task) {
		if (userId && task.userId === userId) {
			return true;
		}
	},
	remove: function (userId, task) {
		if (userId && task.userId === userId) {
			return true;
		}
	}
});

Meteor.methods({
	markAsDone: function (taskId) {
		var selector = {
			_id: taskId,
			userId: this.userId
		};
		var modifier = {
			$set: {
				status: "done"
			}
		};
		Tasks.update(selector, modifier);
	}
});
