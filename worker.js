var when = require("when");
var sqs  = require("./sqs");

function WorkerClass() {

    var self = this;

	//============================================================
    //
	//============================================================
	this.listen = function listen(queue, callback) {

        console.log('info: pooling queue ' + queue + '...');

        sqs.receiveMessages(queue).then(function(messages) {

		    return when.map(messages, function (message) {

    			console.log('info: message received from queue ' + queue);

    			return when(callback(message), function succeeded () {

    				return sqs.deleteMessage(queue, message);

    			}).then(function() {

    				console.log('info: message successfully processed and removed from queue');

    			}).otherwise(function onerror (error) {

    				console.error(error);
    			});
    		});

        }).catch(function onerror (error) {

            console.error(error);

            return when().delay(10000);

        }).finally(function () {

            process.nextTick(function() { self.listen(queue, callback); });
        });
	};
}

module.exports = exports = new WorkerClass();
