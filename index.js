var Q = require("q");
var local_config = require("./conf/config.json");
var config=local_config;
var json2csv = require('json2csv');
var postmark = require("postmark");
var rp = require('request-promise');
var inquirer = require('inquirer');

var client = new postmark.Client(config.postmark_api_key);
var pivotal_base_url='https://www.pivotaltracker.com/services/v5/';
var projects=config.projects;
var pivotal_api_token=config.pivotal_api_token;
var csv_files=[];


if (process.argv.indexOf("--interactive") !== -1) {
    interactive_mode().then(function (stories) {

        csv_files.push(generate_csv(stories));
        send_email(generate_csv(stories));
    });
}



function interactive_mode(){
  var deferred = Q.defer();  
    projects.forEach(function (project,index) {
        console.log("index "+index);
        var project_name = "";
        get_project_name(project).then(function (data) {
            project_name = data;
        });
        var stories = [];
        var url = pivotal_base_url + 'projects/' + project + '/iterations';
        var body = {};
        var options = build_pivotal_rest_request(url, body);
        options.method = "GET";

        rp(options).then(function (iterations) {
            //console.log(iterations);
            var choices = [];
            iterations.forEach(function (iteration) {
                choices.push(
                    {
                        "name": "Iteration " + iteration.number + " - " + iteration.finish,
                        "value": iteration.number
                    }
                );
            });

            inquirer.prompt({
                type: 'list',
                name: 'iteration',
                message: 'Which Iteration would you like? ',
                choices: choices
            }).then(function (answers) {
                var iteration = answers.iteration;
                get_iteration(iteration).then(function (data) {
                    data.stories.forEach(function (story) {
                        if (story.current_state === 'accepted') {
                            stories.push(get_story(project_name, story));
                        }
                    });
                    if (index==(projects.length -1)){
                        deferred.resolve(stories);
                    }
                });
            });
        });
    });
    return deferred.promise;
}


function get_iteration(iteration_number){
var deferred = Q.defer();

 var url = pivotal_base_url + 'projects/1876659/iterations/'+iteration_number;
    var body = {};
    var options = build_pivotal_rest_request(url, body);
    options.method = "GET";
    rp(options).then(function (iteration) {
        deferred.resolve(iteration);
    });
    return deferred.promise;
}
function get_story(project_name, story) {
    var labels = get_labels(story.labels);
   // console.log(story);
    var story_obj = {
        "project_name": project_name,
        "issue_name": story.name,
        "labels": labels,
        "url":story.url
    }
    return story_obj;
}
function get_project_name(project_id) {
    var deferred = Q.defer();

    var url = pivotal_base_url + 'projects/'+project_id;
    var body = {};
    var options = build_pivotal_rest_request(url, body);
    options.method = "GET";
    rp(options).then(function (project) {

        deferred.resolve(project.name);
    });
    return deferred.promise;
}
function generate_csv(stories){

var fields = ['project_name', 'issue_name', 'labels',"url"];
var csv_file = json2csv({ data: stories, fields: fields });
return csv_file;
}
function get_labels(labels){
    var label_list=[];
    labels.forEach(function(label){
        label_list.push(label.name);
    })
    return label_list.join();
}
function send_email(csv) {
    console.log("attempting to send an email");

    client.sendEmail({
        "From": config.sender_address,
        "To": "chris.hale@me.com",
        "Subject": "Test",
        "TextBody": "Test Message",
        "Attachments":[  {
                "Content": new Buffer(csv).toString('base64'),
                "Name": "pivotal_issues.csv",
                "ContentType": "text/csv"
            }]
    }, function (error, success) {
        if (error) {
            console.error("Unable to send via postmark: " + error.message);
            return;
        }
        console.info("Sent to postmark for delivery")
    });

}
function build_pivotal_rest_request(url, body) {
    var options = {
        uri: url,
        method: 'POST',
        headers: {
            'X-TrackerToken': pivotal_api_token
        },
        body: body,
        json: true // Automatically stringifies the body to JSON
    };
    return options;
}